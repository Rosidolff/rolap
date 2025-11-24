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
    const [draggedTrack, setDraggedTrack] = useState<Track | null>(null);
    const [dragOverTarget, setDragOverTarget] = useState<{ cat: string, index?: number } | null>(null);

    const availableSFX = tracks.filter(t => t.type === 'sfx' && (!t.frame || t.frame === currentFrame));
    const toggleCategory = (cat: string) => setExpandedCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
    const handleContextMenu = (e: React.MouseEvent, track: Track) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, track }); };
    const handleDragStart = (e: React.DragEvent, track: Track) => { setDraggedTrack(track); e.dataTransfer.effectAllowed = "move"; };
    const handleDragOver = (e: React.DragEvent, cat: string, index?: number) => { e.preventDefault(); if (!draggedTrack) return; setDragOverTarget({ cat, index }); };
    
    const handleDrop = async (e: React.DragEvent, targetCat: string, targetIndex?: number) => {
        e.preventDefault(); setDragOverTarget(null); if (!draggedTrack) return;
        if (draggedTrack.category !== targetCat) { await moveTrackFile(draggedTrack, targetCat, ''); setDraggedTrack(null); return; }
        if (targetIndex !== undefined) {
            const tracksInCategory = availableSFX.filter(t => t.category === targetCat);
            const orderKey = `${currentFrame}.${targetCat}`;
            const savedOrder = playlistOrders[orderKey];
            if (savedOrder) { tracksInCategory.sort((a, b) => { const idxA = savedOrder.indexOf(a.id); const idxB = savedOrder.indexOf(b.id); if (idxA === -1) return 1; if (idxB === -1) return -1; return idxA - idxB; }); }
            const currentIndex = tracksInCategory.findIndex(t => t.id === draggedTrack.id); if (currentIndex === -1) return;
            const newOrder = [...tracksInCategory]; const [movedItem] = newOrder.splice(currentIndex, 1); newOrder.splice(targetIndex, 0, movedItem);
            reorderPlaylist(orderKey, newOrder);
        }
        setDraggedTrack(null);
    };

    return (
        <div className="space-y-2 pb-20">
            {SFX_CATEGORIES.map(category => {
                const tracksInCategory = availableSFX.filter(t => t.category === category);
                const orderKey = `${currentFrame}.${category}`;
                const savedOrder = playlistOrders[orderKey];
                if (savedOrder) { tracksInCategory.sort((a, b) => { const idxA = savedOrder.indexOf(a.id); const idxB = savedOrder.indexOf(b.id); if (idxA === -1) return 1; if (idxB === -1) return -1; return idxA - idxB; }); }
                const isDragOverContainer = dragOverTarget?.cat === category && dragOverTarget?.index === undefined;

                return (
                    <div key={category} className={`rounded border transition-colors ${isDragOverContainer ? 'border-purple-500/30 bg-purple-500/5' : 'border-transparent bg-white/[0.02]'}`} onDragOver={(e) => handleDragOver(e, category)} onDrop={(e) => handleDrop(e, category)}>
                        <button onClick={() => toggleCategory(category)} className="w-full px-2 py-1.5 flex items-center justify-between group">
                            <span className="font-bold text-zinc-300 text-[10px] flex items-center gap-1 uppercase tracking-wide">
                                <Zap size={10} className="text-purple-500" /> {category}
                            </span>
                            {expandedCategories.includes(category) ? <ChevronDown size={10} className="text-zinc-600" /> : <ChevronRight size={10} className="text-zinc-600" />}
                        </button>

                        {expandedCategories.includes(category) && (
                            <div className="p-1 grid grid-cols-3 gap-1">
                                {tracksInCategory.map((track, index) => {
                                    const isActive = activeSFXIds.includes(track.id);
                                    return (
                                        <button key={track.id} draggable onDragStart={(e) => handleDragStart(e, track)} onDragOver={(e) => handleDragOver(e, category, index)} onDrop={(e) => handleDrop(e, category, index)} onContextMenu={(e) => handleContextMenu(e, track)} onClick={() => toggleSFX(track)} className={`h-10 p-1 rounded border text-[9px] font-bold leading-tight flex items-center justify-center break-words text-center transition-all active:scale-95 ${isActive ? 'bg-purple-600 border-purple-500 text-white shadow-lg scale-105 z-10' : 'bg-[#1a1a1a] border-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-200'}`}>
                                            {track.name}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}
            {contextMenu && <TrackContextMenu x={contextMenu.x} y={contextMenu.y} track={contextMenu.track} onClose={() => setContextMenu(null)} />}
        </div>
    );
};