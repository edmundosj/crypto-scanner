export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const COINS = [
    {id:"bitcoin",      sym:"BTC",  name:"Bitcoin",     bybit:"BTCUSDT"},
    {id:"ethereum",     sym:"ETH",  name:"Ethereum",    bybit:"ETHUSDT"},
    {id:"binancecoin",  sym:"BNB",  name:"BNB",         bybit:"BNBUSDT"},
    {id:"solana",       sym:"SOL",  name:"Solana",      bybit:"SOLUSDT"},
    {id:"ripple",       sym:"XRP",  name:"XRP",         bybit:"XRPUSDT"},
    {id:"dogecoin",     sym:"DOGE", name:"Dogecoin",    bybit:"DOGEUSDT"},
    {id:"cardano",      sym:"ADA",  name:"Cardano",     bybit:"ADAUSDT"},
    {id:"avalanche-2",  sym:"AVAX", name:"Avalanche",   bybit:"AVAXUSDT"},
    {id:"chiliz",       sym:"CHZ",  name:"Chiliz",      bybit:"CHZUSDT"},
    {id:"render-token", sym:"RENDER",name:"Render",     bybit:"RENDERUSDT"},
    {id:"fetch-ai",     sym:"FET",  name:"Fetch.ai",    bybit:"FETUSDT"},
    {id:"bittensor",    sym:"TAO",  name:"Bittensor",   bybit:"TAOUSDT"},
    {id:"the-graph",    sym:"GRT",  name:"The Graph",   bybit:"GRTUSDT"},
    {id:"chainlink",    sym:"LINK", name:"Chainlink",   bybit:"LINKUSDT"},
  ];

  try {
    // Bybit: busca cada moeda em paralelo
    const results = await Promise.allSettled(
      COINS.map(c => 
        fetch(`https://api.bybit.com/v5/market/tickers?category=spot&symbol=${c.bybit}`)
          .then(r => r.json())
          .then(d => {
            const t = d.result?.list?.[0];
            if (!t) throw new Error('no data');
            return {
              id: c.id,
              symbol: c.sym.toLowerCase(),
              name: c.name,
              current_price: parseFloat(t.lastPrice),
              price_change_percentage_24h: parseFloat(t.price24hPcnt) * 100,
              total_volume: parseFloat(t.volume24h) * parseFloat(t.lastPrice),
              market_cap: 0,
              sparkline_in_7d: { price: [] }
            };
          })
      )
    );

    const data = results
      .filter(r => r.status === 'fulfilled')
      .map(r => r.value);

    if (!data.length) throw new Error('no data from bybit');
    res.status(200).json(data);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
}
