export const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Urgent'];

export const STATUS_OPTIONS = ['Pending', 'In Progress', 'Completed', 'Cancelled'];

export const PRIORITY_FILTER_OPTIONS = [
    { value: "", label: "All Priority" },
    { value: "Low", label: "Low" },
    { value: "Medium", label: "Medium" },
    { value: "High", label: "High" },
    { value: "Urgent", label: "Urgent" }
];

export const STATUS_FILTER_OPTIONS = [
    { value: "", label: "All Status" },
    { value: "Pending", label: "Pending" },
    { value: "In Progress", label: "In Progress" },
    { value: "Completed", label: "Completed" },
    { value: "Cancelled", label: "Cancelled" }
];

export const PRIORITY_STYLES = {
    Urgent: { badge: 'error', color: '#ef4444', modal: 'bg-red-50 text-red-700 border-red-200' },
    High: { badge: 'warning', color: '#f59e0b', modal: 'bg-orange-50 text-orange-700 border-orange-200' },
    Medium: { badge: 'info', color: '#3b82f6', modal: 'bg-blue-50 text-blue-700 border-blue-200' },
    Low: { badge: 'success', color: '#10b981', modal: 'bg-green-50 text-green-700 border-green-200' },
    default: { badge: 'light', color: '#6b7280', modal: 'bg-gray-50 text-gray-700 border-gray-200' }
};
