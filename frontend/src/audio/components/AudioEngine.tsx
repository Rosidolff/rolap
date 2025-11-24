import { useEffect, useRef } from 'react';
import { Howl } from 'howler';
import { useAppStore } from '../store';

export const AudioEngine = () => {
    const {
        activeMusic, isPlayingMusic, masterVolume, musicMasterVolume, ambienceMasterVolume, sfxMasterVolume,
        isMasterMuted, isMusicMasterMuted, isAmbienceMasterMuted, isSFXMasterMuted,
        activeAmbience, seekRequest, setMusicProgress, requestSeek,
        activeSFXIds, sfxTrigger, sfxFinished, playbackMode, nextTrack
    } = useAppStore();

    const musicHowlRef = useRef<Howl | null>(null);
    const ambienceHowlsRef = useRef<Map<string, Howl>>(new Map());
    const sfxHowlsRef = useRef<Map<string, Howl>>(new Map());
    const rafRef = useRef<number | null>(null);

    // Cálculo de volúmenes efectivos con Mute
    const masterFactor = isMasterMuted ? 0 : Math.min(masterVolume / 100, 1.0);
    const musicFactor = isMusicMasterMuted ? 0 : Math.min((musicMasterVolume / 100) * masterFactor, 1.0);
    const ambienceFactor = isAmbienceMasterMuted ? 0 : Math.min((ambienceMasterVolume / 100) * masterFactor, 1.0);
    const sfxFactor = isSFXMasterMuted ? 0 : Math.min((sfxMasterVolume / 100) * masterFactor, 1.0);

    // --- Music Logic ---
    useEffect(() => {
        if (!activeMusic) {
            if (musicHowlRef.current) {
                musicHowlRef.current.fade(musicHowlRef.current.volume(), 0, 1500);
                setTimeout(() => { musicHowlRef.current?.stop(); musicHowlRef.current = null; }, 1500);
            }
            return;
        }

        if (musicHowlRef.current && (musicHowlRef.current as any)._src.includes(activeMusic.url)) {
            if (isPlayingMusic) {
                if (!musicHowlRef.current.playing()) {
                    musicHowlRef.current.play();
                    musicHowlRef.current.fade(0, musicFactor, 1000);
                }
            } else { musicHowlRef.current.pause(); }
            musicHowlRef.current.loop(playbackMode === 'loop');
            return;
        }

        if (musicHowlRef.current) {
            const oldHowl = musicHowlRef.current;
            oldHowl.fade(oldHowl.volume(), 0, 1500);
            setTimeout(() => oldHowl.stop(), 1500);
        }

        if (isPlayingMusic) {
            const newHowl = new Howl({
                src: [activeMusic.url],
                html5: true,
                loop: playbackMode === 'loop',
                volume: 0,
                onloaderror: (_id, err) => console.error('Music Load Error:', err),
                onplayerror: (_id, err) => console.error('Music Play Error:', err),
                onend: () => { if (playbackMode !== 'loop') nextTrack(); }
            });
            musicHowlRef.current = newHowl;
            newHowl.play();
            newHowl.fade(0, musicFactor, 2000);
        }
    }, [activeMusic, isPlayingMusic, playbackMode]);

    // Loop update
    useEffect(() => { if (musicHowlRef.current) musicHowlRef.current.loop(playbackMode === 'loop'); }, [playbackMode]);

    // Volume Update (Directo para evitar acople)
    useEffect(() => { if (musicHowlRef.current) musicHowlRef.current.volume(musicFactor); }, [musicFactor]);

    // Seeking
    useEffect(() => { if (seekRequest !== null && musicHowlRef.current) { musicHowlRef.current.seek(seekRequest); requestSeek(null as any); } }, [seekRequest, requestSeek]);

    // Progress
    useEffect(() => {
        const updateProgress = () => {
            if (musicHowlRef.current && musicHowlRef.current.playing()) {
                const seek = musicHowlRef.current.seek();
                const duration = musicHowlRef.current.duration();
                if (typeof seek === 'number') setMusicProgress(seek, duration);
            }
            rafRef.current = requestAnimationFrame(updateProgress);
        };
        if (isPlayingMusic) rafRef.current = requestAnimationFrame(updateProgress);
        else if (rafRef.current) cancelAnimationFrame(rafRef.current);
        return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    }, [isPlayingMusic, setMusicProgress]);

    // --- Ambience Logic ---
    useEffect(() => {
        const currentIds = new Set(activeAmbience.map(a => a.instanceId));
        ambienceHowlsRef.current.forEach((howl, id) => {
            if (!currentIds.has(id)) {
                howl.fade(howl.volume(), 0, 1000);
                setTimeout(() => { howl.stop(); howl.unload(); }, 1000);
                ambienceHowlsRef.current.delete(id);
            }
        });

        activeAmbience.forEach(amb => {
            let howl = ambienceHowlsRef.current.get(amb.instanceId);
            if (!howl) {
                howl = new Howl({ src: [amb.track.url], html5: true, loop: true, volume: 0 });
                ambienceHowlsRef.current.set(amb.instanceId, howl);
                howl.play();
                const initialVol = amb.isMuted ? 0 : (amb.volume / 100) * ambienceFactor;
                howl.fade(0, initialVol, 1000);
            } else {
                const targetVol = amb.isMuted ? 0 : (amb.volume / 100) * ambienceFactor;
                howl.volume(targetVol);
            }
        });
    }, [activeAmbience, ambienceFactor]);

    // --- SFX Logic ---
    useEffect(() => {
        if (sfxTrigger) {
            const { track } = sfxTrigger;
            if (sfxHowlsRef.current.has(track.id)) sfxHowlsRef.current.get(track.id)?.stop();
            const sfx = new Howl({
                src: [track.url],
                volume: sfxFactor,
                onend: () => { sfxFinished(track.id); sfxHowlsRef.current.delete(track.id); }
            });
            sfxHowlsRef.current.set(track.id, sfx);
            sfx.play();
        }
    }, [sfxTrigger]);

    useEffect(() => {
        sfxHowlsRef.current.forEach((howl, id) => {
            if (!activeSFXIds.includes(id)) { howl.stop(); sfxHowlsRef.current.delete(id); } 
            else { howl.volume(sfxFactor); }
        });
    }, [activeSFXIds, sfxFactor]);

    return null;
};