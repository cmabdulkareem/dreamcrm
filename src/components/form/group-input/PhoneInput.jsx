import { useEffect, useState } from "react";

const PhoneInput = ({
  countries,
  placeholder = "+1 (555) 000-0000",
  value = "",
  onChange,
  selectPosition = "start",
  disabled, // Add disabled prop
}) => {
  const [selectedCountry, setSelectedCountry] = useState("IN");
  const [internalValue, setInternalValue] = useState(value);

  // Map from code string to country
  const codeToCountry = countries.reduce(
    (acc, { code, label }) => ({ ...acc, [label]: code }),
    {}
  );

  // Sync internal value from parent
  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  const handleCountryChange = (e) => {
    if (disabled) return; // Prevent changes when disabled
    
    const newCountry = e.target.value;
    setSelectedCountry(newCountry);
    const code = countries.find(c => c.code === newCountry)?.label || "";
    if (internalValue.startsWith("+")) {
      // replace country code
      const numberWithoutCode = internalValue.replace(/^\+\d+/, "");
      const newVal = code + numberWithoutCode;
      setInternalValue(newVal);
      onChange?.(newVal);
    } else {
      setInternalValue(code);
      onChange?.(code);
    }
  };

  const handlePhoneNumberChange = (e) => {
    if (disabled) return; // Prevent changes when disabled
    
    let newValue = e.target.value;

    // Allow only numbers and optional leading +
    if (newValue === "" || /^\+?\d*$/.test(newValue)) {
      setInternalValue(newValue);
      onChange?.(newValue);

      // Auto-detect country based on prefix
      const matchedCode = Object.keys(codeToCountry)
        .sort((a, b) => b.length - a.length) // longest match first
        .find(code => newValue.startsWith(code));
      if (matchedCode) {
        setSelectedCountry(codeToCountry[matchedCode]);
      }
    }
  };

  return (
    <div className="relative flex">
      {selectPosition === "start" && (
        <div className="absolute">
          <select
            value={selectedCountry}
            onChange={handleCountryChange}
            className="appearance-none rounded-l-lg border-0 border-r border-gray-200 bg-transparent py-3 pl-3.5 pr-8 text-gray-700 dark:border-gray-800 dark:text-gray-400"
            disabled={disabled} // Pass disabled prop to select
          >
            {countries.map((country) => (
              <option key={country.code} value={country.code}>
                {country.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <input
        type="tel"
        value={internalValue}
        onChange={handlePhoneNumberChange}
        placeholder={placeholder}
        className={`h-11 w-full ${
          selectPosition === "start" ? "pl-[84px]" : "pr-[84px]"
        } rounded-lg border border-gray-300 px-4 text-sm dark:bg-gray-900 dark:text-white ${
          disabled ? "bg-gray-100 cursor-not-allowed opacity-40" : "" // Match Input component styling
        }`}
        disabled={disabled} // Pass disabled prop to input
      />

      {selectPosition === "end" && (
        <div className="absolute right-0">
          <select
            value={selectedCountry}
            onChange={handleCountryChange}
            className="appearance-none rounded-r-lg border-0 border-l border-gray-200 bg-transparent py-3 pl-3.5 pr-8 text-gray-700 dark:border-gray-800 dark:text-gray-400"
            disabled={disabled} // Pass disabled prop to select
          >
            {countries.map((country) => (
              <option key={country.code} value={country.code}>
                {country.code}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

export default PhoneInput;