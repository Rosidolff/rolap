import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Play, Pause, Repeat, ArrowRight, Shuffle, GripVertical, Plus } from 'lucide-react';
import { MUSIC_CATEGORIES } from '../types';
import { useAppStore } from '../store';
import type { Track } from '../types';
import { TrackContextMenu } from './TrackContextMenu';

// Componente visual para el "hueco"
const DropIndicator = () => (
    <div className="h-12 mx-1 my-1 border-2 border-dashed border-amber-500/50 rounded-md bg-amber-500/10 animate-pulse flex items-center justify-center transition-all duration-200">
        <span className="text-xs text-amber-500 font-bold uppercase tracking-wider flex items-center gap-2">
            <Plus size={14} /> Mover aquí
        </span>
    </div>
);

export const MusicView = () => {
    const {
        currentFrame, activeMusic, isPlayingMusic, playMusic, pauseMusic,
        tracks, playlistOrders, reorderPlaylist, moveTrackFile,
        playbackMode, setPlaybackMode
    } = useAppStore();

    const [expandedCategory, setExpandedCategory] = useState<string | null>('Acción');
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, track: Track } | null>(null);

    // DND STATE
    const [draggedTrack, setDraggedTrack] = useState<Track | null>(null);
    // index puede ser trackIndex O tracks.length para indicar "al final"
    const [dragOverTarget, setDragOverTarget] = useState<{ cat: string, sub: string, index?: number } | null>(null);

    const availableTracks = tracks.filter(t =>
        t.type === 'music' && (!t.frame || t.frame === currentFrame)
    );

    const toggleCategory = (cat: string) => {
        setExpandedCategory(expandedCategory === cat ? null : cat);
    };

    const handleContextMenu = (e: React.MouseEvent, track: Track) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, track });
    };

    // --- DND HANDLERS ---

    const handleDragStart = (e: React.DragEvent, track: Track) => {
        setDraggedTrack(track);
        e.dataTransfer.effectAllowed = "move";
        // Opcional: Configurar una imagen de arrastre personalizada si se desea
        // const img = new Image(); img.src = '...'; e.dataTransfer.setDragImage(img, 0, 0);
    };

    const handleDragOver = (e: React.DragEvent, cat: string, sub: string, index?: number) => {
        e.preventDefault(); // Necesario para permitir drop
        e.stopPropagation(); // Evitar burbujeo confuso
        if (!draggedTrack) return;

        // Si el índice es undefined (arrastre sobre contenedor vacío o zona final), no seteamos index específico todavía
        // Lo manejamos en el render o en el drop del contenedor
        setDragOverTarget({ cat, sub, index });
    };

    // Handler específico para cuando se arrastra sobre el contenedor general de la lista (para añadir al final)
    const handleDragOverContainer = (e: React.DragEvent, cat: string, sub: string, listLength: number) => {
        e.preventDefault();
        e.stopPropagation(); // Importante para que no detecte el padre
        if (!draggedTrack) return;

        // Solo si estamos arrastrando sobre el fondo del contenedor (target === currentTarget)
        // o si la lista está vacía
        if (e.target === e.currentTarget || listLength === 0) {
            setDragOverTarget({ cat, sub, index: listLength });
        }
    };

    const handleDrop = async (e: React.DragEvent, targetCat: string, targetSub: string, targetIndex?: number) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOverTarget(null);
        if (!draggedTrack) return;

        const sourceCat = draggedTrack.category;
        const sourceSub = draggedTrack.subcategory;

        // CASO 1: Mover archivo a otra lista (Cambio de categoría/subcategoría)
        if (sourceCat !== targetCat || sourceSub !== targetSub) {
            await moveTrackFile(draggedTrack, targetCat, targetSub);
            setDraggedTrack(null);
            return;
        }

        // CASO 2: Reordenar en la misma lista
        // Obtenemos la lista ordenada actual
        const tracksInList = availableTracks.filter(t => t.category === targetCat && t.subcategory === targetSub);
        const orderKey = `${currentFrame}.${targetCat}.${targetSub}`;
        const savedOrder = playlistOrders[orderKey];

        if (savedOrder) {
            tracksInList.sort((a, b) => {
                const idxA = savedOrder.indexOf(a.id);
                const idxB = savedOrder.indexOf(b.id);
                if (idxA === -1) return 1;
                if (idxB === -1) return -1;
                return idxA - idxB;
            });
        }

        const currentIndex = tracksInList.findIndex(t => t.id === draggedTrack.id);
        if (currentIndex === -1) return;

        // Determinamos el índice final
        // Si targetIndex es undefined (drop en contenedor), lo mandamos al final
        let finalIndex = targetIndex !== undefined ? targetIndex : tracksInList.length;

        // Ajuste: Si movemos de arriba a abajo, el índice visual cambia al quitar el elemento original
        // Pero para simplificar la lógica de array: sacamos y metemos.

        const newOrder = [...tracksInList];
        // 1. Sacamos el elemento
        const [movedItem] = newOrder.splice(currentIndex, 1);

        // 2. Calculamos inserción. 
        // Si el índice destino era mayor que el origen, hay que restar 1 porque el array se encogió
        // PERO, en la UI, si soltamos SOBRE el item 5 (ahora index 4), queremos que quede EN index 4.
        // Si soltamos en el DropIndicator que está ANTES del item 5:
        // El DropIndicator tiene el index del item que desplaza.

        // Caso especial: Si targetIndex > currentIndex, tenemos que ajustar?
        // React renderiza el DropIndicator ANTES del item 'targetIndex'.
        // Así que 'targetIndex' es la posición donde queremos que acabe el item.
        // PERO al hacer splice(currentIndex, 1), todos los índices > currentIndex disminuyen en 1.
        if (finalIndex > currentIndex) {
            finalIndex -= 1;
        }

        newOrder.splice(finalIndex, 0, movedItem);

        reorderPlaylist(orderKey, newOrder);
        setDraggedTrack(null);
    };

    return (
        <div className="space-y-2 pb-10">
            {/* Global Controls */}
            <div className="flex justify-center gap-4 bg-slate-900 p-2 rounded mb-4 border border-slate-800">
                <button onClick={() => setPlaybackMode('loop')} className={`p-2 rounded ${playbackMode === 'loop' ? 'text-amber-500 bg-amber-900/20' : 'text-slate-500 hover:bg-slate-800'}`} title="Bucle (1 canción)"><Repeat size={18} /></button>
                <button onClick={() => setPlaybackMode('sequential')} className={`p-2 rounded ${playbackMode === 'sequential' ? 'text-cyan-500 bg-cyan-900/20' : 'text-slate-500 hover:bg-slate-800'}`} title="Secuencial (Lista)"><ArrowRight size={18} /></button>
                <button onClick={() => setPlaybackMode('shuffle')} className={`p-2 rounded ${playbackMode === 'shuffle' ? 'text-purple-500 bg-purple-900/20' : 'text-slate-500 hover:bg-slate-800'}`} title="Aleatorio"><Shuffle size={18} /></button>
            </div>

            {Object.entries(MUSIC_CATEGORIES).map(([category, subcategories]) => (
                <div key={category} className="border border-slate-800 rounded-lg overflow-hidden bg-slate-900/50">
                    <button
                        onClick={() => toggleCategory(category)}
                        className="w-full px-3 py-2 flex items-center justify-between bg-slate-800/80 hover:bg-slate-800 transition-colors text-left"
                    >
                        <span className="font-bold text-slate-200 text-sm">{category}</span>
                        {expandedCategory === category ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>

                    {expandedCategory === category && (
                        <div className="p-2 space-y-4 bg-slate-950/50">
                            {subcategories.map(sub => {
                                let tracksInSub = availableTracks.filter(t => t.category === category && t.subcategory === sub);
                                const orderKey = `${currentFrame}.${category}.${sub}`;
                                const savedOrder = playlistOrders[orderKey];

                                if (savedOrder) {
                                    tracksInSub.sort((a, b) => {
                                        const idxA = savedOrder.indexOf(a.id);
                                        const idxB = savedOrder.indexOf(b.id);
                                        if (idxA === -1) return 1;
                                        if (idxB === -1) return -1;
                                        return idxA - idxB;
                                    });
                                }

                                // Detectar si estamos arrastrando sobre esta lista específica
                                const isDragOverList = dragOverTarget?.cat === category && dragOverTarget?.sub === sub;

                                return (
                                    <div
                                        key={sub}
                                        className={`space-y-1 p-1 rounded transition-colors min-h-[2rem] ${isDragOverList ? 'bg-amber-900/10 ring-1 ring-amber-500/20' : ''}`}
                                        onDragOver={(e) => handleDragOverContainer(e, category, sub, tracksInSub.length)}
                                        onDrop={(e) => handleDrop(e, category, sub, dragOverTarget?.index)}
                                    >
                                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2 border-b border-slate-800/50 pb-1 mb-2 select-none pointer-events-none">
                                            {sub}
                                        </h4>

                                        {tracksInSub.length === 0 ? (
                                            <div className="px-2 text-xs text-slate-600 italic h-12 flex items-center justify-center border-2 border-dashed border-slate-800 rounded">
                                                {isDragOverList ? 'Suelta para añadir' : 'Lista vacía'}
                                            </div>
                                        ) : (
                                            <div className="space-y-1">
                                                {tracksInSub.map((track, index) => {
                                                    const isCurrent = activeMusic?.id === track.id;
                                                    // Mostrar indicador ANTES del elemento si el target index coincide
                                                    const showIndicator = isDragOverList && dragOverTarget?.index === index;
                                                    const isDraggingSelf = draggedTrack?.id === track.id;

                                                    return (
                                                        <React.Fragment key={track.id}>
                                                            {showIndicator && <DropIndicator />}

                                                            <div
                                                                draggable
                                                                onDragStart={(e) => handleDragStart(e, track)}
                                                                onDragOver={(e) => handleDragOver(e, category, sub, index)}
                                                                // onDrop aquí es redundante porque burbujea al contenedor, 
                                                                // pero ayuda a prevenir flickering si el contenedor es muy grande

                                                                onContextMenu={(e) => handleContextMenu(e, track)}
                                                                className={`
                                                                    group flex items-center gap-3 p-2 rounded cursor-pointer transition-all relative
                                                                    ${isCurrent ? 'bg-amber-900/20 border border-amber-900/50' : 'hover:bg-slate-800 border border-transparent'}
                                                                    ${isDraggingSelf ? 'opacity-40 grayscale' : 'opacity-100'}
                                                                `}
                                                                onClick={() => isCurrent && isPlayingMusic ? pauseMusic() : playMusic(track, tracksInSub)}
                                                            >
                                                                <div className="text-slate-600 cursor-grab active:cursor-grabbing hover:text-slate-400"><GripVertical size={14} /></div>
                                                                <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${isCurrent ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-slate-200'}`}>
                                                                    {isCurrent && isPlayingMusic ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                                                                </div>
                                                                <div className="flex-1 min-w-0 pointer-events-none">
                                                                    <div className={`text-sm font-medium truncate ${isCurrent ? 'text-amber-500' : 'text-slate-300'}`}>{track.name}</div>
                                                                    {!track.frame && <div className="text-[10px] text-cyan-500">Global</div>}
                                                                </div>
                                                            </div>
                                                        </React.Fragment>
                                                    );
                                                })}
                                                {/* Indicador al final de la lista si estamos arrastrando sobre el "fondo" del contenedor */}
                                                {isDragOverList && dragOverTarget?.index === tracksInSub.length && <DropIndicator />}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            ))}

            {contextMenu && (
                <TrackContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    track={contextMenu.track}
                    onClose={() => setContextMenu(null)}
                />
            )}
        </div>
    );
};