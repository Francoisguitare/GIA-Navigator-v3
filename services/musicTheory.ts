
import { NOTES, MAJOR_SCALE_INTERVALS, MAJOR_PENTATONIC_INTERVALS, MINOR_PENTATONIC_INTERVALS, TUNING } from '../constants.js';

export class NotePositions {
    positions = {};

    constructor() {
        this.calculateNotePositions();
    }

    calculateNotePositions() {
        NOTES.sharp.forEach(note => this.positions[note] = []);
        NOTES.flat.forEach(note => this.positions[note] = []);

        for (let stringIndex = 0; stringIndex < 6; stringIndex++) {
            const openStringNote = TUNING[5 - stringIndex];
            let currentNoteIndex = getNoteInfo(openStringNote).index;
            for (let fret = 0; fret <= 17; fret++) {
                const noteNameSharp = NOTES.sharp[currentNoteIndex % 12];
                const noteNameFlat = NOTES.flat[currentNoteIndex % 12];
                
                if (!this.positions[noteNameSharp]) this.positions[noteNameSharp] = [];
                this.positions[noteNameSharp].push([stringIndex, fret]);
                if (noteNameSharp !== noteNameFlat) {
                     if (!this.positions[noteNameFlat]) this.positions[noteNameFlat] = [];
                     this.positions[noteNameFlat].push([stringIndex, fret]);
                }
                currentNoteIndex++;
            }
        }
    }
    
    get(note) {
        return this.positions[note] || [];
    }
}

export function getNoteInfo(noteName) {
    if (!noteName || typeof noteName !== 'string') return { root: '?', index: -1 };
    
    const match = noteName.match(/^([A-G])([#b]?)/);
    if (!match) return { root: '?', index: -1 };
    
    const root = match[0];
    const sharpIndex = NOTES.sharp.indexOf(root);
    const flatIndex = NOTES.flat.indexOf(root);
    
    if (sharpIndex !== -1) return { root, index: sharpIndex };
    if (flatIndex !== -1) return { root, index: flatIndex };

    const map = { 'A#': 'Bb', 'C#': 'Db', 'D#': 'Eb', 'F#': 'Gb', 'G#': 'Ab' };
    const equivalentFlat = map[root] || root;
    const index = NOTES.flat.indexOf(equivalentFlat);
    return { root, index };
}

function getChordQuality(chordName) {
    if (!chordName) return '';
    if (chordName.includes('maj7') || chordName.includes('M7') || chordName.includes('Δ')) return 'major7';
    if (chordName.includes('m7') || chordName.includes('min7')) return 'minor7';
    if (chordName.includes('°7') || chordName.includes('dim7')) return 'diminished7';
    if (chordName.includes('dim') || chordName.includes('°')) return 'diminished';
    if (chordName.includes('m') && !chordName.includes('maj')) return 'minor';
    if (chordName.includes('7')) return 'dominant7';
    return 'major';
}

function getIntervalNote(rootNote, semitones, key) {
    const rootInfo = getNoteInfo(rootNote);
    if (rootInfo.index === -1) return '?';
    const noteArray = key.keySignatureType === 'flat' ? NOTES.flat : NOTES.sharp;
    const targetIndex = (rootInfo.index + semitones) % 12;
    return noteArray[targetIndex];
}

function findDegree(chordName, key) {
    const chordRootInfo = getNoteInfo(chordName);
    if (chordRootInfo.index === -1) return '?';
    const keyRootIndex = getNoteInfo(key.root).index;
    if (keyRootIndex === -1) return '?';

    const quality = getChordQuality(chordName);
    const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
    const interval = (chordRootInfo.index - keyRootIndex + 12) % 12;
    
    let degree = '?';
    let alteration = '';
    
    const referenceIntervals = MAJOR_SCALE_INTERVALS;

    for (let i = 0; i < referenceIntervals.length; i++) {
        const scaleInterval = referenceIntervals[i];
        if (interval === scaleInterval) { 
            degree = romanNumerals[i]; 
            break; 
        }
        if (interval === scaleInterval - 1) { 
            alteration = 'b'; 
            degree = romanNumerals[i]; 
            break; 
        }
        if (i > 0 && interval === referenceIntervals[i-1] + 1) { 
            if(interval === 3) continue; 
            alteration = '#'; 
            degree = romanNumerals[i-1]; 
            break; 
        }
    }
    
    if (degree === '?') {
         if (interval === 6) { alteration = '#'; degree = 'IV'; }
         else { return '?'; }
    }

    if (quality.includes('minor')) {
        degree = degree.toLowerCase();
    } else if (quality.includes('diminished')) {
        degree = degree.toLowerCase() + '°';
    }

    return alteration + degree;
}

export function getScaleNotes(key) {
    const noteArray = key.keySignatureType === 'flat' ? NOTES.flat : NOTES.sharp;
    const intervals = key.type === 'major' ? MAJOR_SCALE_INTERVALS : [0, 2, 3, 5, 7, 8, 10]; // natural minor
    const rootIndex = getNoteInfo(key.root).index;
    if (rootIndex === -1) return [];
    return intervals.map(i => noteArray[(rootIndex + i) % 12]);
}

export function getPentatonicScaleNotes(key, notePositions) {
    const noteArray = key.keySignatureType === 'flat' ? NOTES.flat : NOTES.sharp;
    const intervals = key.type === 'major' ? MAJOR_PENTATONIC_INTERVALS : MINOR_PENTATONIC_INTERVALS;
    const rootIndex = getNoteInfo(key.root).index;
    if (rootIndex === -1) return [];
    return intervals.map(i => noteArray[(rootIndex + i) % 12]);
}

function getChordTones(chordName, key) {
    const noteInfo = getNoteInfo(chordName);
    const quality = getChordQuality(chordName);
    if(noteInfo.index === -1) return [];
    const root = noteInfo.root;
    
    const thirdInterval = quality.includes('minor') || quality.includes('diminished') ? 3 : 4;
    const fifthInterval = quality.includes('diminished') ? 6 : 7;
    
    const third = getIntervalNote(root, thirdInterval, key);
    const fifth = getIntervalNote(root, fifthInterval, key);
    let tones = [root, third, fifth];

    if (quality.includes('7')) {
        let seventhInterval;
        if(quality === 'major7') seventhInterval = 11;
        else if (quality === 'diminished7') seventhInterval = 9;
        else seventhInterval = 10;
        const seventh = getIntervalNote(root, seventhInterval, key); 
        tones.push(seventh);
    }
    return tones;
}


function checkIfOutOfKey(chordName, key, degree) {
    const scaleNotes = getScaleNotes(key);
    if (!scaleNotes.length) return false;
    const scaleNotesIndices = scaleNotes.map(n => getNoteInfo(n).index);
    const chordTonesNotes = getChordTones(chordName, key);

    for (const tone of chordTonesNotes) {
        const toneIndex = getNoteInfo(tone).index;
        if (!scaleNotesIndices.includes(toneIndex)) {
            if (key.type === 'minor' && degree.toUpperCase().replace(/[#b]/g, '') === 'V') {
                 const harmonicMinorLeadingToneIndex = (getNoteInfo(key.root).index + 11) % 12;
                 if (toneIndex === harmonicMinorLeadingToneIndex) {
                     continue;
                 }
            }
            return true;
        }
    }
    return false;
}

function getExpressivePalette(front, rootNote, key) {
    let palette = [];
    if (front === 'RÉSOLUTION') {
        palette = [
            { note: getIntervalNote(rootNote, 2, key), interval: '9e', intention: 'Lyrisme / Douceur', description: 'Émotion : Doux, apaisant. Action : Idéal pour les phrases longues et mélodiques.' },
            { note: getIntervalNote(rootNote, 9, key), interval: '6M', intention: 'Funk / Optimisme', description: 'Couleur : Éclaircit le son mineur (Dorian). Action : Pour les plans rythmés et dansants.' },
            { note: getIntervalNote(rootNote, 6, key), interval: '#11', intention: 'Rêveur / Flottant', description: 'Effet : Sensation aérienne et mystérieuse (Lydien). Action : À utiliser sur des plans qui montent ou glissent.' }
        ];
    } else { // TENSION or OUT_OF_KEY
         palette = [
            { note: getIntervalNote(rootNote, 1, key), interval: 'b9', intention: 'Tension Ultime', description: 'Émotion : Choc et urgence. Action : À réserver au Climax. Force la résolution.' },
            { note: getIntervalNote(rootNote, 3, key), interval: '#9', intention: 'Action / Hard Rock', description: 'Couleur : Puissante et agressive (Blues/Rock). Action : Pour les plans rythmiques rapides et percussifs.' },
            { note: getIntervalNote(rootNote, 2, key), interval: '9M', intention: 'Couleur Solide / Stable', description: 'HYPERSTRUCTURE SOLIDE. Moins agressif que le Tritone. Donne un son riche et clair.' }
        ];
    }
    return palette.map(p => ({ ...p, type: 'expressive' }));
}


function analyzeSingleChord(chordName, key, nextChordName) {
    const noteInfo = getNoteInfo(chordName);
    const quality = getChordQuality(chordName);
    const degree = findDegree(chordName, key);
    
    const isOutOfKey = checkIfOutOfKey(chordName, key, degree);
    const isPotentiallyDominant = (degree.replace(/[#b]/g, '').toUpperCase() === 'V');
    
    let isConfirmedDominant = false;
    if (isPotentiallyDominant) {
        const currentRootIndex = getNoteInfo(chordName).index;
        const nextRootIndex = getNoteInfo(nextChordName).index;
        if (currentRootIndex !== -1 && nextRootIndex !== -1 && (currentRootIndex - nextRootIndex + 12) % 12 === 7) {
            isConfirmedDominant = true;
        }
    }

    let front;
    if (isConfirmedDominant) {
        front = 'TENSION';
    } else if (isOutOfKey) {
        front = 'OUT_OF_KEY';
    } else {
        front = 'RÉSOLUTION';
    }

    const actionRythmique = front === 'TENSION' || front === 'OUT_OF_KEY' ? 'RAPIDE / AGRESSIF' : 'LENT / LYRIQUE';
    
    let structuralNotes = [];
    structuralNotes.push({ note: noteInfo.root, interval: 'R', type: 'fondatrice', intention: 'Stabilité' });
    
    if (front === 'TENSION') {
        structuralNotes.push({ note: getIntervalNote(noteInfo.root, 4, key), interval: '3M', type:'fondatrice', intention: 'Couleur' });
        structuralNotes.push({ note: getIntervalNote(noteInfo.root, 10, key), interval: 'b7', type:'fondatrice', intention: 'Tension' });
    } else {
        structuralNotes.push({
            note: getIntervalNote(noteInfo.root, quality.includes('minor') ? 3 : 4, key),
            interval: quality.includes('minor') ? '3m' : '3M',
            type: 'fondatrice',
            intention: 'Couleur'
        });
    }

    const expressivePalette = getExpressivePalette(front, noteInfo.root, key);
    const allTargetOptions = [...structuralNotes, ...expressivePalette];

    return { 
        accord: chordName, 
        degre: degree,
        front,
        actionRythmique,
        allTargetOptions,
    };
}

function detectKey(firstChord) {
    const { root } = getNoteInfo(firstChord);
    const quality = getChordQuality(firstChord);
    const flatKeys = ['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb'];
    const flatMinorKeys = ['Dm', 'Gm', 'Cm', 'Fm', 'Bbm', 'Ebm']; 
    
    let keySignatureType = 'sharp';
    if (flatKeys.includes(root) || flatMinorKeys.includes(root+'m') || root.includes('b')) {
        keySignatureType = 'flat';
    }

    if (quality.includes('minor')) {
        return { name: `${root} mineur`, root: root, type: 'minor', keySignatureType };
    }
    return { name: `${root} Majeur`, root: root, type: 'major', keySignatureType };
}


export function analyzeProgression(chords, notePositions) {
    const firstChord = chords.find(c => c.trim());
    if (!firstChord) {
        return { key: null, results: [] };
    }

    const key = detectKey(firstChord);
    const results = [];

    const activeChordsWithIndices = chords
        .map((chord, index) => ({ chord: chord.trim(), index }))
        .filter(item => item.chord !== '');
    
    if (activeChordsWithIndices.length > 0) {
        activeChordsWithIndices.forEach((chordItem, activeIndex) => {
            const nextChordItem = activeChordsWithIndices[activeIndex + 1] || activeChordsWithIndices[0];
            const analysis = analyzeSingleChord(chordItem.chord, key, nextChordItem.chord);
            
            const fundamentalNote = analysis.allTargetOptions.find(opt => opt.interval === 'R');

            results.push({
                ...analysis,
                gridIndex: chordItem.index,
                analysisIndex: activeIndex,
                selectedNote: fundamentalNote
            });
        });
    }

    return { key, results };
}