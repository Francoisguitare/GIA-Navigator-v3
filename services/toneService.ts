import * as Tone from 'tone';
import type { AnalysisResult, Volumes } from '../types';
import { PlaybackState } from '../types';
import { getNoteInfo } from './musicTheory';
import type { NotePositions } from './musicTheory';

type SetActiveGridIndex = (index: number) => void;
type SetPlaybackState = (state: PlaybackState) => void;
type UpdateNeckCallback = (gridIndex: number) => void;

export class ToneService {
    private bassSynth!: Tone.MonoSynth;
    private chordSynth!: Tone.PolySynth;
    private metronome!: Tone.MembraneSynth;
    private part: Tone.Part | null = null;
    private countdownPart: Tone.Part | null = null;
    private currentLoopEndMeasures: number = 0;

    private setActiveGridIndex: SetActiveGridIndex;
    private setPlaybackState: SetPlaybackState;
    private updateNeckCallback: UpdateNeckCallback;

    constructor(
        setActiveGridIndex: SetActiveGridIndex, 
        setPlaybackState: SetPlaybackState,
        updateNeckCallback: UpdateNeckCallback
    ) {
        this.setActiveGridIndex = setActiveGridIndex;
        this.setPlaybackState = setPlaybackState;
        this.updateNeckCallback = updateNeckCallback;
    }

    async init() {
        // Defer synth creation until the audio context is running.
        this.bassSynth = new Tone.MonoSynth({
            oscillator: { type: 'fatsawtooth' },
            envelope: { attack: 0.01, decay: 0.2, sustain: 0.1, release: 0.5 },
            filterEnvelope: { attack: 0.01, decay: 0.1, sustain: 0.1, release: 0.8, baseFrequency: 200, octaves: 4 }
        }).toDestination();

        this.chordSynth = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: "fatsawtooth", count: 3, spread: 30 },
            envelope: { attack: 0.05, decay: 0.1, sustain: 0.7, release: 0.8 }
        }).toDestination();
        
        this.metronome = new Tone.MembraneSynth({
            pitchDecay: 0.01,
            octaves: 10,
            oscillator: { type: 'square' },
            envelope: { attack: 0.001, decay: 0.1, sustain: 0.01, release: 0.1 }
        }).toDestination();
    }
    
    setTempo(bpm: number) {
        Tone.Transport.bpm.value = bpm;
    }

    setVolume(instrument: keyof Volumes, value: number) {
        if (!this.bassSynth) return; // Not initialized yet
        switch (instrument) {
            case 'bass': this.bassSynth.volume.value = value; break;
            case 'chord': this.chordSynth.volume.value = value; break;
            case 'metro': this.metronome.volume.value = value; break;
        }
    }

    private updateSchedule(chords: string[], analysisResults: AnalysisResult[], notePositions: NotePositions) {
        if (this.part) this.part.dispose();

        const lastChordIndex = chords.map(c => c.trim()).lastIndexOf(chords.filter(c => c.trim()).pop() || '');
        if (lastChordIndex === -1) {
            this.currentLoopEndMeasures = 0;
            return;
        }

        const totalBeatsInProgression = (lastChordIndex + 1) * 2;
        const loopEndMeasures = Math.ceil(totalBeatsInProgression / 4);
        this.currentLoopEndMeasures = loopEndMeasures;
        const totalLoopBeats = loopEndMeasures * 4;
        const events: any[] = [];

        for (let i = 0; i <= lastChordIndex; i++) {
            const chordName = chords[i];
            if (chordName) {
                const beat = i * 2;
                const time = `${Math.floor(beat / 4)}:${beat % 4}:0`;
                const { root: rootNote, index: rootIndex } = getNoteInfo(chordName);

                if (rootNote !== '?') {
                    let nextChangeIndex = -1;
                    for (let j = i + 1; j <= lastChordIndex; j++) {
                        if (chords[j]) { nextChangeIndex = j; break; }
                    }
                    
                    const endTimeBeats = (nextChangeIndex !== -1) ? nextChangeIndex * 2 : totalLoopBeats;
                    const durationBeats = endTimeBeats - beat;
                    
                    if (durationBeats > 0) {
                        const durationNotation = `${Math.floor(durationBeats / 4)}:${durationBeats % 4}:0`;
                        events.push({ time, note: rootNote + '2', duration: durationNotation, type: 'bass' });
                        
                        const analysis = analysisResults.find(r => r.gridIndex === i);
                        if(analysis) {
                            const chordTones = analysis.allTargetOptions.filter(o => o.type === 'fondatrice' && o.interval !== 'b7').map(n => n.note + '4');
                             if (chordTones.length > 0) {
                                events.push({ time, notes: chordTones, duration: durationNotation, type: 'chord' });
                            }
                        }
                    }
                }
            }
        }
        
        const loopEndCells = this.currentLoopEndMeasures * 2;
        for (let i = 0; i < loopEndCells; i++) {
            const beat = i * 2;
            const time = `${Math.floor(beat / 4)}:${beat % 4}:0`;
            events.push({ time, gridIndex: i, type: 'highlight' });
        }

        for (let beat = 0; beat < totalLoopBeats; beat++) {
            const time = `${Math.floor(beat / 4)}:${beat % 4}:0`;
            events.push({ time, note: beat % 4 === 0 ? 'C5' : 'C4', type: 'metro' });
        }

        events.sort((a, b) => Tone.Time(a.time).toSeconds() - Tone.Time(b.time).toSeconds());
        
        if (events.length > 0 && loopEndMeasures > 0) {
            this.part = new Tone.Part((time, value) => {
                if (value.type === 'bass') {
                    this.bassSynth.triggerAttackRelease(value.note, value.duration, time);
                } else if (value.type === 'chord') {
                    this.chordSynth.triggerAttackRelease(value.notes, value.duration, time);
                } else if (value.type === 'metro') {
                    this.metronome.triggerAttackRelease(value.note, '16n', time);
                } else if (value.type === 'highlight') {
                    Tone.Draw.schedule(() => {
                        this.setActiveGridIndex(value.gridIndex);
                        this.updateNeckCallback(value.gridIndex);
                    }, time);
                }
            }, events).start("1m");

            this.part.loop = true;
            this.part.loopEnd = `${loopEndMeasures}m`;
        }
    }
    
    play(chords: string[], analysisResults: AnalysisResult[], notePositions: NotePositions) {
        this.updateSchedule(chords, analysisResults, notePositions);
        if (this.currentLoopEndMeasures === 0) return;

        this.setPlaybackState(PlaybackState.Countdown);

        const countdownEvents = [
            { time: '0:0', count: 4 }, { time: '0:1', count: 3 },
            { time: '0:2', count: 2 }, { time: '0:3', count: 1 }
        ];

        if (this.countdownPart) this.countdownPart.dispose();
        this.countdownPart = new Tone.Part((time, value) => {
            this.metronome.triggerAttackRelease('C5', '8n', time);
        }, countdownEvents).start(0);
        
        this.countdownPart.loop = false;
        
        Tone.Transport.scheduleOnce(() => {
            this.setPlaybackState(PlaybackState.Playing);
        }, '1m'); 

        Tone.Transport.loop = true;
        Tone.Transport.loopStart = '1m';
        Tone.Transport.loopEnd = `${this.currentLoopEndMeasures + 1}m`;

        Tone.Transport.start();
    }
    
    stop() {
        if (this.countdownPart) {
            this.countdownPart.stop(0);
            this.countdownPart.dispose();
            this.countdownPart = null;
        }
        if (this.part) {
            this.part.stop(0);
            this.part.dispose();
            this.part = null;
        }
        
        if(this.bassSynth) {
             this.bassSynth.triggerRelease();
             this.chordSynth.releaseAll();
        }

        Tone.Transport.stop();
        Tone.Transport.cancel(0);
        Tone.Transport.position = 0;
        Tone.Transport.loop = false;
        Tone.Transport.loopStart = 0;
        
        this.setPlaybackState(PlaybackState.Stopped);
        this.setActiveGridIndex(-1);
    }
}