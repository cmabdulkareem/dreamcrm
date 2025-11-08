import Badge from "../ui/badge/Badge";

const LeadCard = ({ name, datetime, callback, note, status }) => {
  // Map lead status to badge colors
  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase() || "";
    if (statusLower.includes("converted") || statusLower === "qualified") return "success";
    if (statusLower.includes("negotiation") || statusLower.includes("contacted")) return "info";
    if (statusLower.includes("call") || statusLower === "new") return "warning";
    if (statusLower.includes("lost") || statusLower.includes("not interested")) return "error";
    return "light";
  };

  return (
    <div className="rounded-lg border border-gray-50 bg-gray-100 p-4 dark:border-gray-700 dark:bg-gray-800">
      {/* Top Row */}
      <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-300">
        <span className="font-medium text-gray-800 dark:text-white">{name}</span>
        <span>{datetime}</span>
        <span className="text-gray-500 dark:text-gray-400">
          <Badge
            size="sm"
            color={getStatusColor(status)}
          >
            {status || "N/A"}
          </Badge>
        </span>
      </div>

      {/* Middle Row */}
      <div className="mt-2 text-sm text-gray-700 dark:text-gray-200">
        {note}
      </div>

      {/* Bottom Row */}
      {callback && (
        <div className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
          Next Follow-up: {callback}
        </div>
      )}
    </div>
  );
};

export default LeadCard;
