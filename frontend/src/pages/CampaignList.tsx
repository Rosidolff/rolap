import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Link } from 'react-router-dom';

export default function CampaignList() {
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [newCampaignTitle, setNewCampaignTitle] = useState('');

    useEffect(() => {
        loadCampaigns();
    }, []);

    const loadCampaigns = () => {
        api.campaigns.list().then(setCampaigns);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCampaignTitle) return;
        await api.campaigns.create({ title: newCampaignTitle });
        setNewCampaignTitle('');
        loadCampaigns();
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-8 text-purple-400">Mis Campañas</h1>

            <form onSubmit={handleCreate} className="mb-8 flex gap-4">
                <input
                    type="text"
                    value={newCampaignTitle}
                    onChange={(e) => setNewCampaignTitle(e.target.value)}
                    placeholder="Nueva campaña..."
                    className="flex-1 p-3 rounded bg-gray-800 border border-gray-700 text-white focus:border-purple-500 outline-none"
                />
                <button type="submit" className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded font-bold transition-colors text-white">
                    Crear
                </button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {campaigns.map(campaign => (
                    <Link key={campaign.id} to={`/campaign/${campaign.id}/vault`} className="block p-6 bg-gray-800 rounded-lg border border-gray-700 hover:border-purple-500 transition-colors">
                        <h2 className="text-2xl font-bold mb-2 text-white">{campaign.title}</h2>
                        <p className="text-gray-400 line-clamp-2">{campaign.elevator_pitch || "Sin descripción definida..."}</p>
                    </Link>
                ))}
            </div>
        </div>
    );
}