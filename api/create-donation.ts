import { IncomingForm, File } from 'formidable';
import { promises as fs } from 'fs';
import { supabase } from '../services/supabaseClient';
import type { NextApiRequest, NextApiResponse } from 'next';

export const config = {
    api: {
        bodyParser: false,
    },
};

type FormidableResult = {
    fields: { [key: string]: string | string[] };
    files: { [key: string]: File | File[] };
}

const parseForm = (req: NextApiRequest): Promise<FormidableResult> => {
    return new Promise((resolve, reject) => {
        const form = new IncomingForm();
        form.parse(req, (err, fields, files) => {
            if (err) return reject(err);
            resolve({ fields, files });
        });
    });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).end('Method Not Allowed');
    }

    try {
        const { fields, files } = await parseForm(req);

        // --- 1. Validate Form Data ---
        const quantity = Array.isArray(fields.quantity) ? fields.quantity[0] : fields.quantity;
        const donorName = Array.isArray(fields.donorName) ? fields.donorName[0] : fields.donorName;
        const proofFile = Array.isArray(files.proof) ? files.proof[0] : files.proof;

        if (!quantity || !proofFile) {
            return res.status(400).json({ message: 'Missing required fields or files.' });
        }

        const qty = parseInt(quantity, 10);
        const name = donorName || 'Anonymous Donor';
        const file = proofFile;

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
            amount: qty * 10,
            status: 'PENDING',
            proof_url: proofUrl,
        };

        const { error: insertError } = await supabase.from('donations').insert(donationData);

        if (insertError) {
            console.error('Supabase insert error:', insertError);
            throw new Error('Failed to create donation record.');
        }

        res.status(200).json({ message: 'Donation submitted successfully!', data: donationData });

    } catch (error) {
        console.error('Create-donation API error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}