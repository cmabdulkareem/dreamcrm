import React, { useState, useEffect, useContext } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthContext } from '../../context/AuthContext';
import ComponentCard from '../../components/common/ComponentCard';
import PageMeta from '../../components/common/PageMeta';
import PageBreadCrumb from '../../components/common/PageBreadCrumb';
import InputField from '../../components/form/input/InputField';
import Label from '../../components/form/Label';
import TinyEditor from '../../components/form/input/Editor';
import axios from 'axios';
import {
    Plus,
    Trash2,
    Pencil,
    FileText,
    AlertCircle,
    Clock,
    Save,
    FileCheck,
    X,
} from 'lucide-react';
import Badge from '../../components/ui/badge/Badge';
import Button from '../../components/ui/button/Button';
import { Modal } from '../../components/ui/modal';
import { useModal } from '../../hooks/useModal';
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableCell,
} from "../../components/ui/table";
import API from "../../config/api";

const AgreementBuilder = () => {
    const { user } = useContext(AuthContext);

    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentTemplateId, setCurrentTemplateId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        sections: [{ title: '', content: '', order: 0 }]
    });

    const { isOpen: isFormOpen, openModal: openFormModal, closeModal: closeFormModal } = useModal();

    const fetchTemplates = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API}/hr/agreements`, {
                withCredentials: true
            });
            setTemplates(response.data);
        } catch (error) {
            console.error('Error fetching templates:', error);
            toast.error('Failed to load agreement templates');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTemplates();
    }, []);

    const handleAddSection = () => {
        setFormData(prev => ({
            ...prev,
            sections: [...prev.sections, { title: '', content: '', order: prev.sections.length }]
        }));
    };

    const handleRemoveSection = (index) => {
        const newSections = formData.sections.filter((_, i) => i !== index);
        const updatedSections = newSections.map((s, i) => ({ ...s, order: i }));
        setFormData(prev => ({ ...prev, sections: updatedSections }));
    };

    const handleSectionChange = (index, field, value) => {
        const newSections = [...formData.sections];
        newSections[index][field] = value;
        setFormData(prev => ({ ...prev, sections: newSections }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) return toast.error('Template name is required');
        if (formData.sections.some(s => !s.title.trim() || !s.content.trim())) {
            return toast.error('All sections must have a title and content');
        }

        try {
            if (isEditing) {
                await axios.put(`${API}/hr/agreements/${currentTemplateId}`, formData, {
                    withCredentials: true
                });
                toast.success('Template updated successfully');
            } else {
                await axios.post(`${API}/hr/agreements`, formData, {
                    withCredentials: true
                });
                toast.success('Template created successfully');
            }
            handleCloseForm();
            fetchTemplates();
        } catch (error) {
            console.error('Error saving template:', error);
            toast.error(error.response?.data?.message || 'Failed to save template');
        }
    };

    const handleEdit = (template) => {
        setFormData({
            name: template.name,
            sections: template.sections.map(s => ({ ...s }))
        });
        setCurrentTemplateId(template._id);
        setIsEditing(true);
        openFormModal();
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this template?')) return;
        try {
            await axios.delete(`${API}/hr/agreements/${id}`, { withCredentials: true });
            toast.success('Template deleted successfully');
            fetchTemplates();
        } catch (error) {
            toast.error('Failed to delete template');
        }
    };

    const handleToggleActive = async (id, currentStatus) => {
        try {
            await axios.put(`${API}/hr/agreements/${id}`, { isActive: !currentStatus }, { withCredentials: true });
            toast.success(currentStatus ? 'Template deactivated' : 'Template activated!');
            fetchTemplates();
        } catch (error) {
            toast.error('Failed to update template status');
        }
    };

    const handleOpenCreate = () => {
        setFormData({
            name: '',
            sections: [{ title: '', content: '', order: 0 }]
        });
        setIsEditing(false);
        setCurrentTemplateId(null);
        openFormModal();
    };

    const handleCloseForm = () => {
        closeFormModal();
        setIsEditing(false);
        setCurrentTemplateId(null);
    };

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-white/[0.03] pb-20 text-gray-900 dark:text-white">
            <PageMeta title="Agreement Builder | CDC Insights" />
            <PageBreadCrumb pageTitle="Manage Agreement Templates" />

            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
                <ComponentCard className="!p-0 border border-gray-200 dark:border-gray-800 shadow-theme-xs overflow-hidden bg-white dark:bg-gray-900">
                    {/* Container Header */}
                    <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white/90">
                                    Agreement Templates
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <p className="text-xs text-gray-400">
                                        Total: {templates.length} templates
                                    </p>
                                    <span className="text-gray-300 dark:text-gray-700 font-light">|</span>
                                    <p className="text-[10px] text-gray-400 font-medium italic">
                                        Manage global recruitment agreements
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Button
                                    size="sm"
                                    onClick={handleOpenCreate}
                                    className="h-10 px-6 rounded-lg bg-brand-500 hover:bg-brand-600 text-white font-semibold flex items-center gap-2 shadow-sm transition-all active:scale-95"
                                >
                                    <Plus className="size-5" strokeWidth={2.5} />
                                    New Template
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Table Section */}
                    <div className="overflow-x-auto">
                        <Table className="min-w-full border-collapse">
                            <TableHeader className="bg-gray-50 dark:bg-gray-900 shadow-[0_1px_0_0_rgba(0,0,0,0.05)] border-b border-gray-100 dark:border-gray-800">
                                <TableRow>
                                    <TableCell isHeader className="py-4 px-6 font-bold text-gray-700 text-start text-[10.5px] dark:text-gray-400 uppercase tracking-widest pl-10 relative">
                                        Template Name
                                    </TableCell>
                                    <TableCell isHeader className="py-4 px-6 font-bold text-gray-700 text-start text-[10.5px] dark:text-gray-400 uppercase tracking-widest border-l border-gray-100 dark:border-gray-800/50">
                                        Date Updated
                                    </TableCell>
                                    <TableCell isHeader className="py-4 px-6 font-bold text-gray-700 text-start text-[10.5px] dark:text-gray-400 uppercase tracking-widest border-l border-gray-100 dark:border-gray-800/50">
                                        Sections
                                    </TableCell>
                                    <TableCell isHeader className="py-4 px-6 font-bold text-gray-700 text-center text-[10.5px] dark:text-gray-400 uppercase tracking-widest border-l border-gray-100 dark:border-gray-800/50">
                                        Status
                                    </TableCell>
                                    <TableCell isHeader className="py-4 px-6 font-bold text-gray-700 text-center text-[10.5px] dark:text-gray-400 uppercase tracking-widest border-l border-gray-100 dark:border-gray-800/50">
                                        Actions
                                    </TableCell>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {loading ? (
                                    Array(3).fill(0).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell colSpan={5} className="p-4"><div className="h-8 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : templates.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="py-12 text-center text-gray-500 italic">
                                            No agreement templates found. Create your first one to start onboarding!
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    templates.map((tpl) => (
                                        <TableRow key={tpl._id} className="group hover:bg-slate-50/80 dark:hover:bg-white/5 odd:bg-transparent even:bg-gray-50/30 dark:even:bg-white/[0.01]">
                                            <TableCell className="py-4 px-6 pl-10 relative font-semibold text-gray-800 dark:text-white/90">
                                                <div className={`absolute left-0 top-0 bottom-0 w-[6px] ${tpl.isActive ? 'bg-brand-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
                                                {tpl.name}
                                            </TableCell>
                                            <TableCell className="py-4 px-6 border-l border-gray-100 dark:border-gray-800/50 text-theme-sm text-gray-500 dark:text-gray-400">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="size-3.5" />
                                                    {new Date(tpl.updatedAt).toLocaleDateString()}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 px-6 border-l border-gray-100 dark:border-gray-800/50 text-theme-sm text-gray-500 dark:text-gray-400 font-medium">
                                                {tpl.sections?.length || 0} Modules
                                            </TableCell>
                                            <TableCell className="py-4 px-6 border-l border-gray-100 dark:border-gray-800/50 text-center">
                                                {tpl.isActive ? (
                                                    <Badge color="success" size="sm" variant="light" className="font-bold">ACTIVE</Badge>
                                                ) : (
                                                    <Badge color="light" size="sm" variant="light" className="font-bold">DRAFT</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="py-4 px-6 border-l border-gray-100 dark:border-gray-800/50 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleEdit(tpl)}
                                                        className="p-2 text-gray-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 rounded-lg transition-all"
                                                        title="Edit Template"
                                                    >
                                                        <Pencil className="size-4.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleToggleActive(tpl._id, tpl.isActive)}
                                                        className={`p-2 rounded-lg transition-all ${tpl.isActive
                                                            ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10'
                                                            : 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10'}`}
                                                        title={tpl.isActive ? 'Deactivate' : 'Activate'}
                                                    >
                                                        {tpl.isActive ? <X className="size-4.5" /> : <FileCheck className="size-4.5" />}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(tpl._id)}
                                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                                                        title="Delete Template"
                                                    >
                                                        <Trash2 className="size-4.5" />
                                                    </button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </ComponentCard>
            </div>

            {/* Builder Modal */}
            <Modal
                isOpen={isFormOpen}
                onClose={handleCloseForm}
                className="max-w-[1280px] p-0 overflow-hidden bg-white dark:bg-gray-900 rounded-3xl"
            >
                <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-white/[0.02]">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">
                            {isEditing ? 'Edit Agreement Template' : 'Create New Agreement'}
                        </h2>
                        <p className="text-xs text-gray-500 mt-1">Define sections and rich-text content for the onboarding document.</p>
                    </div>
                    <button
                        onClick={handleCloseForm}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    >
                        <X className="size-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar">
                    <div className="space-y-8">
                        {/* Template Name Header */}
                        <div className="p-6 rounded-2xl bg-brand-50/50 dark:bg-brand-500/5 border border-brand-100 dark:border-brand-500/20">
                            <Label htmlFor="tpl-name" className="!text-[10.5px] font-black uppercase tracking-widest text-brand-600 dark:text-brand-400 mb-4 block">
                                Template Identification
                            </Label>
                            <InputField
                                id="tpl-name"
                                placeholder="e.g., Software Engineer Offer Agreement - March 2024"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                className="!bg-white dark:!bg-gray-800 !rounded-xl h-12 !border-gray-200 dark:!border-gray-700 font-semibold focus:!border-brand-500"
                                required
                            />
                        </div>

                        {/* Sections Area */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between pb-2">
                                <h4 className="text-base font-bold text-gray-800 dark:text-white">Agreement Content Modules</h4>
                                <Button
                                    type="button"
                                    onClick={handleAddSection}
                                    variant="outline"
                                    size="sm"
                                    className="h-9 px-4 rounded-lg font-bold text-xs flex items-center gap-2 border-brand-200 text-brand-600 hover:bg-brand-50"
                                >
                                    <Plus className="size-4" />
                                    Add Section
                                </Button>
                            </div>

                            <div className="space-y-8">
                                {formData.sections.map((section, index) => (
                                    <div
                                        key={index}
                                        className="relative p-6 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-white/[0.01] shadow-sm group"
                                    >
                                        <div className="absolute -left-3 top-6 size-7 rounded-full bg-gray-900 dark:bg-brand-600 text-white flex items-center justify-center text-[10px] font-bold shadow-lg">
                                            {index + 1}
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => handleRemoveSection(index)}
                                            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                            disabled={formData.sections.length === 1}
                                        >
                                            <Trash2 className="size-4" />
                                        </button>

                                        <div className="grid grid-cols-1 gap-6 ml-4">
                                            <div>
                                                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 block">Section Title</Label>
                                                <InputField
                                                    placeholder="e.g., Duties & Responsibilities"
                                                    value={section.title}
                                                    onChange={(e) => handleSectionChange(index, 'title', e.target.value)}
                                                    className="!rounded-xl h-11 focus:!border-brand-500 font-medium"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 block">Content Body</Label>
                                                <div className="rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden bg-gray-50/30 dark:bg-gray-800/30">
                                                    <TinyEditor
                                                        value={section.content}
                                                        onChange={(content) => handleSectionChange(index, 'content', content)}
                                                        height={250}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {formData.sections.length === 0 && (
                                    <div className="py-20 text-center border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-3xl">
                                        <AlertCircle className="size-10 text-gray-300 mx-auto mb-3" />
                                        <p className="text-sm text-gray-400 font-medium">No sections added yet.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-10 border-t border-gray-100 dark:border-gray-800 mt-10">
                        <Button
                            type="button"
                            onClick={handleCloseForm}
                            variant="outline"
                            className="h-11 px-8 rounded-xl font-bold text-sm"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="h-11 px-10 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm shadow-lg shadow-brand-500/20 transition-all active:scale-95"
                        >
                            <Save className="size-4 mr-2" />
                            {isEditing ? 'Update Template' : 'Save Template'}
                        </Button>
                    </div>
                </form>
            </Modal>

            <ToastContainer position="top-right" />
        </div>
    );
};

export default AgreementBuilder;
