import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { AnalysisResult, Key, ModalContent, NeckNotesDisplay, NoteSelection, Volumes, SavedTrack } from './types';
import { PlaybackState } from './types';
import { TOTAL_CELLS, PRESET_PROGRESSIONS } from './constants';
import { analyzeProgression as analyze, getPentatonicScaleNotes, getScaleNotes, NotePositions } from './services/musicTheory';
import { ToneService } from './services/toneService';
import Header from './components/Header';
import GamificationHeader from './components/GamificationHeader';
import InputGrid from './components/InputGrid';
import GuitarNeck from './components/GuitarNeck';
import PlayerControls from './components/PlayerControls';
import AnalysisSection from './components/AnalysisSection';
import InfoModal from './components/InfoModal';
import YouTubeBackingTrack from './components/YouTubeBackingTrack';

const XP_PER_ACTION = 10;
const PRACTICE_TIME_GOAL_SECONDS = 15 * 60; // 15 minutes

const App: React.FC = () => {
    const [isInitialized, setIsInitialized] = useState(false);
    const [chords, setChords] = useState<string[]>(Array(TOTAL_CELLS).fill(''));
    const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
    const [key, setKey] = useState<Key | null>(null);
    const [scaleNotes, setScaleNotes] = useState<string[]>([]);
    const [pentatonicNotes, setPentatonicNotes] = useState<string[]>([]);
    const [playbackState, setPlaybackState] = useState<PlaybackState>(PlaybackState.Stopped);
    const [tempo, setTempo] = useState(45);
    const [volumes, setVolumes] = useState<Volumes>({ metro: -12, bass: -6, chord: -14 });
    const [modalContent, setModalContent] = useState<ModalContent | null>(null);
    const [activeGridIndex, setActiveGridIndex] = useState(-1);
    const [neckNotes, setNeckNotes] = useState<NeckNotesDisplay>({});
    const [notePositions] = useState(() => new NotePositions());
    
    // YouTube State
    const [activeYoutubeTrack, setActiveYoutubeTrack] = useState<SavedTrack | null>(null);
    const [savedYoutubeTracks, setSavedYoutubeTracks] = useState<SavedTrack[]>([]);
    
    // Gamification State
    const [level, setLevel] = useState(1);
    const [xp, setXp] = useState(0);
    const [practiceTime, setPracticeTime] = useState(0);
    
    const toneService = useRef<ToneService | null>(null);
    const practiceTimerRef = useRef<number | null>(null);
    
    const xpForNextLevel = level * 100;

    const addXp = useCallback((amount: number) => {
        setXp(currentXp => {
            const neededXp = level * 100;
            const newXp = currentXp + amount;
            if (newXp >= neededXp) {
                setLevel(currentLevel => currentLevel + 1);
                return newXp - neededXp;
            }
            return newXp;
        });
    }, [level]);
    
    useEffect(() => {
        const savedTracksJSON = localStorage.getItem('gia-youtube-tracks');
        if (savedTracksJSON) {
            try {
                const tracks: SavedTrack[] = JSON.parse(savedTracksJSON);
                setSavedYoutubeTracks(tracks);
                if (tracks.length > 0) {
                    setActiveYoutubeTrack(tracks[0]);
                }
            } catch (e) {
                console.error("Failed to parse saved YouTube tracks from localStorage", e);
                localStorage.removeItem('gia-youtube-tracks');
            }
        }
    }, []);

    useEffect(() => {
        if (playbackState === PlaybackState.Playing) {
            practiceTimerRef.current = window.setInterval(() => {
                setPracticeTime(prevTime => {
                    const newTime = prevTime + 1;
                    if (newTime % 10 === 0) {
                        addXp(1);
                    }
                    return newTime;
                });
            }, 1000);
        } else {
            if (practiceTimerRef.current) {
                clearInterval(practiceTimerRef.current);
            }
        }
        return () => {
            if (practiceTimerRef.current) {
                clearInterval(practiceTimerRef.current);
            }
        };
    }, [playbackState, addXp]);

    const updateAnalysis = useCallback(() => {
        const { key: newKey, results } = analyze(chords, notePositions);
        setKey(newKey);
        setAnalysisResults(results);

        if (newKey) {
            setScaleNotes(getScaleNotes(newKey));
            setPentatonicNotes(getPentatonicScaleNotes(newKey, notePositions));
        } else {
            setScaleNotes([]);
            setPentatonicNotes([]);
        }
    }, [chords, notePositions]);

    useEffect(() => {
        updateAnalysis();
    }, [chords, updateAnalysis]);

    useEffect(() => {
        if (!isInitialized) return;
        
        if (playbackState === PlaybackState.Stopped) {
            const firstSelectedNote = analysisResults.find(r => r.selectedNote)?.selectedNote;
            if (firstSelectedNote) {
                setNeckNotes({ active: [firstSelectedNote] });
            } else {
                setNeckNotes({});
            }
        }
    }, [playbackState, analysisResults, isInitialized]);
    
    const initializeAudio = useCallback(() => {
        if (!toneService.current) {
            toneService.current = new ToneService(
                setActiveGridIndex, 
                setPlaybackState,
                (index) => updateNeckForPlayback(index)
            );
            toneService.current.setTempo(tempo);
            Object.entries(volumes).forEach(([instrument, volume]) => {
                toneService.current?.setVolume(instrument as keyof Volumes, volume);
            });
        }
        setIsInitialized(true);
    }, [tempo, volumes]);

    const handlePlayStop = useCallback(async () => {
        if (!isInitialized) {
            initializeAudio();
        }

        await toneService.current?.startContext();

        if (playbackState !== PlaybackState.Stopped) {
            toneService.current?.stop();
        } else {
            const firstChord = chords.find(c => c.trim() !== '');
            if (firstChord) {
                addXp(XP_PER_ACTION * 2);
                toneService.current?.play(chords, analysisResults, notePositions);
            }
        }
    }, [isInitialized, initializeAudio, playbackState, chords, analysisResults, notePositions, addXp]);

    const handleTempoChange = useCallback((newTempo: number) => {
        setTempo(newTempo);
        toneService.current?.setTempo(newTempo);
    }, []);

    const handleVolumeChange = useCallback((instrument: keyof Volumes, volume: number) => {
        setVolumes(prev => ({ ...prev, [instrument]: volume }));
        toneService.current?.setVolume(instrument, volume);
    }, []);
    
    const updateNeckForPlayback = useCallback((gridIndex: number) => {
        let currentAnalysis = null;
        for (let i = gridIndex; i >= 0; i--) {
            const analysis = analysisResults.find(a => a.gridIndex === i);
            if (analysis) {
                currentAnalysis = analysis;
                break;
            }
        }

        if (!currentAnalysis) {
            setNeckNotes({});
            return;
        }

        const nextAnalysis = analysisResults.find(a => a.analysisIndex === currentAnalysis.analysisIndex + 1) || analysisResults[0];

        setNeckNotes({
            active: currentAnalysis.selectedNote ? [currentAnalysis.selectedNote] : [],
            preview: nextAnalysis?.selectedNote ? [nextAnalysis.selectedNote] : []
        });
    }, [analysisResults]);

    const handleChordChange = useCallback((index: number, value: string) => {
        const newChords = [...chords];
        if (newChords[index] !== value) {
            addXp(XP_PER_ACTION);
        }
        newChords[index] = value;
        setChords(newChords);
    }, [chords, addXp]);

    const handleClearGrid = useCallback(() => {
        setChords(Array(TOTAL_CELLS).fill(''));
    }, []);

    const handleRandomGrid = useCallback(() => {
        addXp(XP_PER_ACTION);
        const randomProg = PRESET_PROGRESSIONS[Math.floor(Math.random() * PRESET_PROGRESSIONS.length)];
        const newChords = Array(TOTAL_CELLS).fill('');
        randomProg.chords.forEach((chord, i) => {
            if (i < newChords.length) {
                newChords[i] = chord;
            }
        });
        setChords(newChords);
    }, [addXp]);
    
    const handleTargetNoteChange = useCallback((analysisIndex: number, optionIndex: number) => {
        const currentResult = analysisResults.find(res => res.analysisIndex === analysisIndex);
        if (currentResult?.selectedNote !== currentResult?.allTargetOptions[optionIndex]) {
            addXp(XP_PER_ACTION);
        }
        
        const newResults = analysisResults.map(res => {
            if (res.analysisIndex === analysisIndex) {
                return { ...res, selectedNote: res.allTargetOptions[optionIndex] };
            }
            return res;
        });
        setAnalysisResults(newResults);
    }, [analysisResults, addXp]);

    const handleCardSelectionChange = (newSelections: NoteSelection[]) => {
        if (newSelections.length > 0) {
            setNeckNotes({ multi: newSelections });
        } else if (playbackState === PlaybackState.Stopped) {
            const firstSelectedNote = analysisResults.find(r => r.selectedNote)?.selectedNote;
            setNeckNotes(firstSelectedNote ? { active: [firstSelectedNote] } : {});
        }
    };
    
    const handleSaveYouTubeTrack = (newTrack: SavedTrack) => {
        setSavedYoutubeTracks(currentTracks => {
            if (currentTracks.some(track => track.id === newTrack.id)) {
                return currentTracks;
            }
            const updatedTracks = [...currentTracks, newTrack];
            localStorage.setItem('gia-youtube-tracks', JSON.stringify(updatedTracks));
            return updatedTracks;
        });
        setActiveYoutubeTrack(newTrack);
    };

    const handleDeleteYouTubeTrack = (trackId: string) => {
        setSavedYoutubeTracks(currentTracks => {
            const updatedTracks = currentTracks.filter(track => track.id !== trackId);
            localStorage.setItem('gia-youtube-tracks', JSON.stringify(updatedTracks));
            if (activeYoutubeTrack?.id === trackId) {
                setActiveYoutubeTrack(updatedTracks.length > 0 ? updatedTracks[0] : null);
            }
            return updatedTracks;
        });
    };

    return (
        <div className="min-h-screen flex flex-col items-center">
            <div className="w-full max-w-7xl mx-auto relative">
                <Header />
                 <GamificationHeader
                    level={level}
                    xp={xp}
                    xpForNextLevel={xpForNextLevel}
                    practiceTime={practiceTime}
                    practiceTimeGoal={PRACTICE_TIME_GOAL_SECONDS}
                />
                <div className="mb-2 p-3 bg-gray-800/50 rounded-xl border border-gray-700">
                    <YouTubeBackingTrack
                        activeTrack={activeYoutubeTrack}
                        savedTracks={savedYoutubeTracks}
                        onSaveTrack={handleSaveYouTubeTrack}
                        onSelectTrack={setActiveYoutubeTrack}
                        onDeleteTrack={handleDeleteYouTubeTrack}
                    />
                    <InputGrid
                        chords={chords}
                        onChordChange={handleChordChange}
                        onClear={handleClearGrid}
                        onRandom={handleRandomGrid}
                        activeGridIndex={activeGridIndex}
                    />
                    <GuitarNeck 
                        pentatonicNotes={pentatonicNotes}
                        displayNotes={neckNotes}
                        notePositions={notePositions}
                    />
                    <PlayerControls
                        playbackState={playbackState}
                        onPlayStop={handlePlayStop}
                        tempo={tempo}
                        onTempoChange={handleTempoChange}
                        volumes={volumes}
                        onVolumeChange={handleVolumeChange}
                    />
                </div>

                <AnalysisSection
                    keySignature={key}
                    scaleNotes={scaleNotes}
                    analysisResults={analysisResults}
                    setModalContent={setModalContent}
                    onTargetNoteChange={handleTargetNoteChange}
                    onCardSelectionChange={handleCardSelectionChange}
                    isPlaybackActive={playbackState !== PlaybackState.Stopped}
                />

                <footer className="text-center mt-4 text-gray-500 text-sm">
                    <p>Développé pour la Guitare Impro Académie par François.</p>
                </footer>
            </div>
            <InfoModal modalContent={modalContent} setModalContent={setModalContent} />
        </div>
    );
};

export default App;
