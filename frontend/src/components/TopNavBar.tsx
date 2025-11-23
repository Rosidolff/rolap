import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faBoxOpen, faDiceD20, faInfoCircle, faSearch, faSignOutAlt, faPlus, faFilter, faUser, faBook
} from '@fortawesome/free-solid-svg-icons';
import { api } from '../services/api';

interface TopNavBarProps {
    campaignId: string;
    activeTab: string;
    onTabChange: (tab: string) => void;
    onToggleInfo: () => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onAdd?: () => void;
    extraTabs?: { id: string, label: string, icon?: any }[];
    
    // Filtros
    showFilters?: boolean;
    onToggleFilters?: () => void;
    filterStatus?: string;
    onFilterStatusChange?: (val: string) => void;
    filterSub?: string;
    onFilterSubChange?: (val: string) => void;
}

const ITEM_TYPES = ["character", "npc", "scene", "secret", "location", "monster", "item"];

const TYPE_LABELS: Record<string, string> = {
    character: "PJs",
    npc: "NPCS",
    scene: "ESCENAS",
    secret: "SECRETOS",
    location: "LUGARES",
    monster: "ENEMIGOS",
    item: "ITEMS"
};

export default function TopNavBar({ 
    campaignId, activeTab, onTabChange, onToggleInfo, searchQuery, onSearchChange, onAdd, extraTabs = [],
    showFilters, onToggleFilters, filterStatus, onFilterStatusChange, filterSub, onFilterSubChange
}: TopNavBarProps) {
    const navigate = useNavigate();

    const handleGoToSession = async () => {
        try {
            const [campaign, sessions] = await Promise.all([
                api.campaigns.get(campaignId),
                api.sessions.list(campaignId)
            ]);
            let targetSessionId = campaign.active_session;
            if (!targetSessionId && sessions.length > 0) {
                // Buscar la última no completada
                const sorted = sessions.sort((a: any, b: any) => b.number - a.number);
                const active = sorted.find((s: any) => s.status !== 'completed');
                targetSessionId = active ? active.id : sorted[sorted.length - 1].id;
            }
            if (targetSessionId) {
                navigate(`/campaign/${campaignId}/sessions`, { state: { sessionId: targetSessionId } });
            } else {
                navigate(`/campaign/${campaignId}/sessions`);
            }
        } catch (error) {
            navigate(`/campaign/${campaignId}/sessions`);
        }
    };

    return (
        <nav className="bg-gray-900 border-b border-gray-800 flex items-stretch px-2 py-1 shadow-md z-40 h-auto min-h-[3.5rem] flex-shrink-0">
            <button onClick={onToggleInfo} className="flex flex-col justify-center items-center px-4 mr-2 bg-gray-800 hover:bg-gray-700 text-blue-400 rounded border border-gray-700 transition-colors flex-shrink-0" title="Info Campaña">
                <FontAwesomeIcon icon={faInfoCircle} size="lg" />
                <span className="text-[10px] font-bold uppercase mt-1">Info</span>
            </button>

            <div className="flex-1 grid grid-cols-4 sm:grid-cols-9 gap-1 mr-2 min-w-0">
                <button onClick={() => onTabChange('all')} className={`col-span-1 flex items-center justify-center text-[10px] font-bold uppercase rounded border transition-colors h-full max-h-[1.5rem] truncate ${activeTab === 'all' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'}`}>Todos</button>
                {ITEM_TYPES.map(type => {
                    const isChar = type === 'character';
                    const isActive = activeTab === type;
                    
                    let baseClasses = "col-span-1 flex items-center justify-center text-[10px] font-bold uppercase rounded border transition-colors h-full max-h-[1.5rem] truncate ";
                    
                    if (isActive) {
                        baseClasses += isChar 
                            ? 'bg-orange-700 border-orange-600 text-white' 
                            : 'bg-blue-600 border-blue-500 text-white';
                    } else {
                        baseClasses += isChar 
                            ? 'bg-orange-900/20 border-orange-900/30 text-gray-300 hover:bg-orange-900/40 hover:text-white' 
                            : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-white';
                    }

                    return (
                        <button key={type} onClick={() => onTabChange(type)} className={baseClasses}>
                            {isChar && <FontAwesomeIcon icon={faUser} className="mr-1 opacity-70" />}
                            {TYPE_LABELS[type]}
                        </button>
                    );
                })}
                
                <div className="col-span-full sm:col-span-2 relative h-full max-h-[1.5rem] flex gap-1">
                    {onToggleFilters && !extraTabs.length && (
                        <button onClick={onToggleFilters} className={`h-full aspect-square rounded flex items-center justify-center transition-colors border ${showFilters ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'}`} title="Filtros">
                            <FontAwesomeIcon icon={faFilter} size="xs" />
                        </button>
                    )}

                    {showFilters && !extraTabs.length && (
                        <div className="absolute top-full left-0 mt-1 bg-gray-800 border border-gray-700 rounded shadow-xl p-2 flex gap-2 z-50">
                            <select value={filterStatus} onChange={(e) => onFilterStatusChange && onFilterStatusChange(e.target.value)} className="bg-gray-900 border border-gray-600 text-[10px] rounded px-2 py-1 text-white outline-none cursor-pointer hover:border-blue-500">
                                <option value="all">Estado: Todos</option>
                                <option value="new">Nuevos</option>
                                <option value="used">Utilizados</option>
                            </select>
                            {activeTab === 'scene' && (
                                <select value={filterSub} onChange={(e) => onFilterSubChange && onFilterSubChange(e.target.value)} className="bg-gray-900 border border-gray-600 text-[10px] rounded px-2 py-1 text-white outline-none cursor-pointer hover:border-blue-500">
                                    <option value="all">Tipo: Todos</option>
                                    <option value="explore">Exploración</option>
                                    <option value="social">Social</option>
                                    <option value="combat">Combate</option>
                                </select>
                            )}
                        </div>
                    )}

                    <div className="relative flex-1 h-full">
                        <FontAwesomeIcon icon={faSearch} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs" />
                        <input type="text" value={searchQuery} onChange={(e) => onSearchChange(e.target.value)} placeholder="Buscar..." className="w-full h-full pl-6 pr-2 bg-gray-900 border border-gray-700 rounded text-xs text-white focus:border-blue-500 outline-none" />
                    </div>
                    
                    {onAdd && activeTab !== 'all' && (
                        <button onClick={onAdd} className="h-full aspect-square bg-blue-600 hover:bg-blue-500 text-white rounded flex items-center justify-center transition-colors" title={`Añadir nuevo ${activeTab}`}>
                            <FontAwesomeIcon icon={faPlus} size="xs" />
                        </button>
                    )}
                </div>

                {extraTabs.map(tab => (
                    <button key={tab.id} onClick={() => onTabChange(tab.id)} className={`col-span-2 sm:col-span-2 flex items-center justify-center gap-1 text-[10px] font-bold uppercase rounded border transition-colors h-full max-h-[1.5rem] truncate ${activeTab === tab.id ? 'bg-purple-600 border-purple-500 text-white' : 'bg-gray-800 border-gray-700 text-purple-300 hover:bg-gray-700'}`}>
                        {tab.icon && <FontAwesomeIcon icon={tab.icon} />} {tab.label}
                    </button>
                ))}
            </div>

            <div className="flex gap-1 flex-shrink-0">
                <Link to={`/campaign/${campaignId}/vault`} className="flex flex-col justify-center items-center px-3 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded border border-gray-700 transition-colors w-14">
                    <FontAwesomeIcon icon={faBoxOpen} /> <span className="text-[9px] font-bold uppercase mt-1">Vault</span>
                </Link>
                
                {/* BOTÓN BITÁCORA AÑADIDO SIN ROMPER EL DISEÑO */}
                <Link to={`/campaign/${campaignId}/bitacora`} className="flex flex-col justify-center items-center px-3 bg-gray-800 hover:bg-gray-700 text-yellow-500 hover:text-yellow-300 rounded border border-gray-700 transition-colors w-14">
                    <FontAwesomeIcon icon={faBook} /> <span className="text-[9px] font-bold uppercase mt-1">Bitácora</span>
                </Link>

                <button onClick={handleGoToSession} className="flex flex-col justify-center items-center px-3 bg-gray-800 hover:bg-gray-700 text-green-400 hover:text-green-300 rounded border border-gray-700 transition-colors w-14">
                    <FontAwesomeIcon icon={faDiceD20} /> <span className="text-[9px] font-bold uppercase mt-1">Sesión</span>
                </button>
                <Link to="/" className="flex flex-col justify-center items-center px-3 bg-gray-900 hover:bg-red-900/30 text-gray-600 hover:text-red-400 rounded border border-transparent hover:border-red-900 transition-colors ml-1" title="Salir">
                    <FontAwesomeIcon icon={faSignOutAlt} />
                </Link>
            </div>
        </nav>
    );
}