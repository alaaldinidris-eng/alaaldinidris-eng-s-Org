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

    // NOTE: Add authentication in a real app to protect this endpoint.

    try {
        const { fields, files } = await parseForm(req);

        const title = Array.isArray(fields.title) ? fields.title[0] : fields.title;
        const description = Array.isArray(fields.description) ? fields.description[0] : fields.description;
        const goal_trees = Array.isArray(fields.goal_trees) ? fields.goal_trees[0] : fields.goal_trees;
        const tree_price = Array.isArray(fields.tree_price) ? fields.tree_price[0] : fields.tree_price;
        const qrCodeFile = Array.isArray(files.qr_code) ? files.qr_code[0] : files.qr_code as File | undefined;

        const settingsUpdate: { [key: string]: any } = {
            title,
            description,
            goal_trees: parseInt(goal_trees, 10),
            tree_price: parseInt(tree_price, 10),
        };

        if (qrCodeFile && qrCodeFile.size > 0) {
            const fileContent = await fs.readFile(qrCodeFile.filepath);
            const fileName = `qr_code_${Date.now()}`;

            const { error: uploadError } = await supabase.storage
                .from('campaign-assets')
                .upload(fileName, fileContent, {
                    contentType: qrCodeFile.mimetype,
                    upsert: true,
                });

            if (uploadError) throw new Error(`Storage Error: ${uploadError.message}`);

            const { data: urlData } = supabase.storage.from('campaign-assets').getPublicUrl(fileName);
            settingsUpdate.qr_image_url = urlData.publicUrl;
        }

        const { error: dbError } = await supabase
            .from('campaign_settings')
            .upsert({ id: 1, ...settingsUpdate });

        if (dbError) throw new Error(`Database Error: ${dbError.message}`);

        res.status(200).json({ message: 'Settings updated successfully!' });

    } catch (error) {
        console.error('Update-settings API error:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
}