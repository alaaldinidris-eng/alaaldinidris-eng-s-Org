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

// --- Local Storage Helpers ---
const getDonationsFromStorage = (): Donation[] => {
  try {
    const stored = localStorage.getItem('treefund_donations_v2');
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
};
const saveDonationsToStorage = (donations: Donation[]) => {
  try {
    localStorage.setItem('treefund_donations_v2', JSON.stringify(donations));
  } catch (e) { console.warn("Could not save donations", e)}
};
const getCampaignFromStorage = (): Campaign | null => {
    const stored = localStorage.getItem('treefund_campaign_v2');
    return stored ? JSON.parse(stored) : null;
}
const saveCampaignToStorage = (campaign: Campaign) => {
    localStorage.setItem('treefund_campaign_v2', JSON.stringify(campaign));
}


// --- Admin & Mutation Functions (localStorage-based) ---
export const createDonation = async (donation: Omit<Donation, 'id' | 'created_at' | 'status'>): Promise<Donation> => {
  const newDonation: Donation = { ...donation, id: `DON-${Math.random().toString(36).substring(2, 7).toUpperCase()}`, status: DonationStatus.PENDING, created_at: new Date().toISOString() };
  const donations = getDonationsFromStorage();
  saveDonationsToStorage([newDonation, ...donations]);
  return newDonation;
};

export const getAdminAllDonations = async (): Promise<Donation[]> => {
    return getDonationsFromStorage();
};

export const adminUpdateDonationStatus = async (id: string, status: DonationStatus): Promise<void> => {
  const donations = getDonationsFromStorage();
  const index = donations.findIndex(d => d.id === id);
  if (index === -1) return;
  donations[index].status = status;
  saveDonationsToStorage(donations);
  apiCache = null; // Invalidate cache
};

export const adminUpdateCampaign = async (data: Partial<Campaign>): Promise<Campaign> => {
  const campaign = await getCampaign();
  const campaignFromStorage = getCampaignFromStorage();
  const baseCampaign = campaignFromStorage || campaign;
  const updated = { ...baseCampaign, ...data };
  saveCampaignToStorage(updated as Campaign);
  apiCache = null; // Invalidate cache
  return updated as Campaign;
};