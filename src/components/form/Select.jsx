import { useState } from "react";

const Select = ({
  options,
  placeholder = "Select an option",
  onChange,
  className = "",
  defaultValue = "",
  value, // Add value prop
  disabled, // Add disabled prop
}) => {
  // Use controlled mode if value prop is provided, otherwise use internal state
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue);
  
  const selectedValue = isControlled ? value : internalValue;

  // Filter out duplicate options and options with invalid values to prevent key prop warnings
  const validOptions = options.filter(option => 
    option && 
    option.value !== undefined && 
    option.value !== null &&
    option.value !== ""
  );
  
  const uniqueOptions = validOptions.filter((option, index, self) => 
    index === self.findIndex(o => o.value === option.value)
  );

  // Find the selected option to get its color
  const selectedOption = uniqueOptions.find(option => option.value === selectedValue);
  const selectedColor = selectedOption && selectedOption.color ? selectedOption.color : "";

  const handleChange = (e) => {
    // Prevent changes when disabled
    if (disabled) return;
    
    const newValue = e.target.value;
    if (!isControlled) {
      setInternalValue(newValue);
    }
    onChange(newValue); // Trigger parent handler
  };

  return (
    <select
      className={`h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pr-11 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:placeholder:text-white/30 dark:focus:border-brand-800 ${
        selectedValue
          ? `text-gray-800 dark:text-white/90 ${selectedColor}`
          : "text-gray-400 dark:text-gray-400"
      } ${disabled ? "bg-gray-100 cursor-not-allowed opacity-40" : ""} ${className}`}
      value={selectedValue}
      onChange={handleChange}
      disabled={disabled} // Pass disabled prop to select element
    >
      {/* Placeholder option */}
      <option
        value=""
        disabled
        className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
      >
        {placeholder}
      </option>
      {/* Map over unique options */}
      {uniqueOptions.map((option) => (
        <option
          key={option.value}
          value={option.value}
          className={`text-gray-700 dark:bg-gray-900 dark:text-gray-400 ${option.color || ""}`}
        >
          {option.label}
        </option>
      ))}
    </select>
  );
};

export default Select;