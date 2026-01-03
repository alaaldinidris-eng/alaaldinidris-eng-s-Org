import { Campaign, Donation, DonationStatus, Stats } from '../types';

// --- Client-side Cache ---
let apiCache: { campaign: Campaign; stats: Stats; recentDonors: Donation[] } | null = null;
let cacheTimestamp: number | null = null;

const getApiData = async () => {
  const now = Date.now();
  if (apiCache && cacheTimestamp && (now - cacheTimestamp < 15000)) {
    return apiCache;
  }
  const response = await fetch('/api');
  if (!response.ok) throw new Error('Failed to fetch API data.');
  const data = await response.json();
  apiCache = data;
  cacheTimestamp = now;
  return data;
};

// --- Public API-driven Functions ---
export const getCampaign = async (): Promise<Campaign> => (await getApiData()).campaign;
export const getStats = async (): Promise<Stats> => (await getApiData()).stats;
export const getRecentApprovedDonations = async (limit: number = 5): Promise<Donation[]> =>
  (await getApiData()).recentDonors.slice(0, limit);
