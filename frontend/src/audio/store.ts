import { create } from 'zustand';
import type { Frame, Track, ActiveAmbience, AmbiencePreset, PlaybackMode } from './types';

interface AppState {
    currentFrame: Frame;
    masterVolume: number;
    tracks: Track[];
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

    fetchTracks: () => Promise<void>;
    fetchPresets: () => Promise<void>;
    loadSettings: () => Promise<void>;
    saveSettings: () => void;

    setFrame: (frame: Frame) => void;
    setMasterVolume: (volume: number) => void;

    playMusic: (track: Track, contextPlaylist?: Track[]) => void;
    pauseMusic: () => void;
    stopMusic: () => void;
    nextTrack: () => void;
    setPlaybackMode: (mode: PlaybackMode) => void;
    reorderPlaylist: (categoryKey: string, newOrder: Track[]) => void;
    moveTrackFile: (track: Track, newCategory: string, newSubcategory: string) => Promise<void>;
    renameTrack: (track: Track, newName: string) => Promise<void>;
    
    setMusicVolume: (volume: number) => void;
    setMusicProgress: (time: number, duration: number) => void;
    requestSeek: (time: number) => void;

    playAmbience: (track: Track, volume?: number) => void;
    stopAmbience: (instanceId: string) => void;
    setAmbienceVolume: (instanceId: string, volume: number) => void;
    toggleAmbienceMute: (instanceId: string) => void;
    reorderActiveAmbience: (newOrder: ActiveAmbience[]) => void; // NUEVO
    
    loadPreset: (preset: AmbiencePreset) => void;
    saveNewPreset: (name: string) => Promise<void>;
    updateCurrentPreset: () => Promise<void>;
    deletePreset: (id: string) => Promise<void>;

    toggleSFX: (track: Track) => void;
    sfxFinished: (trackId: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
    currentFrame: 'Fantasy',
    masterVolume: 50,
    tracks: [],
    presets: [],
    playlistOrders: {},

    activeMusic: null,
    isPlayingMusic: false,
    musicVolume: 100,
    musicDuration: 0,
    musicCurrentTime: 0,
    seekRequest: null,
    
    currentPlaylist: [],
    playbackMode: 'sequential', // CORRECCIÓN: Por defecto secuencial

    activeAmbience: [],
    activePresetId: null,

    activeSFXIds: [],
    sfxTrigger: null,

    fetchTracks: async () => {
        try {
            const [tracksRes, ordersRes] = await Promise.all([
                fetch('http://localhost:5000/api/tracks'),
                fetch('http://localhost:5000/api/playlist/orders')
            ]);
            set({ tracks: await tracksRes.json(), playlistOrders: await ordersRes.json() });
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
            set({ masterVolume: settings.masterVolume ?? 50, currentFrame: settings.lastFrame ?? 'Fantasy' });
        } catch (e) { console.error(e); }
    },
    saveSettings: () => {
        const { masterVolume, currentFrame } = get();
        fetch('http://localhost:5000/api/settings', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ masterVolume, lastFrame: currentFrame })
        }).catch(console.error);
    },

    setFrame: (frame) => { set({ currentFrame: frame }); get().saveSettings(); },
    setMasterVolume: (volume) => { set({ masterVolume: volume }); if (Math.random() > 0.8) get().saveSettings(); },

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
        
        // Si no se encuentra la pista actual (ej: tras reordenar drásticamente), empezamos por el principio
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

    reorderPlaylist: async (categoryKey, newOrder) => {
        set(state => {
            const newOrders = { ...state.playlistOrders, [categoryKey]: newOrder.map(t => t.id) };
            
            // Actualización más agresiva de la playlist actual
            // Si la canción que suena está en la nueva lista, actualizamos currentPlaylist inmediatamente
            // para que el orden se respete en el siguiente nextTrack()
            let updatedPlaylist = state.currentPlaylist;
            const isPlayingFromThisList = state.activeMusic && newOrder.find(t => t.id === state.activeMusic?.id);
            
            if (isPlayingFromThisList) {
                updatedPlaylist = newOrder;
            }

            return { playlistOrders: newOrders, currentPlaylist: updatedPlaylist };
        });

        await fetch('http://localhost:5000/api/playlist/order', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ key: categoryKey, trackIds: newOrder.map(t => t.id) })
        });
    },

    moveTrackFile: async (track, newCategory, newSubcategory) => {
        const targetFrame = track.frame || 'Global';
        try {
            const res = await fetch('http://localhost:5000/api/tracks/move', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
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
        } catch (e) { console.error(e); }
    },

    renameTrack: async (track, newName) => {
        try {
            const res = await fetch('http://localhost:5000/api/tracks/rename', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ trackId: track.id, newName })
            });
            if (!res.ok) throw new Error('Rename failed');
            await get().fetchTracks();
        } catch (e) { console.error(e); }
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
    reorderActiveAmbience: (newOrder) => set({ activeAmbience: newOrder }), // Implementación de la acción
    
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
    sfxFinished: (trackId) => { set(state => ({ activeSFXIds: state.activeSFXIds.filter(id => id !== trackId) })); }
}));