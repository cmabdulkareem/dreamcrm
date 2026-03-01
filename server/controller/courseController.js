import Brand from '../model/brandModel.js';
import Customer from '../model/customerModel.js';

// Get all courses
export const getAllCourses = async (req, res) => {
  try {
    const headerBrandId = req.headers['x-brand-id'];
    let query = {};

    if (headerBrandId) {
      query._id = headerBrandId;
    } else if (req.brandFilter) {
      // If brandFilter has a 'brand' key (standard for our middleware), translate it to '_id' for Brand model
      if (req.brandFilter.brand) {
        query._id = req.brandFilter.brand;
      } else {
        query = req.brandFilter;
      }
    }

    const brands = await Brand.find(query);
    if (!brands || brands.length === 0) {
      // If a specific brand was requested but not found
      if (headerBrandId) return res.status(404).json({ message: "Brand not found" });
      return res.status(200).json({ courses: [] });
    }

    // Aggregate all courses from all matching brands
    let allCourses = brands.flatMap(brand => brand.courses || []);

    // Sort by createdAt descending
    allCourses.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    return res.status(200).json({ courses: allCourses });
  } catch (error) {
    console.error("Error fetching courses:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get single course by ID
export const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    const brand = await Brand.findOne({ "courses._id": id });

    if (!brand) {
      return res.status(404).json({ message: "Course not found." });
    }

    const course = brand.courses.id(id);
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

    const brandId = req.brandFilter?.brand || req.headers['x-brand-id'] || null;
    if (!brandId) return res.status(400).json({ message: "Brand ID is required" });

    const brand = await Brand.findById(brandId);
    if (!brand) return res.status(404).json({ message: "Brand not found" });

    // Check if course code or name already exists FOR THIS BRAND
    const exists = brand.courses.some(c => c.courseCode === courseCode || c.courseName === courseName);
    if (exists) {
      return res.status(400).json({ message: "Course with this code or name already exists in this brand." });
    }

    brand.courses.push({
      courseCode,
      courseName,
      modules,
      duration: parseInt(duration),
      mode,
      singleShotFee: parseFloat(singleShotFee),
      normalFee: parseFloat(normalFee),
      isActive: isActive === 'true' || isActive === true
    });

    await brand.save();

    return res.status(201).json({
      message: "Course created successfully.",
      course: brand.courses[brand.courses.length - 1]
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

    const brand = await Brand.findOne({ "courses._id": id });
    if (!brand) {
      return res.status(404).json({ message: "Course not found." });
    }

    const course = brand.courses.id(id);
    let oldCourseName = course.courseName;

    // Update fields
    for (const key of Object.keys(updateData)) {
      if (key === 'courseCode' || key === 'courseName') {
        const existing = brand.courses.some(c => c._id.toString() !== id && c[key] === updateData[key]);
        if (existing) {
          return res.status(400).json({
            message: `Course with this ${key === 'courseCode' ? 'code' : 'name'} already exists for this brand.`
          });
        }
        course[key] = updateData[key];
      } else if (key === 'duration') {
        course[key] = parseInt(updateData[key]);
      } else if (key === 'singleShotFee' || key === 'normalFee') {
        course[key] = parseFloat(updateData[key]);
      } else if (key === 'isActive') {
        course[key] = updateData[key] === 'true' || updateData[key] === true;
      } else if (key !== '_id' && key !== '__v' && key !== 'brand') {
        course[key] = updateData[key];
      }
    }

    await brand.save();

    // Update related customers if course name changed
    if (oldCourseName && oldCourseName !== course.courseName) {
      await Customer.updateMany(
        { coursePreference: oldCourseName, brand: brand._id },
        { $set: { "coursePreference.$": course.courseName } }
      );
    }

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

    const brand = await Brand.findOne({ "courses._id": id });
    if (!brand) {
      return res.status(404).json({ message: "Course not found." });
    }

    brand.courses.pull(id);
    await brand.save();

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

    const brand = await Brand.findOne({ "courses._id": id });
    if (!brand) {
      return res.status(404).json({ message: "Course not found." });
    }

    const course = brand.courses.id(id);
    course.isActive = !course.isActive;
    await brand.save();

    return res.status(200).json({
      message: `Course ${course.isActive ? 'activated' : 'deactivated'} successfully.`,
      course
    });
  } catch (error) {
    console.error("Toggle course status error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
