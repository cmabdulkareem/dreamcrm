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
    const [isAgreed, setIsAgreed] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`${API}/hr/public/onboarding/${token}`);
                setData(response.data);
            } catch (error) {
                console.error('Error fetching onboarding data:', error);
                toast.error(error.response?.data?.message || 'Invalid or expired onboarding link.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [token]);

    const btnSubmit = async (e) => {
        e.preventDefault();
        if (!isAgreed) return toast.error('Please agree to the terms after reviewing all sections.');
        if (signatureName.trim().toLowerCase() !== data.fullName.toLowerCase()) {
            return toast.error(`Please type your full name exactly as "${data.fullName}" to sign.`);
        }

        try {
            setSubmitting(true);
            await axios.post(`${API}/hr/public/onboarding/${token}/sign`, { signatureName });
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

    if (signed) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <PageMeta title="Agreement Signed - CDC Insights" />
                <div className="bg-white p-10 rounded-3xl shadow-2xl max-w-lg w-full text-center border border-gray-100 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-2 bg-green-500"></div>
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight uppercase">Welcome Aboard!</h2>
                    <p className="text-gray-600 mb-8 leading-relaxed">
                        Thank you, <strong>{data.fullName}</strong>. You have successfully signed your employment agreement for the <strong>{data.jobTitle}</strong> position.
                        Our HR team has been notified, and they will contact you shortly with your joining details and system credentials.
                    </p>
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-sm text-gray-500">
                        A copy of your signed agreement has been archived in our records.
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
                        {data.template?.sections?.map((section, idx) => (
                            <section key={idx} className="onboarding-section">
                                <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-3">
                                    <span className="text-blue-600/20 text-4xl font-black tabular-nums transition-colors selection:bg-blue-200">{(idx + 1).toString().padStart(2, '0')}</span>
                                    {section.title}
                                </h2>
                                <div
                                    className="prose prose-blue max-w-none text-gray-600 leading-relaxed ql-editor p-0"
                                    dangerouslySetInnerHTML={{ __html: section.content }}
                                />
                            </section>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-2xl border-t-4 border-blue-900 relative">
                    <h3 className="text-2xl font-black text-gray-900 mb-6 tracking-tight uppercase">Digital Signature</h3>

                    <form onSubmit={btnSubmit} className="space-y-6">
                        <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-start gap-4">
                            <input
                                type="checkbox"
                                id="agree-check"
                                checked={isAgreed}
                                onChange={(e) => setIsAgreed(e.target.checked)}
                                className="mt-1.5 w-5 h-5 rounded border-gray-300 text-blue-900 focus:ring-blue-900"
                            />
                            <label htmlFor="agree-check" className="text-sm text-gray-700 leading-relaxed cursor-pointer">
                                I have read, understood, and agree to abide by the terms and conditions set forth in this employment agreement. I understand that my typed name below constitutes a legal and binding digital signature.
                            </label>
                        </div>

                        <div>
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

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-5 bg-blue-950 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-blue-900 transition-all shadow-xl shadow-blue-950/20 disabled:opacity-70 group"
                            >
                                {submitting ? 'Processing Signature...' : 'Sign & Accept Offer'}
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
            <ToastContainer position="top-right" />
        </div>
    );
};

export default OnboardingAcceptance;
