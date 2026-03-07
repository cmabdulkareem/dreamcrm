import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { hrService } from '../../../services/hrService';
import { toast } from 'react-toastify';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import PageMeta from '../../../components/common/PageMeta';
import InputField from '../../../components/form/input/InputField';
import TextArea from '../../../components/form/input/TextArea';
import Label from '../../../components/form/Label';
import Badge from '../../../components/ui/badge/Badge';

const PublicJobApply = () => {
    const { id } = useParams();
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
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
    const [skillInput, setSkillInput] = useState('');

    useEffect(() => {
        const fetchJob = async () => {
            try {
                const data = await hrService.getPublicJob(id);
                setJob(data);
            } catch (error) {
                console.error('Error fetching job:', error);
                toast.error('Job posting not found or expired');
            } finally {
                setLoading(false);
            }
        };
        fetchJob();
    }, [id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

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
        try {
            setSubmitting(true);

            // If there's pending input, add it before submitting
            const finalData = { ...formData };
            if (skillInput.trim()) {
                const trimmed = skillInput.trim().replace(/,$/, '');
                if (trimmed && !finalData.otherSkills.includes(trimmed)) {
                    finalData.otherSkills = [...finalData.otherSkills, trimmed];
                }
            }

            await hrService.submitApplication({ ...finalData, jobId: id });
            setSubmitted(true);
            window.scrollTo(0, 0);
        } catch (error) {
            console.error('Error submitting application:', error);
            toast.error(error.message || 'Failed to submit application');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><LoadingSpinner /></div>;

    if (!job) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
                    <p className="text-gray-600 mb-6">This job posting is no longer available.</p>
                    <Link to="/" className="text-blue-600 hover:underline">Return to Home</Link>
                </div>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <PageMeta title="Application Submitted" />
                <div className="bg-white p-10 rounded-3xl shadow-xl max-w-lg w-full text-center border border-gray-100">
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-800 mb-4">Application Received!</h2>
                    <p className="text-gray-600 mb-8 leading-relaxed">
                        Thank you for applying for the <strong>{job.title}</strong> position at <strong>{job.brand}</strong>.
                        Our team will review your application and get back to you if your profile matches our requirements.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full py-4 bg-blue-950 text-white rounded-2xl font-semibold hover:bg-blue-900 transition-all shadow-lg shadow-blue-950/20"
                    >
                        Apply for another position
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 py-12 px-4 sm:px-6 lg:px-8">
            <PageMeta title={`Apply: ${job.title} - ${job.brand}`} />

            <div className="max-w-4xl mx-auto">
                <div className="flex justify-center mb-8 sm:hidden">
                    <img src="/images/logo/logo.svg" alt="CDC International" className="h-12 w-auto" />
                </div>
                {/* Header Section */}
                <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-sm border border-gray-100 mb-8">
                    <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                        <div>
                            <Badge variant="secondary" color="primary" className="mb-3 px-3 py-1 text-xs">
                                {job.brand}
                            </Badge>
                            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
                                {job.title}
                            </h1>
                            <div className="flex flex-wrap items-center gap-4 mt-4 text-gray-500 text-sm font-medium">
                                <span className="flex items-center gap-1.5">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                                    {job.department}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    {job.type}
                                </span>
                            </div>
                        </div>
                        <div className="hidden sm:block">
                            <img src="/images/logo/logo.svg" alt="CDC International" className="h-12 w-auto" />
                        </div>
                    </div>

                    <div className="space-y-8 mt-10">
                        {job.description && (
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                                    <span className="w-1 h-6 bg-blue-600 rounded-full"></span>
                                    Job Description
                                </h3>
                                <div className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                                    {job.description}
                                </div>
                            </div>
                        )}

                        {job.requirements && (
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                                    <span className="w-1 h-6 bg-blue-600 rounded-full"></span>
                                    Requirements
                                </h3>
                                <div
                                    className="text-gray-600 leading-relaxed prose prose-sm max-w-none dark:prose-invert"
                                    dangerouslySetInnerHTML={{ __html: job.requirements }}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Application Form */}
                <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-gray-100 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-blue-950"></div>

                    <h2 className="text-2xl font-bold text-gray-900 mb-8">Apply for this position</h2>

                    <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="sm:col-span-2">
                            <Label htmlFor="fullName" required>Full Name</Label>
                            <InputField
                                name="fullName"
                                id="fullName"
                                value={formData.fullName}
                                onChange={handleChange}
                                placeholder="e.g. John Doe"
                                required
                            />
                        </div>

                        <div>
                            <Label htmlFor="email" required>Email Address</Label>
                            <InputField
                                type="email"
                                name="email"
                                id="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="john@example.com"
                                required
                            />
                        </div>

                        <div>
                            <Label htmlFor="phone" required>Phone Number</Label>
                            <InputField
                                type="tel"
                                name="phone"
                                id="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="+1 (555) 000-0000"
                                required
                            />
                        </div>

                        <div className="sm:col-span-2">
                            <Label htmlFor="qualification">Qualification (Optional)</Label>
                            <InputField
                                name="qualification"
                                id="qualification"
                                value={formData.qualification}
                                onChange={handleChange}
                                placeholder="e.g. B.Tech in Computer Science"
                            />
                        </div>

                        <div>
                            <Label htmlFor="experience">Experience (Optional)</Label>
                            <InputField
                                name="experience"
                                id="experience"
                                value={formData.experience}
                                onChange={handleChange}
                                placeholder="e.g. 5+ Years"
                            />
                        </div>

                        <div className="sm:col-span-2">
                            <div className="flex justify-between items-center mb-1">
                                <Label htmlFor="otherSkills">Key Skills (Optional)</Label>
                                <span className="text-[10px] text-gray-500 italic">Press comma or Enter to add</span>
                            </div>
                            <div className="flex flex-wrap gap-2 p-3 bg-white border border-gray-300 rounded-xl focus-within:ring-2 focus-within:ring-blue-600/20 focus-within:border-blue-600 transition-all min-h-[50px] shadow-sm">
                                {formData.otherSkills.map((skill, idx) => (
                                    <span
                                        key={idx}
                                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 text-sm font-semibold rounded-lg border border-blue-100 animate-in fade-in zoom-in duration-200"
                                    >
                                        {skill}
                                        <button
                                            type="button"
                                            onClick={() => removeSkill(skill)}
                                            className="hover:text-blue-900 transition-colors"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </span>
                                ))}
                                <input
                                    type="text"
                                    value={skillInput}
                                    onChange={handleSkillChange}
                                    onKeyDown={handleSkillKeyDown}
                                    placeholder={formData.otherSkills.length === 0 ? "e.g. React, Node.js, Python" : ""}
                                    className="flex-1 min-w-[200px] bg-transparent outline-none text-gray-900 py-1"
                                />
                            </div>
                        </div>

                        <div className="sm:col-span-2">
                            <Label htmlFor="resumeUrl" required>Resume Link (Google Drive/Dropbox)</Label>
                            <InputField
                                name="resumeUrl"
                                id="resumeUrl"
                                value={formData.resumeUrl}
                                onChange={handleChange}
                                placeholder="https://drive.google.com/your-resume-link"
                                required
                            />
                        </div>

                        <div className="sm:col-span-2">
                            <Label htmlFor="remarks">Remarks (Optional)</Label>
                            <TextArea
                                name="remarks"
                                id="remarks"
                                value={formData.remarks}
                                onChange={handleChange}
                                placeholder="Tell us why you are a good fit for this role or add any notes..."
                                rows={5}
                            />
                        </div>

                        <div className="sm:col-span-2 mt-4">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full sm:w-auto px-10 py-4 bg-blue-950 text-white rounded-2xl font-bold hover:bg-blue-900 transition-all flex items-center justify-center gap-2 disabled:opacity-70 shadow-lg shadow-blue-950/20 group"
                            >
                                {submitting ? 'Submitting Application...' : 'Submit Application'}
                                {!submitting && (
                                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                <div className="mt-8 text-center text-gray-500 text-sm">
                    © {new Date().getFullYear()} CDC International. All rights reserved.
                </div>
            </div>
        </div>
    );
};

export default PublicJobApply;
