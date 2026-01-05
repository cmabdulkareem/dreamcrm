import { useState, useEffect, useRef, useCallback, forwardRef } from "react";
import Input from "./input/InputField";
import LoadingSpinner from "../common/LoadingSpinner";
import { ChevronDownIcon } from "../../icons";

const SearchableLeadSelect = forwardRef(({
  leads = [],
  value,
  onChange,
  placeholder = "Search and select a converted lead...",
  error,
  disabled = false,
  loading = false
}, ref) => {
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  // Filter leads based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredLeads(leads);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = leads.filter(lead => {
        const name = (lead.fullName || "").toLowerCase();
        const email = (lead.email || "").toLowerCase();
        const phone = (lead.phone1 || "").toLowerCase();
        return name.includes(term) || email.includes(term) || phone.includes(term);
      });
      setFilteredLeads(filtered);
    }
  }, [searchTerm, leads]);

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

  const handleSelect = useCallback((lead) => {
    onChange(lead._id);
    setIsOpen(false);
    const displayName = lead.fullName || "Unnamed Lead";
    const displayEmail = lead.email ? ` (${lead.email})` : "";
    setSearchTerm(`${displayName}${displayEmail}`);
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
      const selectedLead = leads.find(lead => lead._id === value);
      if (selectedLead) {
        const displayName = selectedLead.fullName || "Unnamed Lead";
        const displayEmail = selectedLead.email ? ` (${selectedLead.email})` : "";
        setSearchTerm(`${displayName}${displayEmail}`);
      }
    }
  }, [value, leads, searchTerm]);

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
            {filteredLeads.length === 0 ? (
              <div className="px-4 py-2 text-gray-500 dark:text-gray-400">
                {searchTerm ? "No leads found" : "No converted leads available"}
              </div>
            ) : (
              filteredLeads.map((lead) => (
                <button
                  key={lead._id}
                  type="button"
                  className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                  onClick={() => handleSelect(lead)}
                >
                  <div className="font-medium">{lead.fullName || "Unnamed Lead"}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {lead.email || "No email"} • {lead.phone1 || "No phone"}
                  </div>
                </button>
              ))
            )}

            {/* Special option to add without lead */}
            <button
              type="button"
              className="block w-full px-4 py-2 text-left text-sm font-semibold text-brand-600 hover:bg-brand-50 bg-brand-50/30 border-t border-gray-100 dark:bg-brand-900/10 dark:hover:bg-brand-900/20 dark:border-gray-700"
              onClick={() => {
                onChange("no_lead");
                setIsOpen(false);
                setSearchTerm("--- Add Without Lead ---");
              }}
            >
              + Add Without Lead
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

export default SearchableLeadSelect;