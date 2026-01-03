import React, { useState, useEffect, useCallback } from 'react';
import { Donation, DonationStatus, Campaign, Stats } from '../types';
import { getCampaign, getStats } from '../services/supabaseService';
import { ICONS } from '../constants';

// Admin-specific data fetching and mutation functions
const api = {
    getAllDonations: async (): Promise<Donation[]> => {
        const res = await fetch('/api/get-all-donations');
        if (!res.ok) throw new Error('Failed to fetch donations');
        return res.json();
    },
    updateDonationStatus: async (id: string, status: DonationStatus) => {
        const res = await fetch('/api/update-donation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status }),
        });
        if (!res.ok) throw new Error('Failed to update donation');
        return res.json();
    },
    updateSettings: async (formData: FormData) => {
        const res = await fetch('/api/update-settings', {
            method: 'POST',
            body: formData,
        });
        if (!res.ok) throw new Error('Failed to update settings');
        return res.json();
    }
};

export const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<{ donations: Donation[], campaign: Campaign | null, stats: Stats | null }>({ donations: [], campaign: null, stats: null });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'history' | 'settings'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingReceipt, setViewingReceipt] = useState<string | null>(null);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [donations, campaign, stats] = await Promise.all([api.getAllDonations(), getCampaign(), getStats()]);
      setData({ donations, campaign, stats });
    } catch (error) { console.error("Failed to refresh admin data:", error); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { refreshData(); }, [refreshData]);

  const handleStatusChange = async (id: string, status: DonationStatus) => {
    try {
        await api.updateDonationStatus(id, status);
        await refreshData();
    } catch (error) { alert(`Error: ${error.message}`); }
  };

  const filteredDonations = data.donations.filter(d =>
    d.donor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.id.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const pendingDonations = filteredDonations.filter(d => d.status === 'PENDING');
  const historyDonations = filteredDonations.filter(d => d.status !== 'PENDING');

  if (isLoading) return <div className="text-center p-24 font-black text-gray-400">Loading Admin Console...</div>;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900">Admin Console</h1>
            <p className="text-gray-600">Manage donations and campaign settings.</p>
          </div>
          <input type="text" placeholder="Search by name or ID..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="form-input w-full md:w-72" />
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard title="Total Raised" value={`RM ${data.stats?.totalAmount.toLocaleString()}`} icon={ICONS.Wallet} />
            <StatCard title="Trees Funded" value={data.stats?.totalTrees.toLocaleString()} icon={ICONS.Tree} />
            <StatCard title="Pending Review" value={pendingDonations.length.toLocaleString()} icon={ICONS.Clock} />
            <StatCard title="Campaign Goal" value={data.campaign?.goal_trees.toLocaleString()} icon={ICONS.Shield} />
        </div>

        <div className="bg-white/60 backdrop-blur-sm p-2 rounded-2xl inline-flex border gap-2">
            {['pending', 'history', 'settings'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab as any)} className={`tab-btn ${activeTab === tab ? 'tab-btn-active' : ''}`}>
                    {ICONS[tab] || ICONS.Trees}<span>{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
                </button>
            ))}
        </div>

        <main className="bg-white rounded-2xl shadow-sm border p-8">
            {activeTab === 'pending' && <DonationTable donations={pendingDonations} onStatusChange={handleStatusChange} onViewReceipt={setViewingReceipt} isPending={true} />}
            {activeTab === 'history' && <DonationTable donations={historyDonations} isPending={false} />}
            {activeTab === 'settings' && <SettingsPane campaign={data.campaign} onSave={refreshData} />}
        </main>

        {viewingReceipt && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setViewingReceipt(null)}>
                <div className="bg-white p-2 rounded-2xl shadow-2xl max-w-lg w-full">
                    <img src={viewingReceipt} alt="Receipt" className="rounded-xl w-full" />
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

const DonationTable = ({ donations, onStatusChange, onViewReceipt, isPending }) => (
    <div className="overflow-x-auto">
        <table className="w-full text-left">
            <thead>
                <tr className="border-b-2 border-gray-100">
                    <th className="th">Contributor</th>
                    <th className="th">Impact</th>
                    {isPending ? <>
                        <th className="th text-center">Receipt</th>
                        <th className="th text-right">Actions</th>
                    </> : <th className="th">Status</th>}
                </tr>
            </thead>
            <tbody>
                {donations.length > 0 ? donations.map(d => (
                    <tr key={d.id} className="border-b border-gray-100 last:border-none">
                        <td className="td font-semibold">{d.donor_name}<br/><span className="font-normal text-xs text-gray-500">{new Date(d.created_at).toLocaleString()}</span></td>
                        <td className="td">{d.tree_quantity} Trees<br/><span className="font-bold text-green-600">RM {d.amount}</span></td>
                        {isPending ? <>
                            <td className="td text-center"><a href={d.proof_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-bold hover:underline">View Proof</a></td>
                            <td className="td text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <button onClick={() => onStatusChange(d.id, DonationStatus.APPROVED)} className="action-btn bg-green-100 text-green-700">{ICONS.Check}</button>
                                    <button onClick={() => onStatusChange(d.id, DonationStatus.REJECTED)} className="action-btn bg-red-100 text-red-700">{ICONS.X}</button>
                                </div>
                            </td>
                        </> : <td className="td"><span className={`status-badge ${d.status === 'APPROVED' ? 'status-badge-approved' : 'status-badge-rejected'}`}>{d.status}</span></td>}
                    </tr>
                )) : <tr><td colSpan={4} className="text-center py-16 text-gray-500 font-semibold">No donations found.</td></tr>}
            </tbody>
        </table>
    </div>
);

const SettingsPane = ({ campaign, onSave }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [qrPreview, setQrPreview] = useState<string | null>(campaign?.qr_image_url || null);

    const handleQrChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setQrPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.updateSettings(new FormData(e.currentTarget));
            alert("Settings saved successfully!");
            onSave();
        } catch (error) { alert(`Error: ${error.message}`); }
        finally { setIsSubmitting(false); }
    };

    return (
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6">
            <div className="form-group">
                <label className="form-label">Campaign Title</label>
                <input name="title" defaultValue={campaign?.title} className="form-input" />
            </div>
            <div className="form-group">
                <label className="form-label">Description</label>
                <textarea name="description" defaultValue={campaign?.description} rows={3} className="form-input" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-group">
                    <label className="form-label">Price per Tree (RM)</label>
                    <input name="tree_price" type="number" defaultValue={campaign?.tree_price} className="form-input" />
                </div>
                <div className="form-group">
                    <label className="form-label">Goal (Trees)</label>
                    <input name="goal_trees" type="number" defaultValue={campaign?.goal_trees} className="form-input" />
                </div>
            </div>
            <div className="form-group">
                <label className="form-label">Payment QR Code</label>
                <div className="mt-2 flex items-center gap-6 p-4 border-2 border-gray-100 rounded-xl">
                    <img src={qrPreview || campaign?.qr_image_url} alt="QR Code" className="w-24 h-24 rounded-lg bg-gray-100 object-cover" />
                    <input name="qr_code" type="file" accept="image/*" onChange={handleQrChange} className="text-sm" />
                </div>
            </div>
            <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-4 text-base">
                {isSubmitting ? "Saving..." : "Save Campaign Settings"}
            </button>
        </form>
    )
}

const StatCard = ({ title, value, icon }) => (
  <div className="bg-white p-5 rounded-2xl border shadow-sm flex items-center gap-4">
    <div className="w-12 h-12 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center">{icon}</div>
    <div>
      <p className="text-sm text-gray-500 font-semibold">{title}</p>
      <p className="text-2xl font-black text-gray-900">{value || '0'}</p>
    </div>
  </div>
);

/* Base styles for the new design - assumed to be in a global CSS file
.form-label { @apply block text-sm font-bold text-gray-600 mb-2; }
.form-input { @apply w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition; }
.tab-btn { @apply px-4 py-2 rounded-lg font-bold text-gray-500 flex items-center gap-2; }
.tab-btn-active { @apply bg-white text-green-600 shadow-md; }
.th { @apply px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider; }
.td { @apply px-6 py-4 text-sm text-gray-800; }
.action-btn { @apply p-2 rounded-lg transition-colors; }
.status-badge { @apply px-2 py-1 text-xs font-bold rounded-full uppercase; }
.status-badge-approved { @apply bg-green-100 text-green-800; }
.status-badge-rejected { @apply bg-red-100 text-red-800; }
*/