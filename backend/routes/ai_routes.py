from flask import Blueprint, request, jsonify, current_app
from services.file_service import FileService
import os
import google.generativeai as genai

ai_bp = Blueprint('ai', __name__)

def configure_genai():
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise ValueError("GOOGLE_API_KEY not found in environment variables")
    genai.configure(api_key=api_key)
    return genai.GenerativeModel(
        model_name="gemini-2.0-flash",
        generation_config={
            "temperature": 0.9,
            "top_p": 0.95,
            "top_k": 40,
            "max_output_tokens": 8192,
            "response_mime_type": "text/plain",
        }
    )

def get_file_service():
    storage_path = current_app.config['DATA_STORAGE_PATH']
    return FileService(storage_path)

def load_campaign_context(service, campaign_id):
    path = service._get_campaign_path(campaign_id)
    metadata = service.load_json(os.path.join(path, "metadata.json"))
    vault_path = os.path.join(path, "vault")
    vault_items = []
    if os.path.exists(vault_path):
        for f in os.listdir(vault_path):
            if f.endswith(".json"):
                item = service.load_json(os.path.join(vault_path, f))
                if item: vault_items.append(item)
    return metadata, vault_items

def get_rolling_memory(service, campaign_id, limit=3):
    """Recupera los resúmenes de las últimas 'limit' sesiones completadas."""
    campaign_path = service._get_campaign_path(campaign_id)
    sessions_path = os.path.join(campaign_path, "sessions")
    sessions = []
    
    if os.path.exists(sessions_path):
        for f in os.listdir(sessions_path):
            if f.endswith(".json"):
                sess = service.load_json(os.path.join(sessions_path, f))
                if sess and sess.get('status') == 'completed' and sess.get('summary'):
                    sessions.append(sess)
    
    # Ordenar por número (descendente) y tomar los últimos
    sessions.sort(key=lambda x: x.get('number', 0), reverse=True)
    recent = sessions[:limit]
    
    # Formatear texto (orden cronológico para la lectura de la IA)
    memory_text = ""
    for s in reversed(recent):
        memory_text += f"- Sesión {s['number']} ({s.get('title', 'Sin título')}): {s.get('summary')}\n"
    
    return memory_text

@ai_bp.route('/<campaign_id>/chat', methods=['POST'])
def chat_with_ai(campaign_id):
    try:
        model = configure_genai() # Configurar con la key del env cada vez
        data = request.get_json()
        user_query = data.get('query', '')
        context_mode = data.get('mode', 'vault') 
        session_id = data.get('sessionId')
        
        service = get_file_service()
        metadata, vault_items = load_campaign_context(service, campaign_id)
        
        if not metadata:
            return jsonify({"error": "Campaign not found"}), 404

        # Lógica de Framework
        use_full = metadata.get('use_full_framework', False)
        framework_full = metadata.get('framework', '')
        framework_summary = metadata.get('framework_summary', '')
        framework_context = framework_full if use_full else (framework_summary or framework_full)
        if not framework_context: framework_context = "Mundo de fantasía genérico."

        # Memoria Rodante (Contexto Histórico Reciente)
        rolling_memory = get_rolling_memory(service, campaign_id)

        characters = [i['content'] for i in vault_items if i['type'] == 'character']
        secrets = [i['content'] for i in vault_items if i['type'] == 'secret' and i['status'] == 'reserve']
        truths = metadata.get('truths', [])
        fronts = metadata.get('fronts', [])

        system_prompt = f"""
        Eres un Asistente de Dungeon Master experto.
        
        CONTEXTO MUNDIAL (Framework):
        {framework_context}
        
        VERDADES DEL MUNDO:
        {', '.join(filter(None, truths))}
        
        FRENTES (Amenazas Activas):
        {str(fronts)}
        
        PERSONAJES (PJs):
        {str(characters)}
        
        MEMORIA RECIENTE (Lo que ha pasado últimamente):
        {rolling_memory if rolling_memory else "No hay sesiones previas registradas."}
        """

        if context_mode == 'session' and session_id:
            session_path = os.path.join(service._get_campaign_path(campaign_id), "sessions")
            # Buscar archivo de sesión
            target_file = None
            for f in os.listdir(session_path):
                if f.endswith(f"_{session_id}.json"):
                    target_file = f
                    break
            
            if target_file:
                session_data = service.load_json(os.path.join(session_path, target_file))
                linked_ids = session_data.get('linked_items', [])
                active_items = [i['content'] for i in vault_items if i['id'] in linked_ids]
                
                system_prompt += f"""
                ESTADO: SESIÓN EN CURSO.
                Elementos en escena: {str(active_items)}
                Secretos disponibles: {str(secrets)}
                
                Instrucciones: Prioriza conectar la situación actual con la 'Memoria Reciente' y los 'Frentes'.
                """
        else:
            item_names = [i['content'].get('name', i['content'].get('title')) for i in vault_items]
            system_prompt += f"""
            ESTADO: PREPARACIÓN (VAULT).
            Items existentes: {str(item_names)}
            Instrucciones: Crea contenido nuevo que sea coherente con el Framework y la historia reciente.
            """

        chat = model.start_chat(
            history=[
                {"role": "user", "parts": [system_prompt]},
                {"role": "model", "parts": ["Entendido DM. Tengo el contexto completo. ¿Qué hacemos hoy?"]}
            ]
        )
        
        response = chat.send_message(user_query)
        return jsonify({"response": response.text})
        
    except Exception as e:
        print(f"Error IA: {str(e)}") 
        return jsonify({"error": str(e)}), 500