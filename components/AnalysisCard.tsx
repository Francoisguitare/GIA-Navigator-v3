import React from 'react';

// FIX: Define prop types for AnalysisCard and type it as a React.FC to allow React-specific props like 'key'.
interface AnalysisCardProps {
    analysis: any;
    setModalContent: (content: { title: string; body: string } | null) => void;
    onTargetNoteChange: (analysisIndex: number, optionIndex: number) => void;
    isSelected: boolean;
    onSelectToggle: (analysisIndex: number) => void;
    selectionColor: string;
    isPlaybackActive: boolean;
}

const AnalysisCard: React.FC<AnalysisCardProps> = ({ analysis, setModalContent, onTargetNoteChange, isSelected, onSelectToggle, selectionColor, isPlaybackActive }) => {

    const handleBadgeClick = (e) => {
        e.stopPropagation();
        let title = '', body = '';
        switch (analysis.front) {
            case 'TENSION':
                title = 'Front de la Tension (Dominante)';
                body = "Cet accord (V7 ou vii°) force le mouvement vers la résolution. Votre jeu doit être RAPIDE et AGRESSIF. C'est le moment d'accélérer, d'utiliser des notes courtes et de créer une attente.";
                break;
            case 'OUT_OF_KEY':
                title = 'Front de la Tension (Hors Tonalité)';
                body = "Cet accord contient des notes étrangères à la gamme, créant un 'choc' harmonique. Il génère une tension qui demande à être gérée. Considérez-le comme une zone de jeu RAPIDE et SURPRENANTE.";
                break;
            case 'RÉSOLUTION':
                title = 'Front de la Résolution';
                body = "Cet accord est une zone de repos, de transition ou de couleur. Votre jeu doit être LENT et LYRIQUE. C'est le moment d'utiliser des phrasés mélodiques et de laisser respirer la musique.";
                break;
        }
        setModalContent({ title, body });
    };

    const cardClasses = {
        'TENSION': 'border-rose-700',
        'OUT_OF_KEY': 'border-amber-500',
        'RÉSOLUTION': 'border-blue-700',
    };
    
    const badgeClasses = {
        'TENSION': 'bg-rose-700 text-rose-100',
        'OUT_OF_KEY': 'bg-amber-600 text-amber-100',
        'RÉSOLUTION': 'bg-blue-700 text-blue-100',
    };

    const cardWrapperClass = `p-1 w-1/2 md:w-1/3 lg:w-1/4 transition-transform duration-200 ${isSelected ? 'transform scale-[1.02]' : ''}`;

    return (
        <div className={cardWrapperClass}>
            <div className={`relative bg-gray-800 border-2 rounded-lg p-2 flex flex-col h-full space-y-2 transition-all duration-200 ${cardClasses[analysis.front]} ${isSelected ? 'shadow-lg shadow-violet-500/30' : ''}`}>
                 <div
                    onClick={() => onSelectToggle(analysis.analysisIndex)}
                    className={`absolute top-2 left-2 w-4 h-4 rounded-full border-2 transition-all duration-200 ${isPlaybackActive ? 'cursor-not-allowed bg-gray-700 border-gray-600' : 'cursor-pointer'}`}
                    style={{ 
                        borderColor: isSelected ? selectionColor : '#6b7280',
                        backgroundColor: isSelected ? selectionColor : 'transparent',
                     }}
                ></div>
                
                <div className="flex-shrink-0">
                    <div className="flex justify-between items-start mb-1">
                        <h3 className="text-lg font-extrabold text-white pl-6">{analysis.accord} <span className="text-base font-semibold text-gray-400">{analysis.degre}</span></h3>
                        <span onClick={handleBadgeClick} className={`inline-block px-2.5 py-0.5 rounded-full font-semibold text-xs text-center cursor-pointer transition transform hover:scale-105 ${badgeClasses[analysis.front]}`}>
                            {analysis.front === 'OUT_OF_KEY' ? 'HORS TONALITÉ' : analysis.front}
                        </span>
                    </div>
                    <p className={`text-[11px] font-semibold ${analysis.front === 'RÉSOLUTION' ? 'text-blue-300' : 'text-rose-300'}`}>
                        {analysis.actionRythmique}
                    </p>
                </div>
                
                <div className="flex-grow space-y-2">
                    <div>
                        <p className="text-[11px] text-violet-400 font-bold tracking-wider mb-1">CHOISIR UNE NOTE CIBLE</p>
                        <div className="space-y-1">
                            {analysis.allTargetOptions.map((item, index) => {
                                const id = `target-${analysis.analysisIndex}-${index}`;
                                const isChecked = analysis.selectedNote?.note === item.note && analysis.selectedNote?.interval === item.interval;
                                return (
                                    <div key={id}>
                                        <input
                                            type="radio"
                                            name={`target-choice-${analysis.analysisIndex}`}
                                            id={id}
                                            value={index}
                                            className="hidden"
                                            checked={isChecked}
                                            onChange={() => onTargetNoteChange(analysis.analysisIndex, index)}
                                        />
                                        <label
                                            htmlFor={id}
                                            className={`block cursor-pointer p-2 rounded-md border transition-all ${isChecked ? 'bg-violet-800 border-violet-400 text-white' : 'bg-gray-500/20 border-gray-600 hover:bg-gray-500/40 hover:border-gray-500'}`}
                                        >
                                            <span className="font-bold text-sm">{item.note} ({item.interval})</span> - <span className="text-gray-400 text-xs">{item.intention}</span>
                                        </label>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalysisCard;