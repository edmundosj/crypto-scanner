export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const COINS = [
    {id:"bitcoin",      sym:"BTC",  name:"Bitcoin",      kucoin:"BTC-USDT"},
    {id:"ethereum",     sym:"ETH",  name:"Ethereum",     kucoin:"ETH-USDT"},
    {id:"binancecoin",  sym:"BNB",  name:"BNB",          kucoin:"BNB-USDT"},
    {id:"solana",       sym:"SOL",  name:"Solana",       kucoin:"SOL-USDT"},
    {id:"ripple",       sym:"XRP",  name:"XRP",          kucoin:"XRP-USDT"},
    {id:"dogecoin",     sym:"DOGE", name:"Dogecoin",     kucoin:"DOGE-USDT"},
    {id:"cardano",      sym:"ADA",  name:"Cardano",      kucoin:"ADA-USDT"},
    {id:"avalanche-2",  sym:"AVAX", name:"Avalanche",    kucoin:"AVAX-USDT"},
    {id:"chiliz",       sym:"CHZ",  name:"Chiliz",       kucoin:"CHZ-USDT"},
    {id:"render-token", sym:"RENDER",name:"Render",      kucoin:"RENDER-USDT"},
    {id:"fetch-ai",     sym:"FET",  name:"Fetch.ai",     kucoin:"FET-USDT"},
    {id:"bittensor",    sym:"TAO",  name:"Bittensor",    kucoin:"TAO-USDT"},
    {id:"the-graph",    sym:"GRT",  name:"The Graph",    kucoin:"GRT-USDT"},
    {id:"chainlink",    sym:"LINK", name:"Chainlink",    kucoin:"LINK-USDT"},
    {id:"shiba-inu",    sym:"SHIB", name:"Shiba Inu",    kucoin:"SHIB-USDT"},
    // DOG e WiBX via Gate.io (funciona no Vercel!)
    {id:"dog-go-to-the-moon-runes",sym:"DOG",name:"DOG•TO•THE•MOON", gate:"DOG_USDT"},
    {id:"wibx",         sym:"WBX",  name:"WiBX",         gate:"WBX_USDT"},
  ];

  // KuCoin — todos os tickers de uma vez
  let tickers = [];
  try {
    const r = await fetch('https://api.kucoin.com/api/v1/market/allTickers');
    if (r.ok) {
      const d = await r.json();
      tickers = d.data?.ticker || [];
    }
  } catch(e) {}

  // Gate.io — para moedas sem KuCoin
  const gateCoins = COINS.filter(c => !c.kucoin && c.gate);
  const gateResults = {};
  await Promise.allSettled(gateCoins.map(async c => {
    try {
      const r = await fetch(`https://api.gateio.ws/api/v4/spot/tickers?currency_pair=${c.gate}`);
      if (r.ok) {
        const d = await r.json();
        if (d[0]) gateResults[c.id] = d[0];
      }
    } catch(e) {}
  }));

  // WiBX via Kraken (fallback) ou CoinGecko
  const extraResults = {};
  await Promise.allSettled([
    // Tenta Gate para WiBX
    fetch('https://api.gateio.ws/api/v4/spot/tickers?currency_pair=WBX_USDT')
      .then(r=>r.ok?r.json():null)
      .then(d=>{ if(d?.[0]) extraResults['wibx']=d[0]; })
      .catch(()=>{}),
    // CoinGecko para WiBX como último recurso
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=wibx&vs_currencies=usd&include_24hr_change=true')
      .then(r=>r.ok?r.json():null)
      .then(d=>{ if(d?.wibx&&!extraResults['wibx']) extraResults['wibx']={last_price:d.wibx.usd,change_percentage:d.wibx.usd_24h_change}; })
      .catch(()=>{})
  ]);

  const result = COINS.map(c => {
    // KuCoin
    if (c.kucoin) {
      const t = tickers.find(x => x.symbol === c.kucoin);
      if (t && parseFloat(t.last) > 0) return {
        id: c.id, symbol: c.sym.toLowerCase(), name: c.name,
        current_price: parseFloat(t.last),
        price_change_percentage_24h: parseFloat(t.changeRate) * 100 || 0,
        total_volume: parseFloat(t.volValue) || 0,
        market_cap: 0, sparkline_in_7d: { price: [] }
      };
    }

    // Gate.io
    const g = gateResults[c.id] || extraResults[c.id];
    if (g) {
      // Gate.io formato
      if (g.last) return {
        id: c.id, symbol: c.sym.toLowerCase(), name: c.name,
        current_price: parseFloat(g.last) || 0,
        price_change_percentage_24h: parseFloat(g.change_percentage) || 0,
        total_volume: parseFloat(g.quote_volume) || 0,
        market_cap: 0, sparkline_in_7d: { price: [] }
      };
      // CoinGecko formato
      if (g.last_price) return {
        id: c.id, symbol: c.sym.toLowerCase(), name: c.name,
        current_price: parseFloat(g.last_price) || 0,
        price_change_percentage_24h: parseFloat(g.change_percentage) || 0,
        total_volume: 0, market_cap: 0, sparkline_in_7d: { price: [] }
      };
    }

    return null;
  }).filter(Boolean);

  if (!result.length) return res.status(500).json({ error: 'no data' });
  res.status(200).json(result);
}
