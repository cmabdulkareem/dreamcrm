import { useState, useEffect, useRef, useCallback, forwardRef } from "react";
import axios from "axios";
import Input from "./input/InputField";
import LoadingSpinner from "../common/LoadingSpinner";
import { ChevronDownIcon } from "../../icons";

import API from "../../config/api";

const SearchableCourseSelect = forwardRef(({
  value,
  onChange,
  placeholder = "Search and select a course...",
  error,
  // Removed hint parameter as it's no longer needed
  disabled = false
}, ref) => {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  // Fetch courses from database
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API}/courses/all`, { withCredentials: true });
        const activeCourses = response.data.courses.filter(course => course.isActive);
        setCourses(activeCourses);
        setFilteredCourses(activeCourses);
      } catch (error) {
        console.error("Error fetching courses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  // Filter courses based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredCourses(courses.filter(course => course.isActive));
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = courses.filter(course =>
        course.isActive && (
          course.courseName.toLowerCase().includes(term) ||
          course.courseCode.toLowerCase().includes(term)
        )
      );
      setFilteredCourses(filtered);
    }
  }, [searchTerm, courses]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelect = useCallback((course) => {
    onChange(course._id);
    setIsOpen(false);
    setSearchTerm(`${course.courseCode} - ${course.courseName}`);
  }, [onChange]);

  const handleInputChange = useCallback((e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (value) {
      setIsOpen(true);
    }
  }, []);

  const handleInputFocus = useCallback(() => {
    if (!disabled) {
      setIsOpen(true);
    }
  }, [disabled]);

  const handleClear = useCallback(() => {
    setSearchTerm("");
    onChange("");
    inputRef.current?.focus();
  }, [onChange]);

  // If a value is provided but searchTerm is empty, set the display value
  useEffect(() => {
    if (value && !searchTerm) {
      const selectedCourse = courses.find(course => course._id === value);
      if (selectedCourse) {
        setSearchTerm(`${selectedCourse.courseCode} - ${selectedCourse.courseName}`);
      }
    }
  }, [value, courses, searchTerm]);

  // Simple search icon SVG
  const SearchIcon = () => (
    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );

  return (
    <div className="relative" ref={wrapperRef}>
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          error={error}
          // Removed hint prop as it's no longer needed
          disabled={disabled}
          className="pr-20" // Adjust padding to accommodate all icons on the right
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {loading ? (
            <LoadingSpinner className="" size="h-4 w-4" />
          ) : (
            <>
              <div className="flex items-center pr-2 border-r border-gray-300 dark:border-gray-700 mr-2">
                <SearchIcon />
              </div>
              <ChevronDownIcon className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </>
          )}
        </div>
        {searchTerm && !disabled && (
          <button
            type="button"
            className="absolute inset-y-0 right-12 flex items-center pr-2 text-gray-400 hover:text-gray-600"
            onClick={handleClear}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg dark:bg-gray-800">
          <div className="max-h-60 overflow-auto py-1">
            {filteredCourses.length === 0 ? (
              <div className="px-4 py-2 text-gray-500 dark:text-gray-400">
                {searchTerm ? "No courses found" : "No courses available"}
              </div>
            ) : (
              filteredCourses.map((course) => (
                <button
                  key={course._id}
                  type="button"
                  className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                  onClick={() => handleSelect(course)}
                >
                  <div className="font-medium">{course.courseName}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {course.courseCode} • {course.duration} months • ₹{course.normalFee}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
});

export default SearchableCourseSelect;