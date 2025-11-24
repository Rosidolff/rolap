import { useEffect, useRef, useState } from 'react';
import { Check, X, Trash2, Edit2, Image as ImageIcon } from 'lucide-react';
import type { Track } from '../types';
import { useAppStore } from '../store';
import { IconPickerModal } from './IconPickerModal';

interface Props {
    x: number;
    y: number;
    track: Track;
    onClose: () => void;
}

export const TrackContextMenu = ({ x, y, track, onClose }: Props) => {
    const { renameTrack, deleteTrack, updateTrackIcon } = useAppStore();
    const [isRenaming, setIsRenaming] = useState(false);
    const [showIconPicker, setShowIconPicker] = useState(false);
    const [newName, setNewName] = useState(track.name);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                if (!showIconPicker) onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose, showIconPicker]);

    const handleRename = async () => {
        if (newName.trim() && newName !== track.name) {
            await renameTrack(track, newName);
        }
        onClose();
    };

    const handleDelete = async () => {
        if(confirm(`¿Eliminar permanentemente "${track.name}"?`)) {
            await deleteTrack(track);
        }
        onClose();
    };

    const handleIconSelect = async (icon: string) => {
        await updateTrackIcon(track, icon);
        setShowIconPicker(false);
        onClose();
    };

    const style = {
        top: Math.min(y, window.innerHeight - 150),
        left: Math.min(x, window.innerWidth - 200),
    };

    if (showIconPicker) {
        return (
            <IconPickerModal 
                isOpen={true} 
                onClose={() => { setShowIconPicker(false); onClose(); }} 
                onSelect={handleIconSelect}
                currentIcon={track.icon}
            />
        );
    }

    if (isRenaming) {
        return (
            <div 
                ref={menuRef}
                className="fixed z-50 bg-[#1a1a1a] border border-white/10 rounded-lg p-2 shadow-2xl flex items-center gap-2 backdrop-blur-md"
                style={style}
            >
                <input 
                    type="text" 
                    value={newName} 
                    onChange={(e) => setNewName(e.target.value)}
                    className="bg-black/30 border border-white/10 rounded px-2 py-1 text-xs text-white w-40 outline-none focus:border-amber-500"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                />
                <button onClick={handleRename} className="text-green-400 hover:bg-white/10 p-1 rounded"><Check size={14}/></button>
                <button onClick={onClose} className="text-red-400 hover:bg-white/10 p-1 rounded"><X size={14}/></button>
            </div>
        );
    }

    return (
        <div 
            ref={menuRef}
            className="fixed z-50 bg-[#1a1a1a]/90 border border-white/10 rounded-lg py-1 shadow-2xl min-w-[160px] backdrop-blur-xl"
            style={style}
        >
            <button 
                className="w-full text-left px-4 py-2 text-xs text-zinc-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2"
                onClick={() => setIsRenaming(true)}
            >
                <Edit2 size={12} /> Renombrar
            </button>
            
            <button 
                className="w-full text-left px-4 py-2 text-xs text-zinc-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2"
                onClick={() => setShowIconPicker(true)}
            >
                <ImageIcon size={12} /> Cambiar Icono
            </button>

            <div className="h-px bg-white/5 my-1"></div>

            <button 
                className="w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors flex items-center gap-2"
                onClick={handleDelete}
            >
                <Trash2 size={12} /> Eliminar
            </button>
        </div>
    );
};