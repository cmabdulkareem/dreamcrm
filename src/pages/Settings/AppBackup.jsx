import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import API from '../../config/api';
import { BoxIcon, DownloadIcon, TrashBinIcon, RefreshIcon, PlusIcon } from '../../icons';
import ComponentCard from '../../components/common/ComponentCard';
import PageBreadCrumb from '../../components/common/PageBreadCrumb';
import PageMeta from '../../components/common/PageMeta';

const AppBackup = () => {
    const [backups, setBackups] = useState([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [restoring, setRestoring] = useState(false);

    const fetchBackups = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API}/backup/list`, {
                withCredentials: true,
                timeout: 30000 // 30s timeout for file listing
            });
            setBackups(response?.data?.backups || []);
        } catch (error) {
            toast.error('Failed to fetch backups');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBackups();
    }, []);

    const handleCreateBackup = async () => {
        try {
            setCreating(true);
            const response = await axios.post(`${API}/backup/create`, {}, {
                withCredentials: true,
                timeout: 120000 // 2 min for creating backup
            });
            toast.success(response?.data?.message || 'Backup created');
            fetchBackups();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create backup');
        } finally {
            setCreating(false);
        }
    };

    const handleDownload = (filename) => {
        window.open(`${API}/backup/download/${filename}`, '_blank');
    };

    const handleCopyLink = (filename) => {
        const url = `${API}/backup/download/${filename}`;
        navigator.clipboard.writeText(url).then(() => {
            toast.success('Download link copied to clipboard');
        }).catch(() => {
            toast.error('Failed to copy link');
        });
    };

    const handleDelete = async (filename) => {
        if (!window.confirm('Are you sure you want to delete this backup?')) return;
        try {
            await axios.delete(`${API}/backup/${filename}`, {
                withCredentials: true,
                timeout: 10000
            });
            toast.success('Backup deleted');
            fetchBackups();
        } catch (error) {
            toast.error('Failed to delete backup');
        }
    };

    const handleRestore = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!window.confirm('WARNING: Restoring will overwrite all current data and files. Are you absolutely sure?')) {
            e.target.value = null;
            return;
        }

        const formData = new FormData();
        formData.append('backup', file);

        try {
            setRestoring(true);
            const response = await axios.post(`${API}/backup/restore`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                withCredentials: true,
                timeout: 300000 // 5 min for restoration
            });
            toast.success(response?.data?.message || 'System restored successfully');
            // Optionally redirect or reload
            setTimeout(() => window.location.reload(), 2000);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Restore failed');
        } finally {
            setRestoring(false);
            e.target.value = null;
        }
    };

    const formatSize = (bytes) => {
        if (!bytes || bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <>
            <PageMeta title="App Backup & Restore | Student Management" />
            <PageBreadCrumb pageTitle="App Backup & Restore" />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <ComponentCard title="Generate Backup">
                    <div className="p-4 text-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl space-y-4">
                        <div className="flex justify-center">
                            <div className="p-4 bg-brand-50 dark:bg-brand-900/20 text-brand-500 rounded-full">
                                <BoxIcon className="w-12 h-12" />
                            </div>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">System-Wide Backup</h3>
                        <p className="text-sm text-gray-500 max-w-xs mx-auto">
                            This will create a complete zip archive of all database collections and uploaded files.
                        </p>
                        <button
                            onClick={handleCreateBackup}
                            disabled={creating}
                            className="flex items-center justify-center w-full px-4 py-3 text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors disabled:opacity-50"
                        >
                            {creating ? (
                                <RefreshIcon className="w-5 h-5 mr-2 animate-spin" />
                            ) : (
                                <RefreshIcon className="w-5 h-5 mr-2" />
                            )}
                            {creating ? 'Creating Backup...' : 'Generate New Backup'}
                        </button>
                    </div>
                </ComponentCard>

                <ComponentCard title="Restore from File">
                    <div className="p-4 text-center border-2 border-dashed border-red-100 dark:border-red-900/20 rounded-xl space-y-4 bg-red-50/10">
                        <div className="flex justify-center">
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full">
                                <PlusIcon className="w-12 h-12" />
                            </div>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Restore System</h3>
                        <p className="text-sm text-red-500 font-medium max-w-xs mx-auto">
                            CAUTION: This will replace all current data with the contents of the backup file.
                        </p>
                        <div className="relative">
                            <input
                                type="file"
                                accept=".zip"
                                onChange={handleRestore}
                                disabled={restoring}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                            />
                            <div className="flex items-center justify-center w-full px-4 py-3 text-red-600 border border-red-200 dark:border-red-900/50 bg-red-50/50 hover:bg-red-50 rounded-lg transition-colors">
                                {restoring ? (
                                    <RefreshIcon className="w-5 h-5 mr-2 animate-spin" />
                                ) : (
                                    <PlusIcon className="w-5 h-5 mr-2" />
                                )}
                                {restoring ? 'Restoring System...' : 'Upload & Restore (.zip)'}
                            </div>
                        </div>
                    </div>
                </ComponentCard>
            </div>

            <div className="mt-8">
                <ComponentCard title="Recent Backups on Server">
                    {loading ? (
                        <div className="flex justify-center py-10">
                            <RefreshIcon className="w-10 h-10 animate-spin text-brand-500" />
                        </div>
                    ) : (backups?.length || 0) === 0 ? (
                        <div className="text-center py-10 text-gray-500">
                            No backups found on server.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="border-b border-gray-200 dark:border-gray-800">
                                    <tr>
                                        <th className="px-4 py-3 text-sm font-medium text-gray-500">Filename</th>
                                        <th className="px-4 py-3 text-sm font-medium text-gray-500">Size</th>
                                        <th className="px-4 py-3 text-sm font-medium text-gray-500">Created At</th>
                                        <th className="px-4 py-3 text-sm font-medium text-gray-500 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {backups?.map((backup) => (
                                        <tr key={backup.name} className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/10 transition-colors">
                                            <td className="px-4 py-4 text-sm font-medium text-gray-800 dark:text-gray-200">{backup.name}</td>
                                            <td className="px-4 py-4 text-sm text-gray-500">{formatSize(backup.size)}</td>
                                            <td className="px-4 py-4 text-sm text-gray-500">
                                                {backup.createdAt && new Date(backup.createdAt).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-4 text-right space-x-2">
                                                <button
                                                    onClick={() => handleCopyLink(backup.name)}
                                                    className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                                    title="Copy Download Link"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDownload(backup.name)}
                                                    className="p-2 text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors"
                                                    title="Download"
                                                >
                                                    <DownloadIcon className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(backup.name)}
                                                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <TrashBinIcon className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </ComponentCard>
            </div>
        </>
    );
};

export default AppBackup;
