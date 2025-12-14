import { useEffect, useRef, useState } from "react";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.css";
import Label from "./Label";
import { CalenderIcon } from "../../icons";

export default function DatePicker({
  id,
  mode,
  onChange,
  label,
  defaultDate,
  value,
  placeholder = "dd/mm/yyyy",
  minDate,
  disablePastDates,
}) {
  const dateValue = value || defaultDate;
  const fp = useRef(null);
  // State to manage the input display value
  const [inputValue, setInputValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  // Sync internal state when external value changes
  useEffect(() => {
    if (dateValue) {
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        const d = String(date.getDate()).padStart(2, "0");
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const y = date.getFullYear();
        setInputValue(`${d}/${m}/${y}`);
      }
    } else {
      setInputValue("");
    }
  }, [dateValue]);

  useEffect(() => {
    const disableConfig = disablePastDates ? [
      {
        from: "1900-01-01",
        to: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split('T')[0] // Disable up to yesterday
      }
    ] : [];

    // Initialize flatpickr with wrap: true to control the input manually
    fp.current = flatpickr(`#${id}-wrapper`, {
      mode: mode || "single",
      static: true,
      monthSelectorType: "static",
      dateFormat: "Y-m-d",
      wrap: true, // Key: allows us to wrap custom input structure
      allowInput: true,
      clickOpens: false,
      defaultDate: dateValue,
      minDate: minDate || null,
      disable: disableConfig,
      onChange: (selectedDates, dateStr) => {
        // When calendar picks a date, update our custom input
        if (selectedDates.length > 0) {
          const d = String(selectedDates[0].getDate()).padStart(2, "0");
          const m = String(selectedDates[0].getMonth() + 1).padStart(2, "0");
          const y = selectedDates[0].getFullYear();
          setInputValue(`${d}/${m}/${y}`);
          if (onChange) onChange(selectedDates, dateStr);
        }
      },
    });

    return () => {
      if (fp.current) {
        fp.current.destroy();
        fp.current = null;
      }
    };
  }, [mode, onChange, id, minDate, disablePastDates]); // removed dateValue to avoid re-init on every keypress

  const MASK = "dd/mm/yyyy";

  const handleFocus = () => {
    setIsFocused(true);
    if (!inputValue) {
      setInputValue(MASK);
      // Hack to move cursor to start after render
      setTimeout(() => {
        const input = document.getElementById(id);
        if (input) input.setSelectionRange(0, 0);
      }, 0);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (inputValue === MASK) {
      setInputValue("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "Tab") return;

    e.preventDefault();
    const input = e.target;
    let selectionStart = input.selectionStart;
    let currentVal = inputValue;

    // Handle Backspace
    if (e.key === "Backspace") {
      if (selectionStart > 0) {
        let deleteIndex = selectionStart - 1;
        // Skip over separator if deleting specific char
        if (currentVal[deleteIndex] === '/') {
          deleteIndex--;
        }

        if (deleteIndex >= 0) {
          const nextChar = MASK[deleteIndex]; // Restore mask char
          const newVal = currentVal.substring(0, deleteIndex) + nextChar + currentVal.substring(deleteIndex + 1);
          setInputValue(newVal);
          // Move cursor back
          setTimeout(() => input.setSelectionRange(deleteIndex, deleteIndex), 0);

          // Clear flatpickr if invalid
          if (fp.current) fp.current.clear();
        }
      }
      return;
    }

    // Only accept numbers
    if (!/^\d$/.test(e.key)) return;

    // Find next editable slot
    if (selectionStart < MASK.length) {
      if (currentVal[selectionStart] === '/') {
        selectionStart++;
      }
      if (selectionStart < MASK.length) {
        const newVal = currentVal.substring(0, selectionStart) + e.key + currentVal.substring(selectionStart + 1);
        setInputValue(newVal);

        // Move cursor forward
        const nextCursor = selectionStart + 1;
        setTimeout(() => input.setSelectionRange(nextCursor, nextCursor), 0);

        // Check if full date entered
        if (!newVal.includes('d') && !newVal.includes('m') && !newVal.includes('y')) {
          // Parse and set to Flatpickr
          // Basic validation could go here
          const [d, m, y] = newVal.split('/');
          const isoDate = `${y}-${m}-${d}`;
          if (fp.current) {
            fp.current.setDate(isoDate, true); // true = trigger onChange

            // Sync back to verify acceptance (e.g. if disabled date was typed)
            const selected = fp.current.selectedDates[0];
            if (selected) {
              const dStr = String(selected.getDate()).padStart(2, "0");
              const mStr = String(selected.getMonth() + 1).padStart(2, "0");
              const yStr = selected.getFullYear();
              const formatted = `${dStr}/${mStr}/${yStr}`;
              if (formatted !== newVal) {
                setInputValue(formatted);
              }
            } else {
              // Was invalid/rejected and cleared
              setInputValue(MASK);
            }
          }
        }
      }
    }
  };

  return (
    <div>
      {label && <Label htmlFor={id}>{label}</Label>}

      <div className="relative" id={`${id}-wrapper`}>
        <input
          id={id}
          value={inputValue}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          onChange={() => { }} // Controlled via onKeyDown
          placeholder={placeholder}
          data-input // Important for proper flatpickr wrapping
          className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3  dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30  bg-transparent  border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700  dark:focus:border-brand-800 ${isFocused && inputValue === MASK ? 'text-gray-400' : 'text-gray-800'}`}
        />

        <span
          data-toggle // Toggle trigger for flatpickr wrap: true
          className="absolute text-gray-500 -translate-y-1/2 right-3 top-1/2 dark:text-gray-400 cursor-pointer hover:text-brand-500 transition-colors"
        >
          <CalenderIcon className="size-6" />
        </span>
      </div>
    </div>
  );
}