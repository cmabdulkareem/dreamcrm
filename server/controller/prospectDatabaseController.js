import School from '../model/schoolModel.js';
import Stream from '../model/streamModel.js';
import Class from '../model/classModel.js';
import ProspectStudent from '../model/prospectStudentModel.js';

// --- School Controllers ---
export const getSchools = async (req, res) => {
    try {
        const schools = await School.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, schools });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createSchool = async (req, res) => {
    try {
        const { name, place } = req.body;
        const school = await School.create({ name, place, createdBy: req.user._id });
        res.status(201).json({ success: true, school });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateSchool = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, place } = req.body;
        const school = await School.findByIdAndUpdate(id, { name, place }, { new: true });
        res.status(200).json({ success: true, school });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteSchool = async (req, res) => {
    try {
        const { id } = req.params;
        await School.findByIdAndDelete(id);
        // Optionally delete children
        await Stream.deleteMany({ school: id });
        res.status(200).json({ success: true, message: 'School deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- Stream Controllers ---
export const getStreams = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const streams = await Stream.find({ school: schoolId }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, streams });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createStream = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { name } = req.body;
        const stream = await Stream.create({ name, school: schoolId, createdBy: req.user._id });
        res.status(201).json({ success: true, stream });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteStream = async (req, res) => {
    try {
        const { id } = req.params;
        await Stream.findByIdAndDelete(id);
        await Class.deleteMany({ stream: id });
        res.status(200).json({ success: true, message: 'Stream deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- Class Controllers ---
export const getClasses = async (req, res) => {
    try {
        const { streamId } = req.params;
        const classes = await Class.find({ stream: streamId }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, classes });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createClass = async (req, res) => {
    try {
        const { streamId } = req.params;
        const { name } = req.body;
        const newClass = await Class.create({ name, stream: streamId, createdBy: req.user._id });
        res.status(201).json({ success: true, class: newClass });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteClass = async (req, res) => {
    try {
        const { id } = req.params;
        await Class.findByIdAndDelete(id);
        await ProspectStudent.deleteMany({ class: id });
        res.status(200).json({ success: true, message: 'Class deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- Student Controllers ---
export const getStudents = async (req, res) => {
    try {
        const { classId } = req.params;
        const students = await ProspectStudent.find({ class: classId }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, students });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createStudent = async (req, res) => {
    try {
        const { classId } = req.params;
        const { name, phone, socialMedia, place, contactNumber, gender } = req.body;
        const student = await ProspectStudent.create({
            name,
            phone,
            socialMedia,
            place,
            contactNumber,
            gender,
            class: classId,
            createdBy: req.user._id
        });
        res.status(201).json({ success: true, student });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteStudent = async (req, res) => {
    try {
        const { id } = req.params;
        await ProspectStudent.findByIdAndDelete(id);
        res.status(200).json({ success: true, message: 'Student deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
