import { useEffect, useRef } from "react";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.css";
import Label from "./Label";
import { CalenderIcon } from "../../icons";

export default function RangeDatePicker({
    id,
    onChange,
    label,
    value,
    placeholder = "Select date range",
}) {
    const fp = useRef(null);

    useEffect(() => {
        fp.current = flatpickr(`#${id}-wrapper`, {
            mode: "range",
            appendTo: window.document.body,
            monthSelectorType: "static",
            dateFormat: "Y-m-d",
            wrap: true,
            allowInput: true,
            defaultDate: value,
            onChange: (selectedDates, dateStr) => {
                if (onChange) onChange(selectedDates, dateStr);
            },
        });

        return () => {
            if (fp.current) {
                fp.current.destroy();
                fp.current = null;
            }
        };
    }, [id]);

    // Sync value if changed externally
    useEffect(() => {
        if (fp.current && value !== undefined) {
            fp.current.setDate(value, false);
        }
    }, [value]);

    return (
        <div className="w-full">
            {label && <Label htmlFor={id}>{label}</Label>}

            <div className="relative" id={`${id}-wrapper`}>
                <input
                    id={id}
                    placeholder={placeholder}
                    data-input
                    readOnly
                    className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs transition-colors placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />

                <span
                    data-toggle
                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500 transition-colors hover:text-brand-500 dark:text-gray-400"
                >
                    <CalenderIcon className="size-6" />
                </span>
            </div>
        </div>
    );
}
