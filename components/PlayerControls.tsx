
import React from 'react';
import { PlaybackState } from '../constants.js';
import { PlayIcon, StopIcon, MetronomeIcon, BassIcon, ChordIcon } from './Icons.js';

const PlayerControls = ({
    playbackState,
    onPlayStop,
    tempo,
    onTempoChange,
    volumes,
    onVolumeChange,
}) => {
    
    const getButtonText = () => {
        switch(playbackState) {
            case PlaybackState.Playing: return 'Stop';
            case PlaybackState.Countdown: return '...';
            case PlaybackState.Stopped: return 'Play';
            default: return 'Play';
        }
    };
    
    return (
        <div className="mt-3 flex flex-col gap-4 p-3 bg-gray-900/50 rounded-lg">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                    id="play-stop-btn"
                    onClick={onPlayStop}
                    disabled={playbackState === PlaybackState.Countdown}
                    className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 disabled:cursor-not-allowed text-white font-bold py-2 px-6 rounded-lg transition duration-300 flex items-center justify-center gap-2"
                >
                    {playbackState !== PlaybackState.Playing ? <PlayIcon /> : <StopIcon />}
                    <span className="w-16 text-left">{getButtonText()}</span>
                </button>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <label htmlFor="tempo-slider" className="font-semibold text-gray-300">Tempo:</label>
                    <input type="range" id="tempo-slider" min="45" max="180" value={tempo} onChange={(e) => onTempoChange(Number(e.target.value))} className="w-full" />
                    <span className="font-bold text-white w-12 text-center">{tempo} bpm</span>
                </div>
            </div>
            <div className="grid grid-cols-3 gap-x-6 gap-y-2 items-center pt-2 border-t border-gray-700/50">
                <div className="flex items-center gap-2 w-full">
                    <MetronomeIcon />
                    <input type="range" title="Métronome" min="-48" max="0" value={volumes.metro} onChange={(e) => onVolumeChange('metro', Number(e.target.value))} className="w-full" />
                </div>
                <div className="flex items-center gap-2 w-full">
                    <BassIcon />
                    <input type="range" title="Basse" min="-48" max="0" value={volumes.bass} onChange={(e) => onVolumeChange('bass', Number(e.target.value))} className="w-full" />
                </div>
                <div className="flex items-center gap-2 w-full">
                    <ChordIcon />
                    <input type="range" title="Nappes" min="-48" max="0" value={volumes.chord} onChange={(e) => onVolumeChange('chord', Number(e.target.value))} className="w-full" />
                </div>
            </div>
        </div>
    );
};

export default PlayerControls;