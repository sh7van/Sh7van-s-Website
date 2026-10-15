// Sh7van YTA - local server (walang kailangang i-install na package)
const http = require('http'), fs = require('fs'), path = require('path');
const PORT = process.env.PORT || 3000;
const UP = path.join(__dirname, 'uploads'), PUB = path.join(__dirname, 'public');
const CATS = ['Scripts','Thumbnails','Footage','Audio','Templates','Niche Research','Other'];
const MIME = {'.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.gif':'image/gif','.webp':'image/webp','.svg':'image/svg+xml',
 '.mp4':'video/mp4','.webm':'video/webm','.mov':'video/quicktime','.mp3':'audio/mpeg','.wav':'audio/wav','.m4a':'audio/mp4',
 '.pdf':'application/pdf','.txt':'text/plain','.md':'text/plain','.csv':'text/csv','.json':'application/json',
 '.zip':'application/zip','.html':'text/html','.css':'text/css','.js':'text/javascript'};
const mime = f => MIME[path.extname(f).toLowerCase()] || 'application/octet-stream';
CATS.forEach(c => fs.mkdirSync(path.join(UP, c), { recursive: true }));
const clean = n => path.basename(String(n)).replace(/[^\w.\- ()]/g, '_').slice(0, 150) || 'file';
const json = (res, code, obj) => { res.writeHead(code, {'Content-Type':'application/json'}); res.end(JSON.stringify(obj)); };

http.createServer((req, res) => {
  const u = new URL(req.url, 'http://localhost');
  const cat = u.searchParams.get('cat');
  try {
    if (u.pathname === '/api/files' && req.method === 'GET') {
      const out = [];
      for (const c of CATS) for (const n of fs.readdirSync(path.join(UP, c))) {
        const s = fs.statSync(path.join(UP, c, n));
        if (s.isFile()) out.push({ name:n, cat:c, size:s.size, type:mime(n), ts:s.mtimeMs, url:'/files/'+encodeURIComponent(c)+'/'+encodeURIComponent(n) });
      }
      return json(res, 200, out.sort((a,b) => b.ts - a.ts));
    }
    if (u.pathname === '/api/upload' && req.method === 'POST') {
      if (!CATS.includes(cat)) return json(res, 400, { error: 'bad category' });
      let name = clean(u.searchParams.get('name')), dest = path.join(UP, cat, name), i = 1;
      const ext = path.extname(name), base = path.basename(name, ext);
      while (fs.existsSync(dest)) dest = path.join(UP, cat, `${base} (${i++})${ext}`);
      const ws = fs.createWriteStream(dest);
      req.pipe(ws);
      ws.on('finish', () => json(res, 200, { ok: true }));
      ws.on('error', () => json(res, 500, { error: 'write failed' }));
      return;
    }
    if (u.pathname === '/api/files' && req.method === 'DELETE') {
      if (!CATS.includes(cat)) return json(res, 400, { error: 'bad category' });
      fs.unlinkSync(path.join(UP, cat, clean(u.searchParams.get('name'))));
      return json(res, 200, { ok: true });
    }
    if (u.pathname.startsWith('/files/')) {
      const [, , c, n] = u.pathname.split('/').map(decodeURIComponent);
      if (!CATS.includes(c)) return json(res, 404, {});
      const f = path.join(UP, c, clean(n));
      res.writeHead(200, { 'Content-Type': mime(f), 'Content-Length': fs.statSync(f).size });
      return fs.createReadStream(f).pipe(res);
    }
    const f = path.join(PUB, u.pathname === '/' ? 'index.html' : clean(u.pathname));
    res.writeHead(200, { 'Content-Type': mime(f) });
    fs.createReadStream(f).on('error', () => res.end()).pipe(res);
  } catch (e) { json(res, 500, { error: String(e.message) }); }
}).listen(PORT, '127.0.0.1', () => console.log('Sh7van YTA running: http://localhost:' + PORT));
