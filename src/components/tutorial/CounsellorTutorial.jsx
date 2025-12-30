import React, { useEffect, useState } from 'react';
import Joyride, { ACTIONS, EVENTS, STATUS } from 'react-joyride';
import { useTutorial } from '../../context/TutorialContext';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';

const CounsellorTutorial = () => {
    const { isPlaying, stopTutorial, startTutorial } = useTutorial();
    const { user, markTutorialSeen } = useContext(AuthContext);
    const location = useLocation();
    const navigate = useNavigate();
    const [run, setRun] = useState(false);

    // Define steps
    const steps = [
        {
            target: 'body',
            placement: 'center',
            title: 'Welcome to DreamCRM!',
            content: 'Let\'s take a quick tour to help you get started with your Counsellor dashboard.',
            disableBeacon: true,
        },
        {
            target: '#sidebar-item-dashboard',
            content: 'This is your Dashboard. Here you can see a quick overview of your leads and daily tasks.',
        },
        {
            target: '#sidebar-item-lead-management',
            content: 'Manage your leads here. You can add new leads, update their status, and track follow-ups.',
        },
        {
            target: '#header-profile', // We need to ensure this ID exists in Header
            content: 'Access your profile settings, change password, or logout from here.',
        },
        {
            target: 'body',
            placement: 'center',
            title: 'You\'re all set!',
            content: 'If you ever need to see this guide again, you can find it in your profile menu. Happy counselling!',
        },
    ];

    // Auto-start logic
    useEffect(() => {
        // Check if user is counsellor and hasn't seen tutorial
        if (user &&
            (user.roles?.includes('Counsellor') || user.role?.includes('Counsellor')) &&
            !user.hasSeenCounsellorTutorial) {
            // Only auto-start on dashboard to avoid interrupting flow elsewhere
            // or navigate them to dashboard?
            // For now, let's just start it if they are logged in.
            // actually, best to start it.
            startTutorial();
        }
    }, [user, startTutorial]);

    // Sync internal run state with context
    useEffect(() => {
        setRun(isPlaying);
    }, [isPlaying]);

    const handleJoyrideCallback = (data) => {
        const { status, type, action } = data;
        const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED];

        if (finishedStatuses.includes(status)) {
            setRun(false);
            stopTutorial();

            // If completed (not just skipped, but let's count skip as completion for auto-trigger purposes so it doesn't annoy them),
            // update backend.
            // Actually, if they skip, maybe we should remind them? 
            // Requirement says "Allow users to skip... showing progress". 
            // Usually "Skip" implies "I don't want to see this again automatically".

            markTutorialSeen();
        }
    };

    if (!user || (!user.roles?.includes('Counsellor') && !user.role?.includes('Counsellor'))) {
        return null;
    }

    return (
        <Joyride
            steps={steps}
            run={run}
            continuous
            showProgress
            showSkipButton
            disableOverlayClose
            spotlightClicks
            styles={{
                options: {
                    zIndex: 10000,
                    primaryColor: '#F59E0B', // Amber-500 matches DreamZone typical branding or use theme color
                },
            }}
            callback={handleJoyrideCallback}
        />
    );
};

export default CounsellorTutorial;
