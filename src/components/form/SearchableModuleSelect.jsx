import { useState, useEffect, useRef, useCallback, forwardRef } from "react";
import axios from "axios";
import Input from "./input/InputField";
import LoadingSpinner from "../common/LoadingSpinner";
import { ChevronDownIcon } from "../../icons";

import API from "../../config/api";

const SearchableModuleSelect = forwardRef(({
  value,
  onChange,
  placeholder = "Search and select a module...",
  initialLabel = "",
  error,
  disabled = false,
  brandId
}, ref) => {
  const [modules, setModules] = useState([]);
  const [filteredModules, setFilteredModules] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(initialLabel || "");
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  // Fetch modules from database
  useEffect(() => {
    const fetchModules = async () => {
      if (!brandId) return;
      try {
        setLoading(true);
        const response = await axios.get(`${API}/modules/all`, { 
          withCredentials: true,
          headers: { "x-brand-id": brandId }
        });
        const activeModules = (response.data.modules || []).filter(mod => mod.isActive);
        setModules(activeModules);
        setFilteredModules(activeModules);
      } catch (error) {
        console.error("Error fetching modules:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchModules();
  }, [brandId]);

  // Filter modules based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredModules(modules.filter(mod => mod.isActive));
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = modules.filter(mod =>
        mod.isActive && (
          mod.name.toLowerCase().includes(term)
        )
      );
      setFilteredModules(filtered);
    }
  }, [searchTerm, modules]);

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

  const handleSelect = useCallback((mod) => {
    onChange(mod._id);
    setIsOpen(false);
    setSearchTerm(mod.name);
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
    if (value) {
      const selectedModule = modules.find(mod => mod._id === value);
      if (selectedModule) {
        setSearchTerm(selectedModule.name);
      } else if (initialLabel && !searchTerm) {
        setSearchTerm(initialLabel);
      }
    }
  }, [value, modules, initialLabel]);

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
          disabled={disabled}
          className="pr-20"
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
            {filteredModules.length === 0 ? (
              <div className="px-4 py-2 text-gray-500 dark:text-gray-400">
                {searchTerm ? "No modules found" : "No modules available"}
              </div>
            ) : (
              filteredModules.map((mod) => (
                <button
                  key={mod._id}
                  type="button"
                  className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                  onClick={() => handleSelect(mod)}
                >
                  <div className="font-medium">{mod.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {mod.duration} months • ₹{mod.price || 0}
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

export default SearchableModuleSelect;
