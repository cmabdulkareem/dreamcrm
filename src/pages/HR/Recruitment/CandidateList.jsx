import React from 'react';
import PageMeta from '../../../components/common/PageMeta';
import PageBreadCrumb from '../../../components/common/PageBreadCrumb';
import ComponentCard from '../../../components/common/ComponentCard';

const CandidateList = () => {
    const stages = [
        { name: 'Applied', color: 'bg-blue-100 text-blue-800' },
        { name: 'Screening', color: 'bg-yellow-100 text-yellow-800' },
        { name: 'Interview', color: 'bg-purple-100 text-purple-800' },
        { name: 'Offer', color: 'bg-green-100 text-green-800' },
        { name: 'Rejected', color: 'bg-red-100 text-red-800' },
    ];

    const candidates = [
        { id: 1, name: 'Alice Smith', job: 'Senior React Developer', stage: 'Interview', date: '2023-11-10' },
        { id: 2, name: 'Bob Jones', job: 'Marketing Specialist', stage: 'Applied', date: '2023-11-12' },
        { id: 3, name: 'Charlie Brown', job: 'UX Designer', stage: 'Screening', date: '2023-11-11' },
        { id: 4, name: 'David Lee', job: 'Senior React Developer', stage: 'Offer', date: '2023-11-05' },
        { id: 5, name: 'Eva Green', job: 'Marketing Specialist', stage: 'Rejected', date: '2023-11-01' },
    ];

    return (
        <>
            <PageMeta title="Candidates - CRM" />
            <PageBreadCrumb items={[{ name: 'HR', path: '/hr' }, { name: 'Recruitment', path: '/hr/recruitment' }, { name: 'Candidates' }]} />

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6 overflow-x-auto pb-4">
                {stages.map((stage) => (
                    <div key={stage.name} className="min-w-[250px] bg-gray-50 dark:bg-gray-800 rounded-lg p-4 h-full">
                        <h3 className={`font-semibold mb-4 px-3 py-1 rounded-full text-xs inline-block ${stage.color}`}>
                            {stage.name}
                        </h3>
                        <div className="space-y-3">
                            {candidates.filter(c => c.stage === stage.name).map((candidate) => (
                                <div key={candidate.id} className="bg-white dark:bg-gray-700 p-3 rounded shadow-sm border border-gray-100 dark:border-gray-600 cursor-pointer hover:shadow-md transition-shadow">
                                    <p className="font-medium text-gray-900 dark:text-white">{candidate.name}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{candidate.job}</p>
                                    <p className="text-xs text-gray-400 mt-2">{candidate.date}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
};

export default CandidateList;
