export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const COINS = [
    {id:"bitcoin",      sym:"BTC",  name:"Bitcoin",      kucoin:"BTC-USDT",  mexc:"BTCUSDT"},
    {id:"ethereum",     sym:"ETH",  name:"Ethereum",     kucoin:"ETH-USDT",  mexc:"ETHUSDT"},
    {id:"binancecoin",  sym:"BNB",  name:"BNB",          kucoin:"BNB-USDT",  mexc:"BNBUSDT"},
    {id:"solana",       sym:"SOL",  name:"Solana",       kucoin:"SOL-USDT",  mexc:"SOLUSDT"},
    {id:"ripple",       sym:"XRP",  name:"XRP",          kucoin:"XRP-USDT",  mexc:"XRPUSDT"},
    {id:"dogecoin",     sym:"DOGE", name:"Dogecoin",     kucoin:"DOGE-USDT", mexc:"DOGEUSDT"},
    {id:"cardano",      sym:"ADA",  name:"Cardano",      kucoin:"ADA-USDT",  mexc:"ADAUSDT"},
    {id:"avalanche-2",  sym:"AVAX", name:"Avalanche",    kucoin:"AVAX-USDT", mexc:"AVAXUSDT"},
    {id:"chiliz",       sym:"CHZ",  name:"Chiliz",       kucoin:"CHZ-USDT",  mexc:"CHZUSDT"},
    {id:"render-token", sym:"RENDER",name:"Render",      kucoin:"RENDER-USDT",mexc:"RENDERUSDT"},
    {id:"fetch-ai",     sym:"FET",  name:"Fetch.ai",     kucoin:"FET-USDT",  mexc:"FETUSDT"},
    {id:"bittensor",    sym:"TAO",  name:"Bittensor",    kucoin:"TAO-USDT",  mexc:"TAOUSDT"},
    {id:"the-graph",    sym:"GRT",  name:"The Graph",    kucoin:"GRT-USDT",  mexc:"GRTUSDT"},
    {id:"chainlink",    sym:"LINK", name:"Chainlink",    kucoin:"LINK-USDT", mexc:"LINKUSDT"},
  ];

  try {
    // KuCoin: busca todos os tickers de uma vez
    const r = await fetch('https://api.kucoin.com/api/v1/market/allTickers');
    if (!r.ok) throw new Error('kucoin ' + r.status);
    const d = await r.json();
    const tickers = d.data?.ticker || [];

    const result = COINS.map(c => {
      const t = tickers.find(x => x.symbol === c.kucoin);
      if (!t) return null;
      return {
        id: c.id,
        symbol: c.sym.toLowerCase(),
        name: c.name,
        current_price: parseFloat(t.last) || 0,
        price_change_percentage_24h: parseFloat(t.changeRate) * 100 || 0,
        total_volume: parseFloat(t.volValue) || 0,
        market_cap: 0,
        sparkline_in_7d: { price: [] }
      };
    }).filter(Boolean);

    if (result.length === 0) throw new Error('no coins found');
    res.status(200).json(result);
  } catch(e) {
    // Fallback: MEXC
    try {
      const results = await Promise.allSettled(
        COINS.map(c =>
          fetch(`https://api.mexc.com/api/v3/ticker/24hr?symbol=${c.mexc}`)
            .then(r => r.json())
            .then(t => ({
              id: c.id, symbol: c.sym.toLowerCase(), name: c.name,
              current_price: parseFloat(t.lastPrice) || 0,
              price_change_percentage_24h: parseFloat(t.priceChangePercent) || 0,
              total_volume: parseFloat(t.quoteVolume) || 0,
              market_cap: 0,
              sparkline_in_7d: { price: [] }
            }))
        )
      );
      const data = results.filter(r=>r.status==='fulfilled').map(r=>r.value);
      if (!data.length) throw new Error('mexc failed');
      return res.status(200).json(data);
    } catch(e2) {
      res.status(500).json({ error: e2.message });
    }
  }
}
