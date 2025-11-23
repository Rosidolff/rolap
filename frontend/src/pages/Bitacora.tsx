import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBook, faCalendarAlt } from '@fortawesome/free-solid-svg-icons';
import TopNavBar from '../components/TopNavBar';
import CampaignSidebar from '../components/CampaignSidebar';
import ReactMarkdown from 'react-markdown';

export default function Bitacora() {
    const { id } = useParams<{ id: string }>();
    const [sessions, setSessions] = useState<any[]>([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        if (id) loadSessions();
    }, [id]);

    const loadSessions = async () => {
        if (!id) return;
        const list = await api.sessions.list(id);
        // Filtrar solo las completadas
        setSessions(list.filter((s: any) => s.status === 'completed').reverse());
    };

    return (
        <div className="flex flex-col h-screen bg-gray-900 text-gray-300 font-sans">
            {id && (
                <TopNavBar 
                    campaignId={id} 
                    activeTab="bitacora" 
                    onTabChange={() => {}} 
                    onToggleInfo={() => setIsSidebarOpen(true)} 
                    searchQuery="" 
                    onSearchChange={() => {}} 
                />
            )}
            {id && <CampaignSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} campaignId={id} />}

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-3xl font-bold text-yellow-500 mb-8 flex items-center gap-3">
                        <FontAwesomeIcon icon={faBook} /> Bitácora de Campaña
                    </h1>

                    {sessions.length === 0 ? (
                        <p className="text-gray-500 italic">Aún no se ha completado ninguna sesión.</p>
                    ) : (
                        <div className="space-y-8">
                            {sessions.map(session => (
                                <div key={session.id} className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden shadow-lg">
                                    <div className="bg-gray-750 border-b border-gray-700 p-4 flex justify-between items-center">
                                        <h2 className="text-xl font-bold text-white">
                                            Sesión #{session.number}: {session.title || "Sin Título"}
                                        </h2>
                                        <span className="text-sm text-gray-400 flex items-center gap-2">
                                            <FontAwesomeIcon icon={faCalendarAlt} />
                                            {new Date(session.date).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="p-6 prose prose-invert prose-sm max-w-none text-gray-300">
                                        {session.summary ? (
                                            <ReactMarkdown>{session.summary}</ReactMarkdown>
                                        ) : (
                                            <p className="italic text-gray-500">Sin resumen registrado.</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}