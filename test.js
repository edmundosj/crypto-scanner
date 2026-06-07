export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const COINS = [
    {id:"bitcoin",      sym:"BTC",  name:"Bitcoin",      kucoin:"BTC-USDT",   mexc:"BTCUSDT"},
    {id:"ethereum",     sym:"ETH",  name:"Ethereum",     kucoin:"ETH-USDT",   mexc:"ETHUSDT"},
    {id:"binancecoin",  sym:"BNB",  name:"BNB",          kucoin:"BNB-USDT",   mexc:"BNBUSDT"},
    {id:"solana",       sym:"SOL",  name:"Solana",       kucoin:"SOL-USDT",   mexc:"SOLUSDT"},
    {id:"ripple",       sym:"XRP",  name:"XRP",          kucoin:"XRP-USDT",   mexc:"XRPUSDT"},
    {id:"dogecoin",     sym:"DOGE", name:"Dogecoin",     kucoin:"DOGE-USDT",  mexc:"DOGEUSDT"},
    {id:"cardano",      sym:"ADA",  name:"Cardano",      kucoin:"ADA-USDT",   mexc:"ADAUSDT"},
    {id:"avalanche-2",  sym:"AVAX", name:"Avalanche",    kucoin:"AVAX-USDT",  mexc:"AVAXUSDT"},
    {id:"chiliz",       sym:"CHZ",  name:"Chiliz",       kucoin:"CHZ-USDT",   mexc:"CHZUSDT"},
    {id:"render-token", sym:"RENDER",name:"Render",      kucoin:"RENDER-USDT",mexc:"RENDERUSDT"},
    {id:"fetch-ai",     sym:"FET",  name:"Fetch.ai",     kucoin:"FET-USDT",   mexc:"FETUSDT"},
    {id:"bittensor",    sym:"TAO",  name:"Bittensor",    kucoin:"TAO-USDT",   mexc:"TAOUSDT"},
    {id:"the-graph",    sym:"GRT",  name:"The Graph",    kucoin:"GRT-USDT",   mexc:"GRTUSDT"},
    {id:"chainlink",    sym:"LINK", name:"Chainlink",    kucoin:"LINK-USDT",  mexc:"LINKUSDT"},
    {id:"shiba-inu",    sym:"SHIB", name:"Shiba Inu",    kucoin:"SHIB-USDT",  mexc:"SHIBUSDT"},
    {id:"dog-go-to-the-moon-runes",sym:"DOG",name:"DOG•TO•THE•MOON",kucoin:null,mexc:"DOGUSDT"},
    {id:"wibx",         sym:"WBX",  name:"WiBX",         kucoin:null,         mexc:null},
  ];

  // Busca KuCoin (funciona para maioria)
  let tickers = [];
  try {
    const r = await fetch('https://api.kucoin.com/api/v1/market/allTickers');
    if (r.ok) {
      const d = await r.json();
      tickers = d.data?.ticker || [];
    }
  } catch(e) {}

  // Busca MEXC para moedas que não têm na KuCoin
  const mexcCoins = COINS.filter(c => !c.kucoin && c.mexc);
  const mexcResults = {};
  await Promise.allSettled(mexcCoins.map(async c => {
    try {
      const r = await fetch(`https://api.mexc.com/api/v3/ticker/24hr?symbol=${c.mexc}`);
      if (r.ok) {
        const d = await r.json();
        mexcResults[c.id] = d;
      }
    } catch(e) {}
  }));

  // WiBX via CoinGecko
  let wbxData = null;
  try {
    const r = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=wibx&vs_currencies=usd&include_24hr_change=true');
    if (r.ok) {
      const d = await r.json();
      wbxData = d.wibx;
    }
  } catch(e) {}

  const result = COINS.map(c => {
    // WiBX especial
    if (c.id === 'wibx') {
      return {
        id: c.id, symbol: c.sym.toLowerCase(), name: c.name,
        current_price: wbxData?.usd || 0,
        price_change_percentage_24h: wbxData?.usd_24h_change || 0,
        total_volume: 0, market_cap: 0,
        sparkline_in_7d: { price: [] }
      };
    }
    // KuCoin
    if (c.kucoin) {
      const t = tickers.find(x => x.symbol === c.kucoin);
      if (t) return {
        id: c.id, symbol: c.sym.toLowerCase(), name: c.name,
        current_price: parseFloat(t.last) || 0,
        price_change_percentage_24h: parseFloat(t.changeRate) * 100 || 0,
        total_volume: parseFloat(t.volValue) || 0,
        market_cap: 0,
        sparkline_in_7d: { price: [] }
      };
    }
    // MEXC fallback
    if (c.mexc && mexcResults[c.id]) {
      const t = mexcResults[c.id];
      return {
        id: c.id, symbol: c.sym.toLowerCase(), name: c.name,
        current_price: parseFloat(t.lastPrice) || 0,
        price_change_percentage_24h: parseFloat(t.priceChangePercent) || 0,
        total_volume: parseFloat(t.quoteVolume) || 0,
        market_cap: 0,
        sparkline_in_7d: { price: [] }
      };
    }
    return null;
  }).filter(Boolean);

  if (!result.length) return res.status(500).json({ error: 'no data' });
  res.status(200).json(result);
}
