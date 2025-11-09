
import React, { useState, useEffect } from 'react';
import AnalysisCard from './AnalysisCard.js';

const AnalysisSection = ({
    keySignature,
    scaleNotes,
    analysisResults,
    setModalContent,
    onTargetNoteChange,
    onCardSelectionChange,
    isPlaybackActive,
}) => {
    const [selectedCardIndices, setSelectedCardIndices] = useState(new Set());
    const multiSelectColors = ['#FBBF24', '#34D399', '#F87171', '#60A5FA', '#EC4899', '#8B5CF6'];

    const handleExport = () => {
        if (analysisResults.length === 0) return;
        const headers = ['Accord', 'Degré', 'Front GIA', 'Action Rythmique', 'Note Cible Choisie', 'Intention Choisie', 'Intervalle Cible'];
        const rows = analysisResults.map(res => {
            if (!res.accord) return null;
            const selected = res.selectedNote;
            const row = [
                `"${res.accord}"`,
                `"${res.degre}"`,
                `"${res.front}"`,
                `"${res.actionRythmique}"`,
                selected ? `"${selected.note}"` : '""',
                selected ? `"${selected.intention}"` : '""',
                selected ? `"${selected.interval}"` : '""',
            ];
            return row;
        }).filter(row => row !== null);

        const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", "analyse_gia_navigator.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleCardSelectToggle = (analysisIndex) => {
        if (isPlaybackActive) return;
        const newSet = new Set(selectedCardIndices);
        if (newSet.has(analysisIndex)) {
            newSet.delete(analysisIndex);
        } else {
            newSet.add(analysisIndex);
        }
        setSelectedCardIndices(newSet);
    };
    
    useEffect(() => {
        if (isPlaybackActive) {
            setSelectedCardIndices(new Set());
        }
    }, [isPlaybackActive]);
    
    useEffect(() => {
        const selections = [];
        const selectedArray = Array.from(selectedCardIndices);
        selectedArray.forEach((analysisIndex, i) => {
            const analysis = analysisResults.find(r => r.analysisIndex === analysisIndex);
            if (analysis && analysis.selectedNote) {
                selections.push({
                    noteItem: analysis.selectedNote,
                    chordNumber: analysis.analysisIndex + 1,
                    color: multiSelectColors[i % multiSelectColors.length],
                });
            }
        });
        onCardSelectionChange(selections);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCardIndices, analysisResults]);

    return (
        <div className="p-3 bg-gray-800/50 rounded-xl border border-gray-700">
            <div className="flex flex-col sm:flex-row justify-between sm:items-start mb-2 gap-3">
                <div>
                    <h2 className="text-lg font-bold text-white">2. Votre Plan d'Action GIA</h2>
                    <div className="flex items-center flex-wrap gap-x-4 gap-y-2 mt-2">
                        <p className="text-blue-300 font-semibold">
                            {keySignature ? `Tonalité: ${keySignature.name}` : 'En attente d\'un accord...'}
                        </p>
                        {keySignature && (
                            <div className="flex items-center gap-3 bg-gray-700 px-3 py-1 rounded-md text-sm font-semibold text-gray-300">
                                {scaleNotes.map(note => (
                                    <span key={note} className={note === keySignature.root ? 'text-blue-400 font-extrabold' : ''}>
                                        {note}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                {analysisResults.length > 0 && (
                    <div className="flex flex-col items-end gap-2 self-stretch">
                        <button onClick={handleExport} className="w-full bg-slate-600 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300">
                            Exporter (CSV)
                        </button>
                    </div>
                )}
            </div>
            <div className="flex flex-wrap -m-1">
                {analysisResults.map((result, i) => (
                    <AnalysisCard
                        key={result.gridIndex}
                        analysis={result}
                        setModalContent={setModalContent}
                        onTargetNoteChange={onTargetNoteChange}
                        isSelected={selectedCardIndices.has(result.analysisIndex)}
                        onSelectToggle={handleCardSelectToggle}
                        selectionColor={multiSelectColors[Array.from(selectedCardIndices).indexOf(result.analysisIndex) % multiSelectColors.length]}
                        isPlaybackActive={isPlaybackActive}
                    />
                ))}
            </div>
        </div>
    );
};

export default AnalysisSection;