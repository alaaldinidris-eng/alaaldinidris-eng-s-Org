import { supabase } from '../services/supabaseClient';
import { Campaign, Donation, Stats } from '../types';
import { MOCK_QR_CODE } from '../constants'; // Keep using the mock QR for now

// A default campaign object to use as a fallback.
const defaultCampaign: Campaign = {
    id: 'main-campaign',
    title: 'Restore our Rainforests',
    description: 'Join us in restoring the biodiversity of Malaysian tropical forests.',
    tree_price: 10,
    goal_trees: 1000,
    trees_approved: 0,
    qr_image_url: MOCK_QR_CODE,
};

export default async function handler(req, res) {
    try {
        // Fetch all approved donations from Supabase
        const { data: approvedDonations, error: donationsError } = await supabase
            .from('donations')
            .select('*')
            .eq('status', 'APPROVED');

        if (donationsError) {
            console.error('Supabase donations fetch error:', donationsError);
            throw new Error('Failed to fetch donations.');
        }

        // Calculate stats based on the fetched data
        const totalTrees = approvedDonations.reduce((acc, curr) => acc + curr.tree_quantity, 0);
        const totalAmount = approvedDonations.reduce((acc, curr) => acc + curr.amount, 0);

        // In a real application, you might fetch pending donations separately if needed.
        // For now, we will assume pending stats are not shown on the main page.
        const stats: Stats = {
            totalTrees: totalTrees,
            totalAmount: totalAmount,
            pendingTrees: 0, // This can be updated if we add a 'pending' fetch
            goalTrees: defaultCampaign.goal_trees,
        };

        // Get the most recent donors
        const recentDonors = approvedDonations
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 5);

        // Assemble the response
        const apiResponse = {
            campaign: { ...defaultCampaign, trees_approved: totalTrees },
            stats: stats,
            recentDonors: recentDonors,
        };

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 's-maxage=15, stale-while-revalidate=30');
        res.status(200).json(apiResponse);

    } catch (error) {
        console.error("API Error:", error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}