
import React, { useEffect } from 'react';

const InfoModal = ({ modalContent, setModalContent }) => {
    
    useEffect(() => {
        const handleEsc = (event) => {
           if (event.key === 'Escape') {
            setModalContent(null);
           }
        };
        window.addEventListener('keydown', handleEsc);

        return () => {
            window.removeEventListener('keydown', handleEsc);
        };
    }, [setModalContent]);

    if (!modalContent) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 transition-opacity duration-300 ease-in-out">
            <div
                className="absolute inset-0"
                onClick={() => setModalContent(null)}
            ></div>
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md z-10 transform transition-all duration-300 ease-in-out scale-100 opacity-100">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-white">{modalContent.title}</h3>
                    <button onClick={() => setModalContent(null)} className="text-gray-400 hover:text-white text-3xl leading-none">&times;</button>
                </div>
                <p className="text-gray-300">{modalContent.body}</p>
            </div>
        </div>
    );
};

export default InfoModal;