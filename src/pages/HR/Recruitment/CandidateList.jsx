import React, { useState, useEffect } from 'react';
import PageMeta from '../../../components/common/PageMeta';
import PageBreadCrumb from '../../../components/common/PageBreadCrumb';
import ComponentCard from '../../../components/common/ComponentCard';
import { hrService } from '../../../services/hrService';

const CandidateList = () => {
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCandidates = async () => {
            try {
                setLoading(true);
                const data = await hrService.getCandidates();
                setCandidates(data);
            } catch (error) {
                console.error('Error fetching candidates:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCandidates();
    }, []);

    const stages = [
        { name: 'Applied', color: 'text-gray-600' },
        { name: 'Screening', color: 'text-yellow-600' },
        { name: 'Interview', color: 'text-purple-600' },
        { name: 'Offer', color: 'text-blue-600' },
        { name: 'Rejected', color: 'text-red-600' },
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
