import React from 'react';
import Badge from "../../../components/ui/badge/Badge";
import { PRIORITY_STYLES } from '../constants/taskConstants';

export const getPriorityBadge = (priority) => {
    const style = PRIORITY_STYLES[priority] || PRIORITY_STYLES.default;
    return <Badge color={style.badge}>{priority}</Badge>;
};

export const getPriorityColor = (priority) => {
    const style = PRIORITY_STYLES[priority] || PRIORITY_STYLES.default;
    return style.color;
};

export const getStatusBadge = (status) => {
    switch (status) {
        case 'Completed': return <Badge color="success">{status}</Badge>;
        case 'In Progress': return <Badge color="info">{status}</Badge>;
        case 'Cancelled': return <Badge color="error">{status}</Badge>;
        case 'Pending': return <Badge color="warning">{status}</Badge>;
        default: return <Badge color="light">{status}</Badge>;
    }
};

export const getPriorityModalClass = (priority) => {
    const style = PRIORITY_STYLES[priority] || PRIORITY_STYLES.default;
    return style.modal;
};
