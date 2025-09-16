import type { RequestHandler } from '@sveltejs/kit';
import fs from 'fs/promises';
import path from 'path';

export const GET: RequestHandler = async () => {
    const filePath = path.resolve(process.cwd(), 'PRIVACY.md');
    try {
        const file = await fs.readFile(filePath, 'utf-8');
        return new Response(file, {
            headers: {
                'Content-Type': 'text/markdown; charset=utf-8',
                'Cache-Control': 'public, max-age=3600'
            }
        });
    } catch (e) {
        return new Response('Privacy policy not found.', { status: 404 });
    }
};
