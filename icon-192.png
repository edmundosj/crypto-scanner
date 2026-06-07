export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'id required' });

  const KUCOIN_MAP = {
    'bitcoin':'BTC-USDT','ethereum':'ETH-USDT','binancecoin':'BNB-USDT',
    'solana':'SOL-USDT','ripple':'XRP-USDT','dogecoin':'DOGE-USDT',
    'cardano':'ADA-USDT','avalanche-2':'AVAX-USDT','chiliz':'CHZ-USDT',
    'render-token':'RENDER-USDT','fetch-ai':'FET-USDT','bittensor':'TAO-USDT',
    'the-graph':'GRT-USDT','chainlink':'LINK-USDT'
  };

  const sym = KUCOIN_MAP[id];
  if (!sym) return res.status(400).json({ error: 'unknown coin' });

  try {
    const end = Math.floor(Date.now()/1000);
    const start = end - 72*3600;
    const r = await fetch(
      `https://api.kucoin.com/api/v1/market/candles?type=1hour&symbol=${sym}&startAt=${start}&endAt=${end}`
    );
    if (!r.ok) throw new Error('kucoin ' + r.status);
    const d = await r.json();
    if (!d.data?.length) throw new Error('no data');
    // KuCoin: [timestamp, open, close, high, low, volume, turnover] — mais antigo primeiro (reverter)
    const prices = d.data.reverse().map(k => [parseInt(k[0])*1000, parseFloat(k[2])]);
    res.status(200).json({ prices });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
}
