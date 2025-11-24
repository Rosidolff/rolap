import { create } from 'zustand';
import type { Frame, Track, ActiveAmbience, AmbiencePreset, PlaybackMode } from './types';

interface AIContextState {
    campaignId?: string;
    mode: 'vault' | 'session';
    sessionId?: string;
}

interface AppState {
    currentFrame: Frame;
    
    // Volúmenes
    masterVolume: number;
    musicMasterVolume: number;
    ambienceMasterVolume: number;
    sfxMasterVolume: number;

    // Estados de Mute
    isMasterMuted: boolean;
    isMusicMasterMuted: boolean;
    isAmbienceMasterMuted: boolean;
    isSFXMasterMuted: boolean;

    tracks: Track[];
    folderStructure: Record<string, any>;
    presets: AmbiencePreset[];
    playlistOrders: Record<string, string[]>;

    activeMusic: Track | null;
    isPlayingMusic: boolean;
    musicVolume: number;
    musicDuration: number;
    musicCurrentTime: number;
    seekRequest: number | null;
    
    currentPlaylist: Track[];
    playbackMode: PlaybackMode;
    
    activeAmbience: ActiveAmbience[];
    activePresetId: string | null;

    activeSFXIds: string[]; 
    sfxTrigger: { track: Track, triggerId: number } | null;

    aiContext: AIContextState;
    setAiContext: (ctx: AIContextState) => void;

    fetchTracks: () => Promise<void>;
    fetchStructure: () => Promise<void>;
    fetchPresets: () => Promise<void>;
    loadSettings: () => Promise<void>;
    saveSettings: () => void;

    setFrame: (frame: Frame) => void;
    
    // Setters de Volumen
    setMasterVolume: (volume: number) => void;
    setMusicMasterVolume: (volume: number) => void;
    setAmbienceMasterVolume: (volume: number) => void;
    setSFXMasterVolume: (volume: number) => void;

    // Toggles de Mute
    toggleMasterMute: () => void;
    toggleMusicMasterMute: () => void;
    toggleAmbienceMasterMute: () => void;
    toggleSFXMasterMute: () => void;

    playMusic: (track: Track, contextPlaylist?: Track[]) => void;
    pauseMusic: () => void;
    stopMusic: () => void;
    nextTrack: () => void;
    skipTrack: () => void;
    setPlaybackMode: (mode: PlaybackMode) => void;
    reorderPlaylist: (categoryKey: string, newOrder: Track[]) => void;
    moveTrackFile: (track: Track, newCategory: string, newSubcategory: string) => Promise<void>;
    renameTrack: (track: Track, newName: string) => Promise<void>;
    
    deleteTrack: (track: Track) => Promise<void>;
    updateTrackIcon: (track: Track, iconName: string) => Promise<void>;
    
    createCategory: (type: string, name: string, parent?: string) => Promise<void>;
    renameCategory: (type: string, oldName: string, newName: string, parent?: string) => Promise<void>;
    deleteCategory: (type: string, name: string, parent?: string) => Promise<void>;

    setMusicVolume: (volume: number) => void;
    setMusicProgress: (time: number, duration: number) => void;
    requestSeek: (time: number) => void;

    playAmbience: (track: Track, volume?: number) => void;
    stopAmbience: (instanceId: string) => void;
    setAmbienceVolume: (instanceId: string, volume: number) => void;
    toggleAmbienceMute: (instanceId: string) => void;
    reorderActiveAmbience: (newOrder: ActiveAmbience[]) => void;
    
    loadPreset: (preset: AmbiencePreset) => void;
    saveNewPreset: (name: string) => Promise<void>;
    updateCurrentPreset: () => Promise<void>;
    deletePreset: (id: string) => Promise<void>;

    toggleSFX: (track: Track) => void;
    sfxFinished: (trackId: string) => void;
    
    panic: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
    currentFrame: 'Fantasy',
    
    masterVolume: 50,
    musicMasterVolume: 80,
    ambienceMasterVolume: 80,
    sfxMasterVolume: 100,

    isMasterMuted: false,
    isMusicMasterMuted: false,
    isAmbienceMasterMuted: false,
    isSFXMasterMuted: false,

    tracks: [],
    folderStructure: {},
    presets: [],
    playlistOrders: {},

    activeMusic: null,
    isPlayingMusic: false,
    musicVolume: 100,
    musicDuration: 0,
    musicCurrentTime: 0,
    seekRequest: null,
    
    currentPlaylist: [],
    playbackMode: 'sequential',

    activeAmbience: [],
    activePresetId: null,

    activeSFXIds: [],
    sfxTrigger: null,

    aiContext: { mode: 'vault' },
    setAiContext: (ctx) => set({ aiContext: ctx }),

    fetchTracks: async () => {
        try {
            const [tracksRes, ordersRes] = await Promise.all([
                fetch('http://localhost:5000/api/tracks'),
                fetch('http://localhost:5000/api/playlist/orders')
            ]);
            set({ tracks: await tracksRes.json(), playlistOrders: await ordersRes.json() });
            get().fetchStructure();
        } catch (e) { console.error(e); }
    },
    fetchStructure: async () => {
        try {
            const res = await fetch('http://localhost:5000/api/structure');
            set({ folderStructure: await res.json() });
        } catch (e) { console.error(e); }
    },
    fetchPresets: async () => {
        try {
            const res = await fetch('http://localhost:5000/api/presets');
            set({ presets: await res.json() });
        } catch (e) { console.error(e); }
    },
    loadSettings: async () => {
        try {
            const res = await fetch('http://localhost:5000/api/settings');
            const settings = await res.json();
            set({ 
                masterVolume: settings.masterVolume ?? 50, 
                currentFrame: settings.lastFrame ?? 'Fantasy',
                musicMasterVolume: settings.musicMasterVolume ?? 80,
                ambienceMasterVolume: settings.ambienceMasterVolume ?? 80,
                sfxMasterVolume: settings.sfxMasterVolume ?? 100,
            });
        } catch (e) { console.error(e); }
    },
    saveSettings: () => {
        const { masterVolume, currentFrame, musicMasterVolume, ambienceMasterVolume, sfxMasterVolume } = get();
        fetch('http://localhost:5000/api/settings', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ masterVolume, lastFrame: currentFrame, musicMasterVolume, ambienceMasterVolume, sfxMasterVolume })
        }).catch(console.error);
    },

    setFrame: (frame) => { set({ currentFrame: frame }); get().saveSettings(); },
    
    setMasterVolume: (volume) => { set({ masterVolume: volume, isMasterMuted: false }); get().saveSettings(); },
    setMusicMasterVolume: (volume) => { set({ musicMasterVolume: volume, isMusicMasterMuted: false }); get().saveSettings(); },
    setAmbienceMasterVolume: (volume) => { set({ ambienceMasterVolume: volume, isAmbienceMasterMuted: false }); get().saveSettings(); },
    setSFXMasterVolume: (volume) => { set({ sfxMasterVolume: volume, isSFXMasterMuted: false }); get().saveSettings(); },

    toggleMasterMute: () => set(s => ({ isMasterMuted: !s.isMasterMuted })),
    toggleMusicMasterMute: () => set(s => ({ isMusicMasterMuted: !s.isMusicMasterMuted })),
    toggleAmbienceMasterMute: () => set(s => ({ isAmbienceMasterMuted: !s.isAmbienceMasterMuted })),
    toggleSFXMasterMute: () => set(s => ({ isSFXMasterMuted: !s.isSFXMasterMuted })),

    playMusic: (track, contextPlaylist) => {
        let newPlaylist = contextPlaylist || get().currentPlaylist;
        if (!newPlaylist.find(t => t.id === track.id)) newPlaylist = [track];
        set({ activeMusic: track, isPlayingMusic: true, currentPlaylist: newPlaylist });
    },
    pauseMusic: () => set({ isPlayingMusic: false }),
    stopMusic: () => set({ activeMusic: null, isPlayingMusic: false, musicCurrentTime: 0 }),
    
    setPlaybackMode: (mode) => set({ playbackMode: mode }),

    nextTrack: () => {
        const { activeMusic, currentPlaylist, playbackMode } = get();
        if (!activeMusic || currentPlaylist.length === 0) return;
        let nextIndex = 0;
        const currentIndex = currentPlaylist.findIndex(t => t.id === activeMusic.id);
        
        if (currentIndex === -1) {
            nextIndex = 0;
        } else if (playbackMode === 'shuffle') {
            nextIndex = Math.floor(Math.random() * currentPlaylist.length);
            if (currentPlaylist.length > 1 && nextIndex === currentIndex) nextIndex = (nextIndex + 1) % currentPlaylist.length;
        } else {
            nextIndex = (currentIndex + 1) % currentPlaylist.length;
        }
        set({ activeMusic: currentPlaylist[nextIndex], isPlayingMusic: true });
    },

    skipTrack: () => {
        get().nextTrack();
    },

    reorderPlaylist: async (categoryKey, newOrder) => {
        set(state => {
            const newOrders = { ...state.playlistOrders, [categoryKey]: newOrder.map(t => t.id) };
            let updatedPlaylist = state.currentPlaylist;
            const isPlayingFromThisList = state.activeMusic && newOrder.find(t => t.id === state.activeMusic?.id);
            if (isPlayingFromThisList) { updatedPlaylist = newOrder; }
            return { playlistOrders: newOrders, currentPlaylist: updatedPlaylist };
        });
        await fetch('http://localhost:5000/api/playlist/order', {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ key: categoryKey, trackIds: newOrder.map(t => t.id) })
        });
    },

    moveTrackFile: async (track, newCategory, newSubcategory) => {
        const targetFrame = track.type === 'music' ? (track.frame || 'Fantasy') : (track.frame || 'Global');
        try {
            const res = await fetch('http://localhost:5000/api/tracks/move', {
                method: 'POST', headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    trackId: track.id,
                    newFrame: targetFrame,
                    newCategory,
                    newSubcategory,
                    type: track.type
                })
            });
            if (!res.ok) throw new Error('Move failed');
            await get().fetchTracks();
            await get().fetchStructure();
        } catch (e) { console.error(e); }
    },

    renameTrack: async (track, newName) => {
        try {
            const res = await fetch('http://localhost:5000/api/tracks/rename', {
                method: 'POST', headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ trackId: track.id, newName })
            });
            if (!res.ok) throw new Error('Rename failed');
            await get().fetchTracks();
        } catch (e) { console.error(e); }
    },

    deleteTrack: async (track) => {
        try {
            await fetch(`http://localhost:5000/api/tracks?id=${encodeURIComponent(track.id)}`, { method: 'DELETE' });
            const { activeMusic, activeAmbience, activeSFXIds } = get();
            if (activeMusic?.id === track.id) get().stopMusic();
            
            const newAmbience = activeAmbience.filter(a => a.track.id !== track.id);
            if (newAmbience.length !== activeAmbience.length) set({ activeAmbience: newAmbience });

            if (activeSFXIds.includes(track.id)) set({ activeSFXIds: activeSFXIds.filter(id => id !== track.id) });

            await get().fetchTracks();
        } catch (e) { console.error(e); }
    },

    updateTrackIcon: async (track, iconName) => {
        try {
            await fetch('http://localhost:5000/api/tracks/metadata', {
                method: 'PATCH', headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ trackId: track.id, icon: iconName })
            });
            await get().fetchTracks();
        } catch(e) { console.error(e); }
    },

    createCategory: async (type, name, parent) => {
        const { currentFrame } = get();
        await fetch('http://localhost:5000/api/categories', {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ type, name, parent, frame: currentFrame })
        });
        await get().fetchTracks();
        await get().fetchStructure();
    },
    renameCategory: async (type, oldName, newName, parent) => {
        const { currentFrame } = get();
        await fetch('http://localhost:5000/api/categories/rename', {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ type, oldName, newName, parent, frame: currentFrame })
        });
        await get().fetchTracks();
        await get().fetchStructure();
    },
    deleteCategory: async (type, name, parent) => {
        const { currentFrame } = get();
        await fetch(`http://localhost:5000/api/categories?type=${type}&name=${name}&frame=${currentFrame}${parent ? '&parent='+parent : ''}`, {
            method: 'DELETE'
        });
        await get().fetchTracks();
        await get().fetchStructure();
    },

    setMusicVolume: (volume) => set({ musicVolume: volume }),
    setMusicProgress: (time, duration) => set({ musicCurrentTime: time, musicDuration: duration }),
    requestSeek: (time) => set({ seekRequest: time }),

    playAmbience: (track, volume = 50) => {
        const newAmbience: ActiveAmbience = { instanceId: crypto.randomUUID(), track, volume, isMuted: false };
        set(state => ({ activeAmbience: [...state.activeAmbience, newAmbience] }));
    },
    stopAmbience: (id) => set(state => ({ activeAmbience: state.activeAmbience.filter(a => a.instanceId !== id) })),
    setAmbienceVolume: (id, vol) => set(state => ({ activeAmbience: state.activeAmbience.map(a => a.instanceId === id ? { ...a, volume: vol } : a) })),
    toggleAmbienceMute: (id) => set(state => ({ activeAmbience: state.activeAmbience.map(a => a.instanceId === id ? { ...a, isMuted: !a.isMuted } : a) })),
    reorderActiveAmbience: (newOrder) => set({ activeAmbience: newOrder }),
    
    loadPreset: (preset) => {
        set({ activeAmbience: [], activePresetId: preset.id });
        const { tracks } = get();
        preset.tracks.forEach(pTrack => {
            const track = tracks.find(t => t.id === pTrack.trackId);
            if (track) get().playAmbience(track, pTrack.volume);
        });
    },
    saveNewPreset: async (name) => {
        const { activeAmbience, currentFrame } = get();
        const newId = crypto.randomUUID();
        const presetData = {
            id: newId, name, frame: currentFrame,
            tracks: activeAmbience.map(a => ({ trackId: a.track.id, volume: a.volume }))
        };
        await fetch('http://localhost:5000/api/presets', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(presetData) });
        await get().fetchPresets();
        set({ activePresetId: newId });
    },
    updateCurrentPreset: async () => {
        const { activeAmbience, currentFrame, activePresetId, presets } = get();
        if (!activePresetId) return;
        const existing = presets.find(p => p.id === activePresetId);
        if (!existing) return;
        const updated = { ...existing, frame: currentFrame, tracks: activeAmbience.map(a => ({ trackId: a.track.id, volume: a.volume })) };
        await fetch('http://localhost:5000/api/presets', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(updated) });
        await get().fetchPresets();
    },
    deletePreset: async (id) => {
        await fetch(`http://localhost:5000/api/presets/${id}`, { method: 'DELETE' });
        set(state => state.activePresetId === id ? { activePresetId: null } : {});
        get().fetchPresets();
    },

    toggleSFX: (track) => {
        const { activeSFXIds } = get();
        const isPlaying = activeSFXIds.includes(track.id);
        if (isPlaying) set({ activeSFXIds: activeSFXIds.filter(id => id !== track.id) });
        else set({ activeSFXIds: [...activeSFXIds, track.id], sfxTrigger: { track, triggerId: Date.now() } });
    },
    sfxFinished: (trackId) => { set(state => ({ activeSFXIds: state.activeSFXIds.filter(id => id !== trackId) })); },

    panic: () => {
        set({
            activeMusic: null,
            isPlayingMusic: false,
            musicCurrentTime: 0,
            activeAmbience: [],
            activeSFXIds: [],
            sfxTrigger: null 
        });
    }
}));