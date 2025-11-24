import { useState } from 'react';
import { Volume2, VolumeX, Trash2, Plus, Save, FolderOpen, X, RefreshCw, GripVertical } from 'lucide-react';
import { useAppStore } from '../store';
import type { Track, ActiveAmbience } from '../types';
import { TrackContextMenu } from './TrackContextMenu';
import * as LucideIcons from 'lucide-react';

export const AmbienceView = () => {
    const { currentFrame, activeAmbience, playAmbience, stopAmbience, setAmbienceVolume, toggleAmbienceMute, tracks, saveNewPreset, updateCurrentPreset, loadPreset, deletePreset, presets, activePresetId, reorderActiveAmbience } = useAppStore();
    const [showAddModal, setShowAddModal] = useState(false);
    const [showLoadMenu, setShowLoadMenu] = useState(false);
    const [contextMenu, setContextMenu] = useState<{x: number, y: number, track: Track} | null>(null);
    const [draggedItem, setDraggedItem] = useState<ActiveAmbience | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    const activePresetName = presets.find(p => p.id === activePresetId)?.name;
    const availableAmbience = tracks.filter(t => t.type === 'ambience' && (!t.frame || t.frame === currentFrame));

    const handleSaveNew = async () => { if (activeAmbience.length === 0) return; const name = prompt("Nombre:"); if (name) await saveNewPreset(name); };
    const handleUpdate = async () => { if (confirm(`¿Actualizar "${activePresetName}"?`)) await updateCurrentPreset(); };
    const handleDeleteCurrent = async () => { if (activePresetId && confirm(`¿Borrar "${activePresetName}"?`)) await deletePreset(activePresetId); };
    const handleContextMenu = (e: React.MouseEvent, track: Track) => { e.preventDefault(); e.stopPropagation(); setContextMenu({ x: e.clientX, y: e.clientY, track }); };
    const handleDragStart = (e: React.DragEvent, item: ActiveAmbience) => { setDraggedItem(item); e.dataTransfer.effectAllowed = "move"; };
    const handleDragOver = (e: React.DragEvent, index: number) => { e.preventDefault(); if (!draggedItem) return; setDragOverIndex(index); };
    const handleDrop = (e: React.DragEvent, targetIndex: number) => { e.preventDefault(); setDragOverIndex(null); if (!draggedItem) return; const currentIndex = activeAmbience.findIndex(a => a.instanceId === draggedItem.instanceId); if (currentIndex === -1) return; const newOrder = [...activeAmbience]; const [movedItem] = newOrder.splice(currentIndex, 1); newOrder.splice(targetIndex, 0, movedItem); reorderActiveAmbience(newOrder); setDraggedItem(null); };
    const renderTrackIcon = (iconName?: string, size = 14) => { const Icon = (LucideIcons as any)[iconName || 'CloudRain'] || LucideIcons.CloudRain; return <Icon size={size} />; };

    return (
        <div className="space-y-2 pb-20">
            <div className="flex gap-1">
                <div className="relative flex-1">
                    <button onClick={() => setShowLoadMenu(!showLoadMenu)} className="w-full flex items-center justify-between px-2 py-1.5 bg-white/5 text-[10px] font-bold text-zinc-300 rounded border border-white/5 hover:bg-white/10">
                        <div className="flex items-center gap-2"><FolderOpen size={12} className="text-cyan-500" /><span className="truncate max-w-[80px]">{activePresetName || "Preset"}</span></div>
                    </button>
                    {showLoadMenu && (
                        <div className="absolute top-full left-0 mt-1 w-48 bg-[#151515] border border-white/10 rounded shadow-xl z-50 overflow-hidden">
                            <div className="max-h-40 overflow-y-auto custom-scrollbar p-1">
                                {presets.map(preset => (
                                    <div key={preset.id} className="flex items-center justify-between hover:bg-white/5 p-1.5 rounded group cursor-pointer" onClick={() => { loadPreset(preset); setShowLoadMenu(false); }}>
                                        <span className={`text-[10px] ${activePresetId === preset.id ? 'text-cyan-400 font-bold' : 'text-zinc-400'}`}>{preset.name}</span>
                                        <button onClick={(e) => { e.stopPropagation(); if(confirm('¿Borrar?')) deletePreset(preset.id); }} className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100"><Trash2 size={10} /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                {activePresetId && <><button onClick={handleUpdate} className="p-1.5 bg-white/5 text-cyan-500 rounded hover:bg-white/10"><RefreshCw size={12} /></button><button onClick={handleDeleteCurrent} className="p-1.5 bg-white/5 text-red-500 rounded hover:bg-white/10"><Trash2 size={12} /></button></>}
                <button onClick={handleSaveNew} className="p-1.5 bg-white/5 text-zinc-300 rounded hover:bg-white/10"><Save size={12} /></button>
                <button onClick={() => setShowAddModal(!showAddModal)} className="p-1.5 bg-cyan-900/20 text-cyan-400 rounded border border-cyan-500/30 hover:bg-cyan-500/20"><Plus size={12} /></button>
            </div>

            {showAddModal && (
                <div className="bg-[#151515] border border-white/10 rounded p-1 space-y-0.5 mb-2">
                    <div className="grid grid-cols-1 gap-0.5 max-h-32 overflow-y-auto custom-scrollbar">
                        {availableAmbience.map(track => (
                            <button key={track.id} onClick={() => { playAmbience(track); setShowAddModal(false); }} onContextMenu={(e) => handleContextMenu(e, track)} className="w-full text-left px-2 py-1 hover:bg-white/5 rounded flex items-center gap-2 group">
                                <span className="text-zinc-500 group-hover:text-cyan-400">{renderTrackIcon(track.icon, 12)}</span>
                                <span className="text-[10px] text-zinc-400 group-hover:text-white truncate flex-1">{track.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="space-y-1">
                {activeAmbience.map((amb, index) => (
                    <div key={amb.instanceId} onDragOver={(e) => handleDragOver(e, index)} onDrop={(e) => handleDrop(e, index)} className={`relative bg-[#101010] border rounded p-1.5 flex items-center gap-2 group ${draggedItem?.instanceId === amb.instanceId ? 'opacity-30' : ''} ${dragOverIndex === index ? 'border-t-cyan-500' : 'border-white/5'}`}>
                        <div draggable onDragStart={(e) => handleDragStart(e, amb)} className="cursor-grab text-zinc-600 hover:text-zinc-400"><GripVertical size={10} /></div>
                        <div className={`w-6 h-6 rounded flex items-center justify-center ${amb.isMuted ? 'bg-zinc-800 text-zinc-600' : 'bg-cyan-500/10 text-cyan-400'}`}>{renderTrackIcon(amb.track.icon, 12)}</div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline mb-0.5"><span className={`text-[10px] font-bold truncate ${amb.isMuted ? 'text-zinc-600' : 'text-zinc-300'}`}>{amb.track.name}</span><span className="text-[8px] font-mono text-zinc-600">{amb.volume}%</span></div>
                            <input type="range" min="0" max="100" value={amb.volume} onChange={(e) => setAmbienceVolume(amb.instanceId, parseInt(e.target.value))} className="w-full h-0.5 bg-zinc-800 rounded appearance-none cursor-pointer accent-cyan-500" disabled={amb.isMuted} />
                        </div>
                        <div className="flex gap-1">
                            <button onClick={() => toggleAmbienceMute(amb.instanceId)} className={`p-1 rounded ${amb.isMuted ? 'text-red-500 bg-red-500/10' : 'text-zinc-500 hover:text-zinc-300'}`}>{amb.isMuted ? <VolumeX size={10} /> : <Volume2 size={10} />}</button>
                            <button onClick={() => stopAmbience(amb.instanceId)} className="p-1 rounded text-zinc-600 hover:text-red-400"><Trash2 size={10} /></button>
                        </div>
                    </div>
                ))}
            </div>
            {contextMenu && <TrackContextMenu x={contextMenu.x} y={contextMenu.y} track={contextMenu.track} onClose={() => setContextMenu(null)} />}
        </div>
    );
};