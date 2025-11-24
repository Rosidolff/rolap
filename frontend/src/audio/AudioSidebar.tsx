import { useState, useEffect } from 'react'
import { Music, CloudRain, Zap, Plus, AlertTriangle, Play, Pause, ChevronRight, ChevronLeft, SkipForward, Settings2, List, Repeat, ArrowRight, Shuffle, Volume2, VolumeX } from 'lucide-react'
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
  const [showMixer, setShowMixer] = useState(false);
  
  const {
    currentFrame, setFrame, activeMusic, isPlayingMusic, pauseMusic, playMusic,
    fetchTracks, fetchPresets, loadSettings, musicCurrentTime, musicDuration, requestSeek,
    masterVolume, setMasterVolume, musicMasterVolume, setMusicMasterVolume,
    ambienceMasterVolume, setAmbienceMasterVolume, sfxMasterVolume, setSFXMasterVolume,
    isMasterMuted, toggleMasterMute, isMusicMasterMuted, toggleMusicMasterMute,
    isAmbienceMasterMuted, toggleAmbienceMasterMute, isSFXMasterMuted, toggleSFXMasterMute,
    panic, skipTrack, playbackMode, setPlaybackMode
  } = useAppStore()

  useEffect(() => { fetchTracks(); fetchPresets(); loadSettings(); }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={clsx(
      "flex flex-col bg-[#020202] text-zinc-300 border-r border-white/5 transition-all duration-300 ease-in-out h-screen relative shrink-0 shadow-xl z-50 font-sans text-[11px]",
      isOpen ? "w-[300px]" : "w-12"
    )}>
      <AudioEngine />
      
      <button onClick={() => setIsOpen(!isOpen)} className="absolute top-1/2 -right-3 z-50 bg-[#0a0a0a] border border-white/10 rounded-full p-1 text-zinc-500 hover:text-white shadow-xl cursor-pointer hover:border-amber-500/30 hover:scale-110 transition-all">
        {isOpen ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
      </button>

      {!isOpen && (
         <div className="flex flex-col items-center mt-4 gap-4 h-full">
            <button onClick={() => setIsOpen(true)} className="p-2 hover:bg-white/5 rounded text-zinc-400 hover:text-white" title="Expandir"><List size={16} /></button>
            {activeMusic && isPlayingMusic && <div className="w-1 h-1 bg-amber-500 rounded-full animate-pulse"></div>}
         </div>
      )}

      {isOpen && (
        <>
          {/* Header */}
          <div className="px-3 py-2 border-b border-white/5 bg-[#050505] flex flex-col gap-2">
             <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <select value={currentFrame} onChange={(e) => setFrame(e.target.value as Frame)} className="w-full bg-[#0f0f0f] border border-white/5 rounded py-1 pl-2 pr-6 text-[10px] font-bold text-zinc-300 focus:outline-none appearance-none cursor-pointer hover:bg-[#141414] uppercase tracking-wide">
                        <option value="Fantasy">Fantasy</option>
                        <option value="Futurista">Sci-Fi</option>
                        <option value="Grim Dark">Grim Dark</option>
                    </select>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none"><ChevronRight size={10} className="rotate-90" /></div>
                </div>
                <button onClick={() => setShowMixer(!showMixer)} className={`p-1 rounded hover:bg-white/10 ${showMixer ? 'text-white' : 'text-zinc-500'}`} title="Mezclador"><Settings2 size={12} /></button>
                <button onClick={() => setIsUploadModalOpen(true)} className="p-1 text-amber-600 hover:text-amber-400 hover:bg-white/5 rounded" title="Subir"><Plus size={12} /></button>
                <button onClick={panic} className="p-1 text-red-700 hover:text-red-500 hover:bg-red-900/10 rounded" title="Pánico"><AlertTriangle size={12} /></button>
            </div>

            {/* Mixer */}
            <div className={`overflow-hidden transition-all duration-200 ${showMixer ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="bg-[#0a0a0a] rounded p-2 border border-white/5 space-y-1.5 mb-1">
                    <div className="flex items-center gap-2">
                        <button onClick={toggleMasterMute} className={`w-4 ${isMasterMuted ? 'text-red-500' : 'text-zinc-600 hover:text-white'}`}>{isMasterMuted ? <VolumeX size={10} /> : <Volume2 size={10} />}</button>
                        <span className="w-3 text-[9px] font-bold text-zinc-500">M</span>
                        <input type="range" className="flex-1 h-0.5 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-white" value={masterVolume} onChange={e => setMasterVolume(Number(e.target.value))} disabled={isMasterMuted} />
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={toggleMusicMasterMute} className={`w-4 ${isMusicMasterMuted ? 'text-red-500' : 'text-amber-800 hover:text-amber-500'}`}>{isMusicMasterMuted ? <VolumeX size={10} /> : <Music size={10} />}</button>
                        <input type="range" className="flex-1 h-0.5 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-amber-600" value={musicMasterVolume} onChange={e => setMusicMasterVolume(Number(e.target.value))} disabled={isMusicMasterMuted} />
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={toggleAmbienceMasterMute} className={`w-4 ${isAmbienceMasterMuted ? 'text-red-500' : 'text-cyan-800 hover:text-cyan-500'}`}>{isAmbienceMasterMuted ? <VolumeX size={10} /> : <CloudRain size={10} />}</button>
                        <input type="range" className="flex-1 h-0.5 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-cyan-600" value={ambienceMasterVolume} onChange={e => setAmbienceMasterVolume(Number(e.target.value))} disabled={isAmbienceMasterMuted} />
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={toggleSFXMasterMute} className={`w-4 ${isSFXMasterMuted ? 'text-red-500' : 'text-purple-800 hover:text-purple-500'}`}>{isSFXMasterMuted ? <VolumeX size={10} /> : <Zap size={10} />}</button>
                        <input type="range" className="flex-1 h-0.5 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-purple-600" value={sfxMasterVolume} onChange={e => setSFXMasterVolume(Number(e.target.value))} disabled={isSFXMasterMuted} />
                    </div>
                </div>
            </div>
          </div>

          {/* Now Playing */}
          {activeMusic && (
            <div className="bg-[#080808] border-b border-white/5 flex flex-col group">
                <div className="px-3 py-2 flex items-center gap-2">
                    <button onClick={() => isPlayingMusic ? pauseMusic() : playMusic(activeMusic)} className="text-zinc-400 hover:text-white transition-colors shrink-0">
                        {isPlayingMusic ? <Pause size={14} fill="currentColor"/> : <Play size={14} fill="currentColor"/>}
                    </button>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <div className="flex justify-between items-baseline mb-1">
                            <span className="text-[10px] font-bold text-zinc-200 truncate max-w-[160px]">{activeMusic.name}</span>
                            <span className="text-[9px] font-mono text-zinc-600 ml-2 shrink-0">{formatTime(musicCurrentTime)}</span>
                        </div>
                        
                        {/* Hit area grande invisible para facilidad de uso */}
                        <div className="group/seeker relative h-3 flex items-center cursor-pointer w-full -my-1">
                            <div className="w-full h-0.5 bg-zinc-800 rounded-full overflow-hidden group-hover/seeker:h-1 transition-all duration-200 pointer-events-none">
                                <div className="h-full bg-amber-600" style={{ width: `${(musicCurrentTime / (musicDuration || 1)) * 100}%` }}></div>
                            </div>
                            <input type="range" min="0" max={musicDuration || 100} value={musicCurrentTime} onChange={(e) => requestSeek(Number(e.target.value))} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                        </div>
                    </div>
                    <button onClick={skipTrack} className="text-zinc-600 hover:text-white transition-colors shrink-0 ml-1" title="Skip"><SkipForward size={12} /></button>
                </div>

                {/* Controls Fixed */}
                <div className="flex items-center justify-between px-8 py-1 bg-[#050505] border-t border-white/[0.03]">
                    <button onClick={() => setPlaybackMode('loop')} className={`p-1 rounded transition-colors ${playbackMode === 'loop' ? 'text-amber-500' : 'text-zinc-700 hover:text-zinc-400'}`} title="Bucle"><Repeat size={10} /></button>
                    <button onClick={() => setPlaybackMode('sequential')} className={`p-1 rounded transition-colors ${playbackMode === 'sequential' ? 'text-cyan-500' : 'text-zinc-700 hover:text-zinc-400'}`} title="Secuencial"><ArrowRight size={10} /></button>
                    <button onClick={() => setPlaybackMode('shuffle')} className={`p-1 rounded transition-colors ${playbackMode === 'shuffle' ? 'text-purple-500' : 'text-zinc-700 hover:text-zinc-400'}`} title="Aleatorio"><Shuffle size={10} /></button>
                </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex border-b border-white/5 bg-[#050505]">
            {['music', 'ambience', 'sfx'].map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 py-1.5 flex justify-center items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider transition-colors ${activeTab === tab ? 'text-white bg-white/5' : 'text-zinc-600 hover:text-zinc-400'}`}>
                    {tab === 'music' && <Music size={10} className={activeTab===tab?'text-amber-500':''} />}
                    {tab === 'ambience' && <CloudRain size={10} className={activeTab===tab?'text-cyan-500':''} />}
                    {tab === 'sfx' && <Zap size={10} className={activeTab===tab?'text-purple-500':''} />}
                    {tab}
                </button>
            ))}
          </div>

          {/* Content */}
          <main className="flex-1 overflow-y-auto bg-[#020202] p-2 custom-scrollbar scroll-smooth">
            {activeTab === 'music' && <MusicView />}
            {activeTab === 'ambience' && <AmbienceView />}
            {activeTab === 'sfx' && <SFXView />}
          </main>

          <UploadModal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} preselectedType={activeTab} />
        </>
      )}
    </div>
  )
}