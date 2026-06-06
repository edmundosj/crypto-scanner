export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { ids } = req.query;
  if (!ids) return res.status(400).json({ error: 'ids required' });
  try {
    const r = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&sparkline=true&price_change_percentage=24h&per_page=50&page=1`,
      { headers: { 'Accept': 'application/json' } }
    );
    if (!r.ok) throw new Error('coingecko ' + r.status);
    const data = await r.json();
    res.status(200).json(data);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
}
