import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from './components/Layout';
import { ProgressBar } from './components/ProgressBar';
import { DonationForm } from './components/DonationForm';
import { AdminDashboard } from './components/AdminDashboard';
import { getCampaign, getStats, getRecentApprovedDonations } from './services/supabaseService';
import { Campaign, Stats, Donation } from './types';
import { ICONS } from './constants';

const App: React.FC = () => {
  const [view, setView] = useState<'landing' | 'admin' | 'login'>('landing');
  const [data, setData] = useState<{ campaign: Campaign | null, stats: Stats | null, recentDonors: Donation[] }>({ campaign: null, stats: null, recentDonors: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [thankYouMessage, setThankYouMessage] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    try { return localStorage.getItem('treefund_logged_in') === 'true'; } catch { return false; }
  });

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [campaign, stats, recentDonors] = await Promise.all([getCampaign(), getStats(), getRecentApprovedDonations(5)]);
      setData({ campaign, stats, recentDonors });
    } catch (e) { console.error("Data refresh failed", e); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      setView(hash === '#admin' ? (isLoggedIn ? 'admin' : 'login') : 'landing');
      if (hash !== '#admin') setThankYouMessage(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    handleHash();
    refreshData();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [isLoggedIn, refreshData]);

  const handleAdminLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    localStorage.setItem('treefund_logged_in', 'true');
    setIsLoggedIn(true);
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

  if (view === 'login') return <LoginScreen onLogin={handleAdminLogin} />;
  if (view === 'admin') return <Layout isAdmin onLogout={handleLogout}><AdminDashboard /></Layout>;
  if (isLoading || !data.campaign || !data.stats) return <LoadingScreen />;

  return (
    <Layout>
      <div className="bg-gray-50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          <div className="lg:col-span-7 space-y-12">
            <MainContent campaign={data.campaign} stats={data.stats} recentDonors={data.recentDonors} />
          </div>
          <div className="lg:col-span-5 lg:sticky lg:top-24">
            {thankYouMessage ? (
              <ThankYouCard message={thankYouMessage} onReset={() => setThankYouMessage(null)} />
            ) : (
              <DonationForm qrUrl={data.campaign.qr_image_url} treePrice={data.campaign.tree_price} onSuccess={handleDonationSuccess} />
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

const LoadingScreen = () => (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-white space-y-6">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center shadow-md animate-pulse">{ICONS.Trees}</div>
        <div className="text-center">
            <h1 className="text-xl font-bold text-gray-700">Loading Campaign...</h1>
            <p className="text-gray-500">Fetching the latest stats from the forest.</p>
        </div>
    </div>
);

const LoginScreen = ({ onLogin }) => (
    <Layout>
        <div className="max-w-sm mx-auto my-20 p-10 bg-white rounded-2xl shadow-sm border">
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mx-auto mb-4">{ICONS.Shield}</div>
                <h2 className="text-2xl font-bold text-gray-800">Admin Portal</h2>
                <p className="text-sm text-gray-500">Please authenticate to continue.</p>
            </div>
            <form onSubmit={onLogin} className="space-y-4">
                <input type="email" required className="form-input" placeholder="admin@treefund.my" />
                <input type="password" required className="form-input" placeholder="••••••••" />
                <button type="submit" className="btn-primary w-full py-3">Authorize</button>
            </form>
            <div className="mt-6 text-center">
                <button onClick={() => window.location.hash = ''} className="text-xs font-bold text-gray-400 hover:text-green-600">← Back to Home</button>
            </div>
        </div>
    </Layout>
);

const MainContent = ({ campaign, stats, recentDonors }) => (
    <>
        <div className="space-y-6">
            <h1 className="text-5xl md:text-7xl font-black text-gray-900 leading-tight tracking-tighter">
                {campaign.title.split('.').map((part, i) => <span key={i} className={i % 2 !== 0 ? "text-green-600" : ""}>{part}{i < campaign.title.split('.').length - 1 ? '.' : ''}<br/></span>)}
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl">{campaign.description}</p>
        </div>
        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-sm border">
            <ProgressBar current={stats.totalTrees} goal={stats.goalTrees} />
        </div>
        <div>
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Recent Supporters</h3>
            <div className="flex flex-wrap gap-4">
                {recentDonors.map(donor => (
                    <div key={donor.id} className="bg-white px-5 py-3 rounded-xl shadow-sm border flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-green-100 text-green-700 flex items-center justify-center font-bold text-sm">{donor.donor_name?.[0].toUpperCase() || 'A'}</div>
                        <div>
                            <p className="text-sm font-bold text-gray-800">{donor.donor_name}</p>
                            <p className="text-xs font-semibold text-green-600">{donor.tree_quantity} Trees</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </>
);

const ThankYouCard = ({ message, onReset }) => (
    <div className="bg-white rounded-2xl p-10 shadow-2xl border text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
        <div className="w-24 h-24 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mx-auto">{ICONS.Check}</div>
        <h2 className="text-3xl font-bold text-gray-800">Donation Submitted!</h2>
        <p className="text-gray-600 text-sm">"{message}"</p>
        <button onClick={onReset} className="btn-primary w-full py-4">Sponsor More Trees</button>
    </div>
);

export default App;