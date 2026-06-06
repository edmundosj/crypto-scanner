export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol required' });

  const sources = [
    // Bybit — sem restrições
    async () => {
      const r = await fetch(`https://api.bybit.com/v5/market/orderbook?category=spot&symbol=${symbol}&limit=50`);
      const d = await r.json();
      if (d.retCode !== 0) throw new Error('bybit ' + d.retCode);
      return { bids: d.result.b, asks: d.result.a };
    },
    // OKX
    async () => {
      const sym = symbol.replace('USDT', '-USDT');
      const r = await fetch(`https://www.okx.com/api/v5/market/books?instId=${sym}&sz=50`);
      const d = await r.json();
      if (!d.data?.[0]) throw new Error('okx no data');
      return { bids: d.data[0].bids, asks: d.data[0].asks };
    },
  ];

  for (const src of sources) {
    try {
      const data = await Promise.race([
        src(),
        new Promise((_,r) => setTimeout(() => r(new Error('timeout')), 5000))
      ]);
      if (data?.bids?.length) return res.status(200).json(data);
    } catch(e) { continue; }
  }
  res.status(500).json({ error: 'all sources failed' });
}
