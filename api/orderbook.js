export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol required' });

  // Converte BTCUSDT → BTC-USDT para KuCoin
  const kucoinSym = symbol.replace('USDT', '-USDT');
  // Converte para OKX: BTC-USDT
  const okxSym = symbol.replace('USDT', '-USDT');

  const sources = [
    async () => {
      const r = await fetch(`https://api.kucoin.com/api/v1/market/orderbook/level2_100?symbol=${kucoinSym}`);
      const d = await r.json();
      if (!d.data?.bids) throw new Error('kucoin no data');
      return { bids: d.data.bids, asks: d.data.asks };
    },
    async () => {
      const r = await fetch(`https://www.okx.com/api/v5/market/books?instId=${okxSym}&sz=50`);
      const d = await r.json();
      if (!d.data?.[0]) throw new Error('okx no data');
      return { bids: d.data[0].bids, asks: d.data[0].asks };
    },
    async () => {
      const r = await fetch(`https://api.mexc.com/api/v3/depth?symbol=${symbol}&limit=50`);
      if (!r.ok) throw new Error('mexc ' + r.status);
      return await r.json();
    },
  ];

  for (const src of sources) {
    try {
      const data = await Promise.race([src(), new Promise((_,r)=>setTimeout(()=>r(new Error('timeout')),5000))]);
      if (data?.bids?.length) return res.status(200).json(data);
    } catch(e) { continue; }
  }
  res.status(500).json({ error: 'all sources failed' });
}
