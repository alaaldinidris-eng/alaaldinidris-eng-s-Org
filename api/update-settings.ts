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

    // NOTE: Add authentication here in a real app to protect this endpoint.

    try {
        const form = new IncomingForm();
        const [fields, files] = await new Promise((resolve, reject) => {
            form.parse(req, (err, fields, files) => {
                if (err) return reject(err);
                resolve([fields, files]);
            });
        });

        const { title, description, goal_trees, tree_price } = fields;
        const qrCodeFile = Array.isArray(files.qr_code) ? files.qr_code[0] : undefined;

        const settingsUpdate: { [key: string]: any } = {
            title: Array.isArray(title) ? title[0] : title,
            description: Array.isArray(description) ? description[0] : description,
            goal_trees: parseInt(Array.isArray(goal_trees) ? goal_trees[0] : goal_trees, 10),
            tree_price: parseInt(Array.isArray(tree_price) ? tree_price[0] : tree_price, 10),
        };

        // If a new QR code is uploaded, handle the file upload
        if (qrCodeFile) {
            const fileContent = await fs.readFile(qrCodeFile.filepath);
            const fileName = `qr_code_${Date.now()}`;

            // Upload new QR code
            const { error: uploadError } = await supabase.storage
                .from('campaign-assets')
                .upload(fileName, fileContent, {
                    contentType: qrCodeFile.mimetype,
                    upsert: true, // Overwrite if a file with the same name exists
                });

            if (uploadError) throw new Error(`Storage Error: ${uploadError.message}`);

            // Get public URL and add to update object
            const { data: urlData } = supabase.storage.from('campaign-assets').getPublicUrl(fileName);
            settingsUpdate.qr_image_url = urlData.publicUrl;
        }

        // Upsert the settings into the database
        // .upsert will create the row if it doesn't exist, or update it if it does.
        // We use a dummy `id` of 1 to ensure we are always updating the same row.
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