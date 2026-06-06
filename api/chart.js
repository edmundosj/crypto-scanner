export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'id required' });

  const BYBIT_MAP = {
    'bitcoin':'BTCUSDT','ethereum':'ETHUSDT','binancecoin':'BNBUSDT',
    'solana':'SOLUSDT','ripple':'XRPUSDT','dogecoin':'DOGEUSDT',
    'cardano':'ADAUSDT','avalanche-2':'AVAXUSDT','chiliz':'CHZUSDT',
    'render-token':'RENDERUSDT','fetch-ai':'FETUSDT','bittensor':'TAOUSDT',
    'the-graph':'GRTUSDT','chainlink':'LINKUSDT'
  };

  const sym = BYBIT_MAP[id];
  if (!sym) return res.status(400).json({ error: 'unknown coin' });

  try {
    // Bybit klines: 72 candles de 1h
    const end = Date.now();
    const start = end - 72 * 60 * 60 * 1000;
    const r = await fetch(
      `https://api.bybit.com/v5/market/kline?category=spot&symbol=${sym}&interval=60&start=${start}&end=${end}&limit=72`
    );
    if (!r.ok) throw new Error('bybit ' + r.status);
    const d = await r.json();
    if (!d.result?.list) throw new Error('no klines');
    // Bybit retorna [timestamp, open, high, low, close, volume, turnover]
    // Inverter pois Bybit retorna do mais recente para o mais antigo
    const prices = d.result.list.reverse().map(k => [parseInt(k[0]), parseFloat(k[4])]);
    res.status(200).json({ prices });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
}
