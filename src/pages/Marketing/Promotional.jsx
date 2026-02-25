import React, { useState, useEffect, useRef, useContext } from 'react';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import ComponentCard from '../../components/common/ComponentCard';
import Button from '../../components/ui/button/Button';
import { toast } from 'react-toastify';
import { promotionalService } from '../../services/promotionalService';
import { PlusIcon, TrashBinIcon } from '../../icons';
import { getImageUrl } from '../../utils/imageHelper';
import { AuthContext } from '../../context/AuthContext';

const TABS = [
    { id: 'image', label: 'Image' },
    { id: 'video', label: 'Video' },
    { id: 'raw', label: 'Raw Files' }
];

export default function Promotional() {
    const { selectedBrand } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState('image');
    const [items, setItems] = useState({ image: [], video: [], raw: [] });
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);
    const [uploadTitle, setUploadTitle] = useState('');
    const [showUploadModal, setShowUploadModal] = useState(false);

    useEffect(() => {
        fetchItems(activeTab);
    }, [activeTab]);

    const fetchItems = async (type) => {
        setLoading(true);
        try {
            const response = await promotionalService.getPromotionals(type);
            if (response.success) {
                setItems(prev => ({ ...prev, [type]: response.data }));
            }
        } catch (error) {
            console.error('Error fetching promotionals:', error);
            toast.error('Failed to load promotional materials');
        } finally {
            setLoading(false);
        }
    };

    const handleUploadClick = () => {
        setUploadTitle('');
        setShowUploadModal(true);
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!uploadTitle.trim()) {
            toast.error('Please enter a title before selecting a file');
            e.target.value = '';
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('title', uploadTitle);
        formData.append('type', activeTab);
        formData.append('file', file);

        const brandId = selectedBrand?._id || selectedBrand?.id;
        if (!brandId) {
            toast.error('Please select a brand before uploading.');
            setUploading(false);
            return;
        }

        try {
            const response = await promotionalService.uploadPromotional(formData, brandId);
            if (response.success) {
                toast.success('File uploaded successfully');
                setItems(prev => ({
                    ...prev,
                    [activeTab]: [response.data, ...prev[activeTab]]
                }));
                setShowUploadModal(false);
            }
        } catch (error) {
            console.error('Upload error:', error);
            const message = error.response?.data?.message || 'Failed to upload file';
            toast.error(message);
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this file?')) return;

        try {
            const response = await promotionalService.deletePromotional(id);
            if (response.success) {
                toast.success('File deleted successfully');
                setItems(prev => ({
                    ...prev,
                    [activeTab]: prev[activeTab].filter(item => item._id !== id)
                }));
            }
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('Failed to delete file');
        }
    };

    const formatSize = (bytes) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const renderFileCard = (item) => {
        const fileUrl = getImageUrl(item.fileUrl);

        return (
            <div key={item._id} className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all group">
                <div className="relative aspect-video bg-gray-100 dark:bg-gray-900 flex items-center justify-center overflow-hidden">
                    {item.type === 'image' ? (
                        <img src={fileUrl} alt={item.title} className="w-full h-full object-cover" />
                    ) : item.type === 'video' ? (
                        <video src={fileUrl} className="w-full h-full object-cover" controls preload="metadata" />
                    ) : (
                        <div className="flex flex-col items-center justify-center p-6 text-gray-500">
                            <svg className="w-12 h-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            <span className="text-sm font-medium uppercase tracking-wider">{item.originalName.split('.').pop()} file</span>
                        </div>
                    )}

                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={() => handleDelete(item._id)}
                            className="p-2 bg-red-500 text-white rounded-lg shadow-lg hover:bg-red-600 transition-colors"
                            title="Delete File"
                        >
                            <TrashBinIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white truncate" title={item.title}>{item.title}</h4>
                    <div className="flex justify-between items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <span className="truncate" title={item.originalName}>{item.originalName}</span>
                        <span className="shrink-0">{formatSize(item.size)}</span>
                    </div>
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                        <span className="text-xs text-gray-400">By {item.uploadedBy?.fullName || 'Unknown'}</span>
                        <a
                            href={fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-medium text-brand-500 hover:text-brand-600 flex items-center gap-1"
                            download={item.originalName}
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download
                        </a>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="p-6">
            <PageMeta title="Promotional Materials | DreamCRM" />
            <PageBreadcrumb
                pageTitle="Promotional Materials"
                items={[
                    { name: 'Home', path: '/' },
                    { name: 'Marketing', path: '/marketing' },
                    { name: 'Promotional' }
                ]}
            />

            <ComponentCard
                action={
                    <Button
                        size="sm"
                        onClick={handleUploadClick}
                        startIcon={<PlusIcon className="w-4 h-4" />}
                    >
                        Upload {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                    </Button>
                }
            >
                {/* Tabs */}
                <div className="flex gap-2 mb-8 border-b border-gray-200 dark:border-gray-800 pb-4 overflow-x-auto">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-6 py-2.5 text-sm font-semibold rounded-lg transition-all whitespace-nowrap ${activeTab === tab.id
                                ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
                    </div>
                ) : items[activeTab].length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
                        <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No {activeTab}s uploaded yet</h3>
                        <p className="text-sm text-gray-500">Click the upload button to add your first {activeTab}.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {items[activeTab].map(renderFileCard)}
                    </div>
                )}
            </ComponentCard>

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md p-6 shadow-2xl">
                        <h3 className="text-xl font-bold mb-6 text-gray-900 dark:text-white capitalize">
                            Upload {activeTab}
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Title / Description
                                </label>
                                <input
                                    type="text"
                                    value={uploadTitle}
                                    onChange={(e) => setUploadTitle(e.target.value)}
                                    placeholder="e.g., Summer Campaign Banner"
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Select File
                                </label>
                                <div className="relative">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        accept={activeTab === 'image' ? 'image/*' : activeTab === 'video' ? 'video/*' : '*/*'}
                                        disabled={uploading}
                                        className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 dark:file:bg-brand-500/10 dark:file:text-brand-400 disabled:opacity-50"
                                    />
                                    {uploading && (
                                        <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 flex items-center justify-center rounded-lg">
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-brand-500"></div>
                                            <span className="ml-2 text-sm text-brand-500 font-medium">Uploading...</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setShowUploadModal(false)}
                                disabled={uploading}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
