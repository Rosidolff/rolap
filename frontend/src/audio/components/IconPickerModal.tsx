import { X } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { AMBIENCE_ICONS } from '../types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (iconName: string) => void;
    currentIcon?: string;
}

export const IconPickerModal = ({ isOpen, onClose, onSelect, currentIcon }: Props) => {
    if (!isOpen) return null;

    const renderIcon = (iconName: string) => {
        const Icon = (LucideIcons as any)[iconName] || LucideIcons.Cloud;
        return <Icon size={20} />;
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-[#121212] border border-white/10 rounded-xl w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wide">Seleccionar Icono</h3>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={16}/></button>
                </div>
                <div className="p-4 grid grid-cols-6 gap-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {AMBIENCE_ICONS.map(iconName => (
                        <button
                            key={iconName}
                            onClick={() => onSelect(iconName)}
                            className={`aspect-square rounded-lg flex items-center justify-center transition-all duration-200 ${
                                currentIcon === iconName 
                                ? 'bg-amber-500 text-black shadow-[0_0_10px_rgba(245,158,11,0.5)]' 
                                : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white hover:scale-110'
                            }`}
                            title={iconName}
                        >
                            {renderIcon(iconName)}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};