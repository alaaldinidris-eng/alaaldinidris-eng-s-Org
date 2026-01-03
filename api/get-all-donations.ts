import { supabase } from '../services/supabaseClient';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        return res.status(405).end('Method Not Allowed');
    }

    // In a real app, you would add authentication here to protect this endpoint.

    try {
        const { data, error } = await supabase
            .from('donations')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Supabase fetch all donations error:', error);
            throw new Error('Failed to fetch all donations.');
        }

        res.status(200).json(data);

    } catch (error) {
        console.error('Get-all-donations API error:', error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}