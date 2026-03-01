const ComponentCard = ({ title, children, className = "", bodyClassName = "p-4 sm:p-6", desc = "", handledBy = "", action }) => {
  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] ${className}`}
    >
      {/* Card Header */}
      <div className="px-6 py-5 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-medium text-gray-800 dark:text-white/90">
            {title}
          </h3>
          {(desc || handledBy) && (
            <div className="flex justify-between items-center mt-2">
              {desc && <p className="text-sm text-red-500 dark:text-red-400">{desc}</p>}
              {handledBy && <p className="text-sm text-gray-500 dark:text-blue-400">Attended by: {handledBy}</p>}
            </div>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>

      {/* Card Body */}
      <div className={`border-t border-gray-100 dark:border-gray-800 ${bodyClassName}`}>
        <div className="space-y-6">{children}</div>
      </div>
    </div>
  );
};

export default ComponentCard;
