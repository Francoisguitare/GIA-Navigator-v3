
import React from 'react';
import { TOTAL_CELLS } from '../constants';

interface InputGridProps {
    chords: string[];
    onChordChange: (index: number, value: string) => void;
    onClear: () => void;
    onRandom: () => void;
    activeGridIndex: number;
}

const InputGrid: React.FC<InputGridProps> = ({ chords, onChordChange, onClear, onRandom, activeGridIndex }) => {
    return (
        <>
            <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-bold text-white">1. Entrez votre grille (1 case = 2 temps)</h2>
                <div className="flex gap-2">
                    <button onClick={onRandom} title="Générer une grille aléatoire" className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 font-semibold py-1 px-3 rounded-lg transition">🎲 Aléatoire</button>
                    <button onClick={onClear} title="Vider la grille" className="text-xs bg-red-800/50 hover:bg-red-700 text-white font-semibold py-1 px-3 rounded-lg transition">🗑️ Vider</button>
                </div>
            </div>
            <div className="grid grid-cols-8 gap-1 mb-3">
                {Array.from({ length: TOTAL_CELLS }).map((_, i) => (
                    <input
                        key={i}
                        type="text"
                        value={chords[i]}
                        onChange={(e) => onChordChange(i, e.target.value)}
                        className={`input-grid-cell bg-gray-900 border border-gray-600 rounded-lg w-full p-1 text-center text-sm font-bold text-white transition focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 ${activeGridIndex === i ? 'cell-active' : ''}`}
                        aria-label={`Accord ${i + 1}`}
                    />
                ))}
            </div>
        </>
    );
};

export default InputGrid;
