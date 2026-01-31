import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";
import Label from "../../components/ui/form/Label";
import Input from "../../components/ui/form/input/Input";
import Select from "../../components/ui/form/Select";
import {
    FolderIcon,
    TrashBinIcon,
    PencilIcon,
    PlusIcon,
    ChevronLeftIcon,
    UserIcon,
    GridIcon
} from "../../icons";
import API from "../../config/api";

const Databases = () => {
    const [activeLevel, setActiveLevel] = useState('schools'); // schools, streams, classes, students
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [breadcrumbs, setBreadcrumbs] = useState([{ name: 'Schools', level: 'schools' }]);

    const [selectedSchool, setSelectedSchool] = useState(null);
    const [selectedStream, setSelectedStream] = useState(null);
    const [selectedClass, setSelectedClass] = useState(null);

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // add, edit
    const [currentItem, setCurrentItem] = useState(null);
    const [formData, setFormData] = useState({});

    useEffect(() => {
        fetchData();
    }, [activeLevel, selectedSchool, selectedStream, selectedClass]);

    const fetchData = async () => {
        setLoading(true);
        try {
            let url = `${API}/prospect-database/schools`;
            if (activeLevel === 'streams' && selectedSchool) {
                url = `${API}/prospect-database/schools/${selectedSchool._id}/streams`;
            } else if (activeLevel === 'classes' && selectedStream) {
                url = `${API}/prospect-database/streams/${selectedStream._id}/classes`;
            } else if (activeLevel === 'students' && selectedClass) {
                url = `${API}/prospect-database/classes/${selectedClass._id}/students`;
            }

            const response = await axios.get(url);
            if (response.data.success) {
                setData(response.data.schools || response.data.streams || response.data.classes || response.data.students);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const navigateTo = (level, item = null) => {
        if (level === 'schools') {
            setActiveLevel('schools');
            setSelectedSchool(null);
            setSelectedStream(null);
            setSelectedClass(null);
            setBreadcrumbs([{ name: 'Schools', level: 'schools' }]);
        } else if (level === 'streams' && item) {
            setSelectedSchool(item);
            setActiveLevel('streams');
            setBreadcrumbs([
                { name: 'Schools', level: 'schools' },
                { name: item.name, level: 'streams' }
            ]);
        } else if (level === 'classes' && item) {
            setSelectedStream(item);
            setActiveLevel('classes');
            setBreadcrumbs([
                { name: 'Schools', level: 'schools' },
                { name: selectedSchool.name, level: 'streams' },
                { name: item.name, level: 'classes' }
            ]);
        } else if (level === 'students' && item) {
            setSelectedClass(item);
            setActiveLevel('students');
            setBreadcrumbs([
                { name: 'Schools', level: 'schools' },
                { name: selectedSchool.name, level: 'streams' },
                { name: selectedStream.name, level: 'classes' },
                { name: item.name, level: 'students' }
            ]);
        }
    };

    const handleLevelBack = () => {
        if (activeLevel === 'students') navigateTo('classes', selectedStream);
        else if (activeLevel === 'classes') navigateTo('streams', selectedSchool);
        else if (activeLevel === 'streams') navigateTo('schools');
    };

    const getSingular = (level) => {
        if (level === 'classes') return 'Class';
        return level.charAt(0).toUpperCase() + level.slice(1, -1);
    };

    const handleShowModal = (mode, item = null) => {
        setModalMode(mode);
        setCurrentItem(item);
        if (mode === 'edit' && item) {
            setFormData({ ...item });
        } else {
            setFormData({});
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            let url = `${API}/prospect-database/schools`;
            let method = 'post';

            if (activeLevel === 'schools') {
                if (modalMode === 'edit') {
                    url += `/${currentItem._id}`;
                    method = 'put';
                }
            } else if (activeLevel === 'streams') {
                url = `${API}/prospect-database/schools/${selectedSchool._id}/streams`;
                if (modalMode === 'edit') {
                    // Implement stream edit if needed, for now only delete/add
                }
            } else if (activeLevel === 'classes') {
                url = `${API}/prospect-database/streams/${selectedStream._id}/classes`;
            } else if (activeLevel === 'students') {
                url = `${API}/prospect-database/classes/${selectedClass._id}/students`;
            }

            await axios[method](url, formData);
            toast.success(`${getSingular(activeLevel)} saved successfully`);
            setShowModal(false);
            fetchData();
        } catch (error) {
            console.error('Error saving data:', error);
            toast.error('Failed to save data');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this? All children will also be deleted.')) return;
        try {
            let endpoint = activeLevel;
            if (endpoint === 'classes') endpoint = 'classes'; // already class
            await axios.delete(`${API}/prospect-database/${endpoint}/${id}`);
            toast.success('Deleted successfully');
            fetchData();
        } catch (error) {
            console.error('Error deleting:', error);
            toast.error('Failed to delete');
        }
    };

    return (
        <div className="p-6">
            <PageMeta title="Prospect Databases | DreamCRM" description="Manage schools, streams, classes and students" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <PageBreadcrumb pageTitle="Prospect Databases" />
                    <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                        {breadcrumbs.map((bc, idx) => (
                            <React.Fragment key={idx}>
                                <span
                                    className={`cursor-pointer hover:text-brand-500 transition-colors ${idx === breadcrumbs.length - 1 ? 'font-semibold text-brand-600' : ''}`}
                                    onClick={() => navigateTo(bc.level)}
                                >
                                    {bc.name}
                                </span>
                                {idx < breadcrumbs.length - 1 && <span>/</span>}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {activeLevel !== 'schools' && (
                        <Button variant="outline" size="sm" onClick={handleLevelBack}>
                            <ChevronLeftIcon className="mr-2 h-4 w-4" /> Back
                        </Button>
                    )}
                    <Button size="sm" onClick={() => handleShowModal('add')}>
                        <PlusIcon className="mr-2 h-4 w-4" /> Add {getSingular(activeLevel)}
                    </Button>
                </div>
            </div>

            <ComponentCard>
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
                    </div>
                ) : data.length === 0 ? (
                    <div className="text-center py-12">
                        <FolderIcon className="mx-auto h-12 w-12 text-gray-300" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900">No {activeLevel} found</h3>
                        <p className="mt-1 text-sm text-gray-500">Get started by adding a new {getSingular(activeLevel)}.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {data.map((item) => (
                            <div
                                key={item._id}
                                className="group relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:shadow-lg hover:border-brand-500 transition-all duration-300 cursor-pointer"
                                onClick={() => {
                                    if (activeLevel === 'schools') navigateTo('streams', item);
                                    else if (activeLevel === 'streams') navigateTo('classes', item);
                                    else if (activeLevel === 'classes') navigateTo('students', item);
                                }}
                            >
                                <div className="flex items-center gap-4 mb-4">
                                    <div className={`p-3 rounded-lg ${activeLevel === 'students' ? 'bg-orange-100 text-orange-600' :
                                        activeLevel === 'classes' ? 'bg-blue-100 text-blue-600' :
                                            activeLevel === 'streams' ? 'bg-purple-100 text-purple-600' :
                                                'bg-brand-100 text-brand-600'
                                        }`}>
                                        {activeLevel === 'students' ? <UserIcon className="h-6 w-6" /> : <FolderIcon className="h-6 w-6" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                                            {item.name}
                                        </h4>
                                        {activeLevel === 'schools' && (
                                            <p className="text-sm text-gray-500 truncate">{item.place}</p>
                                        )}
                                        {activeLevel === 'students' && (
                                            <p className="text-sm text-gray-500 truncate">{item.phone}</p>
                                        )}
                                    </div>
                                </div>

                                {activeLevel === 'students' && (
                                    <div className="space-y-2 mb-4">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-gray-500">Gender:</span>
                                            <span className="font-medium">{item.gender}</span>
                                        </div>
                                        {item.place && (
                                            <div className="flex justify-between text-xs">
                                                <span className="text-gray-500">Place:</span>
                                                <span className="font-medium">{item.place}</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                                    <button
                                        className="p-1.5 text-gray-400 hover:text-brand-500 transition-colors"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleShowModal('edit', item);
                                        }}
                                    >
                                        <PencilIcon className="h-4 w-4" />
                                    </button>
                                    <button
                                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(item._id);
                                        }}
                                    >
                                        <TrashBinIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </ComponentCard>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md p-6 shadow-2xl">
                        <h3 className="text-xl font-bold mb-6">
                            {modalMode === 'add' ? 'Add' : 'Edit'} {getSingular(activeLevel)}
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label>Name</Label>
                                <Input
                                    value={formData.name || ''}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Enter name"
                                    required
                                />
                            </div>

                            {activeLevel === 'schools' && (
                                <div>
                                    <Label>Place</Label>
                                    <Input
                                        value={formData.place || ''}
                                        onChange={(e) => setFormData({ ...formData, place: e.target.value })}
                                        placeholder="Enter place"
                                        required
                                    />
                                </div>
                            )}

                            {activeLevel === 'students' && (
                                <>
                                    <div>
                                        <Label>Phone</Label>
                                        <Input
                                            value={formData.phone || ''}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            placeholder="Enter phone number"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label>Alt Contact Number</Label>
                                        <Input
                                            value={formData.contactNumber || ''}
                                            onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                                            placeholder="Enter alternative contact"
                                        />
                                    </div>
                                    <div>
                                        <Label>Place</Label>
                                        <Input
                                            value={formData.place || ''}
                                            onChange={(e) => setFormData({ ...formData, place: e.target.value })}
                                            placeholder="Enter student's place"
                                        />
                                    </div>
                                    <div>
                                        <Label>Social Media</Label>
                                        <Input
                                            value={formData.socialMedia || ''}
                                            onChange={(e) => setFormData({ ...formData, socialMedia: e.target.value })}
                                            placeholder="Instagram/Facebook link"
                                        />
                                    </div>
                                    <div>
                                        <Label>Gender</Label>
                                        <Select
                                            value={formData.gender || ''}
                                            onChange={(value) => setFormData({ ...formData, gender: value })}
                                            options={[
                                                { label: 'Select Gender', value: '' },
                                                { label: 'Male', value: 'Male' },
                                                { label: 'Female', value: 'Female' },
                                                { label: 'Other', value: 'Other' }
                                            ]}
                                        />
                                    </div>
                                </>
                            )}

                            <div className="flex justify-end gap-3 mt-8">
                                <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                                <Button type="submit">Save {getSingular(activeLevel)}</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Databases;
