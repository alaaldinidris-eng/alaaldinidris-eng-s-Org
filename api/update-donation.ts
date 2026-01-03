import { supabase } from '../services/supabaseClient';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).end('Method Not Allowed');
    }

    try {
        const { id, status } = req.body;

        if (!id || !status) {
            return res.status(400).json({ message: 'Missing id or status.' });
        }

        if (status !== 'APPROVED' && status !== 'REJECTED') {
            return res.status(400).json({ message: 'Invalid status.' });
        }

        const { error } = await supabase
            .from('donations')
            .update({ status })
            .eq('id', id);

        if (error) {
            console.error('Supabase update error:', error);
            throw new Error('Failed to update donation status.');
        }

        res.status(200).json({ message: 'Donation status updated successfully!' });

    } catch (error) {
        console.error('Update-donation API error:', error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}