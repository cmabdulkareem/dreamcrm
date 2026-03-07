import { useMemo } from "react";
import { getContactPointIcon } from "../leadHelpers";

/**
 * useLeadFiltering
 * Encapsulates all lead filter + sort logic previously inside RecentOrders.jsx.
 * @param {object} params
 * @returns {{ filteredData: Array, contactPointStats: object }}
 */
export function useLeadFiltering({
    data,
    search,
    sortOrder,
    statusFilter,
    leadStatusFilter,
    leadPotentialFilter,
    assignedUserFilter,
    campaignFilter,
    dateRange,
    user,
    canAssignLeads,
}) {
    const filteredData = useMemo(() => {
        return data
            .filter((item) => {
                // --- Search match ---
                const matchesSearch =
                    item.fullName?.toLowerCase().includes(search.toLowerCase()) ||
                    item.phone1?.includes(search);

                // --- Status filter (enquirer status) ---
                const matchesStatus = statusFilter ? item.status === statusFilter : true;

                // --- Lead Status filter ---
                const matchesLeadStatus = leadStatusFilter ? item.leadStatus === leadStatusFilter : true;

                // --- Lead Potential filter ---
                const matchesLeadPotential = leadPotentialFilter ? item.leadPotential === leadPotentialFilter : true;

                // --- Campaign filter ---
                const matchesCampaign = campaignFilter ? item.campaign === campaignFilter : true;

                // --- Assigned User filter (only for admins/managers) ---
                let matchesAssignedUser = true;
                if (canAssignLeads && assignedUserFilter) {
                    const assignedId = item.assignedTo?._id?.toString() || item.assignedTo?.toString();
                    if (assignedUserFilter === "unassigned") {
                        matchesAssignedUser = !assignedId;
                    } else {
                        matchesAssignedUser = assignedId === assignedUserFilter;
                    }
                }

                // --- Role-based visibility ---
                let isUserLead = true;
                if (!canAssignLeads) {
                    const assignedId = item.assignedTo?._id?.toString() || item.assignedTo?.toString();
                    const userId = user?.id?.toString() || user?._id?.toString();
                    if (!assignedId || assignedId !== userId) {
                        isUserLead = false;
                    }
                }

                // --- Date range filter ---
                let matchesDateRange = true;
                if (dateRange && dateRange.length > 0) {
                    const createdAtDate = new Date(item.createdAt);
                    createdAtDate.setHours(0, 0, 0, 0);

                    const followUpDateVal = item.followUpDate ? new Date(item.followUpDate) : null;
                    if (followUpDateVal) followUpDateVal.setHours(0, 0, 0, 0);

                    let convertedAtDate = item.convertedAt ? new Date(item.convertedAt) : null;
                    if (!convertedAtDate && item.leadStatus === 'converted' && item.remarks) {
                        const conversionRemark = item.remarks.find(r =>
                            r.leadStatus === 'converted' || r.remark?.includes("Admission taken")
                        );
                        if (conversionRemark && conversionRemark.updatedOn) {
                            convertedAtDate = new Date(conversionRemark.updatedOn);
                        }
                    }
                    if (convertedAtDate) convertedAtDate.setHours(0, 0, 0, 0);

                    if (dateRange.length === 2) {
                        const startDate = new Date(dateRange[0]);
                        const endDate = new Date(dateRange[1]);
                        startDate.setHours(0, 0, 0, 0);
                        endDate.setHours(0, 0, 0, 0);

                        if (item.leadStatus === 'converted') {
                            matchesDateRange = convertedAtDate && convertedAtDate >= startDate && convertedAtDate <= endDate;
                        } else {
                            const createdInRange = createdAtDate >= startDate && createdAtDate <= endDate;
                            const followUpInRange = followUpDateVal && followUpDateVal >= startDate && followUpDateVal <= endDate;
                            matchesDateRange = createdInRange || followUpInRange;
                        }
                    } else if (dateRange.length === 1) {
                        const filterDate = new Date(dateRange[0]);
                        filterDate.setHours(0, 0, 0, 0);

                        if (item.leadStatus === 'converted') {
                            matchesDateRange = convertedAtDate && convertedAtDate.getTime() === filterDate.getTime();
                        } else {
                            const createdMatches = createdAtDate.getTime() === filterDate.getTime();
                            const followUpMatches = followUpDateVal && followUpDateVal.getTime() === filterDate.getTime();
                            matchesDateRange = createdMatches || followUpMatches;
                        }
                    }
                }

                return matchesSearch && matchesStatus && matchesLeadStatus && matchesLeadPotential &&
                    matchesCampaign && matchesAssignedUser && isUserLead && matchesDateRange;
            })
            .sort((a, b) => {
                const getPotentialWeight = (pot) => {
                    const weights = { 'strongProspect': 4, 'potentialProspect': 3, 'weakProspect': 2, 'notAProspect': 1 };
                    return weights[pot] || 0;
                };

                const getStatusPriority = (status) => {
                    const inactiveStatuses = ['converted', 'lost', 'notInterested'];
                    if (inactiveStatuses.includes(status)) return 2;
                    return 1;
                };

                if (sortOrder === "followup_latest" || sortOrder === "followup_oldest") {
                    const dateA = a.followUpDate ? new Date(a.followUpDate) : null;
                    const dateB = b.followUpDate ? new Date(b.followUpDate) : null;
                    if (dateA) dateA.setHours(0, 0, 0, 0);
                    if (dateB) dateB.setHours(0, 0, 0, 0);

                    if (dateA?.getTime() !== dateB?.getTime()) {
                        if (!dateA && !dateB) return 0;
                        if (!dateA) return 1;
                        if (!dateB) return -1;
                        return sortOrder === "followup_latest" ? dateA - dateB : dateB - dateA;
                    }

                    const priorityA = getStatusPriority(a.leadStatus);
                    const priorityB = getStatusPriority(b.leadStatus);
                    if (priorityA !== priorityB) return priorityA - priorityB;

                    const weightA = getPotentialWeight(a.leadPotential);
                    const weightB = getPotentialWeight(b.leadPotential);
                    if (weightA !== weightB) return weightB - weightA;

                    return new Date(b.createdAt) - new Date(a.createdAt);
                }

                const dateA = new Date(a.createdAt);
                const dateB = new Date(b.createdAt);
                return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
            });
    }, [data, search, sortOrder, statusFilter, leadStatusFilter, leadPotentialFilter, assignedUserFilter, campaignFilter, dateRange, user, canAssignLeads]);

    // Contact point statistics based only on creation date within range
    const contactPointStats = useMemo(() => {
        const stats = {};

        const leadsInDateRange = filteredData.filter(lead => {
            if (!dateRange || dateRange.length === 0) return true;
            const createdAtDate = new Date(lead.createdAt);
            createdAtDate.setHours(0, 0, 0, 0);

            if (dateRange.length === 2) {
                const startDate = new Date(dateRange[0]);
                const endDate = new Date(dateRange[1]);
                startDate.setHours(0, 0, 0, 0);
                endDate.setHours(0, 0, 0, 0);
                return createdAtDate >= startDate && createdAtDate <= endDate;
            } else if (dateRange.length === 1) {
                const filterDate = new Date(dateRange[0]);
                filterDate.setHours(0, 0, 0, 0);
                return createdAtDate.getTime() === filterDate.getTime();
            }
            return true;
        });

        leadsInDateRange.forEach(lead => {
            let cp = lead.contactPoint || 'Not Specified';
            if (cp && cp !== 'Not Specified') {
                cp = cp.charAt(0).toUpperCase() + cp.slice(1).toLowerCase();
            }
            stats[cp] = (stats[cp] || 0) + 1;
        });

        return Object.entries(stats)
            .sort((a, b) => b[1] - a[1])
            .reduce((acc, [key, value]) => {
                acc[key] = value;
                return acc;
            }, {});
    }, [filteredData, dateRange]);

    return { filteredData, contactPointStats };
}
