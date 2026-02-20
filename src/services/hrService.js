import { toast } from 'react-toastify';

// Mock Data
let employees = [
    { id: 1, name: 'Sarah Wilson', role: 'HR Manager', email: 'sarah@example.com', joinDate: '2023-01-15', status: 'Active', department: 'HR' },
    { id: 2, name: 'Mike Johnson', role: 'Sales Manager', email: 'mike@example.com', joinDate: '2023-03-10', status: 'Active', department: 'Sales' },
    { id: 3, name: 'Emily Davis', role: 'Counselor', email: 'emily@example.com', joinDate: '2023-05-22', status: 'On Leave', department: 'Counseling' },
    { id: 4, name: 'Robert Brown', role: 'Instructor', email: 'robert@example.com', joinDate: '2023-06-01', status: 'Active', department: 'Academic' },
];

let jobs = [
    { id: 1, title: 'Senior React Developer', department: 'Engineering', type: 'Full-time', status: 'Active', applicants: 12, description: 'We are looking for an experienced React developer...', requirements: '5+ years experience...' },
    { id: 2, title: 'Marketing Specialist', department: 'Marketing', type: 'Part-time', status: 'Active', applicants: 5, description: 'Join our marketing team...', requirements: '3+ years experience...' },
    { id: 3, title: 'UX Designer', department: 'Design', type: 'Contract', status: 'Closed', applicants: 24, description: 'Design beautiful user interfaces...', requirements: 'Portfolio required...' },
];

let candidates = [
    { id: 1, name: 'Alice Smith', job: 'Senior React Developer', stage: 'Interview', date: '2023-11-10', email: 'alice@example.com' },
    { id: 2, name: 'Bob Jones', job: 'Marketing Specialist', stage: 'Applied', date: '2023-11-12', email: 'bob@example.com' },
    { id: 3, name: 'Charlie Brown', job: 'UX Designer', stage: 'Screening', date: '2023-11-11', email: 'charlie@example.com' },
];

let interviews = [
    { id: 1, date: '2023-11-15', time: '10:00 AM', candidate: 'Alice Smith', job: 'Senior React Developer', interviewer: 'Sarah Wilson', status: 'Scheduled' },
    { id: 2, date: '2023-11-15', time: '02:00 PM', candidate: 'Charlie Brown', job: 'UX Designer', interviewer: 'Mike Johnson', status: 'Scheduled' },
    { id: 3, date: '2023-11-16', time: '11:00 AM', candidate: 'Frank White', job: 'Senior React Developer', interviewer: 'Sarah Wilson', status: 'Pending' },
];

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const hrService = {
    // Stats & Dashboard
    getStats: async () => {
        await delay(500);
        return {
            totalEmployees: employees.length,
            onLeaveToday: employees.filter(e => e.status === 'On Leave').length,
            openPositions: jobs.filter(j => j.status === 'Active').length,
            interviewsToday: interviews.filter(i => i.date === new Date().toISOString().split('T')[0]).length || 0
        };
    },

    getRecentActivity: async () => {
        await delay(500);
        return [
            { id: 1, user: 'Sarah Wilson', action: 'Applied for leave', time: '2 hours ago', type: 'leave' },
            { id: 2, user: 'John Doe', action: 'Completed onboarding', time: '4 hours ago', type: 'onboarding' },
            { id: 3, user: 'Recruitment Team', action: 'Posted new job: Senior React Dev', time: '1 day ago', type: 'job' },
        ];
    },

    // Employees
    getEmployees: async () => {
        await delay(600);
        return [...employees];
    },

    getEmployee: async (id) => {
        await delay(300);
        return employees.find(e => e.id === Number(id));
    },

    createEmployee: async (data) => {
        await delay(800);
        const newEmployee = { ...data, id: employees.length + 1, status: 'Active' };
        employees.push(newEmployee);
        toast.success('Employee added successfully');
        return newEmployee;
    },

    updateEmployee: async (id, data) => {
        await delay(800);
        const index = employees.findIndex(e => e.id === Number(id));
        if (index !== -1) {
            employees[index] = { ...employees[index], ...data };
            toast.success('Employee updated successfully');
            return employees[index];
        }
        throw new Error('Employee not found');
    },

    deleteEmployee: async (id) => {
        await delay(500);
        employees = employees.filter(e => e.id !== Number(id));
        toast.success('Employee deactivated');
        return true;
    },

    // Jobs
    getJobs: async () => {
        await delay(600);
        return [...jobs];
    },

    getJob: async (id) => {
        await delay(300);
        return jobs.find(j => j.id === Number(id));
    },

    createJob: async (data) => {
        await delay(800);
        const newJob = { ...data, id: jobs.length + 1, applicants: 0, status: 'Active' };
        jobs.push(newJob);
        toast.success('Job posted successfully');
        return newJob;
    },

    updateJob: async (id, data) => {
        await delay(800);
        const index = jobs.findIndex(j => j.id === Number(id));
        if (index !== -1) {
            jobs[index] = { ...jobs[index], ...data };
            toast.success('Job updated successfully');
            return jobs[index];
        }
        throw new Error('Job not found');
    },

    deleteJob: async (id) => {
        await delay(500);
        jobs = jobs.filter(j => j.id !== Number(id));
        toast.success('Job deleted');
        return true;
    },

    // Candidates
    getCandidates: async () => {
        await delay(600);
        return [...candidates];
    },

    // Interviews
    getInterviews: async () => {
        await delay(600);
        return [...interviews];
    }
};
