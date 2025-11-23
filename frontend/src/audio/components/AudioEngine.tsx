import { useEffect, useRef } from 'react';
import { Howl } from 'howler';
import { useAppStore } from '../store';

export const AudioEngine = () => {
    const {
        activeMusic,
        isPlayingMusic,
        masterVolume,
        activeAmbience,
        seekRequest,
        setMusicProgress,
        requestSeek,
        activeSFXIds,
        sfxTrigger,
        sfxFinished,
        playbackMode,
        nextTrack
    } = useAppStore();

    // Refs to hold Howl instances
    const musicHowlRef = useRef<Howl | null>(null);
    const ambienceHowlsRef = useRef<Map<string, Howl>>(new Map());
    const sfxHowlsRef = useRef<Map<string, Howl>>(new Map());
    const rafRef = useRef<number | null>(null);

    const masterVolFactor = masterVolume / 100;

    // --- Music Logic ---
    useEffect(() => {
        // If there's no active music, stop current and return
        if (!activeMusic) {
            if (musicHowlRef.current) {
                musicHowlRef.current.fade(musicHowlRef.current.volume(), 0, 1000);
                setTimeout(() => {
                    musicHowlRef.current?.stop();
                    musicHowlRef.current = null;
                }, 1000);
            }
            return;
        }

        // If same track is already loaded, just handle play/pause
        if (musicHowlRef.current && (musicHowlRef.current as any)._src.includes(activeMusic.url)) {
            if (isPlayingMusic) {
                if (!musicHowlRef.current.playing()) {
                    musicHowlRef.current.play();
                    musicHowlRef.current.fade(0, masterVolFactor, 1000);
                }
            } else {
                musicHowlRef.current.pause();
            }
            // Actualizar loop si cambia el modo
            musicHowlRef.current.loop(playbackMode === 'loop');
            return;
        }

        // New track selected: Fade out old, load new
        if (musicHowlRef.current) {
            const oldHowl = musicHowlRef.current;
            oldHowl.fade(oldHowl.volume(), 0, 1000);
            setTimeout(() => oldHowl.stop(), 1000);
        }

        if (isPlayingMusic) {
            const newHowl = new Howl({
                src: [activeMusic.url],
                html5: true, // Force HTML5 Audio for large files
                loop: playbackMode === 'loop',
                volume: 0, // Start at 0 for fade in
                onloaderror: (_id, err) => console.error('Music Load Error:', err),
                onplayerror: (_id, err) => console.error('Music Play Error:', err),
                onend: () => {
                    // Si no estamos en bucle, pasamos a la siguiente
                    if (playbackMode !== 'loop') {
                        nextTrack();
                    }
                }
            });

            musicHowlRef.current = newHowl;
            newHowl.play();
            newHowl.fade(0, masterVolFactor, 2000);
        }

    }, [activeMusic, isPlayingMusic, playbackMode]); // playbackMode incluido para actualizar loop state

    // Actualizar estado de loop dinámicamente
    useEffect(() => {
        if (musicHowlRef.current) {
            musicHowlRef.current.loop(playbackMode === 'loop');
        }
    }, [playbackMode]);

    // Update Music Volume when Master Volume changes
    useEffect(() => {
        if (musicHowlRef.current) {
            musicHowlRef.current.volume(masterVolFactor);
        }
    }, [masterVolume]);

    // Handle Seeking
    useEffect(() => {
        if (seekRequest !== null && musicHowlRef.current) {
            musicHowlRef.current.seek(seekRequest);
            requestSeek(null as any); 
        }
    }, [seekRequest, requestSeek]);

    // Progress Tracking
    useEffect(() => {
        const updateProgress = () => {
            if (musicHowlRef.current && musicHowlRef.current.playing()) {
                const seek = musicHowlRef.current.seek();
                const duration = musicHowlRef.current.duration();
                if (typeof seek === 'number') {
                    setMusicProgress(seek, duration);
                }
            }
            rafRef.current = requestAnimationFrame(updateProgress);
        };

        if (isPlayingMusic) {
            rafRef.current = requestAnimationFrame(updateProgress);
        } else {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        }

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [isPlayingMusic, setMusicProgress]);


    // --- Ambience Logic ---
    useEffect(() => {
        const currentIds = new Set(activeAmbience.map(a => a.instanceId));

        ambienceHowlsRef.current.forEach((howl, id) => {
            if (!currentIds.has(id)) {
                howl.fade(howl.volume(), 0, 1000);
                setTimeout(() => {
                    howl.stop();
                    howl.unload();
                }, 1000);
                ambienceHowlsRef.current.delete(id);
            }
        });

        activeAmbience.forEach(amb => {
            let howl = ambienceHowlsRef.current.get(amb.instanceId);

            if (!howl) {
                howl = new Howl({
                    src: [amb.track.url],
                    html5: true,
                    loop: true,
                    volume: 0,
                });
                ambienceHowlsRef.current.set(amb.instanceId, howl);
                howl.play();
            }

            const targetVol = amb.isMuted ? 0 : (amb.volume / 100) * masterVolFactor;

            if (Math.abs(howl.volume() - targetVol) > 0.01) {
                howl.fade(howl.volume(), targetVol, 300);
            }
        });

    }, [activeAmbience, masterVolume]);

    // --- SFX Logic ---
    
    // Trigger
    useEffect(() => {
        if (sfxTrigger) {
            const { track } = sfxTrigger;
            
            if (sfxHowlsRef.current.has(track.id)) {
                sfxHowlsRef.current.get(track.id)?.stop();
            }

            const sfx = new Howl({
                src: [track.url],
                volume: masterVolFactor,
                onend: () => {
                    sfxFinished(track.id);
                    sfxHowlsRef.current.delete(track.id);
                }
            });
            
            sfxHowlsRef.current.set(track.id, sfx);
            sfx.play();
        }
    }, [sfxTrigger]);

    // Active List Sync
    useEffect(() => {
        sfxHowlsRef.current.forEach((howl, id) => {
            if (!activeSFXIds.includes(id)) {
                howl.stop();
                sfxHowlsRef.current.delete(id);
            } else {
                howl.volume(masterVolFactor);
            }
        });
    }, [activeSFXIds, masterVolume]);

    return null;
};