
export const NOTES = {
    sharp: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
    flat:  ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
};

export const MAJOR_SCALE_INTERVALS = [0, 2, 4, 5, 7, 9, 11];
export const MINOR_PENTATONIC_INTERVALS = [0, 3, 5, 7, 10];
export const MAJOR_PENTATONIC_INTERVALS = [0, 2, 4, 7, 9];

export const TOTAL_CELLS = 24;

export const TUNING = ['E', 'A', 'D', 'G', 'B', 'E']; // From low E to high E

export const PRESET_PROGRESSIONS = [
    { name: "Pop/Rock Mineur", chords: ['Am', '', 'G', '', 'D', '', 'E', ''] },
    { name: "Jazz ii-V-I (Majeur)", chords: ['Dm7', '', 'G7', '', 'Cmaj7', ''] },
    { name: "Pop/Rock Majeur", chords: ['C', '', 'G', '', 'Am', '', 'F', ''] },
    { name: "Blues 12 Mesures (en A)", chords: ['A7','','A7','','A7','','A7','','D7','','D7','','A7','','A7','','E7','','D7','','A7','','A7',''] }
];

export const PlaybackState = {
    Stopped: 'Stopped',
    Countdown: 'Countdown',
    Playing: 'Playing',
};