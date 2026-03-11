import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../../config/api';
import PageMeta from '../../components/common/PageMeta';

const AgreementVerification = () => {
    const { id } = useParams();
    const [verificationData, setVerificationData] = useState(() => {
        if (typeof window !== 'undefined' && window.__INITIAL_VERIFICATION_DATA__) {
            return window.__INITIAL_VERIFICATION_DATA__;
        }
        return null;
    });
    const [loading, setLoading] = useState(!verificationData);
    const [error, setError] = useState(null);

    useEffect(() => {
        const verifyAgreement = async () => {
            if (verificationData) {
                setLoading(false);
                return;
            }
            try {
                const response = await axios.get(`${API_URL}/hr/agreement/verify/${id}`);
                setVerificationData(response.data);
                setLoading(false);
            } catch (err) {
                setError(err.response?.data?.message || 'Verification failed. This document might be invalid or tempered with.');
                setLoading(false);
            }
        };

        if (id) {
            verifyAgreement();
        }

        return () => {
            if (typeof window !== 'undefined' && window.__INITIAL_VERIFICATION_DATA__) {
                delete window.__INITIAL_VERIFICATION_DATA__;
            }
        };
    }, [id, verificationData]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <h2 className="text-xl font-bold text-slate-800">Verifying Digital Signature...</h2>
                    <p className="text-slate-500 mt-2">Checking document authenticity and security records.</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border-t-4 border-red-500">
                    <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">Verification Failed</h2>
                    <p className="text-red-600 mt-4 px-4 py-2 bg-red-50 rounded-lg text-sm font-medium">
                        {error}
                    </p>
                    <div className="mt-8 pt-6 border-t border-slate-100 italic text-xs text-slate-400">
                        CDC International Security System • Error Code: ERR_SIG_INVALID
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-12">
            <PageMeta 
                title="Agreement Verification" 
                description="Verify the digital signature and authenticity of the agreement."
            />
            <div className="max-w-lg w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
                {/* Header Decoration */}
                <div className="h-2 bg-[#ffd215]"></div>
                <div className="h-1 bg-[#00085a]"></div>

                <div className="p-8 md:p-10">
                    {/* Logo */}
                    <div className="flex justify-center mb-6">
                        <img src="/images/logo/logo.svg" alt="CDC International Logo" className="h-12 w-auto" />
                    </div>
                    -
                    {/* Status Badge */}
                    <div className="flex justify-center mb-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#f0f2ff] text-[#00085a] rounded-full border border-[#00085a]/10 shadow-sm">
                            <div className="w-2 h-2 bg-[#00085a] rounded-full animate-pulse"></div>
                            <span className="text-sm font-bold tracking-tight uppercase">Signature Legally Valid</span>
                        </div>
                    </div>

                    <div className="text-center mb-10">
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Authenticity Verified</h1>
                        <p className="text-slate-500 mt-2">Digital Fingerprint Confirmation Successful</p>
                    </div>

                    {/* Verification Grid */}
                    <div className="space-y-4">
                        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Document Status</label>
                                    <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                                        <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        Verified System Record
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Agreement ID</label>
                                    <div className="text-sm font-mono font-bold text-[#00085a] truncate">{verificationData.documentId}</div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Issued By</label>
                                    <div className="text-sm font-bold text-slate-900">{verificationData.issuer}</div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Issued To</label>
                                    <div className="text-sm font-bold text-slate-900">{verificationData.issuedTo}</div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Role/Position</label>
                                    <div className="text-sm font-bold text-slate-900">{verificationData.jobTitle}</div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Signing Party</label>
                                    <div className="text-sm font-serif italic text-blue-800 font-bold">{verificationData.signatureName}</div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Timestamp</label>
                                    <div className="text-sm font-bold text-slate-900 truncate">
                                        {new Date(verificationData.date).toLocaleString()}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Source IP Address</label>
                                    <div className="text-sm font-mono font-bold text-slate-700">{verificationData.ipAddress}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-10 p-4 bg-blue-50/50 rounded-xl border border-blue-100 flex items-start gap-3">
                        <svg className="w-5 h-5 text-[#00085a] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <p className="text-xs text-[#00085a] leading-relaxed font-medium">
                            This document has been digitally signed and its authenticity is guaranteed by CDC International's secure records system. The QR code linked to this page provides tamper-proof verification.
                        </p>
                    </div>

                    <div className="mt-8 text-center text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                        &copy; {new Date().getFullYear()} CDC International Human Resources Division
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AgreementVerification;
