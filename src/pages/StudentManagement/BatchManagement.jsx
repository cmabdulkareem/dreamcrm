import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import PageMeta from '../../components/common/PageMeta';
import ComponentCard from '../../components/common/ComponentCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Button from '../../components/ui/button/Button';
import API from '../../config/api';
import { AuthContext } from '../../context/AuthContext';
import BatchAccordion from '../../components/BatchManagement/BatchAccordion';
import CreateBatchModal from '../../components/BatchManagement/CreateBatchModal';
import { isAdmin, isOwner, isManager } from '../../utils/roleHelpers';
import HolidayCalendarModal from '../../components/BatchManagement/HolidayCalendarModal';

export default function BatchManagement() {
    const { user } = useContext(AuthContext);
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
    const canCreate = isAdmin(user) || isOwner(user) || isManager(user);

    useEffect(() => {
        fetchBatches();
    }, []);

    const fetchBatches = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API}/batches`, { withCredentials: true });
            setBatches(response.data.batches);
        } catch (error) {
            console.error("Error fetching batches:", error);
            toast.error("Failed to load batches.");
        } finally {
            setLoading(false);
        }
    };

    const handleBatchCreated = (newBatch) => {
        setBatches([newBatch, ...batches]);
        setIsModalOpen(false);
    };

    const handleBatchUpdated = (updatedBatch) => {
        setBatches(batches.map(b => b._id === updatedBatch._id ? updatedBatch : b));
    };

    const handleBatchDeleted = (batchId) => {
        setBatches(batches.filter(b => b._id !== batchId));
    };

    return (
        <div className="p-4 md:p-6">
            <PageMeta
                title="Batch Management | DreamCRM"
                description="Manage students in structured batches"
            />
            <PageBreadcrumb pageTitle="Batch Management" />

            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Structured Batches</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage batches with improved student search and addition.</p>
                </div>
                {canCreate && (
                    <div className="flex gap-3 w-full sm:w-auto">
                        <Button variant="outline" onClick={() => setIsHolidayModalOpen(true)} className="flex-1 sm:flex-none">
                            Manage Holidays
                        </Button>
                        <Button variant="primary" onClick={() => setIsModalOpen(true)} className="flex-1 sm:flex-none">
                            Create New Batch
                        </Button>
                    </div>
                )}
            </div>

            {loading ? (
                <LoadingSpinner />
            ) : batches.length > 0 ? (
                <div className="space-y-4">
                    {batches.map(batch => (
                        <BatchAccordion
                            key={batch._id}
                            batch={batch}
                            onUpdate={handleBatchUpdated}
                            onDelete={handleBatchDeleted}
                        />
                    ))}
                </div>
            ) : (
                <ComponentCard>
                    <div className="text-center py-10">
                        <p className="text-gray-500 dark:text-gray-400 mb-4">No batches found for this brand.</p>
                        {canCreate && (
                            <Button variant="outline" onClick={() => setIsModalOpen(true)}>
                                Start by creating your first batch
                            </Button>
                        )}
                    </div>
                </ComponentCard>
            )}

            {isModalOpen && (
                <CreateBatchModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onCreated={handleBatchCreated}
                />
            )}

            {isHolidayModalOpen && (
                <HolidayCalendarModal
                    isOpen={isHolidayModalOpen}
                    onClose={() => setIsHolidayModalOpen(false)}
                />
            )}
            <ToastContainer position="top-center" autoClose={3000} className="!z-[999999]" style={{ zIndex: 999999 }} />
        </div>
    );
}
