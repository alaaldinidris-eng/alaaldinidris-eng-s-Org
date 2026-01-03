import React, { useState, useEffect } from 'react';
import { Donation, DonationStatus, Campaign, Stats } from '../types';
import { getDonations, updateDonationStatus, getCampaign, updateCampaign, getStats } from '../services/supabaseService';
import { ICONS } from '../constants';

export const AdminDashboard: React.FC = () => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'history' | 'settings'>('pending');
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingReceipt, setViewingReceipt] = useState<string | null>(null);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setDonations(getDonations());
    setCampaign(getCampaign());
    setStats(getStats());
  };

  const handleStatusChange = (id: string, status: DonationStatus) => {
    updateDonationStatus(id, status);
    refreshData();
  };

  const handleUpdateCampaign = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const updated = updateCampaign({
      title: formData.get('title') as string,
      goal_trees: parseInt(formData.get('goal') as string),
      tree_price: parseInt(formData.get('price') as string),
      qr_image_url: formData.get('qr') as string,
    });
    setCampaign(updated);
    setIsEditing(false);
    refreshData();
  };

  const filteredDonations = donations.filter(d => 
    d.donor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.id.includes(searchTerm)
  );

  const pendingDonations = filteredDonations.filter(d => d.status === DonationStatus.PENDING);
  const historyDonations = filteredDonations.filter(d => d.status !== DonationStatus.PENDING);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Campaign Command</h1>
          <p className="text-gray-500 font-medium">Verify contributions and manage the mission.</p>
        </div>
        <div className="flex items-center gap-4">
          <input 
            type="text" 
            placeholder="Search sponsors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-4 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none w-64 shadow-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Funds Raised" value={`RM ${stats?.totalAmount.toLocaleString()}`} icon={ICONS.Wallet} color="text-green-600" bg="bg-green-50" />
        <StatCard title="Approved Trees" value={stats?.totalTrees.toLocaleString() || '0'} icon={ICONS.Tree} color="text-green-600" bg="bg-green-50" />
        <StatCard title="Pending" value={stats?.pendingTrees.toLocaleString() || '0'} icon={ICONS.Clock} color="text-yellow-600" bg="bg-yellow-50" />
        <StatCard title="Goal" value={stats?.goalTrees.toLocaleString() || '0'} icon={ICONS.Shield} color="text-blue-600" bg="bg-blue-50" />
      </div>

      <div className="bg-gray-100 p-1.5 rounded-2xl inline-flex">
        {['pending', 'history', 'settings'].map((tab) => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-6 py-2.5 rounded-[0.9rem] text-sm font-black transition-all ${activeTab === tab ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500'}`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div>
        {activeTab === 'pending' && (
          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Contributor</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Impact</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Receipt</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pendingDonations.length > 0 ? pendingDonations.map(d => (
                  <tr key={d.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-8 py-6">
                      <p className="font-black text-gray-900">{d.donor_name}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">{new Date(d.created_at).toLocaleString()}</p>
                    </td>
                    <td className="px-8 py-6">
                      <span className="font-black text-gray-800">{d.tree_quantity} Trees</span>
                      <p className="text-xs font-bold text-green-600">RM {d.amount}</p>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <button onClick={() => setViewingReceipt(d.receipt_url)} className="text-blue-600 text-xs font-black underline">View</button>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <div className="flex items-center justify-end gap-3">
                          <button onClick={() => handleStatusChange(d.id, DonationStatus.APPROVED)} className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-600 hover:text-white transition-all">{ICONS.Check}</button>
                          <button onClick={() => handleStatusChange(d.id, DonationStatus.REJECTED)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all">{ICONS.X}</button>
                       </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={4} className="px-8 py-20 text-center text-gray-400 font-black">Queue is clear!</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Contributor</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Impact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {historyDonations.map(d => (
                  <tr key={d.id}>
                    <td className="px-8 py-6 font-black">{d.donor_name}</td>
                    <td className="px-8 py-6">
                      <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${d.status === DonationStatus.APPROVED ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 font-black">{d.tree_quantity} Trees</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'settings' && campaign && (
          <div className="max-w-2xl mx-auto bg-white rounded-[2.5rem] shadow-xl border border-gray-100 p-10">
            <form onSubmit={handleUpdateCampaign} className="space-y-8">
              <input name="title" defaultValue={campaign.title} disabled={!isEditing} className="w-full p-4 bg-gray-50 border rounded-2xl font-black" placeholder="Title" />
              <div className="grid grid-cols-2 gap-4">
                <input name="price" type="number" defaultValue={campaign.tree_price} disabled={!isEditing} className="w-full p-4 bg-gray-50 border rounded-2xl font-black" placeholder="Price" />
                <input name="goal" type="number" defaultValue={campaign.goal_trees} disabled={!isEditing} className="w-full p-4 bg-gray-50 border rounded-2xl font-black" placeholder="Goal" />
              </div>
              <input name="qr" defaultValue={campaign.qr_image_url} disabled={!isEditing} className="w-full p-4 bg-gray-50 border rounded-2xl font-black text-xs" placeholder="QR URL" />
              {isEditing ? (
                <div className="flex gap-4">
                  <button type="submit" className="flex-1 py-4 bg-green-600 text-white font-black rounded-2xl">Save</button>
                  <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-4 bg-gray-100 text-gray-500 font-black rounded-2xl">Cancel</button>
                </div>
              ) : (
                <button type="button" onClick={() => setIsEditing(true)} className="w-full py-4 bg-gray-900 text-white font-black rounded-2xl">Edit Settings</button>
              )}
            </form>
          </div>
        )}
      </div>

      {viewingReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setViewingReceipt(null)}>
          <img src={viewingReceipt} alt="Receipt" className="max-w-full max-h-full rounded-xl shadow-2xl" />
        </div>
      )}
    </div>
  );
};

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; color: string; bg: string }> = ({ title, value, icon, color, bg }) => (
  <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-5">
    <div className={`w-14 h-14 rounded-2xl ${bg} ${color} flex items-center justify-center`}>{icon}</div>
    <div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{title}</p>
      <p className="text-2xl font-black text-gray-900 tracking-tight">{value}</p>
    </div>
  </div>
);