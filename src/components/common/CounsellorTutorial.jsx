import React, { useState, useEffect, useContext } from 'react';
import Joyride, { EVENTS, STATUS, ACTIONS } from 'react-joyride';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const CounsellorTutorial = () => {
    const { user, markTutorialSeen } = useContext(AuthContext);
    const location = useLocation();
    const navigate = useNavigate();
    const [run, setRun] = useState(false);
    const [stepIndex, setStepIndex] = useState(0);

    // Only run for Counsellors who haven't seen it
    useEffect(() => {
        if (user && user.roles && user.roles.includes('Counsellor') && !user.hasSeenCounsellorTutorial) {
            setRun(true);
        } else {
            setRun(false);
        }
    }, [user]);

    const steps = [
        // 0. Welcome
        {
            target: 'body',
            content: (
                <div className="text-left">
                    <h3 className="font-bold text-lg mb-2">Welcome to DreamCRM! 👋</h3>
                    <p className="mb-2">We have prepared a quick tour to help you get started with your daily tasks as a Counsellor.</p>
                    <p>Let's learn how to manage your leads effectively.</p>
                </div>
            ),
            placement: 'center',
            disableBeacon: true,
        },
        // 1. Dashboard Overview
        {
            target: '#sidebar-item-dashboard',
            content: 'This is your Dashboard. Start your day here to see an overview of your assigned leads and pending tasks.',
            placement: 'right',
        },
        // 2. Lead Management Sidebar
        {
            target: '#sidebar-item-lead-management',
            content: 'The "Lead Management" section is your main workspace.',
            placement: 'right',
        },
        // 3. Add Lead Sidebar
        {
            target: '#sidebar-subitem-new-lead',
            content: 'Click here to add a new enquiry. We\'ll take you to the form in the next step.',
            placement: 'right',
        },
        // 4. New Lead Form - Navigates to /new-lead
        {
            target: 'body',
            content: 'Here you can add details for a new lead. Let\'s look at the important fields.',
            placement: 'center',
        },
        // 5. Full Name
        {
            target: '#firstName', // Using existing ID found in code
            content: 'Enter the full name of the student or enquiry here. This is mandatory.',
        },
        // 6. Phone
        {
            target: '#new-lead-phone',
            content: 'Enter the primary contact number correctly. This is crucial for follow-ups.',
        },
        // 7. Course Preference
        {
            target: '#new-lead-course-preference',
            content: 'Select the courses they are interested in. You can select multiple.',
        },
        // 8. Source/Campaign
        {
            target: '#new-lead-campaign',
            content: 'Select the Campaign or Source where we got this lead from (e.g., Instagram, Walk-in).',
        },
        // 9. Submit
        {
            target: '#new-lead-submit-btn',
            content: 'Once filled, click Save. Always try to fill as many details as possible!',
        },
        // 10. Manager Leads - Navigate to /lead-management
        {
            target: 'body',
            content: 'Now let\'s see where you can manage all your leads.',
            placement: 'center',
        },
        // 11. Table view
        {
            target: '.ag-theme-alpine', // Assuming generic table class, might need specific ID if table is generic
            content: 'Here you will see a list of all leads assigned to you. You can update their status and add remarks from here.',
            placement: 'top'
        },
        // 12. Completion
        {
            target: 'body',
            content: (
                <div className="text-left">
                    <h3 className="font-bold text-lg mb-2">You're all set! 🚀</h3>
                    <p className="mb-2">Remember: Update your leads immediately after every call or meeting.</p>
                    <p>Good luck!</p>
                </div>
            ),
            placement: 'center',
        }
    ];

    const handleJoyrideCallback = (data) => {
        const { action, index, status, type } = data;

        if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
            // Tour finished
            setRun(false);
            markTutorialSeen();
        } else if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
            // Navigation logic based on NEXT step index
            // Current index is 'index'. Next is index + 1 (usually)

            if (action === ACTIONS.NEXT) {
                const nextStepIndex = index + 1;

                // Move from Sidebar to New Lead page
                if (nextStepIndex === 4) {
                    navigate('/new-lead');
                    setTimeout(() => setStepIndex(nextStepIndex), 500); // Wait for nav
                }
                // Move from New Lead to Manage Leads
                else if (nextStepIndex === 10) {
                    navigate('/lead-management');
                    setTimeout(() => setStepIndex(nextStepIndex), 500);
                }
                else {
                    setStepIndex(nextStepIndex);
                }
            } else if (action === ACTIONS.PREV) {
                // Handle back navigation if needed, currently just simpler to update index
                setStepIndex(index - 1);
            }
        }
    };

    // If not running, return null
    if (!run) return null;

    return (
        <Joyride
            steps={steps}
            run={run}
            stepIndex={stepIndex}
            continuous={true}
            showSkipButton={true}
            showProgress={true}
            styles={{
                options: {
                    zIndex: 10000,
                    primaryColor: '#3c50e0',
                },
            }}
            callback={handleJoyrideCallback}
        />
    );
};

export default CounsellorTutorial;
