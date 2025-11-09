
import React, { useRef, useEffect, useState } from 'react';

const NUM_FRETS = 17;
const NECK_HEIGHT = 140;
const NUT_WIDTH = 50;

// Fix: Add explicit props type to solve 'key' prop error.
type NoteDotProps = {
    cx: number;
    cy: number;
    noteItem?: any;
    noteSelection?: any;
    isPreview?: boolean;
    isPlaybackActive: boolean;
};

const NoteDot = ({ cx, cy, noteItem, noteSelection, isPreview, isPlaybackActive }: NoteDotProps) => {
    const colors = {
        fondatrice: '#10B981', 
        expressive: '#8B5CF6',
        preview: '#FBBF24'
    };
    
    if (noteSelection) {
        return (
            <g>
                <circle cx={cx} cy={cy} r={9} fill={noteSelection.color} className="note-dot" />
                <text x={cx} y={cy} className="note-dot-text">{noteSelection.chordNumber}</text>
                <text x={cx} y={cy + 15} className="note-name-text">{noteSelection.noteItem.note}</text>
            </g>
        );
    }

    if (noteItem) {
        const fill = isPreview ? colors.preview : (colors[noteItem.type] || '#FFFFFF');
        const className = `note-dot ${!isPreview && isPlaybackActive ? 'note-dot-active' : ''}`;
        return (
            <circle cx={cx} cy={cy} r={9} fill={fill} stroke="#111827" className={className} />
        );
    }
    
    return null;
}

const GuitarNeck = ({ pentatonicNotes, displayNotes, notePositions }) => {
    const svgRef = useRef(null);
    const [width, setWidth] = useState(0);

    useEffect(() => {
        const resizeObserver = new ResizeObserver(entries => {
            if (entries[0]) {
                setWidth(entries[0].contentRect.width);
            }
        });
        if (svgRef.current) {
            resizeObserver.observe(svgRef.current);
        }
        return () => resizeObserver.disconnect();
    }, []);
    
    if (width === 0) {
        return <div className="w-full overflow-x-auto pb-2.5"><svg ref={svgRef} className="w-full h-[170px]"></svg></div>;
    }
    
    const NECK_WIDTH = width - NUT_WIDTH;
    const isPlaybackActive = !!(displayNotes.active || displayNotes.preview);

    const getPosition = (fret) => NUT_WIDTH + ((fret - 0.5) * (NECK_WIDTH / NUM_FRETS));
    const getStringY = (stringIndex) => (NECK_HEIGHT / 12) * (stringIndex * 2 + 1);

    const fretMarkers = { 3:1, 5:1, 7:1, 9:1, 12:2, 15:1, 17:1 };

    return (
        <div className="w-full overflow-x-auto pb-2.5">
            <svg ref={svgRef} className="w-full h-[170px]">
                <defs>
                    <linearGradient id="woodGrain" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style={{stopColor: '#6b4629', stopOpacity: 1}} />
                        <stop offset="100%" style={{stopColor: '#4a2f19', stopOpacity: 1}} />
                    </linearGradient>
                </defs>
                <rect x={0} y={0} width={width} height={NECK_HEIGHT} fill="url(#woodGrain)" />

                {/* Pentatonic Scale Notes (background) */}
                <g>
                    {pentatonicNotes.flatMap(note =>
                        notePositions.get(note)
                            .filter(([, fret]) => fret > 0 && fret <= NUM_FRETS)
                            .map(([string, fret], i) => (
                                <circle key={`${note}-${string}-${fret}-${i}`} cx={getPosition(fret)} cy={getStringY(string)} r={10} fill="none" stroke="#6B7280" strokeWidth="2" opacity="0.6" />
                            ))
                    )}
                </g>
                
                {/* Frets and Strings */}
                {Array.from({ length: NUM_FRETS + 1 }).map((_, i) => (
                    <line key={`fret-${i}`} x1={NUT_WIDTH + (i * (NECK_WIDTH / NUM_FRETS))} y1={getStringY(0)} x2={NUT_WIDTH + (i * (NECK_WIDTH / NUM_FRETS))} y2={getStringY(5)} stroke={i === 0 ? '#e5e7eb' : '#a0a0a0'} strokeWidth={i === 0 ? 6 : 3} />
                ))}
                {Array.from({ length: 6 }).map((_, i) => (
                    <line key={`string-${i}`} x1={NUT_WIDTH} y1={getStringY(i)} x2={width} y2={getStringY(i)} stroke="#cbd5e1" strokeWidth={1 + (i * 0.2)} />
                ))}
                
                {/* Fret Markers */}
                {Object.entries(fretMarkers).map(([fret, num]) => {
                    const x = getPosition(parseInt(fret));
                    if (num === 1) return <circle key={`marker-${fret}`} cx={x} cy={NECK_HEIGHT / 2} r={5} fill="#e5e7eb" opacity="0.2" />;
                    return (
                        <g key={`marker-${fret}`}>
                            <circle cx={x} cy={NECK_HEIGHT / 4} r={5} fill="#e5e7eb" opacity="0.2" />
                            <circle cx={x} cy={(NECK_HEIGHT / 4) * 3} r={5} fill="#e5e7eb" opacity="0.2" />
                        </g>
                    );
                })}
                 {[3, 5, 7, 9, 12, 15, 17].map(fret => (
                    <text key={`fret-label-${fret}`} x={getPosition(fret)} y={NECK_HEIGHT + 15} className="fret-number-text">{fret}</text>
                ))}


                {/* Target Notes */}
                <g>
                    {displayNotes.multi ? (
                        displayNotes.multi.flatMap(sel => 
                            notePositions.get(sel.noteItem.note)
                                .filter(([, fret]) => fret > 0 && fret <= NUM_FRETS)
                                .map(([string, fret], i) => (
                                    <NoteDot key={`note-multi-${sel.chordNumber}-${string}-${fret}-${i}`} cx={getPosition(fret)} cy={getStringY(string)} noteSelection={sel} isPlaybackActive={false} />
                                ))
                        )
                    ) : (
                        <>
                            {(displayNotes.preview || []).flatMap(item =>
                                notePositions.get(item.note)
                                    .filter(([, fret]) => fret > 0 && fret <= NUM_FRETS)
                                    .map(([string, fret], i) => (
                                         <NoteDot key={`note-preview-${item.note}-${string}-${fret}-${i}`} cx={getPosition(fret)} cy={getStringY(string)} noteItem={item} isPreview={true} isPlaybackActive={isPlaybackActive} />
                                    ))
                            )}
                             {(displayNotes.active || []).flatMap(item =>
                                notePositions.get(item.note)
                                    .filter(([, fret]) => fret > 0 && fret <= NUM_FRETS)
                                    .map(([string, fret], i) => (
                                         <NoteDot key={`note-active-${item.note}-${string}-${fret}-${i}`} cx={getPosition(fret)} cy={getStringY(string)} noteItem={item} isPlaybackActive={isPlaybackActive} />
                                    ))
                            )}
                        </>
                    )}
                </g>
            </svg>
        </div>
    );
};

export default GuitarNeck;
