import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageMeta from '../../components/common/PageMeta';
import InputField from '../../components/form/input/InputField';
import Label from '../../components/form/Label';
import API from "../../config/api";

const OnboardingAcceptance = () => {
    const { token } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [signed, setSigned] = useState(false);
    const [signatureName, setSignatureName] = useState('');
    const [currentStep, setCurrentStep] = useState(0);
    const [agreedSteps, setAgreedSteps] = useState([]);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`${API}/hr/public/onboarding/${token}`);
                setData(response.data);
                if (response.data.templates) {
                    setAgreedSteps(new Array(response.data.templates.length).fill(false));
                }
            } catch (error) {
                console.error('Error fetching onboarding data:', error);
                toast.error(error.response?.data?.message || 'Invalid or expired onboarding link.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [token]);

    const handleDownload = async () => {
        try {
            setGenerating(true);
            const response = await axios.get(`${API}/hr/public/agreement/download?token=${token}`, {
                responseType: 'blob'
            });

            // Create a blob URL and trigger download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Agreement_${data.fullName.replace(/\s+/g, '_')}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            toast.success('Agreement downloaded successfully!');
        } catch (error) {
            console.error('PDF Download Error:', error);
            toast.error('Failed to download PDF.');
        } finally {
            setGenerating(false);
        }
    };

    const btnSubmit = async (e) => {
        e.preventDefault();
        const templates = data.templates || [];
        const isLastStep = currentStep === templates.length - 1;

        if (!agreedSteps[currentStep]) {
            return toast.error('Please agree to the terms of this section before proceeding.');
        }

        if (!isLastStep) {
            setCurrentStep(prev => prev + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        if (signatureName.trim().toLowerCase() !== data.fullName.toLowerCase()) {
            return toast.error(`Please type your full name exactly as "${data.fullName}" to sign.`);
        }

        try {
            setSubmitting(true);
            // Sign agreement and get back the signed content for the preview
            const response = await axios.post(`${API}/hr/public/onboarding/${token}/sign`, { signatureName });

            setData(prev => ({
                ...prev,
                agreementSigned: true,
                signedContent: response.data.signedContent || prev.templates?.map(t => ({
                    title: t.name,
                    content: t.sections.map(s => `<h3>${s.title}</h3>${s.content}`).join('')
                })),
                signatureName: signatureName,
                signedAt: new Date().toISOString()
            }));

            setSigned(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (error) {
            console.error('Error signing agreement:', error);
            toast.error(error.response?.data?.message || 'Failed to sign agreement.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><LoadingSpinner /></div>;

    if (!data) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="text-center max-w-md">
                    <div className="bg-red-100 text-red-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Link</h1>
                    <p className="text-gray-600 mb-8">This onboarding link is either invalid, expired, or the agreement has already been signed.</p>
                    <Link to="/" className="inline-block px-6 py-3 bg-blue-950 text-white rounded-xl font-bold hover:bg-blue-900 transition-all">Go to Homepage</Link>
                </div>
            </div>
        );
    }

    if (signed || data.agreementSigned) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <PageMeta title="Agreement Signed - Welcome" />
                <div className="bg-white p-10 rounded-3xl shadow-2xl max-w-lg w-full text-center border border-gray-100 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 right-0 h-2 bg-[#ffd215]"></div>

                    {/* Logo Section */}
                    <div className="mb-10 flex justify-center">
                        <img src="/images/logo/logo.svg" alt="Company Logo" className="h-12 w-auto" />
                    </div>

                    <div className="w-20 h-20 bg-[#f0f2ff] text-[#00085a] rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-white shadow-lg">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-black text-[#00085a] mb-4 tracking-tight uppercase">Welcome Aboard!</h2>
                    <p className="text-gray-600 mb-8 leading-relaxed">
                        Thank you, <strong>{data.fullName}</strong>. You have successfully signed your employment agreement for the <strong>{data.jobTitle}</strong> position.
                        You can now download a copy of your signed agreement below.
                    </p>

                    <button
                        onClick={handleDownload}
                        disabled={generating}
                        className="w-full flex items-center justify-center gap-3 px-8 py-5 bg-[#00085a] text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-black transition-all shadow-xl shadow-[#00085a]/20 disabled:opacity-70 mb-6 group"
                    >
                        {generating ? (
                            <LoadingSpinner className="!w-5 !h-5 !border-white" />
                        ) : (
                            <svg className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                        )}
                        {generating ? 'Generating PDF...' : 'Download Signed Agreement'}
                    </button>

                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-sm font-medium text-gray-500 leading-relaxed">
                        You can close this window after downloading. Our HR team will contact you shortly with joining details.
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 py-12 px-4 sm:px-6 lg:px-8">
            <PageMeta title={`Onboarding: ${data.fullName} - CDC Insights`} />

            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-10">
                    <img src="/images/logo/logo.svg" alt="CDC Insights" className="h-10 w-auto" />
                    <div className="text-right">
                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full">Secure Onboarding Portal</span>
                    </div>
                </div>

                <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-xl border border-gray-100 mb-8">
                    <header className="mb-12 border-b border-gray-100 pb-8">
                        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight leading-tight">
                            Employment Agreement
                        </h1>
                        <div className="mt-2 flex items-center gap-2">
                            <div className="flex -space-x-2">
                                {data.templates?.map((_, idx) => (
                                    <div
                                        key={idx}
                                        className={`w-3 h-3 rounded-full border-2 border-white ${idx <= currentStep ? 'bg-blue-600' : 'bg-gray-200'}`}
                                    />
                                ))}
                            </div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter ml-2">
                                Agreement {currentStep + 1} of {data.templates?.length}
                            </span>
                        </div>
                        <div className="mt-4 flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2 text-gray-500">
                                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xs">{data.fullName.charAt(0)}</div>
                                <span className="text-sm font-bold text-gray-700">{data.fullName}</span>
                            </div>
                            <div className="w-1.5 h-1.5 bg-gray-300 rounded-full"></div>
                            <span className="text-sm text-gray-500">Position: <strong className="text-gray-700">{data.jobTitle}</strong></span>
                        </div>
                    </header>

                    <div className="space-y-12">
                        {data.templates && data.templates[currentStep] && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="border-b-2 border-blue-900 pb-2 mb-6">
                                    <h2 className="text-2xl font-black text-blue-900 uppercase tracking-tight">
                                        {data.templates[currentStep].name}
                                    </h2>
                                </div>
                                {data.templates[currentStep].sections?.map((section, idx) => (
                                    <section key={`${currentStep}-${idx}`} className="onboarding-section">
                                        <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-3">
                                            <span className="text-blue-600/20 text-4xl font-black tabular-nums transition-colors selection:bg-blue-200">
                                                {(idx + 1).toString().padStart(2, '0')}
                                            </span>
                                            {section.title}
                                        </h2>
                                        <div
                                            className="ql-editor p-0 overflow-visible text-gray-600 leading-relaxed"
                                            style={{
                                                wordBreak: 'keep-all',
                                                wordWrap: 'break-word',
                                                overflowWrap: 'break-word',
                                                hyphens: 'none',
                                                textAlign: 'left'
                                            }}
                                            dangerouslySetInnerHTML={{ __html: section.content }}
                                        />
                                    </section>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-2xl border-t-4 border-blue-900 relative">
                    <h3 className="text-2xl font-black text-gray-900 mb-6 tracking-tight uppercase">Digital Signature</h3>

                    <form onSubmit={btnSubmit} className="space-y-6">
                        <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-start gap-4">
                            <input
                                type="checkbox"
                                id="agree-check"
                                checked={agreedSteps[currentStep] || false}
                                onChange={(e) => {
                                    const newAgreed = [...agreedSteps];
                                    newAgreed[currentStep] = e.target.checked;
                                    setAgreedSteps(newAgreed);
                                }}
                                className="mt-1.5 w-5 h-5 rounded border-gray-300 text-blue-900 focus:ring-blue-900"
                            />
                            <label htmlFor="agree-check" className="text-sm text-gray-700 leading-relaxed cursor-pointer">
                                I have read, understood, and agree to abide by the terms and conditions set forth in this <strong>{data.templates?.[currentStep]?.name || 'agreement'}</strong>. {currentStep === (data.templates?.length || 0) - 1 ? 'I understand that my typed name below constitutes a legal and binding digital signature.' : ''}
                            </label>
                        </div>

                        {currentStep === (data.templates?.length || 0) - 1 && (
                            <div className="animate-in zoom-in-95 duration-300">
                                <Label htmlFor="sig-name">Type your full name to sign *</Label>
                                <InputField
                                    id="sig-name"
                                    placeholder={data.fullName}
                                    value={signatureName}
                                    onChange={(e) => setSignatureName(e.target.value)}
                                    className="text-lg font-medium py-4 italic"
                                    required
                                />
                                <p className="mt-2 text-xs text-gray-500">Please match the name as shown in the header.</p>
                            </div>
                        )}

                        <div className="pt-4 flex gap-4">
                            {currentStep > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setCurrentStep(prev => prev - 1)}
                                    className="flex-1 py-5 bg-gray-100 text-gray-600 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-gray-200 transition-all border border-gray-200"
                                >
                                    Previous
                                </button>
                            )}
                            <button
                                type="submit"
                                disabled={submitting}
                                className={`flex-[2] py-5 bg-blue-950 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-blue-900 transition-all shadow-xl shadow-blue-950/20 disabled:opacity-70 group`}
                            >
                                {submitting ? 'Processing Signature...' : (currentStep === (data.templates?.length || 0) - 1 ? 'Sign & Accept Offer' : 'Next Agreement')}
                                {!submitting && (
                                    <svg className="w-5 h-5 inline-block ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                <div className="mt-10 text-center">
                    <p className="text-gray-400 text-xs">
                        © {new Date().getFullYear()} CDC Insights. Secure Document Portal. IP Logged for verification.
                    </p>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .pdf-title-fix { letter-spacing: 0.5px !important; word-spacing: 2px !important; }
                .pdf-content-fix { text-align: left !important; letter-spacing: 0.1px !important; word-spacing: 1px !important; line-height: 1.6 !important; }
                .pdf-content-fix * { letter-spacing: 0.1px !important; word-spacing: 1px !important; }
                #pdf-render-container { background: white !important; }

                /* Fix text wrapping in agreement content */
                /* Force-stop all mid-word breaks and hyphenation */
                .onboarding-section .ql-editor,
                .onboarding-section .ql-editor *,
                .onboarding-section [class*="prose"],
                .onboarding-section div[dangerouslySetInnerHTML],
                .onboarding-section div[dangerouslySetInnerHTML] * {
                    white-space: pre-wrap !important;
                    word-break: keep-all !important;
                    overflow-wrap: break-word !important;
                    word-wrap: break-word !important;
                    hyphens: none !important;
                    -webkit-hyphens: none !important;
                    -moz-hyphens: none !important;
                    -ms-hyphens: none !important;
                    max-width: 100% !important;
                    overflow: visible !important;
                    text-align: left !important;
                }
                .onboarding-section p,
                .onboarding-section span,
                .onboarding-section li,
                .onboarding-section h1,
                .onboarding-section h2,
                .onboarding-section h3,
                .onboarding-section h4 {
                    white-space: pre-wrap !important;
                    word-break: keep-all !important;
                    overflow-wrap: break-word !important;
                    word-wrap: break-word !important;
                    hyphens: none !important;
                    -webkit-hyphens: none !important;
                    -moz-hyphens: none !important;
                    -ms-hyphens: none !important;
                    max-width: 100% !important;
                    text-align: left !important;
                }
                /* Ensure ql-editor resets don't interfere */
                .ql-editor.p-0 {
                    padding: 0 !important;
                    white-space: pre-wrap !important;
                    word-break: keep-all !important;
                    overflow-wrap: break-word !important;
                    word-wrap: break-word !important;
                }

                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; }
                }
            `}} />
            <ToastContainer position="top-right" />
        </div>
    );
};

export default OnboardingAcceptance;
