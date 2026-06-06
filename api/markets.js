export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // Lista de moedas com símbolos Binance
  const COINS = [
    {id:"bitcoin",      sym:"BTC",  name:"Bitcoin",        binance:"BTCUSDT"},
    {id:"ethereum",     sym:"ETH",  name:"Ethereum",       binance:"ETHUSDT"},
    {id:"binancecoin",  sym:"BNB",  name:"BNB",            binance:"BNBUSDT"},
    {id:"solana",       sym:"SOL",  name:"Solana",         binance:"SOLUSDT"},
    {id:"ripple",       sym:"XRP",  name:"XRP",            binance:"XRPUSDT"},
    {id:"dogecoin",     sym:"DOGE", name:"Dogecoin",       binance:"DOGEUSDT"},
    {id:"cardano",      sym:"ADA",  name:"Cardano",        binance:"ADAUSDT"},
    {id:"avalanche-2",  sym:"AVAX", name:"Avalanche",      binance:"AVAXUSDT"},
    {id:"chiliz",       sym:"CHZ",  name:"Chiliz",         binance:"CHZUSDT"},
    {id:"render-token", sym:"RENDER",name:"Render",        binance:"RENDERUSDT"},
    {id:"fetch-ai",     sym:"FET",  name:"Fetch.ai",       binance:"FETUSDT"},
    {id:"bittensor",    sym:"TAO",  name:"Bittensor",      binance:"TAOUSDT"},
    {id:"the-graph",    sym:"GRT",  name:"The Graph",      binance:"GRTUSDT"},
    {id:"chainlink",    sym:"LINK", name:"Chainlink",      binance:"LINKUSDT"},
  ];

  try {
    // Busca todos os preços de uma vez na Binance
    const symbols = JSON.stringify(COINS.map(c => c.binance));
    const r = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbols=${symbols}`);
    if (!r.ok) throw new Error('binance ' + r.status);
    const tickers = await r.json();

    // Busca sparkline do CoinGecko (com fallback)
    let sparklines = {};
    try {
      const cgIds = COINS.map(c=>c.id).join(',');
      const cgr = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${cgIds}&sparkline=true&per_page=50`);
      if (cgr.ok) {
        const cgdata = await cgr.json();
        for (const d of cgdata) sparklines[d.id] = d.sparkline_in_7d?.price || [];
      }
    } catch(e) {}

    // Combina dados
    const result = tickers.map(tick => {
      const coin = COINS.find(c => c.binance === tick.symbol);
      if (!coin) return null;
      return {
        id: coin.id,
        symbol: coin.sym.toLowerCase(),
        name: coin.name,
        current_price: parseFloat(tick.lastPrice),
        price_change_percentage_24h: parseFloat(tick.priceChangePercent),
        total_volume: parseFloat(tick.quoteVolume),
        market_cap: 0,
        sparkline_in_7d: { price: sparklines[coin.id] || [] }
      };
    }).filter(Boolean);

    res.status(200).json(result);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
}
