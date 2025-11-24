import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { api } from '../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faCheck, faLink, faTimes, faChevronDown, faChevronRight, faSave, faPlus, faUnlink, faBolt, faBookOpen, faPen, faShieldAlt, faGem, faCheckSquare, faSquare, faWandMagicSparkles, faSpinner
} from '@fortawesome/free-solid-svg-icons';
import TopNavBar from '../components/TopNavBar';
import CampaignSidebar from '../components/CampaignSidebar';
import { useAppStore } from '../audio/store'; // CORRECCIÓN: Usar store global

const ITEM_TYPES = ["character", "npc", "scene", "secret", "location", "monster", "item"];
const REUSABLE_TYPES = ["npc", "location", "item", "monster"];

const TYPE_LABELS: Record<string, string> = {
    character: "PERSONAJES",
    npc: "NPCS",
    scene: "ESCENAS",
    secret: "SECRETOS",
    location: "LUGARES",
    monster: "ENEMIGOS",
    item: "ITEMS"
};

const AutoResizeTextarea = ({ value, onChange, placeholder, className, onBlur, autoFocus }: any) => {
    const ref = useRef<HTMLTextAreaElement>(null);
    useLayoutEffect(() => {
        if (ref.current) {
            ref.current.style.height = 'auto';
            ref.current.style.height = `${ref.current.scrollHeight}px`;
        }
    }, [value]);
    return <textarea ref={ref} value={value} onChange={onChange} onBlur={onBlur} className={`${className} overflow-hidden`} placeholder={placeholder} autoFocus={autoFocus} rows={1} />;
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
                <input className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:border-blue-500 outline-none" value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} placeholder={placeholder} />
                <button onClick={add} className="px-2 bg-gray-700 hover:bg-blue-600 rounded text-white transition-colors"><FontAwesomeIcon icon={faPlus} size="xs" /></button>
            </div>
        </div>
    );
};

export default function SessionRunner() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const [session, setSession] = useState<any>(null);
    const [vaultItems, setVaultItems] = useState<any[]>([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    
    const [filterType, setFilterType] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [isLinking, setIsLinking] = useState(false);
    
    const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
        strong_start: true, recap: true, character: true, npc: true, scene: true, secret: true, location: true, monster: true, item: true
    });
    const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
    const [usedItems, setUsedItems] = useState<Set<string>>(new Set());
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editData, setEditData] = useState<any>({});
    const editRef = useRef<HTMLDivElement>(null);
    const [activeNoteTab, setActiveNoteTab] = useState<string>('general');
    const [showConclusionModal, setShowConclusionModal] = useState(false);
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
    const [generatedSummary, setGeneratedSummary] = useState('');

    // CORRECCIÓN: Usar Zustand en lugar de ChatContext
    const { setAiContext } = useAppStore();

    useEffect(() => {
        if (id) {
            // Solo carga inicial
            loadVault();
            initSession();
        }
    }, [id, location.state]);

    useEffect(() => {
        if (id && session?.id) {
            setAiContext({ campaignId: id, mode: 'session', sessionId: session.id });
        }
    }, [id, session?.id, setAiContext]);

    useEffect(() => {
        const handleClickOutside = async (event: MouseEvent) => {
            if (editingId && editRef.current && !editRef.current.contains(event.target as Node)) {
                await saveItemEdit();
            }
        };
        if (editingId) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [editingId, editData]);

    const loadVault = () => { if (id) api.vault.list(id).then(setVaultItems); };

    const initSession = async () => {
        if (!id) return;
        // CORRECCIÓN: Solo mostrar spinner si no hay sesión cargada previamente
        if (!session) setLoading(true); 
        try {
            const passedId = location.state?.sessionId;
            let target = null;

            if (passedId) {
                target = await api.sessions.get(id, passedId);
            } else {
                const sessions = await api.sessions.list(id);
                const camp = await api.campaigns.get(id);
                const activeId = camp.active_session;
                target = activeId ? sessions.find((s:any) => s.id === activeId) : null;
                if (!target && sessions.length > 0) {
                    const sorted = sessions.sort((a: any, b: any) => b.number - a.number);
                    target = sorted.find((s:any) => s.status !== 'completed') || sorted[0];
                }
            }

            if (target) {
                setSession(target);
                if (target.used_items && Array.isArray(target.used_items)) {
                    setUsedItems(new Set(target.used_items));
                }
            } else {
                const newS = await api.sessions.create(id);
                setSession(newS);
            }
        } finally {
            setLoading(false);
        }
    };

    const toggleItemUsage = async (itemId: string) => {
        if (!session || !id) return;
        const newUsed = new Set(usedItems);
        if (newUsed.has(itemId)) newUsed.delete(itemId);
        else newUsed.add(itemId);
        setUsedItems(newUsed);
        const updatedSession = { ...session, used_items: Array.from(newUsed) };
        await api.sessions.update(id, session.id, updatedSession);
        setSession((prev: any) => ({ ...prev, used_items: Array.from(newUsed) }));
    };

    const saveSession = async (updated = session) => {
        if (!id || !updated) return;
        await api.sessions.update(id, updated.id, updated);
        setSession(updated);
    };

    const updateField = (field: string, val: any) => {
        setSession({ ...session, [field]: val });
    };

    const updateNote = (val: string) => {
        const currentNotes = (typeof session.notes === 'string') ? { general: session.notes } : (session.notes || { general: '' });
        const updatedNotes = { ...currentNotes, [activeNoteTab]: val };
        updateField('notes', updatedNotes);
    };

    const getNoteContent = () => {
        if (!session?.notes) return '';
        if (typeof session.notes === 'string') {
            return activeNoteTab === 'general' ? session.notes : '';
        }
        return session.notes[activeNoteTab] || '';
    };

    const toggleLinkItem = async (itemId: string) => {
        if (!session || !id) return;
        const item = vaultItems.find(i => i.id === itemId);
        if(item && item.type === 'character') return;

        const isLinked = session.linked_items?.includes(itemId);
        let newLinked;
        if (isLinked) {
            newLinked = session.linked_items.filter((i: string) => i !== itemId);
            await api.vault.update(id, itemId, { status: 'reserve' });
            const newUsed = new Set(usedItems);
            newUsed.delete(itemId);
            setUsedItems(newUsed);
            await api.sessions.update(id, session.id, { linked_items: newLinked, used_items: Array.from(newUsed) });
        } else {
            newLinked = [...(session.linked_items || []), itemId];
            await api.vault.update(id, itemId, { status: 'active' });
            await api.sessions.update(id, session.id, { linked_items: newLinked });
        }
        const updated = await api.sessions.get(id, session.id);
        setSession(updated);
        loadVault();
    };

    const startConclusion = async () => {
        if (!id || !session) return;
        setShowConclusionModal(true);
        setIsGeneratingSummary(true);
        const usedItemsList = Array.from(usedItems).map(uid => {
            const item = vaultItems.find(i => i.id === uid);
            return item ? `${item.type}: ${item.content.name || item.content.title}` : '';
        }).filter(Boolean).join(', ');
        const notesText = typeof session.notes === 'string' 
            ? session.notes 
            : Object.entries(session.notes).map(([k, v]) => `Notas de ${k === 'general' ? 'DM' : k}: ${v}`).join('\n');
        const prompt = `Genera un resumen narrativo y conciso... Título: ${session.title}. Notas: ${notesText}. Elementos: ${usedItemsList}`;
        try {
            const res = await api.ai.ask(id, prompt, 'session', session.id);
            if (res.response) setGeneratedSummary(res.response);
            else setGeneratedSummary("No se pudo generar el resumen automáticamente.");
        } catch (e) { setGeneratedSummary("Error conectando con la IA."); } 
        finally { setIsGeneratingSummary(false); }
    };

    const confirmConclusion = async () => {
        if (!id || !session) return;
        const finalDate = new Date().toISOString();
        const linkedIds = session.linked_items || [];
        const finalLinkedItems = [];
        for (const itemId of linkedIds) {
            const item = vaultItems.find(i => i.id === itemId);
            if (!item) continue;
            const wasUsed = usedItems.has(itemId);
            if (wasUsed) {
                finalLinkedItems.push(itemId);
                const isReusable = REUSABLE_TYPES.includes(item.type);
                const newUsage = (item.usage_count || 0) + 1;
                await api.vault.update(id, itemId, { status: isReusable ? 'reserve' : 'archived', usage_count: newUsage });
            } else {
                await api.vault.update(id, itemId, { status: 'reserve' });
            }
        }
        const finalSession = { ...session, status: 'completed', date: finalDate, linked_items: finalLinkedItems, summary: generatedSummary };
        await api.sessions.update(id, session.id, finalSession);
        const newSession = await api.sessions.create(id, { recap: generatedSummary });
        await api.campaigns.update(id, { active_session: newSession.id });
        setShowConclusionModal(false);
        navigate(`/campaign/${id}/sessions`, { state: { sessionId: newSession.id } });
        window.location.reload(); 
    };

    const handleQuickCreate = async (type: string) => {
        if (!id || !session) return;
        let defaultContent: any = { name: `Nuevo ${type}`, title: `Nuevo ${type}`, description: "" };
        if (type === 'npc') { defaultContent.archetype = ""; defaultContent.relationship = ""; }
        else if (type === 'scene') { defaultContent.scene_type = "explore"; }
        else if (type === 'character') { defaultContent.player_name = "Jugador"; defaultContent.class = ""; }
        const newItem = await api.vault.create(id, { type, content: defaultContent, tags: [], usage_count: 0 });
        if (type !== 'character') {
            const newLinked = [...(session.linked_items || []), newItem.id];
            const updatedSession = { ...session, linked_items: newLinked };
            setSession(updatedSession);
            await api.sessions.update(id, session.id, updatedSession);
            await api.vault.update(id, newItem.id, { status: 'active' });
        }
        await loadVault();
        setEditingId(newItem.id);
        setEditData(newItem);
        if (filterType === 'all') setOpenGroups(prev => ({ ...prev, [type]: true }));
    };

    const startEditingItem = (item: any) => { setEditingId(item.id); setEditData(JSON.parse(JSON.stringify(item))); };
    const saveItemEdit = async () => { if (!id || !editingId) return; await api.vault.update(id, editingId, editData); setEditingId(null); loadVault(); };
    const updateItemContent = (field: string, val: any) => {
        const newContent = { ...editData.content, [field]: val };
        if (field === 'name') newContent.title = val; if (field === 'title') newContent.name = val;
        setEditData({ ...editData, content: newContent });
    };

    const renderEditInputs = (type: string) => {
        if (type === 'character') {
            return (
                <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 p-2 bg-gray-900/50 rounded border border-gray-700">
                     <div className="space-y-2">
                        <input value={editData.content.player_name || ''} onChange={e => updateItemContent('player_name', e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-blue-200" placeholder="Nombre Jugador" />
                        <div className="flex gap-2">
                            <input value={editData.content.class || ''} onChange={e => updateItemContent('class', e.target.value)} className="flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-yellow-200" placeholder="Clase" />
                            <input value={editData.content.race || ''} onChange={e => updateItemContent('race', e.target.value)} className="flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-green-200" placeholder="Raza" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                             <input value={editData.content.fun_type || ''} onChange={e => updateItemContent('fun_type', e.target.value)} className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-gray-300" placeholder="Tipo de Diversión" />
                             <input value={editData.content.combat_style || ''} onChange={e => updateItemContent('combat_style', e.target.value)} className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-gray-300" placeholder="Estilo Combate" />
                        </div>
                         <AutoResizeTextarea value={editData.content.background || ''} onChange={(e: any) => updateItemContent('background', e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-gray-300 text-xs resize-none" placeholder="Trasfondo breve..." />
                     </div>
                     <div className="space-y-3">
                        <div><h4 className="text-[10px] font-bold text-red-400 uppercase mb-1"><FontAwesomeIcon icon={faShieldAlt} /> Límites y Seguridad</h4><ListEditor items={editData.content.safety_tools} onChange={v => updateItemContent('safety_tools', v)} placeholder="Añadir límite..." /></div>
                        <div><h4 className="text-[10px] font-bold text-yellow-400 uppercase mb-1"><FontAwesomeIcon icon={faGem} /> Lista de Deseos (Conseguible)</h4><ListEditor items={editData.content.wish_list} onChange={v => updateItemContent('wish_list', v)} placeholder="Objeto deseado..." checkable={true} /></div>
                         <div><h4 className="text-[10px] font-bold text-blue-400 uppercase mb-1"><FontAwesomeIcon icon={faLink} /> Vínculos (Quemable)</h4><ListEditor items={editData.content.bonds} onChange={v => updateItemContent('bonds', v)} placeholder="Vínculo con..." checkable={true} /></div>
                     </div>
                     <div className="col-span-full border-t border-gray-700 pt-2">
                        <h4 className="text-[10px] font-bold text-gray-500 uppercase mb-1">Notas Persistentes</h4>
                        <AutoResizeTextarea value={editData.content.notes || ''} onChange={(e: any) => updateItemContent('notes', e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-gray-300 text-xs resize-none" placeholder="Notas generales del personaje..." />
                     </div>
                </div>
            );
        }
        switch (type) {
            case 'npc': return <><input value={editData.content.archetype || ''} onChange={e => updateItemContent('archetype', e.target.value)} className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs w-32 text-yellow-200" placeholder="Arquetipo" /><input value={editData.content.relationship || ''} onChange={e => updateItemContent('relationship', e.target.value)} className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs w-32 text-blue-200" placeholder="Relación" /></>;
            case 'scene': return <select value={editData.content.scene_type || 'explore'} onChange={e => updateItemContent('scene_type', e.target.value)} className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-purple-200"><option value="explore">Explore</option><option value="social">Social</option><option value="combat">Combate</option></select>;
            case 'location': return <input value={editData.content.aspects || ''} onChange={e => updateItemContent('aspects', e.target.value)} className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs w-48 text-green-200" placeholder="Aspectos" />;
            default: return null;
        }
    };

    const renderItemRow = (item: any) => {
        const isEditing = editingId === item.id;
        const isUsed = usedItems.has(item.id);
        const isExpanded = expandedItems[item.id];
        const name = item.content.name || item.content.title || "Sin nombre";
        const isCharacter = item.type === 'character';

        if (isEditing) {
            return (
                <div key={item.id} className="border-b border-gray-700 bg-gray-800 p-2">
                    <div ref={editRef} className="flex flex-col gap-2">
                        <div className="flex flex-wrap gap-2 items-center">
                            <input value={editData.content.name || editData.content.title || ''} onChange={(e) => updateItemContent(item.type === 'scene' ? 'title' : 'name', e.target.value)} className="bg-gray-900 border border-gray-600 rounded px-2 py-1 text-white font-bold text-sm min-w-[200px]" autoFocus />
                            {item.type !== 'character' && renderEditInputs(item.type)}
                            <button onClick={saveItemEdit} className="text-green-400 ml-auto text-sm"><FontAwesomeIcon icon={faSave} /></button>
                        </div>
                        {item.type !== 'character' && <AutoResizeTextarea value={editData.content.description || ''} onChange={(e: any) => updateItemContent('description', e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-gray-300 text-sm" />}
                        {item.type === 'character' && renderEditInputs('character')}
                    </div>
                </div>
            );
        }

        const rowBg = isUsed ? 'bg-amber-900/20 border-l-2 border-amber-600' : (isCharacter ? 'bg-orange-900/10 border-l-2 border-orange-500' : 'hover:bg-gray-750 border-l-2 border-transparent');
        const nameClass = isUsed ? 'text-amber-400 font-bold mr-2 transition-colors inline-flex items-center gap-1 align-baseline' : (isCharacter ? 'font-bold text-orange-300 mr-2 inline-flex items-center gap-1' : 'font-bold text-white mr-2 hover:text-blue-400 transition-colors inline-flex items-center gap-1 align-baseline');

        return (
            <div key={item.id} className={`border-b border-gray-800 last:border-0 transition-colors ${rowBg}`}>
                <div className="flex flex-col">
                    <div className="flex items-center gap-3 min-h-[1.5rem] p-2">
                        <button onClick={() => toggleItemUsage(item.id)} className={`flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${isUsed ? 'bg-amber-600 border-amber-600 text-black' : 'border-gray-600 text-transparent hover:border-gray-400'}`}>
                            <FontAwesomeIcon icon={faCheck} size="xs" />
                        </button>

                        <div className={`flex-1 min-w-0 text-sm leading-tight cursor-pointer ${!isCharacter && isExpanded ? 'whitespace-pre-wrap' : 'truncate'}`} onClick={() => setExpandedItems(p => ({...p, [item.id]: !p[item.id]}))}>
                            <span className={nameClass} onClick={(e) => {e.stopPropagation(); startEditingItem(item);}}>
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
                                    {item.type === 'npc' && <>{item.content.archetype && <span className="text-yellow-500 font-mono text-[10px] mr-2">[{item.content.archetype}]</span>}{item.content.relationship && <span className="text-blue-300 italic text-[11px] mr-2">{item.content.relationship}</span>}</>}
                                    {item.type === 'scene' && item.content.scene_type && <span className="text-purple-400 text-[10px] uppercase font-bold border border-purple-900 px-1 rounded mr-2 align-middle">{item.content.scene_type}</span>}
                                    {item.type === 'location' && item.content.aspects && <span className="text-green-400 font-mono text-[10px] mr-2">[{item.content.aspects}]</span>}
                                    <span className="text-gray-500 mx-1">-</span><span className="text-gray-400 text-sm">{item.content.description}</span>
                                </>
                            )}
                        </div>

                        {!isCharacter && (
                            <div className="flex-shrink-0 flex items-center gap-2">
                                <button onClick={() => toggleLinkItem(item.id)} className="text-gray-600 hover:text-red-400 p-1" title="Desvincular"><FontAwesomeIcon icon={faUnlink} size="xs" /></button>
                            </div>
                        )}
                    </div>

                    {isExpanded && isCharacter && <div className="px-10 pb-2"><CharacterFullView content={item.content} /></div>}
                    {isExpanded && !isCharacter && item.content.description && <div className="px-10 pb-2 text-gray-400 text-xs whitespace-pre-wrap">{item.content.description}</div>}
                </div>
            </div>
        );
    };

    if (session && session.status === 'completed') {
        return (
            <div className="h-screen flex flex-col bg-gray-900 text-gray-300 p-8 items-center justify-center">
                <h1 className="text-3xl font-bold text-gray-500 mb-4">Sesión Archivada</h1>
                <div className="bg-gray-800 p-6 rounded-lg max-w-2xl w-full border border-gray-700">
                    <h2 className="text-xl text-white mb-2">{session.title}</h2>
                    <div className="prose prose-invert prose-sm mb-6">
                        <h3 className="text-yellow-500">Resumen (Bitácora)</h3>
                        <div className="whitespace-pre-wrap">{session.summary}</div>
                    </div>
                    <button onClick={() => navigate(`/campaign/${id}/bitacora`)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500">Ir a Bitácora</button>
                </div>
            </div>
        );
    }

    // --- CÁLCULO SEGURO DE VARIABLES PARA RENDERIZADO (Solución al error de TS) ---
    const characters = vaultItems.filter(i => i.type === 'character');
    const linkedIds = session?.linked_items || [];
    const linked = vaultItems.filter(i => linkedIds.includes(i.id) && i.type !== 'character');
    const filteredLinked = linked.filter(i => filterType === 'all' || i.type === filterType);
    const availableForLinking = vaultItems.filter(i => (i.status === 'reserve' || linkedIds.includes(i.id)) && i.type !== 'character');

    return (
        <div className="h-screen flex flex-col bg-gray-900 text-gray-300 font-sans overflow-hidden">
            {id && (
                <TopNavBar 
                    campaignId={id} 
                    activeTab={filterType} 
                    onTabChange={setFilterType} 
                    onToggleInfo={() => setIsSidebarOpen(true)} 
                    searchQuery={searchQuery} 
                    onSearchChange={setSearchQuery} 
                    onAdd={() => handleQuickCreate(filterType)}
                    extraTabs={[{ id: 'strong_start', label: 'Inicio', icon: faBolt }, { id: 'recap', label: 'Recap', icon: faBookOpen }]}
                />
            )}
            {id && <CampaignSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} campaignId={id} />}
            
            {/* Header Fijo */}
            <div className="h-12 bg-gray-800 border-b border-gray-700 flex justify-between items-center px-4 flex-shrink-0">
                <div className="flex items-center gap-3 flex-1">
                    <span className="font-bold text-green-400 text-sm whitespace-nowrap">
                        {loading ? "Cargando..." : `Sesión #${session?.number}`}
                    </span>
                    <span className="text-gray-600">|</span>
                    <input 
                        type="text" 
                        value={session?.title || ''} 
                        onChange={(e) => updateField('title', e.target.value)} 
                        onBlur={() => saveSession()} 
                        placeholder={loading ? "" : "Título de la sesión..."}
                        className="bg-transparent text-sm text-white w-full outline-none" 
                        disabled={loading}
                    />
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setIsLinking(true)} disabled={loading} className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white text-xs px-3 py-1 rounded font-bold flex items-center gap-2"><FontAwesomeIcon icon={faLink} /> Recursos</button>
                    <button onClick={startConclusion} disabled={loading} className="bg-red-900/30 border border-red-800 hover:bg-red-900/50 disabled:border-gray-700 disabled:text-gray-600 text-red-200 text-xs px-3 py-1 rounded font-bold flex items-center gap-2"><FontAwesomeIcon icon={faCheck} /> Concluir</button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden relative">
                {/* Sidebar de Notas */}
                <div className="w-1/3 border-r border-gray-700 flex flex-col bg-gray-900">
                    <div className="flex bg-gray-800 border-b border-gray-700 overflow-x-auto custom-scrollbar">
                        <button onClick={() => setActiveNoteTab('general')} className={`px-3 py-2 text-xs font-bold uppercase ${activeNoteTab === 'general' ? 'bg-gray-900 text-blue-400' : 'text-gray-500'}`}>General</button>
                        {characters.map((char: any) => (
                            <button key={char.id} onClick={() => setActiveNoteTab(char.id)} className={`px-3 py-2 text-xs font-bold uppercase ${activeNoteTab === char.id ? 'bg-gray-900 text-purple-400' : 'text-gray-500'}`}>{char.content.name.split(' ')[0]}</button>
                        ))}
                    </div>
                    <textarea 
                        value={getNoteContent()} 
                        onChange={e => updateNote(e.target.value)} 
                        onBlur={() => saveSession()} 
                        className="flex-1 w-full bg-gray-900 p-4 text-gray-300 font-mono text-sm resize-none focus:outline-none" 
                        placeholder={loading ? "Cargando notas..." : "Notas..."}
                        disabled={loading} 
                    />
                </div>

                {/* AREA DE CONTENIDO PRINCIPAL CON SPINNER */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-900 p-2 relative animate-fade-in">
                    {loading ? (
                        <div className="absolute inset-0 flex justify-center items-center text-gray-500">
                            <FontAwesomeIcon icon={faSpinner} spin size="3x" />
                        </div>
                    ) : (
                        <>
                            {filterType === 'strong_start' && (
                                <div className="h-full flex flex-col">
                                    <h3 className="text-sm font-bold text-purple-400 uppercase mb-2 flex items-center gap-2"><FontAwesomeIcon icon={faBolt} /> Inicio Fuerte</h3>
                                    <AutoResizeTextarea value={session.strong_start || ''} onChange={(e: any) => updateField('strong_start', e.target.value)} onBlur={() => saveSession()} className="flex-1 w-full bg-gray-800/50 p-4 rounded border border-gray-700 text-sm text-gray-200" />
                                </div>
                            )}
                            {filterType === 'recap' && (
                                <div className="h-full flex flex-col">
                                    <h3 className="text-sm font-bold text-purple-400 uppercase mb-2 flex items-center gap-2"><FontAwesomeIcon icon={faBookOpen} /> Recap (Anterior)</h3>
                                    <AutoResizeTextarea value={session.recap || ''} onChange={(e: any) => updateField('recap', e.target.value)} onBlur={() => saveSession()} className="flex-1 w-full bg-gray-800/50 p-4 rounded border border-gray-700 text-sm text-gray-200" />
                                </div>
                            )}
                            {(filterType !== 'strong_start' && filterType !== 'recap') && (
                                <div className="bg-gray-800 rounded border border-gray-700 overflow-hidden shadow-xl">
                                    {ITEM_TYPES.map(type => {
                                        if (filterType !== 'all' && filterType !== type) return null;
                                        const groupItems = filteredLinked.filter(i => i.type === type);
                                        const isFilteredView = filterType !== 'all';
                                        const content = (
                                            <div className={filterType === 'all' ? "bg-gray-800" : ""}>
                                                {groupItems.map((item: any) => renderItemRow(item))}
                                                {groupItems.length === 0 && isFilteredView && <div className="p-4 text-center text-gray-500 text-xs italic">No hay elementos. Pulsa + para añadir.</div>}
                                            </div>
                                        );
                                        if (isFilteredView) return <div key={type}>{content}</div>;
                                        return (
                                            <div key={type} className="border-b border-gray-700 last:border-0">
                                                <div onClick={() => setOpenGroups(p => ({...p, [type]: !p[type]}))} className="bg-gray-700 hover:bg-gray-600 px-3 py-1.5 cursor-pointer flex items-center gap-2 select-none border-t border-gray-600 first:border-t-0 shadow-inner group">
                                                    <FontAwesomeIcon icon={openGroups[type] ? faChevronDown : faChevronRight} className="text-white text-xs" />
                                                    <span className="text-sm font-bold uppercase text-white tracking-wider drop-shadow-sm">{TYPE_LABELS[type]}</span>
                                                    <span className="text-[10px] text-gray-300 bg-gray-600 px-2 py-0.5 rounded-full ml-2">({groupItems.length})</span>
                                                    <button onClick={(e) => { e.stopPropagation(); handleQuickCreate(type); }} className="ml-auto text-gray-400 hover:text-white bg-gray-600/50 hover:bg-blue-600 w-6 h-6 rounded flex items-center justify-center transition-colors" title={`Crear ${type}`}><FontAwesomeIcon icon={faPlus} size="xs" /></button>
                                                </div>
                                                {openGroups[type] && content}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* MODAL DE CIERRE DE SESIÓN */}
            {showConclusionModal && (
                <div className="fixed inset-0 bg-black/90 z-50 flex justify-center items-center p-4">
                    <div className="bg-gray-800 border border-gray-600 rounded-lg w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-yellow-500 flex items-center gap-2">
                                <FontAwesomeIcon icon={faWandMagicSparkles} /> Concluir Sesión & Generar Bitácora
                            </h2>
                            <button onClick={() => setShowConclusionModal(false)} className="text-gray-400 hover:text-white"><FontAwesomeIcon icon={faTimes} /></button>
                        </div>
                        
                        <div className="p-6 flex-1 overflow-y-auto">
                            {isGeneratingSummary ? (
                                <div className="flex flex-col items-center justify-center h-40 text-blue-400">
                                    <FontAwesomeIcon icon={faSpinner} spin size="3x" className="mb-4" />
                                    <p className="animate-pulse">La IA está redactando el resumen de la partida...</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <p className="text-sm text-gray-400">
                                        Revisa y edita el resumen generado. Este texto se guardará en la <strong>Bitácora</strong> y se usará como <strong>Recap</strong> automático para la próxima sesión.
                                    </p>
                                    <textarea 
                                        value={generatedSummary}
                                        onChange={(e) => setGeneratedSummary(e.target.value)}
                                        className="w-full h-64 bg-gray-900 border border-gray-600 rounded p-4 text-gray-200 leading-relaxed focus:border-yellow-500 outline-none resize-none custom-scrollbar"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-gray-700 flex justify-end gap-3 bg-gray-800 rounded-b-lg">
                            <button onClick={() => setShowConclusionModal(false)} className="px-4 py-2 text-gray-300 hover:text-white">Cancelar</button>
                            <button 
                                onClick={confirmConclusion} 
                                disabled={isGeneratingSummary || !generatedSummary.trim()}
                                className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <FontAwesomeIcon icon={faCheck} /> Confirmar y Crear Siguiente Sesión
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isLinking && (
                <div className="fixed inset-0 bg-black/80 z-50 flex justify-center items-center p-8">
                    <div className="bg-gray-900 border border-gray-700 w-full max-w-4xl h-[85vh] rounded shadow-2xl flex flex-col">
                        <div className="flex justify-between p-4 border-b border-gray-800">
                            <h2 className="font-bold text-blue-400 uppercase text-sm">Vincular Recursos</h2>
                            <button onClick={() => setIsLinking(false)} className="text-gray-400 hover:text-white"><FontAwesomeIcon icon={faTimes} size="lg" /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                             {ITEM_TYPES.filter(t => t !== 'character').map((type: any) => {
                                 const group = availableForLinking.filter(i => i.type === type);
                                 if (group.length === 0) return null;
                                 return (
                                     <div key={type} className="bg-gray-800/50 rounded p-2 border border-gray-800">
                                         <h3 className="text-xs font-bold uppercase text-gray-500 mb-2">{TYPE_LABELS[type]}</h3>
                                         <div className="space-y-1">
                                            {group.map((item: any) => {
                                                const isLinked = session.linked_items?.includes(item.id);
                                                return (
                                                    <div key={item.id} onClick={() => toggleLinkItem(item.id)} className={`p-2 rounded border cursor-pointer text-xs flex items-center justify-between ${isLinked ? 'bg-blue-900/30 border-blue-800' : 'bg-gray-900 border-gray-700 hover:border-gray-500'}`}>
                                                        <span className={isLinked ? 'text-blue-300 font-bold' : 'text-gray-300'}>{item.content.name || item.content.title}</span>
                                                        {isLinked && <FontAwesomeIcon icon={faCheck} className="text-blue-500" />}
                                                    </div>
                                                );
                                            })}
                                         </div>
                                     </div>
                                 );
                             })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}