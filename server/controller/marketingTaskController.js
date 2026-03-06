import MarketingTask from '../model/marketingTaskModel.js';
import { isAdmin, isOwner, isManager } from "../utils/roleHelpers.js";

export const getTasks = async (req, res) => {
    try {
        const brandId = req.headers['x-brand-id'];
        if (!brandId) {
            return res.status(400).json({ success: false, message: 'Brand ID is required' });
        }

        const query = { brandId };

        // For non-admin/manager users, only show tasks they created or are assigned to
        const isUserAdmin = isAdmin(req.user, brandId) || isOwner(req.user, brandId) || isManager(req.user, brandId);

        if (!isUserAdmin) {
            query.$or = [
                { createdBy: req.user.id },
                { team: req.user.id }
            ];
        }

        const tasks = await MarketingTask.find(query)
            .populate('createdBy', 'fullName avatar')
            .populate('team', 'fullName avatar')
            .populate('remarks.user', 'fullName avatar')
            .populate('subTasks.assignedTo', 'fullName avatar')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, tasks });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createTask = async (req, res) => {
    try {
        const { title, description, priority, scheduledDate, subTasks, team } = req.body;
        const brandId = req.headers['x-brand-id'];

        if (!brandId) {
            return res.status(400).json({ success: false, message: 'Brand ID is required' });
        }

        const task = new MarketingTask({
            title,
            description,
            priority,
            scheduledDate,
            subTasks: subTasks || [],
            team: team || [],
            brandId,
            createdBy: req.user.id
        });

        await task.save();
        res.status(201).json({ success: true, task });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, priority, status, scheduledDate, subTasks, team } = req.body;
        const brandId = req.headers['x-brand-id'];

        const task = await MarketingTask.findOneAndUpdate(
            { _id: id, brandId },
            { title, description, priority, status, scheduledDate, subTasks, team },
            { new: true }
        );

        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        res.status(200).json({ success: true, task });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const addRemark = async (req, res) => {
    try {
        const { id } = req.params;
        const { remark } = req.body;
        const brandId = req.headers['x-brand-id'];

        const task = await MarketingTask.findOne({ _id: id, brandId });
        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        task.remarks.push({
            remark,
            user: req.user.id,
            date: new Date()
        });

        await task.save();
        res.status(200).json({ success: true, task });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteTask = async (req, res) => {
    try {
        const { id } = req.params;
        const brandId = req.headers['x-brand-id'];

        const task = await MarketingTask.findOneAndDelete({ _id: id, brandId });
        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        res.status(200).json({ success: true, message: 'Task deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const toggleSubTask = async (req, res) => {
    try {
        const { id, subTaskId } = req.params;
        const brandId = req.headers['x-brand-id'];

        const task = await MarketingTask.findOne({ _id: id, brandId });
        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        const subTask = task.subTasks.id(subTaskId);
        if (!subTask) {
            return res.status(404).json({ success: false, message: 'Sub-task not found' });
        }

        subTask.isCompleted = !subTask.isCompleted;
        await task.save();

        res.status(200).json({ success: true, task });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const addSubTask = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, targetDate, assignedTo } = req.body;
        const brandId = req.headers['x-brand-id'];

        const task = await MarketingTask.findOne({ _id: id, brandId });
        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        task.subTasks.push({
            title,
            targetDate: targetDate || null,
            assignedTo: assignedTo || null,
            isCompleted: false
        });

        await task.save();
        res.status(200).json({ success: true, task });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteSubTask = async (req, res) => {
    try {
        const { id, subTaskId } = req.params;
        const brandId = req.headers['x-brand-id'];

        const task = await MarketingTask.findOne({ _id: id, brandId });
        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        task.subTasks.pull(subTaskId);
        await task.save();

        res.status(200).json({ success: true, task });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateSubTask = async (req, res) => {
    try {
        const { id, subTaskId } = req.params;
        const { title, targetDate, assignedTo, isCompleted } = req.body;
        const brandId = req.headers['x-brand-id'];

        const task = await MarketingTask.findOne({ _id: id, brandId });
        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        const subTask = task.subTasks.id(subTaskId);
        if (!subTask) {
            return res.status(404).json({ success: false, message: 'Sub-task not found' });
        }

        if (title !== undefined) subTask.title = title;
        if (targetDate !== undefined) subTask.targetDate = targetDate;
        if (assignedTo !== undefined) subTask.assignedTo = assignedTo || null;
        if (isCompleted !== undefined) subTask.isCompleted = isCompleted;

        await task.save();

        const updatedTask = await MarketingTask.findById(id)
            .populate('createdBy', 'fullName avatar')
            .populate('team', 'fullName avatar')
            .populate('remarks.user', 'fullName avatar')
            .populate('subTasks.assignedTo', 'fullName avatar');

        res.status(200).json({ success: true, task: updatedTask });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
