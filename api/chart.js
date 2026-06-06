export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'id required' });

  const BINANCE_MAP = {
    'bitcoin':'BTCUSDT','ethereum':'ETHUSDT','binancecoin':'BNBUSDT',
    'solana':'SOLUSDT','ripple':'XRPUSDT','dogecoin':'DOGEUSDT',
    'cardano':'ADAUSDT','avalanche-2':'AVAXUSDT','chiliz':'CHZUSDT',
    'render-token':'RENDERUSDT','fetch-ai':'FETUSDT','bittensor':'TAOUSDT',
    'the-graph':'GRTUSDT','chainlink':'LINKUSDT'
  };

  const sym = BINANCE_MAP[id];
  if (!sym) return res.status(400).json({ error: 'unknown coin' });

  try {
    // Binance klines: 72 candles de 1h = 72h
    const r = await fetch(`https://api.binance.com/api/v3/klines?symbol=${sym}&interval=1h&limit=72`);
    if (!r.ok) throw new Error('binance ' + r.status);
    const klines = await r.json();
    // Converte para formato { prices: [[timestamp, price], ...] }
    const prices = klines.map(k => [k[0], parseFloat(k[4])]); // close price
    res.status(200).json({ prices });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
}
