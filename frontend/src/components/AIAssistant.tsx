import { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faMagic, faCommentDots, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import ReactMarkdown from 'react-markdown';
import { api } from '../services/api';
import { useChat } from '../context/ChatContext';

export default function AIAssistant() {
    // Leemos todo del contexto
    const { messages, addMessage, isOpen, setIsOpen, aiContext } = useChat();
    const { campaignId, mode, sessionId } = aiContext;
    
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!query.trim() || loading || !campaignId) return;

        addMessage({ role: 'user', text: query });
        const currentQuery = query;
        setQuery('');
        setLoading(true);

        try {
            const res = await api.ai.ask(campaignId, currentQuery, mode, sessionId);
            if (res.response) {
                addMessage({ role: 'ai', text: res.response });
            } else {
                addMessage({ role: 'ai', text: "Lo siento, hubo un error conectando con la mente colmena." });
            }
        } catch (error) {
            console.error(error);
            addMessage({ role: 'ai', text: "Error de comunicación con el servidor." });
        } finally {
            setLoading(false);
        }
    };

    // Si no hay campaña cargada, no mostramos nada
    if (!campaignId) return null;

    return (
        <>
            {/* Botón Flotante para abrir (Visible solo si está cerrado) */}
            {!isOpen && (
                <button 
                    onClick={() => { setIsOpen(true); }} 
                    className="fixed bottom-6 right-6 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all z-50 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white animate-in fade-in zoom-in duration-300"
                    title="Asistente IA"
                >
                    <FontAwesomeIcon icon={faMagic} size="lg" />
                </button>
            )}

            {/* Panel Lateral Fijo */}
            <div 
                className={`fixed top-14 right-0 bottom-0 w-96 bg-gray-900 border-l border-gray-700 shadow-2xl flex flex-col transition-transform duration-300 z-40 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
                {/* Header Clickable (Cierra al hacer click) */}
                <div 
                    onClick={() => setIsOpen(false)}
                    className="bg-gray-800/50 p-2 border-b border-gray-700 flex justify-center items-center flex-shrink-0 backdrop-blur-sm cursor-pointer hover:bg-gray-800/80 transition-colors select-none group"
                    title="Click para ocultar panel"
                >
                    <h3 className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 flex items-center gap-2 text-xs px-2 group-hover:opacity-80 transition-opacity">
                        <FontAwesomeIcon icon={faMagic} className="text-purple-500" />
                        {mode === 'vault' ? 'Creador' : 'Narrador'} IA
                    </h3>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-900 custom-scrollbar">
                    {messages.length === 0 && (
                        <div className="text-center text-gray-500 text-sm mt-10 px-4 select-none">
                            <FontAwesomeIcon icon={faMagic} className="text-yellow-600 text-2xl mb-2 opacity-50" />
                            <p>Hola DM.</p>
                            <p className="mt-2 text-xs text-gray-600">
                                {mode === 'vault' 
                                    ? "Estoy listo para crear contenido." 
                                    : "Escucho la sesión. Pregunta lo que necesites."}
                            </p>
                        </div>
                    )}
                    {messages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[90%] rounded-lg p-3 text-sm ${msg.role === 'user' ? 'bg-blue-900/50 text-blue-100 border border-blue-800' : 'bg-gray-800 text-gray-300 border border-gray-700'}`}>
                                {msg.role === 'ai' ? (
                                    <div className="prose prose-invert prose-sm max-w-none">
                                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                                    </div>
                                ) : (
                                    msg.text
                                )}
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex justify-start">
                            <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                                <FontAwesomeIcon icon={faCommentDots} className="text-gray-500 animate-pulse" />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-3 bg-gray-800 border-t border-gray-700 flex-shrink-0">
                    <div className="flex items-end gap-2">
                        {/* Input de Texto */}
                        <div className="relative flex-1">
                            <textarea 
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                                placeholder="Escribe aquí..."
                                className="w-full bg-gray-900 border border-gray-600 rounded-lg pl-3 pr-8 py-2 text-sm text-white focus:border-purple-500 outline-none resize-none h-10 focus:h-24 transition-all custom-scrollbar"
                            />
                        </div>

                        {/* Botones de Acción */}
                        <div className="flex gap-1">
                            <button 
                                onClick={handleSend}
                                disabled={loading || !query.trim()}
                                className="w-10 h-10 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg flex items-center justify-center transition-colors"
                                title="Enviar"
                            >
                                <FontAwesomeIcon icon={faPaperPlane} />
                            </button>
                            
                            <button 
                                onClick={() => setIsOpen(false)} 
                                className="w-10 h-10 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white rounded-lg flex items-center justify-center transition-colors border border-gray-600"
                                title="Cerrar Panel"
                            >
                                <FontAwesomeIcon icon={faChevronDown} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}