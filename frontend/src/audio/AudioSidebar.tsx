import { useState, useEffect } from 'react'
import { Music, CloudRain, Zap, Plus, AlertTriangle, Play, Pause, ChevronRight, ChevronLeft } from 'lucide-react'
import { useAppStore } from './store'
import type { Frame } from './types'
import { MusicView } from './components/MusicView'
import { AmbienceView } from './components/AmbienceView'
import { SFXView } from './components/SFXView'
import { UploadModal } from './components/UploadModal'
import { AudioEngine } from './components/AudioEngine'
import clsx from 'clsx'

export function AudioSidebar() {
  const [isOpen, setIsOpen] = useState(true)
  const [activeTab, setActiveTab] = useState<'music' | 'ambience' | 'sfx'>('music')
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  
  const {
    currentFrame,
    setFrame,
    activeMusic,
    isPlayingMusic,
    pauseMusic,
    playMusic,
    fetchTracks,
    fetchPresets,
    loadSettings,
    musicCurrentTime,
    musicDuration,
    requestSeek,
    masterVolume,
    setMasterVolume
  } = useAppStore()

  useEffect(() => {
    fetchTracks();
    fetchPresets();
    loadSettings();
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={clsx(
      "flex flex-col bg-slate-950 text-slate-100 border-r border-slate-800 transition-all duration-300 ease-in-out h-screen relative shrink-0",
      isOpen ? "w-[400px]" : "w-12"
    )}>
      <AudioEngine />
      
      {/* Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="absolute top-1/2 -right-3 z-50 bg-slate-800 border border-slate-700 rounded-full p-1 text-slate-300 hover:text-white shadow-md cursor-pointer"
        title={isOpen ? "Colapsar" : "Expandir"}
      >
        {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>

      {!isOpen && (
         <div className="flex flex-col items-center mt-4 gap-4 h-full">
            <button onClick={() => setIsOpen(true)} className="p-2 hover:bg-slate-800 rounded text-amber-500" title="Expandir Audio">
                <Music size={20} />
            </button>
            {/* Vertical Text or Status could go here */}
            {activeMusic && isPlayingMusic && (
                <div className="animate-pulse w-2 h-2 bg-amber-500 rounded-full"></div>
            )}
         </div>
      )}

      {isOpen && (
        <>
          {/* Header Global */}
          <header className="p-4 border-b border-slate-800 bg-slate-900 flex flex-col gap-4 shadow-md z-10">
             <div className="flex items-center justify-between">
              <h1 className="text-lg font-bold text-amber-500 tracking-wider">RPGMusic</h1>
              <button className="p-2 bg-red-900/50 text-red-400 border border-red-800 rounded hover:bg-red-800 hover:text-white transition-colors" title="Pánico (Detener todo)">
                <AlertTriangle size={18} />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={currentFrame}
                onChange={(e) => setFrame(e.target.value as Frame)}
                className="flex-1 bg-slate-950 border border-slate-700 rounded p-2 text-sm text-slate-300 focus:border-amber-500 focus:outline-none"
              >
                <option value="Fantasy">Fantasía</option>
                <option value="Futurista">Futurista</option>
                <option value="Grim Dark">Grim Dark</option>
              </select>
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="p-2 bg-slate-800 border border-slate-700 text-slate-300 rounded hover:bg-slate-700 hover:text-white transition-colors"
                title="Añadir Pista"
              >
                <Plus size={18} />
              </button>
            </div>

            {/* Master Volume */}
            <div className="flex items-center gap-3 px-1">
              <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Master</span>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={masterVolume}
                onChange={(e) => setMasterVolume(Number(e.target.value))}
                className="flex-1 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500" 
              />
              <span className="text-[10px] text-slate-500 w-6">{masterVolume}%</span>
            </div>

            {/* Now Playing Mini Player */}
            {activeMusic && (
              <div className="mt-2 p-2 bg-slate-950 rounded border border-slate-800 flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-900/30 rounded flex items-center justify-center text-amber-500">
                  <Music size={14} />
                </div>
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <div className="text-xs font-bold text-slate-200 truncate">{activeMusic.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {formatTime(musicCurrentTime)} / {formatTime(musicDuration)}
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={musicDuration || 100}
                    value={musicCurrentTime}
                    onChange={(e) => requestSeek(Number(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>
                <button
                  onClick={() => isPlayingMusic ? pauseMusic() : playMusic(activeMusic)}
                  className="p-1.5 hover:bg-slate-800 rounded text-slate-300"
                >
                  {isPlayingMusic ? <Pause size={14} /> : <Play size={14} />}
                </button>
              </div>
            )}
          </header>

          {/* Navegación Principal (Tabs) */}
          <nav className="flex border-b border-slate-800 bg-slate-900">
            <button
              onClick={() => setActiveTab('music')}
              className={`flex-1 py-3 flex justify-center items-center gap-2 border-b-2 transition-all ${activeTab === 'music' ? 'border-amber-500 text-amber-500 bg-slate-800/50' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'}`}
            >
              <Music size={16} />
              <span className="text-xs font-bold uppercase tracking-wide">Música</span>
            </button>
            <button
              onClick={() => setActiveTab('ambience')}
              className={`flex-1 py-3 flex justify-center items-center gap-2 border-b-2 transition-all ${activeTab === 'ambience' ? 'border-amber-500 text-amber-500 bg-slate-800/50' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'}`}
            >
              <CloudRain size={16} />
              <span className="text-xs font-bold uppercase tracking-wide">Ambientes</span>
            </button>
            <button
              onClick={() => setActiveTab('sfx')}
              className={`flex-1 py-3 flex justify-center items-center gap-2 border-b-2 transition-all ${activeTab === 'sfx' ? 'border-amber-500 text-amber-500 bg-slate-800/50' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'}`}
            >
              <Zap size={16} />
              <span className="text-xs font-bold uppercase tracking-wide">SFX</span>
            </button>
          </nav>

          {/* Vista de Contenido */}
          <main className="flex-1 overflow-y-auto bg-slate-950 p-4 custom-scrollbar">
            {activeTab === 'music' && <MusicView />}
            {activeTab === 'ambience' && <AmbienceView />}
            {activeTab === 'sfx' && <SFXView />}
          </main>

          <UploadModal
            isOpen={isUploadModalOpen}
            onClose={() => setIsUploadModalOpen(false)}
            preselectedType={activeTab}
          />
        </>
      )}
    </div>
  )
}
