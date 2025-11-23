import { useParams } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faTrash, faTimes, faChevronDown, faChevronRight, faPen, faPlus, faShareFromSquare, faMinus, faShieldAlt, faGem, faLink, faCheckSquare, faSquare, faTag, faSave, faSpinner
} from '@fortawesome/free-solid-svg-icons';
import TopNavBar from '../components/TopNavBar';
import CampaignSidebar from '../components/CampaignSidebar';
import { useChat } from '../context/ChatContext'; 

const ITEM_TYPES = ["character", "npc", "scene", "secret", "location", "monster", "item"];

const TYPE_LABELS: Record<string, string> = {
    character: "PERSONAJES",
    npc: "NPCS",
    scene: "ESCENAS",
    secret: "SECRETOS",
    location: "LUGARES",
    monster: "ENEMIGOS",
    item: "ITEMS"
};

// --- COMPONENTE TAG INPUT ---
const TagInput = ({ tags, onChange, allExistingTags }: { tags: string[], onChange: (t: string[]) => void, allExistingTags: string[] }) => {
    const [input, setInput] = useState('');
    const [suggestions, setSuggestions] = useState<string[]>([]);

    const handleAdd = (val: string) => {
        const trimmed = val.trim().toLowerCase();
        if (trimmed && !tags.includes(trimmed)) {
            onChange([...tags, trimmed]);
        }
        setInput('');
        setSuggestions([]);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAdd(input);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setInput(val);
        if (val.length > 0) {
            setSuggestions(allExistingTags.filter(t => t.includes(val.toLowerCase()) && !tags.includes(t)).slice(0, 5));
        } else {
            setSuggestions([]);
        }
    };

    return (
        <div className="flex flex-wrap gap-1 items-center bg-gray-900 border border-gray-700 rounded px-2 py-1 w-full relative">
            <FontAwesomeIcon icon={faTag} className="text-gray-600 text-xs" />
            {tags.map(tag => (
                <span key={tag} className="bg-blue-900/40 text-blue-300 text-[10px] px-1.5 rounded border border-blue-800 flex items-center gap-1">
                    {tag}
                    <button onClick={() => onChange(tags.filter(t => t !== tag))} className="hover:text-white"><FontAwesomeIcon icon={faTimes} /></button>
                </span>
            ))}
            <input 
                value={input}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="Etiquetas..."
                className="bg-transparent text-xs text-white outline-none flex-1 min-w-[60px]"
            />
            {suggestions.length > 0 && (
                <div className="absolute top-full left-0 w-full bg-gray-800 border border-gray-600 rounded mt-1 z-50 shadow-lg">
                    {suggestions.map(s => (
                        <div key={s} onClick={() => handleAdd(s)} className="px-2 py-1 text-xs text-gray-300 hover:bg-blue-600 hover:text-white cursor-pointer">
                            {s}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const ListEditor = ({ items, onChange, placeholder, icon, checkable = false }: { items: any[], onChange: (val: any[]) => void, placeholder: string, icon?: any, checkable?: boolean }) => {
    const [inputValue, setInputValue] = useState("");
    
    const add = () => {
        if (inputValue.trim()) {
            const newItem = checkable ? { text: inputValue.trim(), done: false } : inputValue.trim();
            onChange([...(items || []), newItem]);
            setInputValue("");
        }
    };

    const remove = (index: number) => {
        const newItems = [...(items || [])];
        newItems.splice(index, 1);
        onChange(newItems);
    };

    const toggleCheck = (index: number) => {
        const newItems = [...(items || [])];
        const item = newItems[index];
        if (typeof item === 'object') {
            newItems[index] = { ...item, done: !item.done };
            onChange(newItems);
        }
    };

    return (
        <div className="w-full">
            <ul className="mb-1 space-y-1">
                {(items || []).map((item, i) => {
                    const isObj = typeof item === 'object';
                    const text = isObj ? item.text : item;
                    const isDone = isObj ? item.done : false;

                    return (
                        <li key={i} className={`flex items-start gap-2 text-xs bg-gray-800/50 rounded px-2 py-1 ${isDone ? 'opacity-50' : ''}`}>
                             {checkable && isObj ? (
                                 <button onClick={() => toggleCheck(i)} className={`mt-0.5 ${isDone ? 'text-green-500' : 'text-gray-600 hover:text-gray-400'}`}>
                                     <FontAwesomeIcon icon={isDone ? faCheckSquare : faSquare} />
                                 </button>
                             ) : (
                                 icon && <FontAwesomeIcon icon={icon} className="mt-0.5 text-gray-500" size="xs"/>
                             )}
                             <span className={`flex-1 break-words text-gray-300 ${isDone ? 'line-through' : ''}`}>{text}</span>
                             <button onClick={() => remove(i)} className="text-gray-600 hover:text-red-400"><FontAwesomeIcon icon={faTimes} size="xs"/></button>
                        </li>
                    );
                })}
            </ul>
            <div className="flex gap-1">
                <input 
                    className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:border-blue-500 outline-none"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && add()}
                    placeholder={placeholder}
                />
                <button onClick={add} className="px-2 bg-gray-700 hover:bg-blue-600 rounded text-white transition-colors"><FontAwesomeIcon icon={faPlus} size="xs" /></button>
            </div>
        </div>
    );
};

const AutoResizeTextarea = ({ value, onChange, placeholder, className }: any) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [value]);
    return <textarea ref={textareaRef} value={value} onChange={onChange} className={`${className} overflow-hidden`} placeholder={placeholder} rows={3} style={{ minHeight: '4.5rem' }} />;
};

const CharacterFullView = ({ content }: { content: any }) => {
    
    const renderList = (list: any[]) => {
        if (!list || list.length === 0) return <span className="text-gray-600 italic">-</span>;
        return (
            <ul className="list-none text-gray-400 space-y-0.5">
                {list.map((item: any, i: number) => {
                    const isObj = typeof item === 'object';
                    const text = isObj ? item.text : item;
                    const isDone = isObj ? item.done : false;
                    return (
                        <li key={i} className={`flex gap-2 items-start ${isDone ? 'line-through opacity-50 text-gray-500' : ''}`}>
                            {isDone && <FontAwesomeIcon icon={faCheckSquare} className="mt-1 text-[9px]" />}
                            {!isDone && <div className="w-2 h-2 mt-1 rounded-sm border border-gray-600"></div>}
                            <span>{text}</span>
                        </li>
                    );
                })}
            </ul>
        );
    };

    return (
        <div className="bg-gray-900/30 p-3 text-xs border-t border-purple-900/30 -mx-2 -mb-1 mt-1">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-3">
                <div><span className="text-gray-500 font-bold uppercase text-[10px]">Clase:</span> <span className="text-gray-300 ml-1">{content.class}</span></div>
                <div><span className="text-gray-500 font-bold uppercase text-[10px]">Raza:</span> <span className="text-gray-300 ml-1">{content.race}</span></div>
                <div><span className="text-gray-500 font-bold uppercase text-[10px]">Jugador:</span> <span className="text-gray-300 ml-1">{content.player_name}</span></div>
                <div><span className="text-gray-500 font-bold uppercase text-[10px]">Diversión:</span> <span className="text-gray-300 ml-1">{content.fun_type}</span></div>
                <div className="col-span-2"><span className="text-gray-500 font-bold uppercase text-[10px]">Combate:</span> <span className="text-gray-300 ml-1">{content.combat_style}</span></div>
            </div>
            
            {content.background && (
                <div className="mb-3">
                    <div className="text-gray-500 font-bold uppercase text-[10px] mb-1">Trasfondo</div>
                    <div className="text-gray-400 italic leading-relaxed">{content.background}</div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
                <div className="bg-red-900/10 p-2 rounded border border-red-900/20">
                    <div className="font-bold text-red-400 mb-1 flex gap-1 items-center uppercase text-[10px]"><FontAwesomeIcon icon={faShieldAlt} /> Límites</div>
                    {renderList(content.safety_tools)}
                </div>
                <div className="bg-yellow-900/10 p-2 rounded border border-yellow-900/20">
                    <div className="font-bold text-yellow-400 mb-1 flex gap-1 items-center uppercase text-[10px]"><FontAwesomeIcon icon={faGem} /> Deseos</div>
                    {renderList(content.wish_list)}
                </div>
                <div className="bg-blue-900/10 p-2 rounded border border-blue-900/20">
                    <div className="font-bold text-blue-400 mb-1 flex gap-1 items-center uppercase text-[10px]"><FontAwesomeIcon icon={faLink} /> Vínculos</div>
                    {renderList(content.bonds)}
                </div>
            </div>

            {content.notes && (
                <div className="pt-2 border-t border-gray-800/50">
                    <div className="text-gray-500 font-bold uppercase text-[10px] mb-1">Notas Persistentes</div>
                    <div className="text-gray-300 whitespace-pre-wrap leading-relaxed">{content.notes}</div>
                </div>
            )}
        </div>
    );
};

export default function VaultManager() {
    const { id } = useParams<{ id: string }>();
    const [items, setItems] = useState<any[]>([]);
    const [filterType, setFilterType] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    
    const [activeSession, setActiveSession] = useState<any>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'used'>('all');
    const [subFilter, setSubFilter] = useState<string>('all');

    const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
        character: true, npc: true, scene: true, secret: true, location: true, monster: true, item: true
    });
    const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editData, setEditData] = useState<any>({});
    const editRef = useRef<HTMLDivElement>(null);

    const allTags = Array.from(new Set(items.flatMap(i => i.tags || [])));

    const { setAiContext } = useChat();

    useEffect(() => {
        if (id) {
            loadData();
            setAiContext({ campaignId: id, mode: 'vault' });
        }
    }, [id, setAiContext]);

    useEffect(() => {
        const handleClickOutside = async (event: MouseEvent) => {
            if (editingId && editRef.current && !editRef.current.contains(event.target as Node)) {
                 await saveEdit();
            }
        };
        if (editingId) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [editingId, editData]);

    const loadData = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const [vaultData, campData] = await Promise.all([
                api.vault.list(id),
                api.campaigns.get(id).then(camp => {
                    if (camp.active_session) return api.sessions.get(id, camp.active_session);
                    return api.sessions.list(id).then(list => list.length > 0 ? list[0] : null);
                })
            ]);
            setItems(vaultData);
            setActiveSession(campData);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (type: string) => {
        if (!id) return;
        let defaultContent: any = { name: `Nuevo ${type}`, title: `Nuevo ${type}`, description: "" };
        
        if (type === 'character') {
            defaultContent = {
                name: "Nombre Personaje",
                player_name: "Nombre Jugador",
                class: "",
                race: "",
                fun_type: "",
                combat_style: "",
                safety_tools: [],
                wish_list: [],
                bonds: [],
                background: "",
                notes: "" 
            };
        }
        else if (type === 'npc') { defaultContent.archetype = ""; defaultContent.relationship = ""; }
        else if (type === 'scene') { defaultContent.scene_type = "explore"; }
        else if (type === 'location') { defaultContent.aspects = ""; }

        const newItem = await api.vault.create(id, { type, content: defaultContent, tags: [], usage_count: 0 });
        await loadData();
        setEditingId(newItem.id);
        setEditData(newItem);
        if (filterType === 'all') setOpenGroups(prev => ({ ...prev, [type]: true }));
    };

    const handleDelete = async (itemId: string) => {
        if (!id || !confirm("¿Borrar elemento permanentemente?")) return;
        await api.vault.delete(id, itemId);
        loadData();
    };

    const saveEdit = async () => {
        if (!id || !editingId) return;
        await api.vault.update(id, editingId, editData);
        setEditingId(null);
        loadData();
    };

    const toggleSessionItem = async (itemId: string) => {
        const item = items.find(i => i.id === itemId);
        if (item && item.type === 'character') {
            alert("Los personajes siempre están disponibles en sesión.");
            return;
        }

        if (!id || !activeSession) {
            alert("No hay sesión activa detectada para vincular.");
            return;
        }

        const isLinked = activeSession.linked_items?.includes(itemId);
        let newLinked;
        let newStatus;

        if (isLinked) {
            newLinked = activeSession.linked_items.filter((i: string) => i !== itemId);
            newStatus = 'reserve';
        } else {
            newLinked = [...(activeSession.linked_items || []), itemId];
            newStatus = 'active';
        }

        const updatedSession = { ...activeSession, linked_items: newLinked };
        await api.sessions.update(id, activeSession.id, updatedSession);
        setActiveSession(updatedSession);

        await api.vault.update(id, itemId, { status: newStatus });
        loadData();
    };

    const startEditing = (item: any) => { setEditingId(item.id); setEditData(JSON.parse(JSON.stringify(item))); };
    
    const updateEditContent = (field: string, value: any) => {
        const newContent = { ...editData.content, [field]: value };
        if (field === 'name') newContent.title = value;
        if (field === 'title') newContent.name = value;
        setEditData({ ...editData, content: newContent });
    };

    const updateEditTags = (newTags: string[]) => {
        setEditData({ ...editData, tags: newTags });
    };

    const renderEditInputs = (type: string) => {
        if (type === 'character') {
            return (
                <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 p-2 bg-gray-900/50 rounded border border-gray-700">
                     <div className="space-y-2">
                        <input value={editData.content.player_name || ''} onChange={e => updateEditContent('player_name', e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-blue-200" placeholder="Nombre Jugador" />
                        <div className="flex gap-2">
                            <input value={editData.content.class || ''} onChange={e => updateEditContent('class', e.target.value)} className="flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-yellow-200" placeholder="Clase" />
                            <input value={editData.content.race || ''} onChange={e => updateEditContent('race', e.target.value)} className="flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-green-200" placeholder="Raza" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                             <input value={editData.content.fun_type || ''} onChange={e => updateEditContent('fun_type', e.target.value)} className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-gray-300" placeholder="Tipo de Diversión" />
                             <input value={editData.content.combat_style || ''} onChange={e => updateEditContent('combat_style', e.target.value)} className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-gray-300" placeholder="Estilo Combate" />
                        </div>
                         <AutoResizeTextarea value={editData.content.background || ''} onChange={(e: any) => updateEditContent('background', e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-gray-300 text-xs resize-none" placeholder="Trasfondo breve..." />
                     </div>

                     <div className="space-y-3">
                        <div>
                            <h4 className="text-[10px] font-bold text-red-400 uppercase mb-1"><FontAwesomeIcon icon={faShieldAlt} /> Límites y Seguridad</h4>
                            <ListEditor items={editData.content.safety_tools} onChange={v => updateEditContent('safety_tools', v)} placeholder="Añadir límite..." />
                        </div>
                        <div>
                            <h4 className="text-[10px] font-bold text-yellow-400 uppercase mb-1"><FontAwesomeIcon icon={faGem} /> Lista de Deseos (Conseguible)</h4>
                            <ListEditor items={editData.content.wish_list} onChange={v => updateEditContent('wish_list', v)} placeholder="Objeto deseado..." checkable={true} />
                        </div>
                         <div>
                            <h4 className="text-[10px] font-bold text-blue-400 uppercase mb-1"><FontAwesomeIcon icon={faLink} /> Vínculos (Quemable)</h4>
                            <ListEditor items={editData.content.bonds} onChange={v => updateEditContent('bonds', v)} placeholder="Vínculo con..." checkable={true} />
                        </div>
                     </div>
                     
                     <div className="col-span-full border-t border-gray-700 pt-2">
                        <TagInput tags={editData.tags || []} onChange={updateEditTags} allExistingTags={allTags} />
                     </div>

                     <div className="col-span-full border-t border-gray-700 pt-2">
                        <h4 className="text-[10px] font-bold text-gray-500 uppercase mb-1">Notas Persistentes</h4>
                        <AutoResizeTextarea value={editData.content.notes || ''} onChange={(e: any) => updateEditContent('notes', e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-gray-300 text-xs resize-none" placeholder="Notas generales del personaje..." />
                     </div>
                </div>
            );
        }

        switch (type) {
            case 'npc': return <><input value={editData.content.archetype || ''} onChange={e => updateEditContent('archetype', e.target.value)} className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs w-32 text-yellow-200" placeholder="Arquetipo" /><input value={editData.content.relationship || ''} onChange={e => updateEditContent('relationship', e.target.value)} className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs w-32 text-blue-200" placeholder="Relación" /></>;
            case 'scene': return <select value={editData.content.scene_type || 'explore'} onChange={e => updateEditContent('scene_type', e.target.value)} className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-purple-200"><option value="explore">Explore</option><option value="social">Social</option><option value="combat">Combate</option></select>;
            case 'location': return <input value={editData.content.aspects || ''} onChange={e => updateEditContent('aspects', e.target.value)} className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs w-48 text-green-200" placeholder="Aspectos" />;
            default: return null;
        }
    };

    const getItemStatus = (item: any) => {
        if (item.status === 'archived') return 'burned';
        if (activeSession?.used_items?.includes(item.id)) return 'used'; 
        if ((item.usage_count || 0) > 0) return 'used';
        return 'new';
    };

    const ReadOnlyItemRow = ({ item }: any) => {
        const isExpanded = expandedItems[item.id];
        const name = item.content.name || item.content.title || "Sin nombre";
        const status = getItemStatus(item);
        const inSession = activeSession?.linked_items?.includes(item.id);
        const isCharacter = item.type === 'character';

        let rowClass = "border-b border-gray-800 last:border-0 transition-colors ";
        let nameClass = "font-bold mr-2 hover:text-white transition-colors inline-flex items-center gap-1 align-baseline cursor-pointer ";

        if (isCharacter) {
             rowClass += "bg-orange-900/10 hover:bg-orange-900/20 border-l-2 border-l-orange-500";
             nameClass += "text-orange-300";
        } else if (inSession) {
            rowClass += "bg-green-900/10 hover:bg-green-900/20 border-l-2 border-l-green-600";
            nameClass += "text-green-400";
        } else if (status === 'burned') {
            rowClass += "bg-blue-900/10 hover:bg-blue-900/20 border-l-2 border-l-blue-900 opacity-60";
            nameClass += "text-blue-400";
        } else if (status === 'used') {
            rowClass += "bg-blue-900/10 hover:bg-blue-900/20 border-l-2 border-l-blue-500";
            nameClass += "text-blue-400";
        } else {
            rowClass += "bg-transparent hover:bg-gray-750";
            nameClass += "text-gray-200";
        }

        return (
            <div className={rowClass}>
                <div className="flex flex-col">
                    <div className="flex items-center gap-3 min-h-[1.5rem] py-1 px-2">
                        <div className="flex-shrink-0 flex items-center gap-1">
                            <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }} className="text-gray-700 hover:text-red-500 p-1 transition-colors" title="Eliminar">
                                <FontAwesomeIcon icon={faTrash} size="xs" />
                            </button>
                            {!isCharacter && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); toggleSessionItem(item.id); }} 
                                    className={`p-1 transition-colors ${inSession ? 'text-green-400 hover:text-green-300' : 'text-gray-600 hover:text-blue-400'}`}
                                    title={inSession ? "Quitar de Sesión Activa" : "Añadir a Sesión Activa"}
                                >
                                    <FontAwesomeIcon icon={inSession ? faMinus : faShareFromSquare} size="xs" />
                                </button>
                            )}
                        </div>

                        <div 
                            className={`flex-1 min-w-0 text-sm leading-tight cursor-pointer ${!isCharacter && isExpanded ? 'whitespace-pre-wrap' : 'truncate'}`} 
                            onClick={() => setExpandedItems(p => ({ ...p, [item.id]: !p[item.id] }))}
                        >
                            <span className={nameClass} onClick={(e) => { e.stopPropagation(); startEditing(item); }}>
                                {name} <FontAwesomeIcon icon={faPen} className="text-[9px] opacity-0 hover:opacity-50" />
                            </span>
                            
                            {isCharacter && (
                                <>
                                    <span className="text-gray-500 text-[10px] mr-2">({item.content.player_name})</span>
                                    {item.content.class && <span className="text-yellow-500 text-[10px] mr-2">[{item.content.class}]</span>}
                                </>
                            )}

                            {!isCharacter && (
                                <>
                                    {item.type === 'npc' && <>{item.content.archetype && <span className="text-yellow-500 font-mono text-[11px] mr-2">[{item.content.archetype}]</span>}{item.content.relationship && <span className="text-blue-300 italic text-[11px] mr-2">{item.content.relationship}</span>}</>}
                                    {item.type === 'scene' && item.content.scene_type && <span className="text-purple-400 text-[10px] uppercase font-bold border border-purple-900 px-1 rounded mr-2 align-middle">{item.content.scene_type}</span>}
                                    {item.type === 'location' && item.content.aspects && <span className="text-green-400 font-mono text-[11px] mr-2">[{item.content.aspects}]</span>}
                                    <span className="text-gray-600 mr-2">-</span><span className="text-gray-400">{item.content.description}</span>
                                </>
                            )}
                            
                            {/* Visualización de Tags (Mini) */}
                            {item.tags && item.tags.length > 0 && (
                                <span className="ml-2 opacity-70">
                                    {item.tags.map((t: string) => <span key={t} className="text-[9px] text-blue-300 bg-blue-900/30 px-1 rounded mr-1">#{t}</span>)}
                                </span>
                            )}
                        </div>
                    </div>
                    
                    {/* DESPLEGABLE SOLO PARA PJs */}
                    {isExpanded && isCharacter && (
                        <div className="px-4 pb-2">
                            <CharacterFullView content={item.content} />
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderItemRow = (item: any) => {
        const isEditing = editingId === item.id;
        if (isEditing) {
            return (
                <div key={item.id} className="border-b border-gray-800 py-1 px-2 bg-gray-800/50">
                    <div ref={editRef} className="flex items-start gap-3 rounded -ml-2 -mr-2 px-2">
                        <div className="pt-1.5 flex-shrink-0"><button onClick={() => handleDelete(item.id)} className="text-gray-600 hover:text-red-500 p-1"><FontAwesomeIcon icon={faTrash} size="xs" /></button></div>
                        <div className="flex flex-col gap-1 w-full">
                            <div className="flex flex-wrap gap-2 items-center">
                                <input value={editData.content.name || editData.content.title || ''} onChange={(e) => updateEditContent(item.type === 'scene' ? 'title' : 'name', e.target.value)} className="bg-gray-900 border border-gray-600 rounded px-2 py-0.5 text-white font-bold text-sm min-w-[200px]" autoFocus />
                                {item.type !== 'character' && renderEditInputs(item.type)}
                                <div className="flex gap-2 ml-auto">
                                    <button onClick={saveEdit} className="text-green-400 hover:text-green-200 text-xs px-2 py-0.5 bg-gray-900 rounded border border-gray-700 mr-1"><FontAwesomeIcon icon={faSave} /></button>
                                    <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-200 text-xs px-2 py-0.5 bg-gray-900 rounded border border-gray-700"><FontAwesomeIcon icon={faTimes} /></button>
                                </div>
                            </div>
                            {item.type !== 'character' && (
                                <>
                                    <AutoResizeTextarea value={editData.content.description || ''} onChange={(e: any) => updateEditContent('description', e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-gray-300 text-sm font-sans resize-none" placeholder="Descripción..." />
                                    <div className="mt-1">
                                        <TagInput tags={editData.tags || []} onChange={updateEditTags} allExistingTags={allTags} />
                                    </div>
                                </>
                            )}
                            
                            {item.type === 'character' && renderEditInputs('character')}
                        </div>
                    </div>
                </div>
            );
        }
        return <ReadOnlyItemRow key={item.id} item={item} />;
    };

    const searchFilteredItems = items.filter(item => {
        const text = (item.content.name || item.content.title || '').toLowerCase() + (item.content.description || '').toLowerCase() + (item.content.player_name || '').toLowerCase();
        const tagsMatch = item.tags ? item.tags.some((t: string) => t.includes(searchQuery.toLowerCase())) : false;
        
        if (!text.includes(searchQuery.toLowerCase()) && !tagsMatch) return false;

        const status = getItemStatus(item);
        if (statusFilter !== 'all') {
            if (statusFilter === 'used') {
                if (status !== 'used' && status !== 'burned') return false;
            } else if (status !== statusFilter) {
                return false;
            }
        }

        if (subFilter !== 'all' && item.type === 'scene' && item.content.scene_type !== subFilter) return false;

        return true;
    });

    return (
        <div className="flex flex-col h-screen bg-gray-900 text-gray-300 font-sans">
            {id && <TopNavBar 
                campaignId={id} 
                activeTab={filterType} 
                onTabChange={(tab) => { setFilterType(tab); setSubFilter('all'); }} 
                onToggleInfo={() => setIsSidebarOpen(true)} 
                searchQuery={searchQuery} 
                onSearchChange={setSearchQuery}
                onAdd={() => handleCreate(filterType)} 
                showFilters={showFilters}
                onToggleFilters={() => setShowFilters(!showFilters)}
                filterStatus={statusFilter}
                onFilterStatusChange={(val) => setStatusFilter(val as any)}
                filterSub={subFilter}
                onFilterSubChange={setSubFilter}
            />}
            {id && <CampaignSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} campaignId={id} />}
            
            {/* AI ASSISTANT Integration */}
            {/* {id && <AIAssistant campaignId={id} mode="vault" />} */}

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-gray-900 animate-fade-in relative">
                {loading ? (
                    <div className="absolute inset-0 flex justify-center items-center text-gray-500">
                        <FontAwesomeIcon icon={faSpinner} spin size="3x" />
                    </div>
                ) : (
                    <div className="bg-gray-800 rounded border border-gray-700 overflow-hidden shadow-xl">
                        {ITEM_TYPES.map(type => {
                            if (filterType !== 'all' && filterType !== type) return null;
                            const groupItems = searchFilteredItems.filter(i => i.type === type);
                            const isFilteredView = filterType !== 'all';
                            
                            const content = (
                                <div className={filterType === 'all' ? "bg-gray-800" : ""}>
                                    {groupItems.map(item => renderItemRow(item))}
                                    {groupItems.length === 0 && isFilteredView && <div className="p-4 text-center text-gray-500 text-xs italic">No hay elementos.</div>}
                                </div>
                            );

                            if (isFilteredView) return <div key={type}>{content}</div>;

                            return (
                                <div key={type} className="border-b border-gray-700 last:border-0">
                                    <div onClick={() => setOpenGroups(p => ({...p, [type]: !p[type]}))} className="bg-gray-700 hover:bg-gray-600 px-3 py-1.5 cursor-pointer flex items-center gap-2 select-none border-t border-gray-600 first:border-t-0 shadow-inner group">
                                        <FontAwesomeIcon icon={openGroups[type] ? faChevronDown : faChevronRight} className="text-white text-xs" />
                                        <span className="text-sm font-bold uppercase text-white tracking-wider drop-shadow-sm">{TYPE_LABELS[type]}</span>
                                        <span className="text-[10px] text-gray-300 bg-gray-600 px-2 py-0.5 rounded-full ml-2">({groupItems.length})</span>
                                        
                                        {filterType === 'all' && (
                                            <button onClick={(e) => { e.stopPropagation(); handleCreate(type); }} className="ml-auto text-gray-400 hover:text-white bg-gray-600/50 hover:bg-blue-600 w-6 h-6 rounded flex items-center justify-center transition-colors" title={`Crear ${type}`}><FontAwesomeIcon icon={faPlus} size="xs" /></button>
                                        )}
                                    </div>
                                    {openGroups[type] && content}
                                </div>
                            );
                        })}
                        {searchFilteredItems.length === 0 && filterType === 'all' && <div className="p-4 text-center text-gray-500 text-xs italic">No hay elementos coincidentes.</div>}
                    </div>
                )}
            </div>
        </div>
    );
}