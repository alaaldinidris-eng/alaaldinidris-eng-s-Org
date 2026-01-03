import { supabase } from '../services/supabaseClient';
import { Campaign, Stats } from '../types';
import { MOCK_QR_CODE } from '../constants';

// A fallback campaign object in case the database is unreachable or empty.
const fallbackCampaign: Campaign = {
    id: 'fallback-campaign',
    title: 'Restore our Rainforests',
    description: 'Join us in restoring the biodiversity of Malaysian tropical forests.',
    tree_price: 10,
    goal_trees: 1000,
    trees_approved: 0,
    qr_image_url: MOCK_QR_CODE,
};

export default async function handler(req, res) {
    try {
        // --- Step 1: Fetch Campaign Settings from Supabase ---
        const { data: settings, error: settingsError } = await supabase
            .from('campaign_settings')
            .select('*')
            .limit(1)
            .single(); // .single() ensures we get one object, not an array

        if (settingsError && settingsError.code !== 'PGRST116') { // Ignore 'Range not satisfiable' error for empty tables
            console.error('Supabase settings fetch error:', settingsError);
            // Don't throw; we can use the fallback
        }

        const liveCampaign = settings ? { ...fallbackCampaign, ...settings } : fallbackCampaign;

        // --- Step 2: Fetch Approved Donations ---
        const { data: approvedDonations, error: donationsError } = await supabase
            .from('donations')
            .select('*')
            .eq('status', 'APPROVED');

        if (donationsError) {
            console.error('Supabase donations fetch error:', donationsError);
            throw new Error('Failed to fetch donations.');
        }

        // --- Step 3: Calculate Stats ---
        const totalTrees = approvedDonations.reduce((acc, curr) => acc + curr.tree_quantity, 0);
        const totalAmount = approvedDonations.reduce((acc, curr) => acc + curr.amount, 0);

        const stats: Stats = {
            totalTrees: totalTrees,
            totalAmount: totalAmount,
            pendingTrees: 0, // Pending trees are not shown on the public page
            goalTrees: liveCampaign.goal_trees,
        };

        // --- Step 4: Get Recent Donors ---
        const recentDonors = approvedDonations
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 5);

        // --- Step 5: Assemble and Send Response ---
        const apiResponse = {
            campaign: { ...liveCampaign, trees_approved: totalTrees },
            stats: stats,
            recentDonors: recentDonors,
        };

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 's-maxage=15, stale-while-revalidate=30');
        res.status(200).json(apiResponse);

    } catch (error) {
        console.error("API Error:", error.message);
        // If something goes wrong, serve a fallback response to keep the site alive.
        res.status(500).json({
            campaign: fallbackCampaign,
            stats: { totalTrees: 0, totalAmount: 0, pendingTrees: 0, goalTrees: fallbackCampaign.goal_trees },
            recentDonors: [],
        });
    }
}