import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Papa from 'papaparse';
import { toast } from 'react-toastify';
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";
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
    const [activeLevel, setActiveLevel] = useState('folders'); // folders, schools, streams, classes, students
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [breadcrumbs, setBreadcrumbs] = useState([{ name: 'Folders', level: 'folders' }]);

    const [selectedFolder, setSelectedFolder] = useState(null);
    const [selectedSchool, setSelectedSchool] = useState(null);
    const [selectedStream, setSelectedStream] = useState(null);
    const [selectedClass, setSelectedClass] = useState(null);

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // add, edit
    const [currentItem, setCurrentItem] = useState(null);
    const [formData, setFormData] = useState({});

    // CSV Import State
    const [importingStudents, setImportingStudents] = useState([]);
    const [showImportTable, setShowImportTable] = useState(false);

    useEffect(() => {
        fetchData();
    }, [activeLevel, selectedFolder, selectedSchool, selectedStream, selectedClass]);

    const fetchData = async () => {
        setLoading(true);
        try {
            let url = `${API}/prospect-database/folders`;
            if (activeLevel === 'schools' && selectedFolder) {
                url = `${API}/prospect-database/schools?folderId=${selectedFolder._id}`;
            } else if (activeLevel === 'streams' && selectedSchool) {
                url = `${API}/prospect-database/schools/${selectedSchool._id}/streams`;
            } else if (activeLevel === 'classes' && selectedStream) {
                url = `${API}/prospect-database/streams/${selectedStream._id}/classes`;
            } else if (activeLevel === 'students' && selectedClass) {
                url = `${API}/prospect-database/classes/${selectedClass._id}/students`;
            }

            const response = await axios.get(url);
            if (response.data.success) {
                setData(response.data.folders || response.data.schools || response.data.streams || response.data.classes || response.data.students);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const navigateTo = (level, item = null) => {
        if (level === 'folders') {
            setActiveLevel('folders');
            setSelectedFolder(null);
            setSelectedSchool(null);
            setSelectedStream(null);
            setSelectedClass(null);
            setBreadcrumbs([{ name: 'Folders', level: 'folders' }]);
        } else if (level === 'schools' && item) {
            setSelectedFolder(item);
            setActiveLevel('schools');
            setSelectedSchool(null);
            setSelectedStream(null);
            setSelectedClass(null);
            setBreadcrumbs([
                { name: 'Folders', level: 'folders' },
                { name: item.name, level: 'schools', item }
            ]);
        } else if (level === 'streams' && item) {
            setSelectedSchool(item);
            setActiveLevel('streams');
            setSelectedStream(null);
            setSelectedClass(null);
            setBreadcrumbs([
                { name: 'Folders', level: 'folders' },
                { name: selectedFolder.name, level: 'schools', item: selectedFolder },
                { name: item.name, level: 'streams', item }
            ]);
        } else if (level === 'classes' && item) {
            setSelectedStream(item);
            setActiveLevel('classes');
            setSelectedClass(null);
            setBreadcrumbs([
                { name: 'Folders', level: 'folders' },
                { name: selectedFolder.name, level: 'schools', item: selectedFolder },
                { name: selectedSchool.name, level: 'streams', item: selectedSchool },
                { name: item.name, level: 'classes', item }
            ]);
        } else if (level === 'students' && item) {
            setSelectedClass(item);
            setActiveLevel('students');
            setBreadcrumbs([
                { name: 'Folders', level: 'folders' },
                { name: selectedFolder.name, level: 'schools', item: selectedFolder },
                { name: selectedSchool.name, level: 'streams', item: selectedSchool },
                { name: selectedStream.name, level: 'classes', item: selectedStream },
                { name: item.name, level: 'students', item }
            ]);
        }
    };

    const handleLevelBack = () => {
        if (activeLevel === 'students') navigateTo('classes', selectedStream);
        else if (activeLevel === 'classes') navigateTo('streams', selectedSchool);
        else if (activeLevel === 'streams') navigateTo('schools', selectedFolder);
        else if (activeLevel === 'schools') navigateTo('folders');
    };

    const getSingular = (level) => {
        if (level === 'classes') return 'Class';
        if (level === 'students') return 'Student';
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
            let url = `${API}/prospect-database/folders`;
            let method = 'post';

            if (activeLevel === 'folders') {
                if (modalMode === 'edit') {
                    url += `/${currentItem._id}`;
                    method = 'put';
                }
            } else if (activeLevel === 'schools') {
                url = `${API}/prospect-database/schools`;
                formData.folderId = selectedFolder._id;
                if (modalMode === 'edit') {
                    url += `/${currentItem._id}`;
                    method = 'put';
                }
            } else if (activeLevel === 'streams') {
                url = `${API}/prospect-database/schools/${selectedSchool._id}/streams`;
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
            await axios.delete(`${API}/prospect-database/${endpoint}/${id}`);
            toast.success('Deleted successfully');
            fetchData();
        } catch (error) {
            console.error('Error deleting:', error);
            toast.error('Failed to delete');
        }
    };

    const handleCsvImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.errors.length > 0) {
                    toast.error('Error parsing CSV file');
                    return;
                }

                const students = results.data.map((row, index) => ({
                    sn: index + 1,
                    name: row.name || row.Name || '',
                    gender: row.gender || row.Gender || '',
                    place: '',
                    phone: '',
                    remark: '',
                    tempId: Math.random().toString(36).substr(2, 9)
                })).filter(s => s.name);

                if (students.length === 0) {
                    toast.error('No valid students found in CSV. Ensure columns are named "name" and "gender".');
                    return;
                }

                setImportingStudents(students);
                setShowImportTable(true);
                e.target.value = ''; // Reset for re-imports
            }
        });
    };

    const handleInlineEdit = (id, field, value) => {
        if (field === 'phone' && value && !/^\d*$/.test(value)) return;
        setImportingStudents(prev => prev.map(s => s.tempId === id ? { ...s, [field]: value } : s));
    };

    const handleBulkSave = async () => {
        try {
            const studentsToSave = importingStudents.map(({ sn, tempId, ...rest }) => rest);
            await axios.post(`${API}/prospect-database/classes/${selectedClass._id}/students/bulk`, { students: studentsToSave });
            toast.success('Students imported successfully');
            setShowImportTable(false);
            setImportingStudents([]);
            fetchData();
        } catch (error) {
            console.error('Error importing students:', error);
            toast.error('Failed to import students');
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
                                    onClick={() => navigateTo(bc.level, bc.item)}
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
                    {activeLevel === 'students' && (
                        <div className="relative">
                            <label
                                htmlFor="student-csv-upload"
                                className="inline-flex items-center justify-center gap-2 rounded-lg transition px-4 py-2 text-sm bg-transparent text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/[0.03] dark:hover:text-gray-300 cursor-pointer"
                            >
                                <GridIcon className="mr-2 h-4 w-4" /> Import CSV
                            </label>
                            <input
                                type="file"
                                id="student-csv-upload"
                                className="hidden"
                                accept=".csv"
                                onChange={handleCsvImport}
                            />
                        </div>
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
                ) : (showImportTable || activeLevel === 'students') ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                                    <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200">SN</th>
                                    <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200">Name</th>
                                    <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200">Gender</th>
                                    <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200">Place</th>
                                    <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200">Mobile</th>
                                    <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200">Remark</th>
                                    {activeLevel === 'students' && !showImportTable && <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200 text-right">Actions</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {(showImportTable ? importingStudents : data).map((item, idx) => (
                                    <tr key={item._id || item.tempId} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{item.sn || idx + 1}</td>
                                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white uppercase">{item.name}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 uppercase">{item.gender}</td>
                                        <td className="px-4 py-3 text-sm">
                                            {showImportTable ? (
                                                <input
                                                    type="text"
                                                    value={item.place}
                                                    onChange={(e) => handleInlineEdit(item.tempId, 'place', e.target.value)}
                                                    className="w-full bg-transparent border-b border-transparent focus:border-brand-500 focus:outline-none py-1 px-2"
                                                    placeholder="Enter place..."
                                                />
                                            ) : (
                                                <span className="text-gray-600 dark:text-gray-400 uppercase">{item.place || '-'}</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            {showImportTable ? (
                                                <input
                                                    type="text"
                                                    value={item.phone}
                                                    onChange={(e) => handleInlineEdit(item.tempId, 'phone', e.target.value)}
                                                    className="w-full bg-transparent border-b border-transparent focus:border-brand-500 focus:outline-none py-1 px-2"
                                                    placeholder="Enter mobile..."
                                                />
                                            ) : (
                                                <span className="text-gray-600 dark:text-gray-400">{item.phone || '-'}</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            {showImportTable ? (
                                                <input
                                                    type="text"
                                                    value={item.remark}
                                                    onChange={(e) => handleInlineEdit(item.tempId, 'remark', e.target.value)}
                                                    className="w-full bg-transparent border-b border-transparent focus:border-brand-500 focus:outline-none py-1 px-2"
                                                    placeholder="Add remark..."
                                                />
                                            ) : (
                                                <span className="text-gray-600 dark:text-gray-400">{item.socialMedia || '-'}</span>
                                            )}
                                        </td>
                                        {activeLevel === 'students' && !showImportTable && (
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => handleShowModal('edit', item)} className="text-gray-400 hover:text-brand-500"><PencilIcon className="h-4 w-4" /></button>
                                                    <button onClick={() => handleDelete(item._id)} className="text-gray-400 hover:text-red-500"><TrashBinIcon className="h-4 w-4" /></button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {showImportTable && (
                            <div className="flex justify-end gap-3 mt-6 p-4">
                                <Button variant="outline" onClick={() => setShowImportTable(false)}>Cancel Import</Button>
                                <Button onClick={handleBulkSave}>Save All Students</Button>
                            </div>
                        )}
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
                                    if (activeLevel === 'folders') navigateTo('schools', item);
                                    else if (activeLevel === 'schools') navigateTo('streams', item);
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
                                            placeholder="Select Gender"
                                            options={[
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
