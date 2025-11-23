import { useState } from 'react';
import { Zap, ChevronDown, ChevronRight } from 'lucide-react';
import { SFX_CATEGORIES } from '../types';
import { useAppStore } from '../store';
import type { Track } from '../types';
import { TrackContextMenu } from './TrackContextMenu';

export const SFXView = () => {
    const { currentFrame, toggleSFX, activeSFXIds, tracks, playlistOrders, reorderPlaylist, moveTrackFile } = useAppStore();

    const [expandedCategories, setExpandedCategories] = useState<string[]>(['Combate', 'Magia']);
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, track: Track } | null>(null);

    // DND State
    const [draggedTrack, setDraggedTrack] = useState<Track | null>(null);
    const [dragOverTarget, setDragOverTarget] = useState<{ cat: string, index?: number } | null>(null);

    const availableSFX = tracks.filter(t => t.type === 'sfx' && (!t.frame || t.frame === currentFrame));

    const toggleCategory = (cat: string) => {
        setExpandedCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
    };

    const handleContextMenu = (e: React.MouseEvent, track: Track) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, track });
    };

    const handleDragStart = (e: React.DragEvent, track: Track) => {
        setDraggedTrack(track);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent, cat: string, index?: number) => {
        e.preventDefault();
        if (!draggedTrack) return;
        setDragOverTarget({ cat, index });
    };

    const handleDrop = async (e: React.DragEvent, targetCat: string, targetIndex?: number) => {
        e.preventDefault();
        setDragOverTarget(null);
        if (!draggedTrack) return;

        // Mover entre categorías
        if (draggedTrack.category !== targetCat) {
            await moveTrackFile(draggedTrack, targetCat, '');
            setDraggedTrack(null);
            return;
        }

        // Reordenar
        if (targetIndex !== undefined) {
            const tracksInCategory = availableSFX.filter(t => t.category === targetCat);
            const orderKey = `${currentFrame}.${targetCat}`;
            const savedOrder = playlistOrders[orderKey];

            if (savedOrder) {
                tracksInCategory.sort((a, b) => {
                    const idxA = savedOrder.indexOf(a.id);
                    const idxB = savedOrder.indexOf(b.id);
                    if (idxA === -1) return 1;
                    if (idxB === -1) return -1;
                    return idxA - idxB;
                });
            }

            const currentIndex = tracksInCategory.findIndex(t => t.id === draggedTrack.id);
            if (currentIndex === -1) return;

            const newOrder = [...tracksInCategory];
            const [movedItem] = newOrder.splice(currentIndex, 1);
            newOrder.splice(targetIndex, 0, movedItem);

            reorderPlaylist(orderKey, newOrder);
        }
        setDraggedTrack(null);
    };

    return (
        <div className="space-y-4 pb-10">
            {SFX_CATEGORIES.map(category => {
                const tracksInCategory = availableSFX.filter(t => t.category === category);
                const orderKey = `${currentFrame}.${category}`;
                const savedOrder = playlistOrders[orderKey];

                if (savedOrder) {
                    tracksInCategory.sort((a, b) => {
                        const idxA = savedOrder.indexOf(a.id);
                        const idxB = savedOrder.indexOf(b.id);
                        if (idxA === -1) return 1;
                        if (idxB === -1) return -1;
                        return idxA - idxB;
                    });
                }

                const isDragOverContainer = dragOverTarget?.cat === category && dragOverTarget?.index === undefined;

                return (
                    <div
                        key={category}
                        className={`border border-slate-800 rounded-lg overflow-hidden bg-slate-900/50 transition-colors ${isDragOverContainer ? 'bg-amber-900/20 ring-1 ring-amber-500/50' : ''}`}
                        onDragOver={(e) => handleDragOver(e, category)}
                        onDrop={(e) => handleDrop(e, category)}
                    >
                        <button
                            onClick={() => toggleCategory(category)}
                            className="w-full px-3 py-2 flex items-center justify-between bg-slate-800/80 hover:bg-slate-800 transition-colors text-left"
                        >
                            <span className="font-bold text-slate-200 flex items-center gap-2 text-sm"><Zap size={14} className="text-amber-500" />{category}</span>
                            {expandedCategories.includes(category) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>

                        {expandedCategories.includes(category) && (
                            <div className="p-2 bg-slate-950/50">
                                {tracksInCategory.length === 0 ? (
                                    <div className="text-xs text-slate-600 italic px-2">Arrastra aquí...</div>
                                ) : (
                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                        {tracksInCategory.map((track, index) => {
                                            const isActive = activeSFXIds.includes(track.id);
                                            const isOver = dragOverTarget?.cat === category && dragOverTarget?.index === index;

                                            return (
                                                <button
                                                    key={track.id}
                                                    draggable
                                                    onDragStart={(e) => handleDragStart(e, track)}
                                                    onDragOver={(e) => handleDragOver(e, category, index)}
                                                    onDrop={(e) => handleDrop(e, category, index)}
                                                    onContextMenu={(e) => handleContextMenu(e, track)}
                                                    onClick={() => toggleSFX(track)}
                                                    className={`
                                                        relative h-20 p-2 rounded-md flex items-center justify-center transition-all active:scale-95 border overflow-hidden
                                                        ${isActive
                                                            ? 'bg-amber-600 border-amber-400 text-white shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                                                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750 hover:border-slate-600 hover:text-white'}
                                                        ${isOver ? 'border-l-4 border-l-cyan-500' : ''}
                                                        ${draggedTrack?.id === track.id ? 'opacity-50' : 'opacity-100'}
                                                    `}
                                                >
                                                    {isActive && <div className="absolute inset-0 bg-white/10 animate-pulse" />}
                                                    <span className="text-sm font-black leading-tight text-center break-words w-full z-10 drop-shadow-md uppercase select-none">
                                                        {track.name}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
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