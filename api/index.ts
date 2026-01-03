import { promises as fs } from 'path';
import path from 'path';

export default async function handler(req, res) {
  try {
    // Vercel CLI runs the function from the root
    const dbPath = path.join(process.cwd(), 'api', 'db.json');
    const data = await fs.readFile(dbPath, 'utf-8');
    const db = JSON.parse(data);

    const approvedDonations = db.donations.filter(d => d.status === 'APPROVED');
    const pendingDonations = db.donations.filter(d => d.status === 'PENDING');

    const stats = {
      totalTrees: approvedDonations.reduce((acc, curr) => acc + curr.tree_quantity, 0),
      totalAmount: approvedDonations.reduce((acc, curr) => acc + curr.amount, 0),
      pendingTrees: pendingDonations.reduce((acc, curr) => acc + curr.tree_quantity, 0),
      goalTrees: db.campaign.goal_trees
    };

    const recentDonors = approvedDonations
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate');
    res.status(200).json({
      campaign: db.campaign,
      stats: stats,
      recentDonors: recentDonors
    });

  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}