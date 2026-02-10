import ActivityLog from '../model/activityLogModel.js';

/**
 * Logs a user activity to the database.
 * 
 * @param {string} userId - ID of the user performing the action
 * @param {string} action - Action type (CREATE, UPDATE, DELETE, REMARK, etc.)
 * @param {string} module - Module name (Leads, Students, etc.)
 * @param {Object} options - Optional: entityId, description, metadata
 */
export const logActivity = async (userId, action, module, options = {}) => {
    try {
        if (!userId) return;

        const { entityId, description, metadata } = options;

        const log = new ActivityLog({
            userId,
            action,
            module,
            entityId,
            description,
            metadata
        });

        await log.save();
    } catch (error) {
        // Silently fail logging to avoid breaking core functionality, but log to console
        console.error('Failed to log activity:', error);
    }
};

export default logActivity;
