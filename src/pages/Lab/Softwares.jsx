import React, { useState, useEffect } from 'react';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import ComponentCard from '../../components/common/ComponentCard';
import Button from '../../components/ui/button/Button';
import { labService } from '../../services/labService';
import { PlusIcon } from '../../icons';

const LICENSE_TYPES = ['perpetual', 'subscription', 'freeware', 'open-source', 'trial', 'other'];

const emptyForm = {
    name: '', version: '', licenseKey: '', licenseType: 'other',
    installedOn: [], expiryDate: '', vendor: '', notes: ''
};

export default function Softwares() {
    const [softwares, setSoftwares] = useState([]);
    const [pcs, setPCs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [sw, pcData] = await Promise.all([labService.getSoftwares(), labService.getPCs()]);
            setSoftwares(sw);
            setPCs(pcData);
        } catch (e) { } finally { setLoading(false); }
    };

    const openAdd = () => { setForm(emptyForm); setEditing(null); setShowModal(true); };
    const openEdit = (sw) => {
        setForm({
            ...sw,
            installedOn: sw.installedOn?.map(p => p._id || p) || [],
            expiryDate: sw.expiryDate ? sw.expiryDate.split('T')[0] : ''
        });
        setEditing(sw);
        setShowModal(true);
    };

    const save = async (e) => {
        if (e) e.preventDefault();
        if (!form.name.trim()) return;
        setSaving(true);
        try {
            if (editing) {
                const updated = await labService.updateSoftware(editing._id, form);
                setSoftwares(prev => prev.map(s => s._id === updated._id ? updated : s));
            } else {
                const created = await labService.addSoftware(form);
                setSoftwares(prev => [...prev, created]);
            }
            setShowModal(false);
        } catch (e) { } finally { setSaving(false); }
    };

    const deleteSW = async (id) => {
        if (!window.confirm('Delete this software entry?')) return;
        await labService.deleteSoftware(id);
        setSoftwares(prev => prev.filter(s => s._id !== id));
    };

    const togglePC = (pcId) => {
        setForm(f => ({
            ...f,
            installedOn: f.installedOn.includes(pcId)
                ? f.installedOn.filter(id => id !== pcId)
                : [...f.installedOn, pcId]
        }));
    };

    const isExpiringSoon = (date) => {
        if (!date) return false;
        const diff = (new Date(date) - new Date()) / (1000 * 60 * 60 * 24);
        return diff >= 0 && diff <= 30;
    };
    const isExpired = (date) => date && new Date(date) < new Date();

    const filtered = softwares.filter(s =>
        s.name?.toLowerCase().includes(search.toLowerCase()) ||
        s.vendor?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="">
            <PageMeta title="Softwares | Compute Lab" />
            <PageBreadcrumb
                pageTitle="Softwares Inventory"
                items={[
                    { name: 'Home', path: '/' },
                    { name: 'Compute Lab', path: '/compute-lab' },
                    { name: 'Softwares' }
                ]}
            />

            <ComponentCard
                title="Software Inventory"
                desc="Track installed software and licenses"
                action={
                    <Button
                        size="sm"
                        onClick={openAdd}
                        startIcon={<PlusIcon className="w-4 h-4" />}
                    >
                        Add Software
                    </Button>
                }
            >
                {/* Search */}
                <div className="mb-5">
                    <input
                        value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search by name or vendor..."
                        className="w-full max-w-sm rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white outline-none focus:border-brand-500"
                    />
                </div>

                {loading ? (
                    <div className="text-center py-12 text-gray-400 italic">Syncing software records...</div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">No software match found.</div>
                ) : (
                    <div className="overflow-x-auto -mx-4 sm:-mx-6">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50/50 dark:bg-white/[0.02] text-gray-500 dark:text-gray-400 text-xs uppercase font-bold tracking-wider">
                                <tr>
                                    <th className="px-6 py-4 text-left">Software</th>
                                    <th className="px-6 py-4 text-left">Version</th>
                                    <th className="px-6 py-4 text-left">License</th>
                                    <th className="px-6 py-4 text-left">Expiry</th>
                                    <th className="px-6 py-4 text-left">Installed On</th>
                                    <th className="px-6 py-4 text-left">Vendor</th>
                                    <th className="px-6 py-4 text-left">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {filtered.map(sw => {
                                    const expired = isExpired(sw.expiryDate);
                                    const soon = isExpiringSoon(sw.expiryDate);
                                    return (
                                        <tr key={sw._id} className="hover:bg-gray-50 dark:hover:bg-white/[0.01] transition-colors">
                                            <td className="px-6 py-4 font-semibold text-gray-800 dark:text-white">{sw.name}</td>
                                            <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{sw.version || '—'}</td>
                                            <td className="px-6 py-4">
                                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 capitalize">{sw.licenseType}</span>
                                            </td>
                                            <td className="px-6 py-4 text-[11px] font-medium">
                                                {sw.expiryDate ? (
                                                    <span className={`${expired ? 'text-red-500' : soon ? 'text-yellow-500' : 'text-gray-500 dark:text-gray-400'}`}>
                                                        {expired ? '⚠ Expired: ' : soon ? '⚠ Expiring: ' : ''}
                                                        {new Date(sw.expiryDate).toLocaleDateString()}
                                                    </span>
                                                ) : <span className="text-gray-400">—</span>}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {sw.installedOn?.length > 0
                                                        ? sw.installedOn.map(p => (
                                                            <span key={p._id} className="text-[10px] font-bold bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 px-2 py-0.5 rounded">{p.pcNumber}</span>
                                                        ))
                                                        : <span className="text-gray-400 text-xs">—</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{sw.vendor || '—'}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-4 items-center">
                                                    <button onClick={() => openEdit(sw)} className="text-xs font-bold text-brand-500 hover:text-brand-600 uppercase tracking-wider">Edit</button>
                                                    <button onClick={() => deleteSW(sw._id)} className="text-xs font-bold text-red-400 hover:text-red-500 uppercase tracking-wider">Delete</button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </ComponentCard>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-6 uppercase tracking-tight">
                            {editing ? 'Modify Software Record' : 'Register New Software'}
                        </h3>
                        <form onSubmit={save} className="space-y-5">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-0.5">Application Name *</label>
                                <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                    placeholder="e.g. AutoCAD 2024" className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-800 dark:text-white outline-none focus:border-brand-500" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-0.5">Version</label>
                                    <input value={form.version} onChange={e => setForm(f => ({ ...f, version: e.target.value }))}
                                        placeholder="2024.1" className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-800 dark:text-white outline-none focus:border-brand-500" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-0.5">Vendor</label>
                                    <input value={form.vendor} onChange={e => setForm(f => ({ ...f, vendor: e.target.value }))}
                                        placeholder="Autodesk" className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-800 dark:text-white outline-none focus:border-brand-500" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-0.5">License Model</label>
                                    <select value={form.licenseType} onChange={e => setForm(f => ({ ...f, licenseType: e.target.value }))}
                                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-800 dark:text-white outline-none focus:border-brand-500 uppercase font-bold text-[11px] tracking-wide">
                                        {LICENSE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-0.5">Expiry Date</label>
                                    <input type="date" value={form.expiryDate} onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))}
                                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-800 dark:text-white outline-none focus:border-brand-500" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-0.5">License Key</label>
                                <input value={form.licenseKey} onChange={e => setForm(f => ({ ...f, licenseKey: e.target.value }))}
                                    placeholder="XXXX-XXXX-XXXX" className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-mono text-gray-800 dark:text-white outline-none focus:border-brand-500" />
                            </div>
                            {/* PC Selection */}
                            {pcs.length > 0 && (
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-0.5">Terminal Installation</label>
                                    <div className="flex flex-wrap gap-2 bg-gray-50 dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                                        {pcs.map(pc => (
                                            <button
                                                key={pc._id}
                                                type="button"
                                                onClick={() => togglePC(pc._id)}
                                                className={`text-[10px] font-bold px-3 py-1 rounded-full border transition-all ${form.installedOn.includes(pc._id)
                                                    ? 'bg-brand-500 text-white border-brand-500 shadow-md scale-105'
                                                    : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-brand-300'
                                                    }`}
                                            >
                                                {pc.pcNumber}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-0.5">Administrative Notes</label>
                                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                                    rows={2} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-800 dark:text-white outline-none focus:border-brand-500 resize-none" />
                            </div>

                            <div className="flex gap-4 mt-8 pt-4 border-t border-gray-100 dark:border-gray-800">
                                <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)} disabled={saving}>Cancel</Button>
                                <Button type="submit" className="flex-1" disabled={saving || !form.name.trim()} loading={saving}>
                                    {editing ? 'Update Registry' : 'Commit SW'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
