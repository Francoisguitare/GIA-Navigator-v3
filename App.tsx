
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TOTAL_CELLS, PRESET_PROGRESSIONS, PlaybackState } from './constants.js';
import { analyzeProgression as analyze, getPentatonicScaleNotes, getScaleNotes, NotePositions } from './services/musicTheory.js';
import { ToneService } from './services/toneService.js';
import Header from './components/Header.js';
import GamificationHeader from './components/GamificationHeader.js';
import InputGrid from './components/InputGrid.js';
import GuitarNeck from './components/GuitarNeck.js';
import PlayerControls from './components/PlayerControls.js';
import AnalysisSection from './components/AnalysisSection.js';
import InfoModal from './components/InfoModal.js';
import YouTubeBackingTrack from './components/YouTubeBackingTrack.js';
import * as Tone from 'tone';

const XP_PER_ACTION = 10;
const PRACTICE_TIME_GOAL_SECONDS = 15 * 60; // 15 minutes

const App = () => {
    const [chords, setChords] = useState(Array(TOTAL_CELLS).fill(''));
    const [analysisResults, setAnalysisResults] = useState([]);
    const [key, setKey] = useState(null);
    const [scaleNotes, setScaleNotes] = useState([]);
    const [pentatonicNotes, setPentatonicNotes] = useState([]);
    const [playbackState, setPlaybackState] = useState(PlaybackState.Stopped);
    const [tempo, setTempo] = useState(45);
    const [volumes, setVolumes] = useState({ metro: -12, bass: -6, chord: -14 });
    const [modalContent, setModalContent] = useState(null);
    const [activeGridIndex, setActiveGridIndex] = useState(-1);
    const [neckNotes, setNeckNotes] = useState({});
    const [notePositions] = useState(() => new NotePositions());
    
    // YouTube State
    const [activeYoutubeTrack, setActiveYoutubeTrack] = useState(null);
    const [savedYoutubeTracks, setSavedYoutubeTracks] = useState([]);
    
    // Gamification State
    const [level, setLevel] = useState(1);
    const [xp, setXp] = useState(0);
    const [practiceTime, setPracticeTime] = useState(0);
    
    const toneService = useRef(null);
    const practiceTimerRef = useRef(null);
    
    const xpForNextLevel = level * 100;

    const addXp = useCallback((amount) => {
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
                const tracks = JSON.parse(savedTracksJSON);
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
        if (playbackState === PlaybackState.Stopped) {
            const firstSelectedNote = analysisResults.find(r => r.selectedNote)?.selectedNote;
            if (firstSelectedNote) {
                setNeckNotes({ active: [firstSelectedNote] });
            } else {
                setNeckNotes({});
            }
        }
    }, [playbackState, analysisResults]);
    
    const updateNeckForPlayback = useCallback((gridIndex) => {
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

    const handlePlayStop = useCallback(async () => {
        if (!toneService.current) {
            await Tone.start();
            const newToneService = new ToneService(
                setActiveGridIndex,
                setPlaybackState,
                (index) => updateNeckForPlayback(index)
            );
            await newToneService.init();
            toneService.current = newToneService;
            
            // Set initial values after creation
            toneService.current.setTempo(tempo);
            Object.entries(volumes).forEach(([instrument, volume]) => {
                toneService.current?.setVolume(instrument, volume);
            });
        }

        if (playbackState !== PlaybackState.Stopped) {
            toneService.current?.stop();
        } else {
            const firstChord = chords.find(c => c.trim() !== '');
            if (firstChord) {
                addXp(XP_PER_ACTION * 2);
                toneService.current?.play(chords, analysisResults, notePositions);
            }
        }
    }, [playbackState, chords, analysisResults, notePositions, addXp, updateNeckForPlayback, tempo, volumes]);

    const handleTempoChange = useCallback((newTempo) => {
        setTempo(newTempo);
        toneService.current?.setTempo(newTempo);
    }, []);

    const handleVolumeChange = useCallback((instrument, volume) => {
        setVolumes(prev => ({ ...prev, [instrument]: volume }));
        toneService.current?.setVolume(instrument, volume);
    }, []);
    
    const handleChordChange = useCallback((index, value) => {
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
    
    const handleTargetNoteChange = useCallback((analysisIndex, optionIndex) => {
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

    const handleCardSelectionChange = (newSelections) => {
        if (newSelections.length > 0) {
            setNeckNotes({ multi: newSelections });
        } else if (playbackState === PlaybackState.Stopped) {
            const firstSelectedNote = analysisResults.find(r => r.selectedNote)?.selectedNote;
            setNeckNotes(firstSelectedNote ? { active: [firstSelectedNote] } : {});
        }
    };
    
    const handleSaveYouTubeTrack = (newTrack) => {
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

    const handleDeleteYouTubeTrack = (trackId) => {
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