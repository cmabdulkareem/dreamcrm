import React from 'react';

const LoadingSpinner = ({ className = "h-32", size = "h-8 w-8" }) => {
    return (
        <div className={`flex justify-center items-center ${className}`}>
            <div className={`animate-spin rounded-full ${size} border-b-2 border-gray-900 dark:border-white`}></div>
        </div>
    );
};

export default LoadingSpinner;
