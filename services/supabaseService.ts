import { Campaign, Donation, DonationStatus, Stats } from '../types';
import { TREE_PRICE, DEFAULT_GOAL, MOCK_QR_CODE } from '../constants';

// Simulated database using localStorage for the prototype
const STORAGE_KEY_CAMPAIGN = 'treefund_campaign_v2';
const STORAGE_KEY_DONATIONS = 'treefund_donations_v2';

const initialCampaign: Campaign = {
  id: 'main-campaign',
  title: 'Restore our Rainforests',
  description: 'Join us in restoring the biodiversity of Malaysian tropical forests. Every seedling counts toward a sustainable future for our wildlife and climate.',
  tree_price: TREE_PRICE,
  goal_trees: DEFAULT_GOAL,
  trees_approved: 0,
  qr_image_url: MOCK_QR_CODE
};

const safeGetItem = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    console.warn("Storage access denied", e);
    return null;
  }
};

const safeSetItem = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn("Storage write denied", e);
  }
};

export const getCampaign = (): Campaign => {
  const stored = safeGetItem(STORAGE_KEY_CAMPAIGN);
  if (!stored) {
    safeSetItem(STORAGE_KEY_CAMPAIGN, JSON.stringify(initialCampaign));
    return initialCampaign;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return initialCampaign;
  }
};

export const updateCampaign = (data: Partial<Campaign>): Campaign => {
  const current = getCampaign();
  const updated = { ...current, ...data };
  safeSetItem(STORAGE_KEY_CAMPAIGN, JSON.stringify(updated));
  return updated;
};

export const getDonations = (): Donation[] => {
  const stored = safeGetItem(STORAGE_KEY_DONATIONS);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch (e) {
    return [];
  }
};

export const createDonation = (donation: Omit<Donation, 'id' | 'created_at' | 'status'>): Donation => {
  const newDonation: Donation = {
    ...donation,
    id: `DON-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
    status: DonationStatus.PENDING,
    created_at: new Date().toISOString()
  };
  const current = getDonations();
  safeSetItem(STORAGE_KEY_DONATIONS, JSON.stringify([newDonation, ...current]));
  return newDonation;
};

export const updateDonationStatus = (id: string, status: DonationStatus): void => {
  const donations = getDonations();
  const index = donations.findIndex(d => d.id === id);
  if (index === -1) return;

  const oldStatus = donations[index].status;
  const donation = donations[index];
  
  // Update donation status
  donations[index] = { ...donation, status };
  safeSetItem(STORAGE_KEY_DONATIONS, JSON.stringify(donations));

  // Handle campaign counter logic
  if (status === DonationStatus.APPROVED && oldStatus !== DonationStatus.APPROVED) {
    const campaign = getCampaign();
    updateCampaign({ trees_approved: (campaign.trees_approved || 0) + donation.tree_quantity });
  } else if (status !== DonationStatus.APPROVED && oldStatus === DonationStatus.APPROVED) {
    const campaign = getCampaign();
    updateCampaign({ trees_approved: Math.max(0, (campaign.trees_approved || 0) - donation.tree_quantity) });
  }
};

export const getRecentApprovedDonations = (limit: number = 5): Donation[] => {
  return getDonations()
    .filter(d => d.status === DonationStatus.APPROVED)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit);
};

export const getStats = (): Stats => {
  const campaign = getCampaign();
  const donations = getDonations();
  const approved = donations.filter(d => d.status === DonationStatus.APPROVED);
  const pending = donations.filter(d => d.status === DonationStatus.PENDING);

  return {
    totalTrees: approved.reduce((acc, curr) => acc + curr.tree_quantity, 0),
    totalAmount: approved.reduce((acc, curr) => acc + curr.amount, 0),
    pendingTrees: pending.reduce((acc, curr) => acc + curr.tree_quantity, 0),
    goalTrees: campaign.goal_trees
  };
};