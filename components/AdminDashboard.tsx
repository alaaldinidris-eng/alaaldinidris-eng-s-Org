import React, { useState, useEffect, useCallback } from 'react';
import { Donation, DonationStatus, Campaign, Stats } from '../types';
import { getCampaign, getStats } from '../services/supabaseService';
import { ICONS } from '../constants';

// This function now fetches ALL donations for the admin view
const getAllDonations = async (): Promise<Donation[]> => {
    const response = await fetch('/api/get-all-donations');
    if (!response.ok) {
        throw new Error('Failed to fetch donations for admin.');
    }
    return response.json();
}

// This function calls our new update API
const updateDonationStatus = async (id: string, status: DonationStatus) => {
    const response = await fetch('/api/update-donation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
    });
    if (!response.ok) {
        throw new Error('Failed to update donation status.');
    }
    return response.json();
}

export const AdminDashboard: React.FC = () => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingReceipt, setViewingReceipt] = useState<string | null>(null);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [donationsData, campaignData, statsData] = await Promise.all([
        getAllDonations(),
        getCampaign(),
        getStats(),
      ]);
      setDonations(donationsData);
      setCampaign(campaignData);
      setStats(statsData);
    } catch (error) {
      console.error("Failed to refresh admin data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const handleStatusChange = async (id: string, status: DonationStatus) => {
    try {
        await updateDonationStatus(id, status);
        await refreshData();
    } catch (error) {
        console.error("Failed to update status:", error);
        alert("Could not update donation status. See console for details.");
    }
  };

  const filteredDonations = donations.filter(d => 
    d.donor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingDonations = filteredDonations.filter(d => d.status === 'PENDING');
  const historyDonations = filteredDonations.filter(d => d.status !== 'PENDING');

  if (isLoading) {
      return <div className="text-center p-24 font-black">Loading Admin Console...</div>
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Campaign Command</h1>
          <p className="text-gray-500 font-medium">Verify contributions and manage the mission.</p>
        </div>
        <input
            type="text" 
            placeholder="Search by name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-4 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none w-64 shadow-sm"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Funds Raised" value={`RM ${stats?.totalAmount.toLocaleString()}`} icon={ICONS.Wallet} color="text-green-600" bg="bg-green-50" />
        <StatCard title="Approved Trees" value={stats?.totalTrees.toLocaleString() || '0'} icon={ICONS.Tree} color="text-green-600" bg="bg-green-50" />
        <StatCard title="Pending Donations" value={pendingDonations.length.toLocaleString()} icon={ICONS.Clock} color="text-yellow-600" bg="bg-yellow-50" />
        <StatCard title="Goal" value={stats?.goalTrees.toLocaleString() || '0'} icon={ICONS.Shield} color="text-blue-600" bg="bg-blue-50" />
      </div>

      <div className="bg-gray-100 p-1.5 rounded-2xl inline-flex">
        {['pending', 'history'].map((tab) => (
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
          <DonationTable
            donations={pendingDonations}
            onStatusChange={handleStatusChange}
            onViewReceipt={setViewingReceipt}
            isPending={true}
          />
        )}
        {activeTab === 'history' && (
          <DonationTable
            donations={historyDonations}
            isPending={false}
          />
        )}
      </div>

      {viewingReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setViewingReceipt(null)}>
            <div className="bg-white p-4 rounded-2xl shadow-2xl">
                <img src={viewingReceipt} alt="Receipt" className="max-w-full max-h-[80vh] rounded-xl" />
            </div>
        </div>
      )}
    </div>
  );
};

const DonationTable = ({ donations, onStatusChange, onViewReceipt, isPending }) => (
    <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
            <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Contributor</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Impact</th>
                    {isPending && <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Receipt</th>}
                    {isPending && <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Verification</th>}
                    {!isPending && <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>}
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {donations.length > 0 ? donations.map(d => (
                    <tr key={d.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-8 py-6">
                            <p className="font-black text-gray-900">{d.donor_name}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase">{new Date(d.created_at).toLocaleString()}</p>
                        </td>
                        <td className="px-8 py-6">
                            <span className="font-black text-gray-800">{d.tree_quantity} Trees</span>
                            <p className="text-xs font-bold text-green-600">RM {d.amount}</p>
                        </td>
                        {isPending && (
                            <>
                                <td className="px-8 py-6 text-center">
                                    <a href={d.proof_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-xs font-black underline">View</a>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <div className="flex items-center justify-end gap-3">
                                        <button onClick={() => onStatusChange(d.id, DonationStatus.APPROVED)} className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-600 hover:text-white transition-all">{ICONS.Check}</button>
                                        <button onClick={() => onStatusChange(d.id, DonationStatus.REJECTED)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all">{ICONS.X}</button>
                                    </div>
                                </td>
                            </>
                        )}
                        {!isPending && (
                            <td className="px-8 py-6">
                                <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${d.status === DonationStatus.APPROVED ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {d.status}
                                </span>
                            </td>
                        )}
                    </tr>
                )) : (
                    <tr><td colSpan={isPending ? 4: 3} className="px-8 py-20 text-center text-gray-400 font-black">{isPending ? "No pending donations." : "No historical donations."}</td></tr>
                )}
            </tbody>
        </table>
    </div>
);


const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; color: string; bg: string }> = ({ title, value, icon, color, bg }) => (
  <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-5">
    <div className={`w-14 h-14 rounded-2xl ${bg} ${color} flex items-center justify-center`}>{icon}</div>
    <div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{title}</p>
      <p className="text-2xl font-black text-gray-900 tracking-tight">{value}</p>
    </div>
  </div>
);