export default async function handler(req, res) {
  // strip to same charset as your PHP: A-Za-z0-9_
  const handle = (req.query.h || '').replace(/[^A-Za-z0-9_]/g, '');

  if (handle === '') {
    res.status(400).send('no handle');
    return;
  }

  const target = 'https://unavatar.io/twitter/' + encodeURIComponent(handle);

  try {
    const upstream = await fetch(target, {
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    const type = upstream.headers.get('content-type') || 'image/png';

    if (!upstream.ok) {
      res.status(502).send('fetch failed');
      return;
    }

    const buf = Buffer.from(await upstream.arrayBuffer());

    if (!buf || buf.length === 0) {
      res.status(502).send('fetch failed');
      return;
    }

    res.setHeader('Content-Type', type);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.status(200).send(buf);
  } catch (e) {
    res.status(502).send('fetch failed');
  }
}
