import { useEffect, useRef, useState } from 'react';
import { Check, X } from 'lucide-react';
import type { Track } from '../types';
import { useAppStore } from '../store';

interface Props {
    x: number;
    y: number;
    track: Track;
    onClose: () => void;
}

export const TrackContextMenu = ({ x, y, track, onClose }: Props) => {
    const { renameTrack } = useAppStore();
    const [isRenaming, setIsRenaming] = useState(false);
    const [newName, setNewName] = useState(track.name);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const handleRename = async () => {
        if (newName.trim() && newName !== track.name) {
            await renameTrack(track, newName);
        }
        onClose();
    };

    const style = {
        top: Math.min(y, window.innerHeight - 100), // Evitar que se salga por abajo
        left: Math.min(x, window.innerWidth - 200), // Evitar que se salga por la derecha
    };

    if (isRenaming) {
        return (
            <div 
                ref={menuRef}
                className="fixed z-50 bg-slate-900 border border-slate-700 rounded-lg p-2 shadow-xl flex items-center gap-2"
                style={style}
            >
                <input 
                    type="text" 
                    value={newName} 
                    onChange={(e) => setNewName(e.target.value)}
                    className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-white w-48 outline-none focus:border-amber-500"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                />
                <button onClick={handleRename} className="text-green-500 hover:bg-slate-800 p-1 rounded"><Check size={14}/></button>
                <button onClick={onClose} className="text-red-500 hover:bg-slate-800 p-1 rounded"><X size={14}/></button>
            </div>
        );
    }

    return (
        <div 
            ref={menuRef}
            className="fixed z-50 bg-slate-900 border border-slate-700 rounded-lg py-1 shadow-xl min-w-[150px]"
            style={style}
        >
            <button 
                className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                onClick={() => setIsRenaming(true)}
            >
                Cambiar Nombre
            </button>
        </div>
    );
};