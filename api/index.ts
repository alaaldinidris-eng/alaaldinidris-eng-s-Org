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
    console.log("[API START] Received request to /api/index");

    try {
        console.log("VITE_SUPABASE_URL:", process.env.VITE_SUPABASE_URL ? "Loaded" : "MISSING");
        console.log("SUPABASE_SERVICE_KEY:", process.env.SUPABASE_SERVICE_KEY ? "Loaded" : "MISSING");

        // --- Step 1: Fetch Campaign Settings from Supabase ---
        console.log("Step 1: Fetching campaign settings...");
        const { data: settings, error: settingsError } = await supabase
            .from('campaign_settings')
            .select('*')
            .limit(1)
            .single();

        if (settingsError && settingsError.code !== 'PGRST116') {
            console.error('Supabase settings fetch error:', settingsError);
        }
        console.log("Step 1: Settings fetched successfully.", settings ? `ID: ${settings.id}`: "No settings found, using fallback.");

        const liveCampaign = settings ? { ...fallbackCampaign, ...settings } : fallbackCampaign;

        // --- Step 2: Fetch Approved Donations ---
        console.log("Step 2: Fetching approved donations...");
        const { data: approvedDonations, error: donationsError } = await supabase
            .from('donations')
            .select('*')
            .eq('status', 'APPROVED');

        if (donationsError) {
            console.error('Supabase donations fetch error:', donationsError);
            throw new Error('Failed to fetch donations.');
        }
        console.log(`Step 2: Found ${approvedDonations.length} approved donations.`);

        // --- Step 3: Calculate Stats ---
        console.log("Step 3: Calculating stats...");
        const totalTrees = approvedDonations.reduce((acc, curr) => acc + curr.tree_quantity, 0);
        const totalAmount = approvedDonations.reduce((acc, curr) => acc + curr.amount, 0);

        const stats: Stats = {
            totalTrees: totalTrees,
            totalAmount: totalAmount,
            pendingTrees: 0,
            goalTrees: liveCampaign.goal_trees,
        };
        console.log("Step 3: Stats calculated.", stats);

        // --- Step 4: Get Recent Donors ---
        console.log("Step 4: Sorting recent donors...");
        const recentDonors = approvedDonations
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 5);

        // --- Step 5: Assemble and Send Response ---
        console.log("Step 5: Assembling and sending final response.");
        const apiResponse = {
            campaign: { ...liveCampaign, trees_approved: totalTrees },
            stats: stats,
            recentDonors: recentDonors,
        };

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate');
        res.status(200).json(apiResponse);
        console.log("[API END] Request handled successfully.");

    } catch (error) {
        console.error("[API CRITICAL ERROR]:", error.message);
        res.status(500).json({
            error: error.message,
            campaign: fallbackCampaign,
            stats: { totalTrees: 0, totalAmount: 0, pendingTrees: 0, goalTrees: fallbackCampaign.goal_trees },
            recentDonors: [],
        });
    }
}