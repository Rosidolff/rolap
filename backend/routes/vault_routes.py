from flask import Blueprint, request, jsonify, current_app
from services.file_service import FileService
from services.id_service import generate_id
import os

vault_bp = Blueprint('vault', __name__)

def get_file_service():
    storage_path = current_app.config['DATA_STORAGE_PATH']
    return FileService(storage_path)

@vault_bp.route('/<campaign_id>/vault', methods=['GET'])
def list_vault_items(campaign_id):
    service = get_file_service()
    campaign_path = service._get_campaign_path(campaign_id)
    vault_path = os.path.join(campaign_path, "vault")
    
    items = []
    if os.path.exists(vault_path):
        for filename in os.listdir(vault_path):
            if filename.endswith(".json"):
                item = service.load_json(os.path.join(vault_path, filename))
                if item:
                    # Asegurar que usage_count existe para items antiguos
                    if 'usage_count' not in item:
                        item['usage_count'] = 0
                    items.append(item)
    
    return jsonify(items)

@vault_bp.route('/<campaign_id>/vault', methods=['POST'])
def create_vault_item(campaign_id):
    data = request.get_json()
    if not data or 'type' not in data:
        return jsonify({"error": "Type is required"}), 400

    service = get_file_service()
    item_id = generate_id()
    item_type = data['type']
    
    item = {
        "id": item_id,
        "type": item_type,
        "status": "reserve",
        "usage_count": 0, # Nuevo campo para seguimiento
        "tags": data.get('tags', []),
        "content": data.get('content', {})
    }
    
    campaign_path = service._get_campaign_path(campaign_id)
    file_path = os.path.join(campaign_path, "vault", f"{item_type}_{item_id}.json")
    
    service.save_json(file_path, item)
    
    return jsonify(item), 201

@vault_bp.route('/<campaign_id>/vault/<item_id>', methods=['PUT'])
def update_vault_item(campaign_id, item_id):
    data = request.get_json()
    service = get_file_service()
    campaign_path = service._get_campaign_path(campaign_id)
    vault_path = os.path.join(campaign_path, "vault")
    
    target_file = None
    for filename in os.listdir(vault_path):
        if filename.endswith(f"_{item_id}.json"):
            target_file = filename
            break
            
    if not target_file:
        return jsonify({"error": "Item not found"}), 404
        
    file_path = os.path.join(vault_path, target_file)
    current_item = service.load_json(file_path)
    
    # Update fields
    if 'status' in data:
        current_item['status'] = data['status']
    if 'tags' in data:
        current_item['tags'] = data['tags']
    if 'content' in data:
        current_item['content'] = data['content']
    if 'usage_count' in data:
        current_item['usage_count'] = data['usage_count']
        
    service.save_json(file_path, current_item)
    return jsonify(current_item)

@vault_bp.route('/<campaign_id>/vault/<item_id>', methods=['DELETE'])
def delete_vault_item(campaign_id, item_id):
    service = get_file_service()
    campaign_path = service._get_campaign_path(campaign_id)
    vault_path = os.path.join(campaign_path, "vault")
    
    target_file = None
    for filename in os.listdir(vault_path):
        if filename.endswith(f"_{item_id}.json"):
            target_file = filename
            break
            
    if target_file:
        os.remove(os.path.join(vault_path, target_file))
        return jsonify({"message": "Item deleted"})
        
    return jsonify({"error": "Item not found"}), 404