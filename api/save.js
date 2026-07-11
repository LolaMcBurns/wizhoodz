import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  // CORS (safe to keep even on same-origin)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')
    return res.status(405).json({ ok: false, error: 'Method not allowed.' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    let { wallet, handle, wizardName, id } = body || {};

    // ---- validate ----
    wallet = (wallet || '').trim();
    handle = (handle || '').trim().replace(/^@/, '').toLowerCase();

    if (!wallet || !handle)
      return res.status(400).json({ ok: false, error: 'Missing wallet or handle.' });

    const walletOk = /^0x[a-fA-F0-9]{6,}$/.test(wallet) ||
                     /^[1-9A-HJ-NP-Za-km-z]{25,}$/.test(wallet);
    if (!walletOk)
      return res.status(400).json({ ok: false, error: 'That wallet address looks invalid.' });

    if (handle.length < 2)
      return res.status(400).json({ ok: false, error: 'That X handle looks invalid.' });

    // ---- duplicate check ----
    const walletKey = 'wallet:' + wallet.toLowerCase();
    const handleKey = 'handle:' + handle;

    if (await kv.exists(walletKey))
      return res.status(409).json({ ok: false, error: 'This wallet is already on the WizList.' });

    if (await kv.exists(handleKey))
      return res.status(409).json({ ok: false, error: 'This X handle is already on the WizList.' });

    // ---- save ----
    const entry = {
      wallet,
      handle,
      wizardName: wizardName || '',
      id: id || '',
      ts: Date.now()
    };

    await kv.set(walletKey, entry);
    await kv.set(handleKey, entry);
    await kv.lpush('entries', JSON.stringify(entry)); // master list

    return res.status(200).json({ ok: true, message: "You're on the WizList!" });
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'Server error. Please try again.' });
  }
}
