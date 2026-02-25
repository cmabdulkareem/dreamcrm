import React, { useState, useEffect } from 'react';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import ComponentCard from '../../components/common/ComponentCard';
import Button from '../../components/ui/button/Button';
import { labService } from '../../services/labService';
import { PlusIcon } from '../../icons';

const PRIORITY_CONFIG = {
    low: { label: 'Low', color: 'bg-gray-100 text-gray-600 dark:bg-gray-700/50 dark:text-gray-400' },
    medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
    high: { label: 'High', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

const STATUS_TABS = ['all', 'open', 'in-progress', 'resolved'];
const emptyForm = { pc: '', title: '', description: '', priority: 'medium' };

export default function Complaints() {
    const [complaints, setComplaints] = useState([]);
    const [pcs, setPCs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [cData, pcData] = await Promise.all([labService.getComplaints(), labService.getPCs()]);
            setComplaints(cData);
            setPCs(pcData);
        } catch (e) { } finally { setLoading(false); }
    };

    const save = async (e) => {
        if (e) e.preventDefault();
        if (!form.pc || !form.title.trim()) return;
        setSaving(true);
        try {
            const created = await labService.addComplaint(form);
            setComplaints(prev => [created, ...prev]);
            setShowModal(false);
            setForm(emptyForm);
        } catch (e) { } finally { setSaving(false); }
    };

    const changeStatus = async (id, status) => {
        const updated = await labService.updateComplaint(id, { status });
        setComplaints(prev => prev.map(c => c._id === id ? updated : c));
    };

    const deleteComplaint = async (id) => {
        if (!window.confirm('Delete this complaint?')) return;
        await labService.deleteComplaint(id);
        setComplaints(prev => prev.filter(c => c._id !== id));
    };

    const filtered = activeTab === 'all' ? complaints : complaints.filter(c => c.status === activeTab);

    // Counts per tab
    const counts = {
        all: complaints.length,
        open: complaints.filter(c => c.status === 'open').length,
        'in-progress': complaints.filter(c => c.status === 'in-progress').length,
        resolved: complaints.filter(c => c.status === 'resolved').length,
    };

    return (
        <div className="">
            <PageMeta title="Complaints | Compute Lab" />
            <PageBreadcrumb
                pageTitle="Service Complaints"
                items={[
                    { name: 'Home', path: '/' },
                    { name: 'Compute Lab', path: '/compute-lab' },
                    { name: 'Complaints' }
                ]}
            />

            <ComponentCard
                title="Service Log"
                desc="Track and resolve lab PC hardware/software issues"
                action={
                    <Button
                        size="sm"
                        onClick={() => { setForm(emptyForm); setShowModal(true); }}
                        startIcon={<PlusIcon className="w-4 h-4" />}
                    >
                        Raise Complaint
                    </Button>
                }
            >
                {/* Status Tabs */}
                <div className="flex gap-1 mb-8 bg-gray-50 dark:bg-white/[0.02] p-1 rounded-xl w-fit border border-gray-100 dark:border-gray-800">
                    {STATUS_TABS.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-5 py-2 text-xs font-bold rounded-lg capitalize transition-all duration-200 flex items-center gap-2 ${activeTab === tab
                                ? 'bg-white dark:bg-gray-800 text-brand-600 dark:text-brand-400 shadow-sm border border-gray-100 dark:border-gray-700'
                                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-500'
                                }`}
                        >
                            {tab === 'all' ? 'All Logs' : tab.replace('-', ' ')}
                            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${activeTab === tab ? 'bg-brand-500 text-white shadow-lg' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                                {counts[tab]}
                            </span>
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="text-center py-20 text-gray-400 italic">Accessing service records...</div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50/50 dark:bg-white/[0.01] rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Clear Session: No Complaints Found</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filtered.map(c => {
                            const pCfg = PRIORITY_CONFIG[c.priority] || PRIORITY_CONFIG.medium;
                            return (
                                <div key={c._id} className="bg-white dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all p-5 group">
                                    <div className="flex items-start justify-between gap-6">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap mb-2">
                                                <span className="font-bold text-gray-800 dark:text-white group-hover:text-brand-500 transition-colors uppercase tracking-tight">{c.title}</span>
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest ${pCfg.color}`}>{pCfg.label}</span>
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest ${c.status === 'open' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30' : c.status === 'in-progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30' : 'bg-green-100 text-green-700 dark:bg-green-900/30'}`}>
                                                    {c.status}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs font-bold text-gray-400 uppercase tracking-tighter mb-3">
                                                <span className="text-brand-500 bg-brand-50 dark:bg-brand-500/10 px-2 py-0.5 rounded-md">{c.pc?.pcNumber}</span>
                                                {c.pc?.label && <span className="text-gray-500">{c.pc.label}</span>}
                                                <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                                <span className="font-medium lowercase tracking-normal italic opacity-60">Raised by {c.raisedBy?.fullName || 'Anonymous'}</span>
                                                <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                                <span className="font-medium lowercase tracking-normal italic opacity-60">{new Date(c.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            {c.description && <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed mb-3">{c.description}</p>}
                                            {c.resolvedBy && (
                                                <div className="flex items-center gap-2 text-[10px] text-green-600 dark:text-green-500 font-black uppercase tracking-widest bg-green-50 dark:bg-green-900/10 w-fit px-3 py-1.5 rounded-lg border border-green-100 dark:border-green-800/20 mt-2 animate-in fade-in zoom-in-95 duration-500">
                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                                    Resolved by {c.resolvedBy.fullName}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col items-end gap-3 shrink-0">
                                            {c.status !== 'resolved' && (
                                                <div className="relative group/select">
                                                    <select
                                                        value={c.status}
                                                        onChange={e => changeStatus(c._id, e.target.value)}
                                                        className="text-[10px] font-black uppercase tracking-widest border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 cursor-pointer appearance-none focus:border-brand-500 transition-all pr-10"
                                                    >
                                                        <option value="open">Open Case</option>
                                                        <option value="in-progress">In Progress</option>
                                                        <option value="resolved">Mark Resolved</option>
                                                    </select>
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 transition-transform group-hover/select:translate-y-0.5">
                                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
                                                    </div>
                                                </div>
                                            )}
                                            <button onClick={() => deleteComplaint(c._id)}
                                                className="text-[10px] font-black uppercase tracking-widest text-red-300 hover:text-red-500 transition-colors pt-2 px-2">
                                                Archive Log
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </ComponentCard>

            {/* Raise Complaint Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md px-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-8 border border-white/20">
                        <h3 className="text-xl font-black text-gray-900 dark:text-white mb-8 italic uppercase tracking-tighter">Issue Reporting</h3>
                        <form onSubmit={save} className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Workstation Assignment *</label>
                                <div className="relative group/select">
                                    <select required value={form.pc} onChange={e => setForm(f => ({ ...f, pc: e.target.value }))}
                                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-5 py-4 text-sm font-bold text-gray-800 dark:text-white outline-none focus:border-brand-500 appearance-none transition-all pr-12">
                                        <option value="">Select Target PC</option>
                                        {pcs.map(pc => <option key={pc._id} value={pc._id}>{pc.pcNumber}{pc.label ? ` · ${pc.label}` : ''}</option>)}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover/select:translate-y-0.5 transition-transform">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Issue Headline *</label>
                                <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                    placeholder="e.g. Hardware Malfunction" className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-5 py-4 text-sm font-bold text-gray-800 dark:text-white outline-none focus:border-brand-500 transition-all font-mono" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">Priority Matrix</label>
                                <div className="flex gap-2">
                                    {['low', 'medium', 'high'].map(p => (
                                        <button key={p} type="button" onClick={() => setForm(f => ({ ...f, priority: p }))}
                                            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl border transition-all duration-300 ${form.priority === p
                                                ? 'border-brand-500 bg-brand-500 text-white shadow-lg shadow-brand-500/20 scale-105'
                                                : 'border-gray-200 dark:border-gray-700 text-gray-400 hover:border-brand-300'}`}>
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Detailed Log</label>
                                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                    rows={3} placeholder="Describe the technical issue in detail..." className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-5 py-4 text-sm font-medium text-gray-800 dark:text-white outline-none focus:border-brand-500 resize-none transition-all leading-relaxed" />
                            </div>

                            <div className="flex gap-4 mt-8 pt-4 border-t border-gray-100 dark:border-gray-800">
                                <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)} disabled={saving}>Abort</Button>
                                <Button type="submit" className="flex-1" disabled={saving || !form.pc || !form.title.trim()} loading={saving}>
                                    Commit Log
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
