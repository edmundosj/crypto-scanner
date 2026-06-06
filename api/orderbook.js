export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol required' });

  // Tenta múltiplas exchanges
  const sources = [
    // Bybit — sem restrições geográficas
    async () => {
      const r = await fetch(`https://api.bybit.com/v5/market/orderbook?category=spot&symbol=${symbol}&limit=50`);
      if (!r.ok) throw new Error('bybit ' + r.status);
      const d = await r.json();
      if (d.retCode !== 0) throw new Error('bybit retCode ' + d.retCode);
      // Converte formato Bybit para formato Binance
      return {
        bids: d.result.b.map(([p, q]) => [p, q]),
        asks: d.result.a.map(([p, q]) => [p, q])
      };
    },
    // OKX
    async () => {
      const okxSym = symbol.replace('USDT', '-USDT');
      const r = await fetch(`https://www.okx.com/api/v5/market/books?instId=${okxSym}&sz=50`);
      if (!r.ok) throw new Error('okx ' + r.status);
      const d = await r.json();
      if (!d.data?.[0]) throw new Error('okx no data');
      return {
        bids: d.data[0].bids.map(([p, q]) => [p, q]),
        asks: d.data[0].asks.map(([p, q]) => [p, q])
      };
    },
    // Binance direto (tenta mesmo assim)
    async () => {
      const r = await fetch(`https://api.binance.com/api/v3/depth?symbol=${symbol}&limit=50`);
      if (!r.ok) throw new Error('binance ' + r.status);
      return await r.json();
    }
  ];

  for (const source of sources) {
    try {
      const data = await source();
      if (data.bids?.length) return res.status(200).json(data);
    } catch (e) {
      continue;
    }
  }

  res.status(500).json({ error: 'All sources failed' });
}
