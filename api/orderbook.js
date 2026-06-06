export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol required' });
  const sources = [
    () => fetch(`https://api.bybit.com/v5/market/orderbook?category=spot&symbol=${symbol}&limit=50`).then(async r => {
      const d = await r.json();
      if (d.retCode !== 0) throw new Error('bybit error');
      return { bids: d.result.b, asks: d.result.a };
    }),
    () => fetch(`https://api.binance.com/api/v3/depth?symbol=${symbol}&limit=50`).then(async r => {
      if (!r.ok) throw new Error('binance ' + r.status);
      return r.json();
    }),
    () => fetch(`https://www.okx.com/api/v5/market/books?instId=${symbol.replace('USDT','-USDT')}&sz=50`).then(async r => {
      const d = await r.json();
      if (!d.data?.[0]) throw new Error('okx error');
      return { bids: d.data[0].bids, asks: d.data[0].asks };
    }),
  ];
  for (const src of sources) {
    try {
      const data = await Promise.race([src(), new Promise((_,r)=>setTimeout(()=>r(new Error('timeout')),4000))]);
      if (data?.bids?.length) return res.status(200).json(data);
    } catch(e) { continue; }
  }
  res.status(500).json({ error: 'all sources failed' });
}
