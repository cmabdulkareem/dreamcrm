import { useState } from "react";

const ChartTab = ({ onPeriodChange, defaultPeriod = "monthly" }) => {
  const [selected, setSelected] = useState(defaultPeriod);

  const handleSelect = (period) => {
    setSelected(period);
    if (onPeriodChange) {
      onPeriodChange(period);
    }
  };

  const getButtonClass = (option) =>
    selected === option
      ? "shadow-theme-xs text-gray-900 dark:text-white bg-white dark:bg-gray-800"
      : "text-gray-500 dark:text-gray-400";

  return (
    <div className="flex items-center gap-0.5 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900">
      <button
        onClick={() => handleSelect("monthly")}
        className={`px-3 py-2 font-medium w-full rounded-md text-theme-sm hover:text-gray-900 dark:hover:text-white ${getButtonClass(
          "monthly"
        )}`}
      >
        Monthly
      </button>

      <button
        onClick={() => handleSelect("quarterly")}
        className={`px-3 py-2 font-medium w-full rounded-md text-theme-sm hover:text-gray-900 dark:hover:text-white ${getButtonClass(
          "quarterly"
        )}`}
      >
        Quarterly
      </button>

      <button
        onClick={() => handleSelect("yearly")}
        className={`px-3 py-2 font-medium w-full rounded-md text-theme-sm hover:text-gray-900 dark:hover:text-white ${getButtonClass(
          "yearly"
        )}`}
      >
        Annually
      </button>
    </div>
  );
};

export default ChartTab;
