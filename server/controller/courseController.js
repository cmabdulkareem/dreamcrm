import courseModel from '../model/courseModel.js';

// Get all courses
export const getAllCourses = async (req, res) => {
  try {
    // Check for brand filter from middleware (if authenticated) or header (if public)
    // Brand Independent: Fetch all courses regardless of brand
    const courses = await courseModel.find({}).sort({ createdAt: -1 });
    return res.status(200).json({ courses });
  } catch (error) {
    console.error("Error fetching courses:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get single course by ID
export const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await courseModel.findById(id);

    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    return res.status(200).json({ course });
  } catch (error) {
    console.error("Error fetching course:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Create new course
export const createCourse = async (req, res) => {
  try {
    const {
      courseCode,
      courseName,
      modules,
      duration,
      mode,
      singleShotFee,
      normalFee,
      isActive
    } = req.body;

    // Check if course code already exists
    const existingCourse = await courseModel.findOne({ courseCode });
    if (existingCourse) {
      return res.status(400).json({ message: "Course with this code already exists." });
    }

    const newCourse = new courseModel({
      courseCode,
      courseName,
      modules,
      duration: parseInt(duration),
      mode,
      singleShotFee: parseFloat(singleShotFee),
      normalFee: parseFloat(normalFee),
      isActive: isActive === 'true' || isActive === true
      // brand: Independent
    });

    await newCourse.save();

    return res.status(201).json({
      message: "Course created successfully.",
      course: newCourse
    });
  } catch (error) {
    console.error("Create course error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Update course
export const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const course = await courseModel.findById(id);
    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    // Update fields
    Object.keys(updateData).forEach(key => {
      if (key === 'duration') {
        course[key] = parseInt(updateData[key]);
      } else if (key === 'singleShotFee' || key === 'normalFee') {
        course[key] = parseFloat(updateData[key]);
      } else if (key === 'isActive') {
        course[key] = updateData[key] === 'true' || updateData[key] === true;
      } else if (key !== '_id' && key !== '__v') {
        course[key] = updateData[key];
      }
    });

    await course.save();

    return res.status(200).json({
      message: "Course updated successfully.",
      course
    });
  } catch (error) {
    console.error("Update course error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Delete course
export const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await courseModel.findByIdAndDelete(id);
    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    return res.status(200).json({ message: "Course deleted successfully." });
  } catch (error) {
    console.error("Delete course error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Toggle course status
export const toggleCourseStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await courseModel.findById(id);
    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    course.isActive = !course.isActive;
    await course.save();

    return res.status(200).json({
      message: `Course ${course.isActive ? 'activated' : 'deactivated'} successfully.`,
      course
    });
  } catch (error) {
    console.error("Toggle course status error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};