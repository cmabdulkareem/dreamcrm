import { createContext, useContext, useState, useCallback } from 'react';

const TutorialContext = createContext();

export const useTutorial = () => {
    const context = useContext(TutorialContext);
    if (!context) {
        throw new Error('useTutorial must be used within a TutorialProvider');
    }
    return context;
};

export const TutorialProvider = ({ children }) => {
    const [isPlaying, setIsPlaying] = useState(false);

    // You can add more state here if needed, e.g., which tutorial to play
    // for now we only have the Counsellor tutorial

    const startTutorial = useCallback(() => {
        setIsPlaying(true);
    }, []);

    const stopTutorial = useCallback(() => {
        setIsPlaying(false);
    }, []);

    return (
        <TutorialContext.Provider value={{ isPlaying, startTutorial, stopTutorial }}>
            {children}
        </TutorialContext.Provider>
    );
};
