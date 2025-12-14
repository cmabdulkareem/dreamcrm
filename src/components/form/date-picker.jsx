import { useEffect, useRef } from "react";
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
  value, // Add value prop
  placeholder = "dd/mm/yyyy",
  minDate, // Add minDate prop
  disablePastDates, // Add disablePastDates prop
}) {
  // Use value if provided, otherwise use defaultDate
  const dateValue = value || defaultDate;
  const fp = useRef(null);

  useEffect(() => {
    // Create disable configuration for past dates if needed
    const disableConfig = disablePastDates ? [
      {
        from: "1900-01-01",
        to: new Date().toISOString().split('T')[0] // Use today's date instead of yesterday
      }
    ] : [];

    fp.current = flatpickr(`#${id}`, {
      mode: mode || "single",
      static: true,
      monthSelectorType: "static",
      dateFormat: "Y-m-d",
      altInput: true,
      altFormat: "d/m/Y",
      allowInput: true,
      clickOpens: false, // Ensure calendar only opens on icon click
      defaultDate: dateValue,
      minDate: minDate || null, // Set minDate if provided
      disable: disableConfig, // Disable past dates if requested
      onChange,
    });

    return () => {
      if (fp.current) {
        fp.current.destroy();
        fp.current = null;
      }
    };
  }, [mode, onChange, id, dateValue, minDate, disablePastDates]);

  return (
    <div>
      {label && <Label htmlFor={id}>{label}</Label>}

      <div className="relative">
        <input
          id={id}
          placeholder={placeholder}
          className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3  dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30  bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700  dark:focus:border-brand-800"
        />

        <span
          onClick={() => fp.current?.open()}
          className="absolute text-gray-500 -translate-y-1/2 right-3 top-1/2 dark:text-gray-400 cursor-pointer hover:text-brand-500 transition-colors"
        >
          <CalenderIcon className="size-6" />
        </span>
      </div>
    </div>
  );
}