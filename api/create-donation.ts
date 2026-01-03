import { IncomingForm } from 'formidable';
import { promises as fs } from 'fs';
import { supabase } from '../services/supabaseClient';

export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).end('Method Not Allowed');
    }

    try {
        const form = new IncomingForm();

        const [fields, files] = await new Promise((resolve, reject) => {
            form.parse(req, (err, fields, files) => {
                if (err) return reject(err);
                resolve([fields, files]);
            });
        });

        // --- 1. Validate Form Data ---
        const { quantity, donorName } = fields;
        const proofFile = files.proof;

        if (!quantity || !proofFile || Array.isArray(proofFile) === false || proofFile.length === 0) {
            return res.status(400).json({ message: 'Missing required fields or files.' });
        }

        const qty = parseInt(Array.isArray(quantity) ? quantity[0] : quantity, 10);
        const name = Array.isArray(donorName) ? donorName[0] : donorName || 'Anonymous Donor';
        const file = proofFile[0];

        // --- 2. Upload to Supabase Storage ---
        const fileContent = await fs.readFile(file.filepath);
        const fileName = `proof_${Date.now()}_${file.originalFilename}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('donation-proofs')
            .upload(fileName, fileContent, {
                contentType: file.mimetype,
                upsert: false,
            });

        if (uploadError) {
            console.error('Supabase storage error:', uploadError);
            throw new Error('Failed to upload proof to storage.');
        }

        // --- 3. Get Public URL ---
        const { data: urlData } = supabase.storage
            .from('donation-proofs')
            .getPublicUrl(uploadData.path);

        const proofUrl = urlData.publicUrl;

        // --- 4. Create Donation Record in Database ---
        const donationData = {
            id: `DON-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
            donor_name: name,
            tree_quantity: qty,
            amount: qty * 10, // Assuming TREE_PRICE is 10
            status: 'PENDING',
            proof_url: proofUrl,
        };

        const { error: insertError } = await supabase
            .from('donations')
            .insert(donationData);

        if (insertError) {
            console.error('Supabase insert error:', insertError);
            throw new Error('Failed to create donation record.');
        }

        res.status(200).json({ message: 'Donation submitted successfully!', data: donationData });

    } catch (error) {
        console.error('Create-donation API error:', error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}