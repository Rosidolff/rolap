import { useParams, Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faEdit, faPlus, faTrash, faGlobe, faBolt, faCheckCircle } from '@fortawesome/free-solid-svg-icons';

const AutoResizeTextarea = ({ value, onChange, placeholder, className }: any) => {
    const ref = useRef<HTMLTextAreaElement>(null);
    useEffect(() => {
        if (ref.current) {
            ref.current.style.height = 'auto';
            ref.current.style.height = ref.current.scrollHeight + 'px';
        }
    }, [value]);
    return <textarea ref={ref} value={value} onChange={onChange} placeholder={placeholder} className={className} />;
};

export default function CampaignDashboard() {
    const { id } = useParams<{ id: string }>();
    const [campaign, setCampaign] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<any>(null);

    useEffect(() => {
        if (id) loadCampaign();
    }, [id]);

    const loadCampaign = () => {
        if (id) api.campaigns.get(id).then(data => {
            setCampaign(data);
            setEditData(data);
        });
    };

    const handleSave = async () => {
        if (!id || !editData) return;
        await api.campaigns.update(id, editData);
        setCampaign(editData);
        setIsEditing(false);
    };

    const updateField = (field: string, value: any) => {
        setEditData({ ...editData, [field]: value });
    };

    const updateFront = (index: number, field: string, value: string) => {
        const newFronts = [...editData.fronts];
        newFronts[index] = { ...newFronts[index], [field]: value };
        setEditData({ ...editData, fronts: newFronts });
    };

    const addFront = () => {
        setEditData({ ...editData, fronts: [...(editData.fronts || []), { name: 'Nueva Amenaza', goal: '', grim_portents: ["", "", ""] }] });
    };

    const removeFront = (index: number) => {
        const newFronts = [...editData.fronts];
        newFronts.splice(index, 1);
        setEditData({ ...editData, fronts: newFronts });
    };

    const updateTruth = (index: number, value: string) => {
        const newTruths = [...editData.truths];
        newTruths[index] = value;
        setEditData({ ...editData, truths: newTruths });
    };

    if (!campaign) return <div className="p-8 text-white">Cargando...</div>;

    return (
        <div className="p-8 max-w-6xl mx-auto min-h-screen bg-gray-900 text-gray-300">
            <header className="mb-8 border-b border-gray-800 pb-4 flex justify-between items-end">
                <div className="w-full">
                    <Link to="/" className="text-gray-500 hover:text-white mb-4 block text-sm uppercase font-bold tracking-wider">&larr; Volver a Campañas</Link>
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={editData.title}
                                    onChange={(e) => updateField('title', e.target.value)}
                                    className="text-4xl font-bold text-white bg-gray-800 border border-gray-700 rounded px-2 w-full outline-none focus:border-purple-500"
                                />
                            ) : (
                                <h1 className="text-4xl font-bold text-white">{campaign.title}</h1>
                            )}
                        </div>
                        
                        <div className="flex gap-2 ml-4">
                            {isEditing ? (
                                <button onClick={handleSave} className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded font-bold flex items-center gap-2">
                                    <FontAwesomeIcon icon={faSave} /> Guardar
                                </button>
                            ) : (
                                <button onClick={() => setIsEditing(true)} className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded font-bold border border-gray-700 flex items-center gap-2">
                                    <FontAwesomeIcon icon={faEdit} /> Editar
                                </button>
                            )}
                            <Link to={`/campaign/${id}/vault`} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-bold">Ir al Vault</Link>
                        </div>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Framework Column (Nuevo) */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 shadow-xl">
                        <h3 className="text-xl font-bold mb-4 text-cyan-400 flex items-center gap-2">
                            <FontAwesomeIcon icon={faGlobe} /> Framework del Mundo
                        </h3>
                        <p className="text-xs text-gray-500 mb-2 italic">
                            Describe aquí los datos fundamentales de tu mundo. La IA usará esto como base principal para generar contenido coherente. Incluye tono, nivel de magia, tecnología, geografía clave, dioses, etc.
                        </p>
                        {isEditing ? (
                            <AutoResizeTextarea
                                value={editData.framework || ''}
                                onChange={(e: any) => updateField('framework', e.target.value)}
                                className="w-full min-h-[200px] bg-gray-900 border border-gray-600 rounded p-4 text-gray-300 leading-relaxed outline-none focus:border-cyan-500"
                                placeholder="Ej: Es un mundo post-apocalíptico donde la magia es radiactiva. La ciudad principal, Neo-Arcadia, flota sobre un mar de nubes tóxicas..."
                            />
                        ) : (
                            <div className="text-gray-300 whitespace-pre-wrap leading-relaxed bg-gray-900/50 p-4 rounded border border-gray-800 min-h-[100px]">
                                {campaign.framework || "No hay framework definido."}
                            </div>
                        )}
                    </div>

                    <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 shadow-xl">
                        <h3 className="text-xl font-bold mb-4 text-yellow-400">Elevator Pitch</h3>
                        {isEditing ? (
                            <AutoResizeTextarea
                                value={editData.elevator_pitch}
                                onChange={(e: any) => updateField('elevator_pitch', e.target.value)}
                                className="w-full bg-gray-900 border border-gray-600 rounded p-3 text-gray-300 outline-none focus:border-yellow-500"
                            />
                        ) : (
                            <p className="text-gray-300 italic text-lg">"{campaign.elevator_pitch || "Define el concepto..."}"</p>
                        )}
                    </div>
                </div>

                {/* Sidebar Column: Fronts & Truths */}
                <div className="space-y-8">
                    {/* Truths */}
                    <div className="bg-gray-800/50 p-5 rounded-lg border border-gray-700">
                        <h3 className="text-lg font-bold text-blue-400 mb-3">Las 6 Verdades</h3>
                        <ul className="space-y-3">
                            {(isEditing ? editData.truths : (campaign.truths || ["","","","","",""])).slice(0,6).map((t: string, i: number) => (
                                <li key={i} className="flex gap-2">
                                    <span className="text-blue-500 font-bold font-mono">{i+1}.</span>
                                    {isEditing ? (
                                        <input
                                            value={t}
                                            onChange={(e) => updateTruth(i, e.target.value)}
                                            className="bg-gray-900 border-b border-gray-600 w-full text-sm px-1 text-white focus:border-blue-500 outline-none"
                                            placeholder={`Verdad #${i+1}`}
                                        />
                                    ) : (
                                        <span className="text-sm text-gray-300">{t || "-"}</span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Fronts */}
                    <div className="bg-gray-800/50 p-5 rounded-lg border border-gray-700">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-red-400 flex items-center gap-2"><FontAwesomeIcon icon={faBolt} /> Frentes</h3>
                            {isEditing && <button onClick={addFront} className="text-green-400 hover:text-white"><FontAwesomeIcon icon={faPlus} /></button>}
                        </div>
                        <div className="space-y-4">
                            {(isEditing ? editData.fronts : campaign.fronts)?.map((f: any, i: number) => (
                                <div key={i} className="bg-gray-900 p-3 rounded border border-gray-700">
                                    {isEditing ? (
                                        <div className="space-y-2">
                                            <div className="flex justify-between gap-2">
                                                <input
                                                    value={f.name}
                                                    onChange={(e) => updateFront(i, 'name', e.target.value)}
                                                    className="bg-transparent border-b border-gray-600 w-full font-bold text-white text-sm focus:border-red-500 outline-none"
                                                    placeholder="Nombre Amenaza"
                                                />
                                                <button onClick={() => removeFront(i)} className="text-red-500 hover:text-red-300"><FontAwesomeIcon icon={faTrash} size="sm" /></button>
                                            </div>
                                            <input
                                                value={f.goal}
                                                onChange={(e) => updateFront(i, 'goal', e.target.value)}
                                                className="bg-transparent border-b border-gray-600 w-full text-xs text-gray-400 italic focus:border-gray-400 outline-none"
                                                placeholder="Objetivo..."
                                            />
                                        </div>
                                    ) : (
                                        <div>
                                            <div className="font-bold text-red-200 text-sm">{f.name}</div>
                                            <div className="text-xs text-gray-500 italic mb-2">{f.goal}</div>
                                            <div className="space-y-1">
                                                {f.grim_portents?.map((gp: any, gpi: number) => (
                                                    <div key={gpi} className="flex items-start gap-2 text-[10px]">
                                                        <FontAwesomeIcon icon={gp.done ? faCheckCircle : faGlobe} className={gp.done ? "text-red-600 mt-0.5" : "text-gray-700 mt-0.5"} />
                                                        <span className={gp.done ? "line-through text-gray-600" : "text-gray-400"}>{gp.text || gp}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {(!campaign.fronts || campaign.fronts.length === 0) && !isEditing && <p className="text-sm text-gray-500">Sin frentes activos.</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}