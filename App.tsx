import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { ProgressBar } from './components/ProgressBar';
import { DonationForm } from './components/DonationForm';
import { AdminDashboard } from './components/AdminDashboard';
import { getCampaign, getStats, getRecentApprovedDonations } from './services/supabaseService';
import { Campaign, Stats, Donation } from './types';
import { ICONS } from './constants';

const App: React.FC = () => {
  const [view, setView] = useState<'landing' | 'admin' | 'login'>('landing');
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentDonors, setRecentDonors] = useState<Donation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [thankYouMessage, setThankYouMessage] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    try {
      return localStorage.getItem('treefund_logged_in') === 'true';
    } catch {
      return false;
    }
  });

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const [campaignData, statsData, donorsData] = await Promise.all([
        getCampaign(),
        getStats(),
        getRecentApprovedDonations(5)
      ]);
      setCampaign(campaignData);
      setStats(statsData);
      setRecentDonors(donorsData);
    } catch (e) {
      console.error("Data refresh failed", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash === '#admin') {
        setView(isLoggedIn ? 'admin' : 'login');
      } else {
        setView('landing');
        setThankYouMessage(null);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const initLoad = async () => {
      handleHash();
      await refreshData();
    };

    initLoad();

    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [isLoggedIn]);

  const handleAdminLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    localStorage.setItem('treefund_logged_in', 'true');
    setIsLoggedIn(true);
    setView('admin');
    window.location.hash = '#admin';
  };

  const handleLogout = () => {
    localStorage.removeItem('treefund_logged_in');
    setIsLoggedIn(false);
    window.location.hash = '';
  };

  const handleDonationSuccess = async (message: string) => {
    setThankYouMessage(message);
    await refreshData();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (view === 'login') {
    return (
      <Layout onAdminClick={() => window.location.hash = '#admin'}>
        <div className="max-w-md mx-auto my-24 p-12 bg-white rounded-[3.5rem] shadow-[0_32px_64px_-15px_rgba(0,0,0,0.1)] border border-gray-100 relative overflow-hidden">
          <div className="text-center mb-12 relative z-10">
            <div className="w-24 h-24 bg-green-600 text-white rounded-[2.2rem] flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-green-100 rotate-6 transform hover:rotate-0 transition-transform duration-500">
              <div className="scale-150">{ICONS.Shield}</div>
            </div>
            <h2 className="text-4xl font-black text-gray-900 tracking-tight">Admin Portal</h2>
            <p className="text-sm text-gray-500 mt-4 font-medium px-8 leading-relaxed">Secure workspace for campaign auditors.</p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-7 relative z-10">
            <input type="email" required className="w-full px-8 py-6 bg-gray-50 border-2 border-gray-100 rounded-3xl focus:border-green-500 outline-none font-black text-gray-700" placeholder="admin@treefund.my" />
            <input type="password" required className="w-full px-8 py-6 bg-gray-50 border-2 border-gray-100 rounded-3xl focus:border-green-500 outline-none font-black text-gray-700" placeholder="••••••••" />
            <button type="submit" className="w-full py-7 bg-green-600 hover:bg-green-700 text-white font-black rounded-[2rem] transition-all uppercase tracking-[0.2em] text-[10px]">
              Authorize Entry
            </button>
          </form>
          <div className="mt-12 text-center relative z-10">
             <button onClick={() => window.location.hash = ''} className="text-[10px] font-black text-gray-300 hover:text-green-600 transition-colors uppercase tracking-[0.2em]">← Return Home</button>
          </div>
        </div>
      </Layout>
    );
  }

  if (view === 'admin') {
    return (
      <Layout isAdmin onLogout={handleLogout} onAdminClick={() => window.location.hash = '#admin'}>
        <AdminDashboard />
      </Layout>
    );
  }

  if (isLoading) {
    return (
        <div className="w-full h-screen flex flex-col items-center justify-center bg-[#fcfdfc] space-y-8">
            <div className="w-24 h-24 bg-green-600 text-white rounded-[2.2rem] flex items-center justify-center mx-auto shadow-2xl shadow-green-100 rotate-6">
              <div className="scale-150 animate-pulse">{ICONS.Trees}</div>
            </div>
            <div className="text-center">
                <h1 className="text-2xl font-black text-gray-800">Securing the Grove...</h1>
                <p className="text-gray-500 font-medium mt-2">Connecting to our digital forest to get the latest stats.</p>
            </div>
        </div>
    )
  }

  return (
    <Layout onAdminClick={() => window.location.hash = '#admin'}>
      <div className="bg-[#fcfdfc] relative overflow-hidden min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24 lg:pt-32 lg:pb-48 grid grid-cols-1 lg:grid-cols-12 gap-20 items-start relative z-10">
          <div className="lg:col-span-7 space-y-16">
            <div className="space-y-10">
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-white border-2 border-green-50 text-green-700 rounded-full text-[10px] font-black uppercase tracking-[0.25em] shadow-sm">
                Live Mission
              </div>
              <h1 className="text-7xl md:text-[8rem] font-black text-gray-900 leading-[0.88] tracking-tighter">
                Foster a<br/><span className="text-green-600">Forest.</span>
              </h1>
              <p className="text-2xl text-gray-500 max-w-xl leading-relaxed font-medium">
                {campaign?.description}
              </p>
            </div>

            <div className="bg-white/90 backdrop-blur-xl p-12 rounded-[4rem] shadow-xl border border-white">
              {stats && campaign && (
                <ProgressBar current={stats.totalTrees} goal={campaign.goal_trees} />
              )}
            </div>

            <div className="space-y-8">
               <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] ml-4">Guardians of the Soil</h3>
               <div className="flex flex-wrap gap-5">
                  {recentDonors.map((donor) => (
                    <div key={donor.id} className="bg-white px-7 py-4 rounded-[2rem] shadow-sm border border-gray-100 flex items-center gap-4">
                       <div className="w-10 h-10 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center font-black text-xs">
                          {donor.donor_name?.[0].toUpperCase() || 'A'}
                       </div>
                       <div className="flex flex-col">
                          <span className="text-sm font-black text-gray-900">{donor.donor_name}</span>
                          <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">{donor.tree_quantity} Trees</span>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>

          <div className="lg:col-span-5 lg:sticky lg:top-32">
            {thankYouMessage ? (
              <div className="bg-white rounded-[4rem] p-16 shadow-2xl border border-gray-50 text-center space-y-12">
                <div className="w-32 h-32 bg-green-50 text-green-600 rounded-[3rem] flex items-center justify-center mx-auto">
                  <div className="scale-[3]">{ICONS.Check}</div>
                </div>
                <h2 className="text-5xl font-black text-gray-900 tracking-tighter">Impact Logged</h2>
                <p className="text-green-900 font-black italic text-xl">"{thankYouMessage}"</p>
                <button onClick={() => setThankYouMessage(null)} className="w-full py-8 bg-gray-900 text-white font-black rounded-[2.2rem] uppercase tracking-[0.2em] text-[10px]">
                  Sponsor More Impact
                </button>
              </div>
            ) : (
              <DonationForm qrUrl={campaign?.qr_image_url || ''} onSuccess={handleDonationSuccess} />
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default App;