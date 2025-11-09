
import React, { useState } from 'react';
import { YouTubeIcon, ExternalLinkIcon, XIcon, SmallPlayIcon, EyeOffIcon } from './Icons.js';

const getYoutubeVideoId = (url) => {
    if (!url) return null;
    let videoId = null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
        videoId = match[2];
    }
    return videoId;
};

const YouTubeBackingTrack = ({ activeTrack, savedTracks, onSaveTrack, onSelectTrack, onDeleteTrack }) => {
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isPlayerVisible, setIsPlayerVisible] = useState(false);

    const handleSave = async () => {
        const trimmedUrl = inputValue.trim();
        const videoId = getYoutubeVideoId(trimmedUrl);
        if (!videoId) {
            alert("Veuillez entrer une URL YouTube valide.");
            return;
        }

        setIsLoading(true);
        try {
            // Using a no-cors proxy for oEmbed to get the video title in restricted environments
            const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
            if (!response.ok) throw new Error('Could not fetch video metadata.');
            
            const data = await response.json();
            const newTrack = {
                id: videoId,
                url: trimmedUrl,
                title: data.title || `Vidéo ${videoId}`
            };
            onSaveTrack(newTrack);
            setInputValue('');
        } catch (error) {
            console.error("Error fetching YouTube title:", error);
            // Fallback for when oEmbed fails
             const newTrack = {
                id: videoId,
                url: trimmedUrl,
                title: `Vidéo ${videoId}`
            };
            onSaveTrack(newTrack);
            setInputValue('');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectTrack = (track) => {
        onSelectTrack(track);
        setIsPlayerVisible(false); // Hide player when selecting a new track
    }

    return (
        <div className="pt-2 pb-3 border-y border-gray-700/50 mb-3">
            <div className="flex justify-between items-center mb-2 gap-2 flex-wrap">
                 <h3 className="text-sm font-bold text-gray-300 flex items-center gap-2">
                    <YouTubeIcon />
                    <span>Backing Track Actif: </span>
                    {activeTrack ? 
                        <span className="text-red-400 font-normal truncate max-w-[200px] sm:max-w-xs" title={activeTrack.title}>{activeTrack.title}</span> 
                        : <span className="text-gray-500 font-normal">Aucun</span>
                    }
                </h3>
                {activeTrack && !isPlayerVisible && (
                     <button
                        onClick={() => setIsPlayerVisible(true)}
                        className="flex items-center justify-center gap-2 text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 font-semibold py-2 px-3 rounded-lg transition"
                        title="Lancer le lecteur"
                    >
                        <SmallPlayIcon />
                       <span>Lancer le Backing Track</span>
                    </button>
                )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 mt-3">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Collez une URL YouTube ici pour l'ajouter à vos favoris..."
                    className="flex-grow bg-gray-900 border border-gray-600 rounded-lg w-full p-2 text-sm text-white transition focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
                />
                <button onClick={handleSave} disabled={isLoading} className="w-full sm:w-auto text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 font-semibold py-2 px-4 rounded-lg transition disabled:bg-gray-800 disabled:cursor-not-allowed">
                    {isLoading ? 'Analyse...' : 'Sauvegarder'}
                </button>
            </div>
            
            {savedTracks.length > 0 && (
                <div className="mt-4">
                    <h4 className="text-xs font-bold text-gray-400 tracking-wider uppercase mb-2">Mes Backing Tracks</h4>
                    <div className="flex flex-wrap gap-2">
                        {savedTracks.map(track => (
                            <div key={track.id} className="relative group">
                                <button
                                    onClick={() => handleSelectTrack(track)}
                                    className={`pr-7 pl-3 py-1 text-sm rounded-md transition truncate max-w-xs ${activeTrack?.id === track.id ? 'bg-red-600 text-white font-semibold' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}
                                    title={track.title}
                                >
                                    {track.title}
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onDeleteTrack(track.id); }}
                                    className="absolute top-0 right-0 h-full px-2 flex items-center text-gray-400 hover:text-white opacity-50 group-hover:opacity-100 transition-opacity"
                                    aria-label={`Supprimer ${track.title}`}
                                >
                                    <XIcon />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {isPlayerVisible && activeTrack && (
                <div className="mt-4 p-2 bg-gray-900/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                         <a
                            href={activeTrack.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Ouvrir sur YouTube (garanti de fonctionner)"
                            className="flex items-center justify-center gap-2 text-sm bg-white hover:bg-gray-200 text-black font-bold py-2 px-4 rounded-lg transition"
                        >
                            <ExternalLinkIcon />
                            <span>Ouvrir sur YouTube</span>
                        </a>
                         <button
                            onClick={() => setIsPlayerVisible(false)}
                            className="flex items-center justify-center gap-2 text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 font-semibold py-2 px-3 rounded-lg transition"
                            title="Cacher le lecteur"
                        >
                            <EyeOffIcon />
                           <span>Cacher</span>
                        </button>
                    </div>
                    <div className="bg-black rounded-lg overflow-hidden">
                        <div className="aspect-w-16 aspect-h-9">
                            <iframe
                                key={activeTrack.id}
                                className="w-full h-full aspect-video"
                                src={`https://www.youtube-nocookie.com/embed/${activeTrack.id}?autoplay=1`}
                                title="Lecteur vidéo YouTube"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        </div>
                        <p className="text-xs text-gray-500 p-2 text-center">Si une erreur s'affiche, la lecture est restreinte. Utilisez le bouton "Ouvrir sur YouTube" ci-dessus.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default YouTubeBackingTrack;