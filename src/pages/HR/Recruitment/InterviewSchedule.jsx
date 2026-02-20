import React from 'react';
import PageMeta from '../../../components/common/PageMeta';
import PageBreadCrumb from '../../../components/common/PageBreadCrumb';
import ComponentCard from '../../../components/common/ComponentCard';
import { CalendarIcon, UserCircleIcon } from '../../../icons';

const InterviewSchedule = () => {
    const interviews = [
        { id: 1, date: '2023-11-15', time: '10:00 AM', candidate: 'Alice Smith', job: 'Senior React Developer', interviewer: 'Sarah Wilson', status: 'Scheduled' },
        { id: 2, date: '2023-11-15', time: '02:00 PM', candidate: 'Charlie Brown', job: 'UX Designer', interviewer: 'Mike Johnson', status: 'Scheduled' },
        { id: 3, date: '2023-11-16', time: '11:00 AM', candidate: 'Frank White', job: 'Senior React Developer', interviewer: 'Sarah Wilson', status: 'Pending' },
    ];

    return (
        <>
            <PageMeta title="Interview Schedule - CRM" />
            <PageBreadCrumb items={[{ name: 'HR', path: '/hr' }, { name: 'Recruitment', path: '/hr/recruitment' }, { name: 'Interviews' }]} />

            <ComponentCard title="Upcoming Interviews">
                <div className="space-y-4">
                    {interviews.map((interview) => (
                        <div key={interview.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div className="flex items-start gap-4">
                                <div className="bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400 p-3 rounded-lg text-center min-w-[60px]">
                                    <p className="text-xs font-bold uppercase">{new Date(interview.date).toLocaleString('default', { month: 'short' })}</p>
                                    <p className="text-xl font-bold">{new Date(interview.date).getDate()}</p>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900 dark:text-white text-lg">{interview.candidate}</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{interview.job}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-1 flex items-center gap-1">
                                        <UserCircleIcon className="w-4 h-4" /> Interviewer: {interview.interviewer}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-4 md:mt-0 flex flex-col items-end gap-2">
                                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-medium">
                                    <CalendarIcon className="w-5 h-5" />
                                    {interview.time}
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${interview.status === 'Scheduled' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                    }`}>
                                    {interview.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </ComponentCard>
        </>
    );
};

export default InterviewSchedule;
