import { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faTimes, faHistory, faPlus, faTrash, faCheck, faStar, faCircle, 
    faUser, faLevelUpAlt, faBook, faGlobe, faChevronDown, faChevronUp, faToggleOn, faToggleOff, faCompressAlt
} from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';

interface CampaignSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    campaignId: string;
}

const PLACEHOLDERS_TRUTHS = ["Verdad Social/Económica", "Verdad Política/Amenaza interna", "Verdad de amenaza Externa", "Verdad Cosmológica", "Verdad Histórica", "Otra verdad"];

const MoodsEditor = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
    const [inputValue, setInputValue] = useState("");
    const tags = value ? value.split(',').map(t => t.trim()).filter(t => t) : [];

    const removeTag = (index: number) => {
        const newTags = [...tags];
        newTags.splice(index, 1);
        onChange(newTags.join(','));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            if (inputValue.trim()) {
                const newTags = [...tags, inputValue.trim()];
                onChange(newTags.join(','));
                setInputValue("");
            }
        } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
            removeTag(tags.length - 1);
        }
    };

    return (
        <div className="w-full bg-transparent border-b border-gray-800 hover:border-gray-700 flex flex-wrap gap-1 focus-within:border-pink-500 transition-colors p-1.5">
            {tags.map((tag, i) => (
                <span key={i} className="bg-pink-900/30 text-pink-300 text-[10px] px-2 py-0.5 rounded border border-pink-800/50 flex items-center gap-1">
                    {tag} <button onClick={() => removeTag(i)} className="hover:text-white"><FontAwesomeIcon icon={faTimes} size="xs"/></button>
                </span>
            ))}
            <input 
                className="flex-1 bg-transparent text-sm text-gray-300 outline-none min-w-[80px] px-1"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={() => { if(inputValue.trim()) { onChange([...tags, inputValue.trim()].join(',')); setInputValue(""); } }}
                placeholder={tags.length === 0 ? "Añadir géneros..." : ""}
            />
        </div>
    );
};

const AutoResizeTextarea = ({ value, onChange, onBlur, placeholder, className }: any) => {
    const ref = useRef<HTMLTextAreaElement>(null);
    useEffect(() => {
        if (ref.current) {
            ref.current.style.height = 'auto';
            ref.current.style.height = ref.current.scrollHeight + 'px';
        }
    }, [value]);
    return <textarea ref={ref} value={value} onChange={onChange} onBlur={onBlur} placeholder={placeholder} className={className} rows={1} />;
};

export default function CampaignSidebar({ isOpen, onClose, campaignId }: CampaignSidebarProps) {
    const [metadata, setMetadata] = useState<any>(null);
    const [sessions, setSessions] = useState<any[]>([]);
    const [characters, setCharacters] = useState<any[]>([]);
    const [showFramework, setShowFramework] = useState(false); 
    const navigate = useNavigate();

    useEffect(() => {
        if (isOpen && campaignId) {
            loadData();
        }
    }, [isOpen, campaignId]);

    const loadData = async () => {
        const meta = await api.campaigns.get(campaignId);
        const truths = meta.truths || [];
        while (truths.length < 6) truths.push("");
        
        const fronts = (meta.fronts || []).map((f: any) => ({
            ...f,
            grim_portents: (f.grim_portents || ["", "", ""]).map((gp: any) => 
                typeof gp === 'string' ? { text: gp, done: false } : gp
            )
        }));

        setMetadata({ ...meta, truths: truths.slice(0, 6), fronts });
        const sess = await api.sessions.list(campaignId);
        setSessions(sess.sort((a: any, b: any) => b.number - a.number));

        const vault = await api.vault.list(campaignId);
        setCharacters(vault.filter((i:any) => i.type === 'character'));
    };

    const persistChanges = async (newData: any) => {
        if (!newData) return;
        setMetadata(newData);
        await api.campaigns.update(campaignId, newData);
    };

    const updateField = (field: string, value: any) => {
        const newData = { ...metadata, [field]: value };
        setMetadata(newData);
    };

    const handleBlur = () => { persistChanges(metadata); };

    const updateTruth = (index: number, val: string) => {
        const newTruths = [...metadata.truths];
        newTruths[index] = val;
        updateField('truths', newTruths);
    };

    const updateFront = (index: number, field: string, val: string) => {
        const newFronts = [...(metadata.fronts || [])];
        newFronts[index] = { ...newFronts[index], [field]: val };
        updateField('fronts', newFronts);
    };
    
    const addFront = () => {
        const newFronts = [...(metadata.fronts || []), { 
            name: '', 
            goal: '', 
            grim_portents: [{text: "", done: false}, {text: "", done: false}, {text: "", done: false}] 
        }];
        persistChanges({ ...metadata, fronts: newFronts });
    };

    const removeFront = (index: number) => {
        const newFronts = [...(metadata.fronts || [])];
        newFronts.splice(index, 1);
        persistChanges({ ...metadata, fronts: newFronts });
    };

    const updateGrimPortent = (frontIndex: number, portentIndex: number, field: 'text' | 'done', val: any) => {
        const newFronts = [...(metadata.fronts || [])];
        const portents = [...newFronts[frontIndex].grim_portents];
        portents[portentIndex] = { ...portents[portentIndex], [field]: val };
        newFronts[frontIndex].grim_portents = portents;
        
        if (field === 'done') {
            persistChanges({ ...metadata, fronts: newFronts });
        } else {
            updateField('fronts', newFronts);
        }
    };

    const addGrimPortent = (frontIndex: number) => {
        const newFronts = [...(metadata.fronts || [])];
        newFronts[frontIndex].grim_portents.push({ text: "", done: false });
        persistChanges({ ...metadata, fronts: newFronts });
    };

    const removeGrimPortent = (frontIndex: number, portentIndex: number) => {
        const newFronts = [...(metadata.fronts || [])];
        newFronts[frontIndex].grim_portents.splice(portentIndex, 1);
        persistChanges({ ...metadata, fronts: newFronts });
    };

    const goToSession = (session: any) => {
        if (session.status === 'completed') {
            navigate(`/campaign/${campaignId}/bitacora`);
        } else {
            navigate(`/campaign/${campaignId}/sessions`, { state: { sessionId: session.id } });
        }
        onClose();
    };

    const setActiveSession = async (sessionId: string) => {
        const updated = { ...metadata, active_session: sessionId };
        persistChanges(updated);
    };

    const handleDeleteSession = async (session: any, e: React.MouseEvent) => {
        e.stopPropagation();
        if (session.status === 'completed') {
            alert("Las sesiones completadas están archivadas y no se pueden borrar.");
            return;
        }
        if (confirm("¿Estás seguro de eliminar esta sesión? Todos los recursos vinculados volverán al Vault.")) {
            await api.sessions.delete(campaignId, session.id);
            loadData();
        }
    };

    return (
        <>
            {isOpen && <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose}></div>}
            
            <div className={`fixed top-0 left-0 h-full w-96 bg-gray-900 border-r border-gray-700 shadow-2xl transform transition-transform duration-300 z-50 flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex justify-between items-start p-4 border-b border-gray-800 bg-gray-900">
                    <div className="flex-1 pr-2">
                        <h2 className="text-sm font-bold uppercase text-gray-400 tracking-widest truncate mb-1">{metadata?.title || "Campaña"}</h2>
                        <div className="flex items-center gap-2 text-xs">
                            <span className="text-yellow-500 font-bold flex items-center gap-1"><FontAwesomeIcon icon={faLevelUpAlt} /> NIVEL</span>
                            <input 
                                className="bg-gray-800 border border-gray-700 rounded px-1 w-10 text-center text-yellow-400 font-bold outline-none focus:border-yellow-500"
                                value={metadata?.level || 1}
                                onChange={(e) => updateField('level', e.target.value)}
                                onBlur={handleBlur}
                            />
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white"><FontAwesomeIcon icon={faTimes} /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-6">
                    
                    <section>
                        <h3 className="text-xs font-bold text-orange-500 uppercase mb-2 flex items-center gap-2"><FontAwesomeIcon icon={faUser} /> Personajes</h3>
                        <div className="flex flex-wrap gap-2">
                            {characters.map(char => (
                                <div key={char.id} className="text-xs text-gray-300 bg-gray-800 px-2 py-1 rounded border border-gray-700 flex items-center gap-1">
                                    <span className="font-bold text-orange-300">{char.content.name}</span>
                                    <span className="text-gray-500">({char.content.class})</span>
                                </div>
                            ))}
                            {characters.length === 0 && <p className="text-xs text-gray-600 italic">Sin personajes.</p>}
                        </div>
                    </section>

                    <section>
                        <h3 className="text-xs font-bold text-yellow-500 uppercase mb-2">Eje Conceptual</h3>
                        <AutoResizeTextarea value={metadata?.elevator_pitch || ''} onChange={(e: any) => updateField('elevator_pitch', e.target.value)} onBlur={handleBlur} placeholder="El gancho principal..." className="w-full bg-transparent border-b border-gray-800 hover:border-gray-700 focus:border-yellow-500 outline-none text-sm text-gray-300 resize-none" />
                    </section>

                    <section>
                        <h3 className="text-xs font-bold text-pink-500 uppercase mb-2">Géneros</h3>
                        <MoodsEditor value={metadata?.moods || ''} onChange={(val) => { updateField('moods', val); persistChanges({...metadata, moods: val}); }} />
                    </section>

                    <section>
                        <h3 className="text-xs font-bold text-blue-500 uppercase mb-2">Las 6 Verdades</h3>
                        <ul className="space-y-2">
                            {metadata?.truths?.map((t: string, i: number) => (
                                <li key={i} className="flex gap-2 items-start">
                                    <span className="text-xs text-gray-600 font-mono mt-1">{i+1}.</span>
                                    <AutoResizeTextarea value={t} onChange={(e: any) => updateTruth(i, e.target.value)} onBlur={handleBlur} placeholder={PLACEHOLDERS_TRUTHS[i]} className="flex-1 bg-transparent border-b border-gray-800 hover:border-gray-700 focus:border-blue-500 outline-none text-sm text-gray-300 resize-none" />
                                </li>
                            ))}
                        </ul>
                    </section>

                    <section>
                         <div className="flex justify-between items-center mb-2">
                            <h3 className="text-xs font-bold text-red-500 uppercase">Frentes</h3>
                            <button onClick={addFront} className="text-gray-500 hover:text-green-400"><FontAwesomeIcon icon={faPlus} size="xs"/></button>
                        </div>
                        <div className="space-y-4">
                            {metadata?.fronts?.map((f: any, i: number) => (
                                <div key={i} className="bg-gray-800/50 p-3 rounded border border-gray-700/50 relative group/front">
                                    <div className="flex gap-2 mb-2 items-center">
                                        <input value={f.name} onChange={(e) => updateFront(i, 'name', e.target.value)} onBlur={handleBlur} placeholder="Nombre Amenaza" className="bg-transparent border-b border-gray-600 w-full text-sm font-bold text-gray-200 focus:border-red-500 outline-none" />
                                        <button onClick={() => removeFront(i)} className="text-gray-600 hover:text-red-500"><FontAwesomeIcon icon={faTrash} size="xs"/></button>
                                    </div>
                                    <input value={f.goal} onChange={(e) => updateFront(i, 'goal', e.target.value)} onBlur={handleBlur} placeholder="Objetivo..." className="bg-transparent w-full text-xs text-gray-400 focus:text-gray-200 outline-none mb-2 italic" />
                                    
                                    <div className="space-y-1 pl-2 border-l-2 border-red-900/30">
                                        {(f.grim_portents || []).map((gp: any, gpIndex: number) => (
                                            <div key={gpIndex} className="flex items-center gap-2 group/portent mb-1">
                                                <button 
                                                    onClick={() => updateGrimPortent(i, gpIndex, 'done', !gp.done)}
                                                    className={`flex-shrink-0 w-3 h-3 flex items-center justify-center outline-none ${gp.done ? 'text-red-800' : ''}`}
                                                >
                                                    {gp.done ? (
                                                        <FontAwesomeIcon icon={faCircle} className="text-[10px]" />
                                                    ) : (
                                                        <div className="w-2.5 h-2.5 rounded-full border-2 border-gray-600 hover:border-red-500 transition-colors"></div>
                                                    )}
                                                </button>
                                                
                                                <input 
                                                    value={gp.text || ''} 
                                                    onChange={(e) => updateGrimPortent(i, gpIndex, 'text', e.target.value)} 
                                                    onBlur={handleBlur} 
                                                    placeholder={`Evento ${gpIndex + 1}`} 
                                                    className={`bg-transparent w-full text-[10px] outline-none hover:bg-gray-800/50 rounded px-1 transition-colors ${gp.done ? 'line-through text-gray-500' : 'text-gray-300'}`} 
                                                />
                                                
                                                {gpIndex >= 3 && (
                                                    <button onClick={() => removeGrimPortent(i, gpIndex)} className="text-gray-700 hover:text-red-500 opacity-0 group-hover/portent:opacity-100 transition-opacity">
                                                        <FontAwesomeIcon icon={faTimes} size="xs"/>
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex justify-end mt-1">
                                        <button onClick={() => addGrimPortent(i)} className="text-gray-600 hover:text-green-400 text-[10px] opacity-0 group-hover/front:opacity-100 transition-opacity px-2" title="Añadir Evento">
                                            <FontAwesomeIcon icon={faPlus} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {(!metadata?.fronts || metadata.fronts.length === 0) && <p className="text-xs text-gray-600 italic">Sin frentes activos.</p>}
                        </div>
                    </section>

                    <section className="pt-4 border-t border-gray-800">
                         <div className="flex justify-between items-center mb-3">
                             <h3 className="text-xs font-bold text-green-500 uppercase flex items-center gap-2"><FontAwesomeIcon icon={faHistory} /> Cronología</h3>
                         </div>
                         <div className="space-y-2">
                            {sessions.length === 0 ? (
                                <p className="text-xs text-gray-600 italic">No hay sesiones registradas.</p>
                            ) : (
                                sessions.map(s => {
                                    const isActive = metadata?.active_session === s.id;
                                    return (
                                        <div key={s.id} className={`flex items-center justify-between group p-2 rounded border border-transparent hover:border-gray-700 ${s.status === 'completed' ? 'bg-gray-900 opacity-80 hover:opacity-100' : 'bg-gray-800/30'}`}>
                                            <div className="cursor-pointer flex-1" onClick={() => goToSession(s)}>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-xs font-bold ${s.status === 'completed' ? 'text-gray-500' : 'text-gray-300 group-hover:text-green-400'}`}>Sesión #{s.number}</span>
                                                    {s.status === 'completed' ? (
                                                        <span className="text-[9px] text-gray-500 font-normal border border-gray-700 px-1 rounded bg-gray-800">Archivada</span>
                                                    ) : (
                                                        <span className="text-[9px] text-green-500 font-normal border border-green-900 px-1 rounded bg-green-900/20">Activa</span>
                                                    )}
                                                </div>
                                                <div className="text-[11px] text-gray-400 font-italic truncate">{s.title || "Sin título..."}</div>
                                                <div className="text-[9px] text-gray-600">{new Date(s.date).toLocaleDateString()}</div>
                                            </div>
                                            
                                            <div className="flex items-center gap-1">
                                                {s.status !== 'completed' && (
                                                    <button onClick={() => setActiveSession(s.id)} className={`p-1.5 rounded hover:bg-gray-700 transition-colors ${isActive ? 'text-yellow-400' : 'text-gray-600 hover:text-yellow-200'}`} title={isActive ? "Sesión Activa" : "Marcar como Activa"}>
                                                        <FontAwesomeIcon icon={isActive ? faStar : faCheck} />
                                                    </button>
                                                )}
                                                
                                                {s.status !== 'completed' ? (
                                                    <button onClick={(e) => handleDeleteSession(s, e)} className="p-1.5 rounded text-gray-600 hover:bg-red-900/50 hover:text-red-400 transition-colors" title="Borrar Sesión">
                                                        <FontAwesomeIcon icon={faTrash} size="xs"/>
                                                    </button>
                                                ) : (
                                                    <button onClick={() => goToSession(s)} className="p-1.5 rounded text-gray-600 hover:text-blue-400 transition-colors" title="Ver en Bitácora">
                                                        <FontAwesomeIcon icon={faBook} size="xs"/>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                         </div>
                    </section>

                    {/* --- SECCIÓN FRAMEWORK MUNDIAL (AL FINAL) --- */}
                    <section className="pt-4 border-t border-gray-800 pb-10">
                        <div 
                            className="flex justify-between items-center mb-2 cursor-pointer group select-none" 
                            onClick={() => setShowFramework(!showFramework)}
                        >
                            <h3 className="text-xs font-bold text-cyan-500 uppercase flex items-center gap-2">
                                <FontAwesomeIcon icon={faGlobe} /> Framework Mundial
                            </h3>
                            <FontAwesomeIcon 
                                icon={showFramework ? faChevronUp : faChevronDown} 
                                className="text-gray-600 group-hover:text-white transition-colors text-xs" 
                            />
                        </div>
                        
                        {/* Contenedor colapsable */}
                        <div className={`overflow-hidden transition-all duration-300 ease-in-out space-y-4 ${showFramework ? 'max-h-[2000px] opacity-100 pt-2' : 'max-h-0 opacity-0'}`}>
                            
                            {/* Control para la IA */}
                            <div className="flex items-center justify-between bg-gray-800/30 p-2 rounded border border-gray-700">
                                <span className="text-[10px] text-gray-400">Enviar a la IA:</span>
                                <button 
                                    onClick={() => {
                                        const newVal = !metadata?.use_full_framework;
                                        updateField('use_full_framework', newVal);
                                        persistChanges({ ...metadata, use_full_framework: newVal });
                                    }}
                                    className="flex items-center gap-2 text-xs font-bold focus:outline-none"
                                >
                                    <span className={metadata?.use_full_framework ? "text-cyan-400" : "text-gray-500"}>Completo</span>
                                    <FontAwesomeIcon 
                                        icon={metadata?.use_full_framework ? faToggleOn : faToggleOff} 
                                        className={`text-lg ${metadata?.use_full_framework ? "text-cyan-500" : "text-gray-600"}`} 
                                    />
                                    <span className={!metadata?.use_full_framework ? "text-green-400" : "text-gray-500"}>Resumido</span>
                                </button>
                            </div>

                            {/* Framework Resumido (Base por defecto) */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-green-500 uppercase flex items-center gap-1">
                                    <FontAwesomeIcon icon={faCompressAlt} /> Resumen (Contexto Ágil)
                                </label>
                                <p className="text-[9px] text-gray-500 italic">Se usará por defecto para respuestas rápidas.</p>
                                <AutoResizeTextarea 
                                    value={metadata?.framework_summary || ''} 
                                    onChange={(e: any) => updateField('framework_summary', e.target.value)} 
                                    onBlur={handleBlur} 
                                    placeholder="Puntos clave para que la IA no pierda el foco (ej: Tono, Magia, Tecnología)..." 
                                    className="w-full bg-gray-800/50 border border-gray-700 rounded p-2 text-xs text-gray-300 focus:border-green-500 outline-none resize-none min-h-[80px]" 
                                />
                            </div>

                            {/* Framework Completo */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-cyan-500 uppercase flex items-center gap-1">
                                    <FontAwesomeIcon icon={faBook} /> Framework Completo (Lore)
                                </label>
                                <p className="text-[9px] text-gray-500 italic">Activa el interruptor arriba para forzar su uso.</p>
                                <AutoResizeTextarea 
                                    value={metadata?.framework || ''} 
                                    onChange={(e: any) => updateField('framework', e.target.value)} 
                                    onBlur={handleBlur} 
                                    placeholder="Lore completo, historia, geografía detallada..." 
                                    className="w-full bg-gray-800/50 border border-gray-700 rounded p-2 text-xs text-gray-300 focus:border-cyan-500 outline-none resize-none min-h-[300px]" 
                                />
                            </div>
                        </div>
                    </section>

                </div>
            </div>
        </>
    );
}