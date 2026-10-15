import { handleUpload } from '@vercel/blob/client';

export default async function handler(req, res) {
  try {
    const json = await handleUpload({
      body: req.body,
      request: req,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const pass = process.env.SITE_PASSWORD;
        if (!pass || clientPayload !== pass) throw new Error('Mali ang password');
        return { addRandomSuffix: false };
      },
      onUploadCompleted: async () => {},
    });
    return res.status(200).json(json);
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
}
