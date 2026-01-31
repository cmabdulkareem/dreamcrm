import Folder from '../model/folderModel.js';
import School from '../model/schoolModel.js';
import Stream from '../model/streamModel.js';
import Class from '../model/classModel.js';
import ProspectStudent from '../model/prospectStudentModel.js';

// --- Folder Controllers ---
export const getFolders = async (req, res) => {
    try {
        const folders = await Folder.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, folders });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createFolder = async (req, res) => {
    try {
        const { name } = req.body;
        const folder = await Folder.create({ name, createdBy: req.user.id });
        res.status(201).json({ success: true, folder });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateFolder = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        const folder = await Folder.findByIdAndUpdate(id, { name }, { new: true });
        res.status(200).json({ success: true, folder });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteFolder = async (req, res) => {
    try {
        const { id } = req.params;
        await Folder.findByIdAndDelete(id);
        // Delete child schools (or decouple them)
        await School.deleteMany({ folder: id });
        res.status(200).json({ success: true, message: 'Folder deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- School Controllers ---
export const getSchools = async (req, res) => {
    try {
        const { folderId } = req.query;
        const query = folderId ? { folder: folderId } : {};
        const schools = await School.find(query).sort({ createdAt: -1 });
        res.status(200).json({ success: true, schools });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createSchool = async (req, res) => {
    try {
        const { name, place, folderId } = req.body;
        const school = await School.create({
            name,
            place,
            folder: folderId,
            createdBy: req.user.id
        });
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
        const stream = await Stream.create({ name, school: schoolId, createdBy: req.user.id });
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
        const newClass = await Class.create({ name, stream: streamId, createdBy: req.user.id });
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
        const students = await ProspectStudent.find({ class: classId }).sort({ gender: 1, name: 1 });
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
            createdBy: req.user.id
        });
        res.status(201).json({ success: true, student });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const student = await ProspectStudent.findByIdAndUpdate(id, req.body, { new: true });
        res.status(200).json({ success: true, student });
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

export const bulkCreateStudents = async (req, res) => {
    try {
        const { classId } = req.params;
        const { students } = req.body;

        if (!Array.isArray(students)) {
            return res.status(400).json({ success: false, message: 'Students data must be an array' });
        }

        const studentsWithMetadata = students.map(student => ({
            ...student,
            class: classId,
            createdBy: req.user.id
        }));

        const result = await ProspectStudent.insertMany(studentsWithMetadata);
        res.status(201).json({ success: true, count: result.length, students: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
