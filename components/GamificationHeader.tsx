
import React from 'react';
import { LevelIcon, TimeIcon } from './Icons.js';

const ProgressBar = ({ value, max, colorClass }) => (
    <div className="w-full bg-gray-700 rounded-full h-2.5">
        <div 
            className={`${colorClass} h-2.5 rounded-full transition-all duration-500`} 
            style={{ width: `${Math.min(100, (value / max) * 100)}%` }}
        ></div>
    </div>
);

const GamificationHeader = ({ level, xp, xpForNextLevel, practiceTime, practiceTimeGoal }) => {

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    };

    return (
        <div className="mb-2 p-3 bg-gray-800/50 rounded-xl border border-gray-700 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Level Gauge */}
            <div className="flex items-center gap-3">
                <LevelIcon />
                <div className="w-full">
                    <div className="flex justify-between items-center mb-1 text-sm">
                        <span className="font-bold text-white">Niveau {level}</span>
                        <span className="font-semibold text-gray-400">{xp} / {xpForNextLevel} XP</span>
                    </div>
                    <ProgressBar value={xp} max={xpForNextLevel} colorClass="bg-violet-500" />
                </div>
            </div>

            {/* Time Gauge */}
            <div className="flex items-center gap-3">
                <TimeIcon />
                <div className="w-full">
                     <div className="flex justify-between items-center mb-1 text-sm">
                        <span className="font-bold text-white">Temps de pratique</span>
                        <span className="font-semibold text-gray-400">{formatTime(practiceTime)}</span>
                    </div>
                    <ProgressBar value={practiceTime} max={practiceTimeGoal} colorClass="bg-green-500" />
                </div>
            </div>
        </div>
    );
};

export default GamificationHeader;