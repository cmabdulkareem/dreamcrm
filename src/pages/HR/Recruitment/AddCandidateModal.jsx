import React, { useState } from 'react';
import { X, User, Mail, Phone, Link, FileText, Loader2, GraduationCap, Briefcase, Award } from 'lucide-react';
import { hrService } from '../../../services/hrService';

const AddCandidateModal = ({ isOpen, onClose, jobId, jobTitle, onSuccess, candidate = null }) => {
    const isEdit = !!candidate;
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        resumeUrl: '',
        remarks: '',
        qualification: '',
        experience: '',
        otherSkills: []
    });

    React.useEffect(() => {
        if (candidate) {
            setFormData({
                fullName: candidate.fullName || '',
                email: candidate.email || '',
                phone: candidate.phone || '',
                resumeUrl: candidate.resumeUrl || '',
                remarks: candidate.remarks || '',
                qualification: candidate.qualification || '',
                experience: candidate.experience || '',
                otherSkills: Array.isArray(candidate.otherSkills) ? candidate.otherSkills : []
            });
        } else {
            setFormData({
                fullName: '',
                email: '',
                phone: '',
                resumeUrl: '',
                remarks: '',
                qualification: '',
                experience: '',
                otherSkills: []
            });
        }
    }, [candidate, isOpen]);
    const [skillInput, setSkillInput] = useState('');
    const [error, setError] = useState(null);

    if (!isOpen) return null;

    const addSkill = (skill) => {
        const trimmedSkill = skill.trim();
        if (trimmedSkill && !formData.otherSkills.includes(trimmedSkill)) {
            setFormData(prev => ({
                ...prev,
                otherSkills: [...prev.otherSkills, trimmedSkill]
            }));
        }
        setSkillInput('');
    };

    const removeSkill = (skillToRemove) => {
        setFormData(prev => ({
            ...prev,
            otherSkills: prev.otherSkills.filter(skill => skill !== skillToRemove)
        }));
    };

    const handleSkillKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (skillInput.trim()) addSkill(skillInput);
        } else if (e.key === 'Backspace' && !skillInput && formData.otherSkills.length > 0) {
            removeSkill(formData.otherSkills[formData.otherSkills.length - 1]);
        }
    };

    const handleSkillChange = (e) => {
        const val = e.target.value;
        if (val.includes(',')) {
            const parts = val.split(',');
            const newSkill = parts[0].trim();
            if (newSkill) addSkill(newSkill);
            setSkillInput(parts[1] || '');
        } else {
            setSkillInput(val);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // If there's pending input, add it before submitting
            const finalData = { ...formData };
            const pendingInput = skillInput.trim().replace(/,$/, '');
            if (pendingInput && !finalData.otherSkills.includes(pendingInput)) {
                finalData.otherSkills = [...finalData.otherSkills, pendingInput];
            }

            if (isEdit) {
                await hrService.updateApplication(candidate._id, finalData);
            } else {
                await hrService.addManualCandidate(jobId, finalData);
            }
            onSuccess();
            onClose();
        } catch (err) {
            console.error(`Error ${isEdit ? 'updating' : 'adding'} candidate:`, err);
            setError(err.message || `Failed to ${isEdit ? 'update' : 'add'} candidate`);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 h-fit max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50 shrink-0">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{isEdit ? 'Edit Candidate Details' : 'Add New Candidate'}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Application for: {jobTitle}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    <form id="add-candidate-form" onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-lg">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            {/* Personal Details */}
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                        <User size={14} className="text-gray-400" />
                                        Full Name *
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        placeholder="Enter full name"
                                        className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-gray-900 dark:text-white"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                            <Mail size={14} className="text-gray-400" />
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            placeholder="email@example.com"
                                            className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-gray-900 dark:text-white"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                            <Phone size={14} className="text-gray-400" />
                                            Phone Number *
                                        </label>
                                        <input
                                            required
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            placeholder="Enter phone number"
                                            className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-gray-900 dark:text-white"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Professional Details */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                        <GraduationCap size={14} className="text-gray-400" />
                                        Qualification
                                    </label>
                                    <input
                                        type="text"
                                        name="qualification"
                                        value={formData.qualification}
                                        onChange={handleChange}
                                        placeholder="e.g. B.Tech / MBA"
                                        className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-gray-900 dark:text-white"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                        <Briefcase size={14} className="text-gray-400" />
                                        Experience
                                    </label>
                                    <input
                                        type="text"
                                        name="experience"
                                        value={formData.experience}
                                        onChange={handleChange}
                                        placeholder="e.g. 3+ Years"
                                        className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-gray-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center justify-between">
                                    <span className="flex items-center gap-2">
                                        <Award size={14} className="text-gray-400" />
                                        Key Skills
                                    </span>
                                    <span className="text-[10px] text-gray-400 font-normal italic">Press comma or Enter to add</span>
                                </label>
                                <div className="flex flex-wrap gap-2 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all min-h-[46px]">
                                    {formData.otherSkills.map((skill, idx) => (
                                        <span
                                            key={idx}
                                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-lg border border-blue-100 dark:border-blue-800/50 animate-in fade-in zoom-in duration-200"
                                        >
                                            {skill}
                                            <button
                                                type="button"
                                                onClick={() => removeSkill(skill)}
                                                className="hover:text-blue-900 dark:hover:text-white transition-colors"
                                            >
                                                <X size={12} />
                                            </button>
                                        </span>
                                    ))}
                                    <input
                                        type="text"
                                        value={skillInput}
                                        onChange={handleSkillChange}
                                        onKeyDown={handleSkillKeyDown}
                                        placeholder={formData.otherSkills.length === 0 ? "e.g. React, Node.js" : ""}
                                        className="flex-1 min-w-[120px] bg-transparent outline-none text-sm text-gray-900 dark:text-white py-1 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                    <Link size={14} className="text-gray-400" />
                                    Resume URL
                                </label>
                                <input
                                    type="url"
                                    name="resumeUrl"
                                    value={formData.resumeUrl}
                                    onChange={handleChange}
                                    placeholder="https://"
                                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-gray-900 dark:text-white"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                    <FileText size={14} className="text-gray-400" />
                                    Remarks (Optional)
                                </label>
                                <textarea
                                    name="remarks"
                                    value={formData.remarks}
                                    onChange={handleChange}
                                    rows={3}
                                    placeholder="Add notes..."
                                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-gray-900 dark:text-white resize-none"
                                />
                            </div>
                        </div>
                    </form>
                </div>

                {/* Fixed Footer */}
                <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex items-center gap-3 bg-gray-50/50 dark:bg-gray-800/50 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        form="add-candidate-form"
                        type="submit"
                        disabled={loading}
                        className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-50"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                {isEdit ? 'Saving...' : 'Submitting...'}
                            </>
                        ) : (
                            isEdit ? 'Save Changes' : 'Add Candidate'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
export default AddCandidateModal;
