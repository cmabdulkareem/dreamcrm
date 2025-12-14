import corsOptions from '../config/corsOptions.js';

/**
 * Get the appropriate frontend URL based on the request origin
 * Falls back to the first allowed origin if no match is found
 * @param {Object} req - Express request object
 * @returns {string} Frontend URL
 */
export const getFrontendUrl = (req) => {
    const origin = req.get('origin') || req.get('referer');

    // If we have an origin and it's in our allowed list, use it
    if (origin && corsOptions.origin.includes(origin)) {
        return origin;
    }

    // Check if referer matches any allowed origin
    if (origin) {
        const refererUrl = new URL(origin);
        const refererOrigin = `${refererUrl.protocol}//${refererUrl.host}`;
        if (corsOptions.origin.includes(refererOrigin)) {
            return refererOrigin;
        }
    }

    // Fallback: Use production URL first, then localhost
    const productionUrl = corsOptions.origin.find(url =>
        url.includes('vercel.app') || url.includes('render.com') || (!url.includes('localhost'))
    );

    return productionUrl || corsOptions.origin[0];
};

/**
 * Get all allowed frontend URLs from CORS config
 * @returns {Array<string>} Array of allowed frontend URLs
 */
export const getAllowedOrigins = () => {
    return corsOptions.origin;
};
