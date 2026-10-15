import { list, del } from '@vercel/blob';

export default async function handler(req, res) {
  const pass = process.env.SITE_PASSWORD;
  if (!pass) return res.status(500).json({ error: 'Wala pang SITE_PASSWORD sa Environment Variables ng Vercel' });
  if (req.headers['x-pass'] !== pass) return res.status(401).json({ error: 'unauthorized' });
  try {
    if (req.method === 'GET') {
      const { blobs } = await list({ limit: 1000 });
      return res.status(200).json(blobs.map(b => ({ pathname: b.pathname, url: b.url, size: b.size, ts: b.uploadedAt })));
    }
    if (req.method === 'DELETE') {
      const url = String(req.query.url || '');
      if (!/^https:\/\/[\w.-]+\.blob\.vercel-storage\.com\//.test(url)) return res.status(400).json({ error: 'bad url' });
      await del(url);
      return res.status(200).json({ ok: true });
    }
    return res.status(405).end();
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
