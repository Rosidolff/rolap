import React, { useState, useMemo, useRef } from 'react';
import { ChevronRight, GripVertical, Plus, FolderPlus, Edit2, Trash2, Play } from 'lucide-react';
import { useAppStore } from '../store';
import type { Track } from '../types';
import { TrackContextMenu } from './TrackContextMenu';

// --- SISTEMA DE COLOR REFINADO ---
// Header: Limpio (sin fondo, solo texto y borde).
// Sublistas: Fondo tintado oscuro (base del bloque).
// Tracks: Fondo más claro/luminoso para destacar sobre la lista.
const THEMES = [
    { // ACCIÓN (Rojo) -> Naranja / Rosa
        header: 'text-red-400 border-red-500/20 hover:bg-white/5',
        subOdd: 'bg-orange-900/20 border-orange-500/30 text-orange-200', 
        subEven: 'bg-rose-900/20 border-rose-500/30 text-rose-200',
        trackOdd: 'bg-orange-500/20 hover:bg-orange-500/30 text-zinc-200',
        trackEven: 'bg-rose-500/20 hover:bg-rose-500/30 text-zinc-200',
        active: 'text-red-400'
    },
    { // MISTERIO (Violeta) -> Índigo / Fucsia
        header: 'text-violet-400 border-violet-500/20 hover:bg-white/5',
        subOdd: 'bg-indigo-900/20 border-indigo-500/30 text-indigo-200',
        subEven: 'bg-fuchsia-900/20 border-fuchsia-500/30 text-fuchsia-200',
        trackOdd: 'bg-indigo-500/20 hover:bg-indigo-500/30 text-zinc-200',
        trackEven: 'bg-fuchsia-500/20 hover:bg-fuchsia-500/30 text-zinc-200',
        active: 'text-violet-400'
    },
    { // EXPLORACIÓN (Esmeralda) -> Verde / Teal
        header: 'text-emerald-400 border-emerald-500/20 hover:bg-white/5',
        subOdd: 'bg-green-900/20 border-green-500/30 text-green-200',
        subEven: 'bg-teal-900/20 border-teal-500/30 text-teal-200',
        trackOdd: 'bg-green-500/20 hover:bg-green-500/30 text-zinc-200',
        trackEven: 'bg-teal-500/20 hover:bg-teal-500/30 text-zinc-200',
        active: 'text-emerald-400'
    },
    { // COTIDIANO (Ámbar) -> Amarillo / Naranja
        header: 'text-amber-400 border-amber-500/20 hover:bg-white/5',
        subOdd: 'bg-yellow-900/20 border-yellow-500/30 text-yellow-200',
        subEven: 'bg-orange-900/20 border-orange-500/30 text-orange-200',
        trackOdd: 'bg-yellow-500/20 hover:bg-yellow-500/30 text-zinc-200',
        trackEven: 'bg-orange-500/20 hover:bg-orange-500/30 text-zinc-200',
        active: 'text-amber-400'
    },
    { // DRAMA (Azul) -> Cielo / Índigo
        header: 'text-blue-400 border-blue-500/20 hover:bg-white/5',
        subOdd: 'bg-sky-900/20 border-sky-500/30 text-sky-200',
        subEven: 'bg-indigo-900/20 border-indigo-500/30 text-indigo-200',
        trackOdd: 'bg-sky-500/20 hover:bg-sky-500/30 text-zinc-200',
        trackEven: 'bg-indigo-500/20 hover:bg-indigo-500/30 text-zinc-200',
        active: 'text-blue-400'
    },
    { // TERROR (Piedra) -> Zinc / Neutro
        header: 'text-stone-400 border-stone-500/20 hover:bg-white/5',
        subOdd: 'bg-zinc-900/20 border-zinc-500/30 text-zinc-300',
        subEven: 'bg-neutral-900/20 border-neutral-500/30 text-neutral-300',
        trackOdd: 'bg-zinc-500/20 hover:bg-zinc-500/30 text-zinc-200',
        trackEven: 'bg-neutral-500/20 hover:bg-neutral-500/30 text-zinc-200',
        active: 'text-stone-400'
    }
];

const DropIndicator = () => (
    <div className="h-0.5 mx-2 my-0.5 bg-white/50 rounded-full animate-pulse pointer-events-none shadow-[0_0_4px_rgba(255,255,255,0.8)]"></div>
);

export const MusicView = () => {
    const {
        currentFrame, activeMusic, isPlayingMusic, playMusic, pauseMusic,
        tracks, playlistOrders, reorderPlaylist, moveTrackFile,
        createCategory, renameCategory, deleteCategory,
        folderStructure
    } = useAppStore();

    const [expandedCategories, setExpandedCategories] = useState<string[]>(['Acción']);
    const [expandedSubcategories, setExpandedSubcategories] = useState<string[]>([]);
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, track: Track } | null>(null);
    const [catMenu, setCatMenu] = useState<{ x: number, y: number, name: string, parent?: string } | null>(null);

    const [draggedTrack, setDraggedTrack] = useState<Track | null>(null);
    const [dragOverTarget, setDragOverTarget] = useState<{ cat: string, sub: string, index?: number } | null>(null);
    const expandTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const availableTracks = useMemo(() => tracks.filter(t =>
        t.type === 'music' && (!t.frame || t.frame === currentFrame)
    ), [tracks, currentFrame]);

    const structure = useMemo(() => {
        const fsCategories = folderStructure[currentFrame]?.music || {};
        const merged: Record<string, string[]> = {};
        Object.keys(fsCategories).forEach(cat => { merged[cat] = [...(fsCategories[cat] || [])]; });
        
        Object.keys(merged).forEach(cat => {
            const hasOrphanTracks = availableTracks.some(t => t.category === cat && (!t.subcategory || t.subcategory === 'General'));
            if (hasOrphanTracks && !merged[cat].includes('General')) merged[cat].unshift('General');
        });
        return merged;
    }, [folderStructure, currentFrame, availableTracks]);

    const toggleCategory = (cat: string) => setExpandedCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
    
    const toggleSubcategory = (cat: string, sub: string) => {
        const key = `${cat}-${sub}`;
        setExpandedSubcategories(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
    };

    const handlePlayList = (e: React.MouseEvent, tracksInList: Track[]) => {
        e.stopPropagation();
        if (tracksInList.length > 0) {
            playMusic(tracksInList[0], tracksInList);
        }
    };

    const handleTrackContextMenu = (e: React.MouseEvent, track: Track) => { e.preventDefault(); e.stopPropagation(); setContextMenu({ x: e.clientX, y: e.clientY, track }); };
    const handleCategoryContextMenu = (e: React.MouseEvent, name: string, parent?: string) => { e.preventDefault(); e.stopPropagation(); setCatMenu({ x: e.clientX, y: e.clientY, name, parent }); };
    
    const handleDragStart = (e: React.DragEvent, track: Track) => { setDraggedTrack(track); e.dataTransfer.effectAllowed = "move"; };
    const handleDragOverCategoryHeader = (cat: string) => { if (!expandedCategories.includes(cat)) { if (!expandTimeoutRef.current) { expandTimeoutRef.current = setTimeout(() => { setExpandedCategories(prev => [...prev, cat]); expandTimeoutRef.current = null; }, 600); } } };
    const handleDragOverSubHeader = (cat: string, sub: string) => { const key = `${cat}-${sub}`; if (!expandedSubcategories.includes(key)) { if (!expandTimeoutRef.current) { expandTimeoutRef.current = setTimeout(() => { setExpandedSubcategories(prev => [...prev, key]); expandTimeoutRef.current = null; }, 600); } } };
    const handleDragLeaveHeader = () => { if (expandTimeoutRef.current) { clearTimeout(expandTimeoutRef.current); expandTimeoutRef.current = null; } };
    const handleDragOver = (e: React.DragEvent, cat: string, sub: string, index?: number) => { e.preventDefault(); e.stopPropagation(); if (!draggedTrack) return; setDragOverTarget({ cat, sub, index }); };
    
    const handleDrop = async (e: React.DragEvent, targetCat: string, targetSub: string, targetIndex?: number) => {
        e.preventDefault(); e.stopPropagation(); setDragOverTarget(null);
        if (expandTimeoutRef.current) clearTimeout(expandTimeoutRef.current);
        if (!draggedTrack) return;
        const finalSub = targetSub || 'General';
        if (draggedTrack.category !== targetCat || (draggedTrack.subcategory || 'General') !== finalSub) {
            await moveTrackFile(draggedTrack, targetCat, finalSub); setDraggedTrack(null); return;
        }
        const tracksInList = availableTracks.filter(t => t.category === targetCat && (t.subcategory || 'General') === finalSub);
        const orderKey = `${currentFrame}.${targetCat}.${finalSub}`;
        const savedOrder = playlistOrders[orderKey];
        if (savedOrder) { tracksInList.sort((a, b) => { const idxA = savedOrder.indexOf(a.id); const idxB = savedOrder.indexOf(b.id); if (idxA === -1) return 1; if (idxB === -1) return -1; return idxA - idxB; }); }
        const currentIndex = tracksInList.findIndex(t => t.id === draggedTrack.id);
        if (currentIndex === -1) return;
        let finalIndex = targetIndex !== undefined ? targetIndex : tracksInList.length;
        const newOrder = [...tracksInList];
        const [movedItem] = newOrder.splice(currentIndex, 1);
        if (finalIndex > currentIndex) finalIndex -= 1;
        newOrder.splice(finalIndex, 0, movedItem);
        reorderPlaylist(orderKey, newOrder);
        setDraggedTrack(null);
    };

    const handleCreateCategory = async () => { const name = prompt("Nueva Categoría:"); if (name) await createCategory('music', name); };
    const handleCreateSubcategory = async (parent: string) => { const name = prompt(`Nueva lista en ${parent}:`); if (name) await createCategory('music', name, parent); };
    const executeRenameCategory = async () => { if (!catMenu) return; const newName = prompt("Renombrar:", catMenu.name); if (newName && newName !== catMenu.name) { await renameCategory('music', catMenu.name, newName, catMenu.parent); } setCatMenu(null); };
    const executeDeleteCategory = async () => { if (!catMenu) return; if (confirm(`¿Eliminar "${catMenu.name}"?`)) { await deleteCategory('music', catMenu.name, catMenu.parent); } setCatMenu(null); };

    return (
        <div className="space-y-2 pb-20">
            <div className="flex items-center justify-end mb-1 px-1">
                <button onClick={handleCreateCategory} className="p-1.5 bg-white/5 border border-white/5 text-zinc-500 rounded hover:bg-white/10 hover:text-white flex items-center gap-1 transition-colors" title="Nueva Categoría"><FolderPlus size={10} /> <span className="text-[9px] font-bold">NUEVA</span></button>
            </div>

            {Object.entries(structure).map(([category, subcategories], catIndex) => {
                const theme = THEMES[catIndex % THEMES.length];
                
                return (
                    <div 
                        key={category} 
                        className={`rounded-lg border mb-1 transition-all duration-200 ${dragOverTarget?.cat === category ? 'border-amber-500/30' : `border-transparent ${expandedCategories.includes(category) ? 'bg-black/20' : ''}`}`} 
                        onDragOver={(e) => { e.preventDefault(); handleDragOverCategoryHeader(category); }} 
                        onDragLeave={handleDragLeaveHeader} 
                        onDrop={(e) => handleDrop(e, category, 'General')}
                    >
                        {/* HEADER: Sin fondo, solo texto y borde */}
                        <div 
                            className={`w-full px-2 py-2 flex items-center justify-between cursor-pointer group border-b border-transparent rounded-t-lg ${theme.header}`} 
                            onContextMenu={(e) => handleCategoryContextMenu(e, category)} 
                            onClick={() => toggleCategory(category)}
                        >
                            <div className="flex items-center gap-2">
                                <ChevronRight size={12} className={`transition-transform opacity-70 ${expandedCategories.includes(category) ? 'rotate-90 opacity-100' : 'opacity-60'}`} />
                                <span className="font-black text-[11px] uppercase tracking-wider shadow-sm">{category}</span>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); handleCreateSubcategory(category); }} className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-white"><Plus size={12}/></button>
                        </div>

                        {expandedCategories.includes(category) && (
                            <div className="pb-1 pt-0.5">
                                {subcategories.map((sub, subIndex) => {
                                    let tracksInSub = availableTracks.filter(t => t.category === category && (sub === 'General' ? (!t.subcategory || t.subcategory === 'General') : t.subcategory === sub));
                                    const orderKey = `${currentFrame}.${category}.${sub}`;
                                    const savedOrder = playlistOrders[orderKey];
                                    if (savedOrder) { tracksInSub.sort((a, b) => { const idxA = savedOrder.indexOf(a.id); const idxB = savedOrder.indexOf(b.id); if (idxA === -1) return 1; if (idxB === -1) return -1; return idxA - idxB; }); }
                                    
                                    const isDragOverList = dragOverTarget?.cat === category && dragOverTarget?.sub === sub;
                                    const subKey = `${category}-${sub}`;
                                    const isExpanded = expandedSubcategories.includes(subKey);
                                    
                                    // Alternancia de estilo para SUBLISTAS (Background tintado recuperado)
                                    const subStyle = subIndex % 2 === 0 ? theme.subEven : theme.subOdd;
                                    // Estilo de canciones (Más claro/opaco)
                                    const trackStyle = subIndex % 2 === 0 ? theme.trackEven : theme.trackOdd;

                                    return (
                                        <div 
                                            key={sub} 
                                            className={`mx-1 my-0.5 rounded border-l-2 transition-all duration-300 ${isDragOverList ? 'bg-amber-500/20 ring-1 ring-amber-500/30' : subStyle}`} 
                                            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); if(draggedTrack) { setDragOverTarget({cat: category, sub, index: tracksInSub.length}); handleDragOverSubHeader(category, sub); } }} 
                                            onDrop={(e) => handleDrop(e, category, sub, dragOverTarget?.index)}
                                        >
                                            <div 
                                                className="flex items-center justify-between py-1.5 pl-2 pr-2 group/sub cursor-pointer transition-colors hover:brightness-110" 
                                                onContextMenu={(e) => handleCategoryContextMenu(e, sub, category)}
                                            >
                                                {/* Clic en nombre/icono -> Expandir */}
                                                <div className="flex items-center gap-2 overflow-hidden flex-1" onClick={() => toggleSubcategory(category, sub)}>
                                                    <ChevronRight size={10} className={`transition-transform ${isExpanded ? 'rotate-90 opacity-100' : 'opacity-60'}`} />
                                                    {/* Clic en texto -> Reproducir */}
                                                    <span 
                                                        className="text-[10px] font-bold uppercase tracking-tight truncate hover:underline"
                                                        onClick={(e) => handlePlayList(e, tracksInSub)}
                                                        title="Reproducir Lista"
                                                    >
                                                        {sub}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[8px] opacity-60 font-mono">{tracksInSub.length}</span>
                                                    <button onClick={(e) => { e.stopPropagation(); handlePlayList(e, tracksInSub); }} className="opacity-0 group-hover/sub:opacity-100 transition-opacity hover:text-white"><Play size={10} fill="currentColor" /></button>
                                                </div>
                                            </div>
                                            
                                            {isExpanded && (
                                                <div className="space-y-0.5 px-1 pb-1">
                                                    {tracksInSub.length === 0 && <div className="text-[8px] opacity-50 italic pl-4 py-1">Vacío</div>}
                                                    {tracksInSub.map((track, index) => {
                                                        const isCurrent = activeMusic?.id === track.id;
                                                        const showIndicator = isDragOverList && dragOverTarget?.index === index;
                                                        return (
                                                            <React.Fragment key={track.id}>
                                                                {showIndicator && <DropIndicator />}
                                                                <div 
                                                                    draggable 
                                                                    onDragStart={(e) => handleDragStart(e, track)} 
                                                                    onDragOver={(e) => handleDragOver(e, category, sub, index)} 
                                                                    onContextMenu={(e) => handleTrackContextMenu(e, track)} 
                                                                    className={`
                                                                        group flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-all shadow-sm
                                                                        ${isCurrent ? `bg-white/20 ${theme.active} font-bold ring-1 ring-white/20` : `${trackStyle}`} 
                                                                        ${draggedTrack?.id === track.id ? 'opacity-30' : 'opacity-100'}
                                                                    `} 
                                                                    onClick={() => isCurrent && isPlayingMusic ? pauseMusic() : playMusic(track, tracksInSub)}
                                                                >
                                                                    <GripVertical size={8} className="opacity-0 group-hover:opacity-50 -ml-1" />
                                                                    <span className="text-[10px] truncate flex-1 leading-tight">{track.name}</span>
                                                                    {isCurrent && <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse shadow-sm"></div>}
                                                                </div>
                                                            </React.Fragment>
                                                        );
                                                    })}
                                                    {isDragOverList && dragOverTarget?.index === tracksInSub.length && <DropIndicator />}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}

            {contextMenu && <TrackContextMenu x={contextMenu.x} y={contextMenu.y} track={contextMenu.track} onClose={() => setContextMenu(null)} />}
            {catMenu && (
                <div className="fixed z-50 bg-[#121212] border border-white/10 rounded py-1 shadow-xl min-w-[120px]" style={{ top: catMenu.y, left: catMenu.x }}>
                    <button onClick={executeRenameCategory} className="w-full text-left px-3 py-1.5 text-[10px] text-zinc-300 hover:bg-white/10 flex items-center gap-2"><Edit2 size={10}/> Renombrar</button>
                    <button onClick={executeDeleteCategory} className="w-full text-left px-3 py-1.5 text-[10px] text-red-400 hover:bg-white/10 flex items-center gap-2"><Trash2 size={10}/> Eliminar</button>
                    <button onClick={() => setCatMenu(null)} className="w-full text-left px-3 py-1.5 text-[10px] text-zinc-500 hover:bg-white/5 border-t border-white/5 mt-1">Cancelar</button>
                </div>
            )}
        </div>
    );
};