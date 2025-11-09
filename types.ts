
export interface NoteInfo {
    root: string;
    index: number;
}

export interface Key {
    name: string;
    root: string;
    type: 'major' | 'minor';
    keySignatureType: 'sharp' | 'flat';
}

export interface TargetNoteOption {
    note: string;
    interval: string;
    type: 'fondatrice' | 'expressive';
    intention: string;
    description?: string;
}

export type FrontGIA = 'RÉSOLUTION' | 'TENSION' | 'OUT_OF_KEY';

export interface AnalysisResult {
    accord: string;
    degre: string;
    front: FrontGIA;
    actionRythmique: string;
    allTargetOptions: TargetNoteOption[];
    gridIndex: number;
    analysisIndex: number;
    selectedNote?: TargetNoteOption;
}

export interface ModalContent {
    title: string;
    body: string;
}

export enum PlaybackState {
    Stopped = 'Stopped',
    Countdown = 'Countdown',
    Playing = 'Playing',
}

export interface Volumes {
    metro: number;
    bass: number;
    chord: number;
}

export interface NoteSelection {
    noteItem: TargetNoteOption;
    chordNumber: number;
    color: string;
}

export interface NeckNotesDisplay {
    active?: TargetNoteOption[];
    preview?: TargetNoteOption[];
    multi?: NoteSelection[];
}

export interface SavedTrack {
  id: string;
  url: string;
  title: string;
}
