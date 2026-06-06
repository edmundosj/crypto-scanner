export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const results = {};
  
  const tests = [
    ['bybit_ticker', 'https://api.bybit.com/v5/market/tickers?category=spot&symbol=BTCUSDT'],
    ['bybit_ob', 'https://api.bybit.com/v5/market/orderbook?category=spot&symbol=BTCUSDT&limit=5'],
    ['okx', 'https://www.okx.com/api/v5/market/ticker?instId=BTC-USDT'],
    ['kraken', 'https://api.kraken.com/0/public/Ticker?pair=XBTUSD'],
    ['coinbase', 'https://api.coinbase.com/v2/exchange-rates?currency=BTC'],
    ['kucoin', 'https://api.kucoin.com/api/v1/market/stats?symbol=BTC-USDT'],
    ['mexc', 'https://api.mexc.com/api/v3/ticker/24hr?symbol=BTCUSDT'],
    ['gate', 'https://api.gateio.ws/api/v4/spot/tickers?currency_pair=BTC_USDT'],
    ['huobi', 'https://api.huobi.pro/market/detail/merged?symbol=btcusdt'],
  ];

  await Promise.allSettled(tests.map(async ([name, url]) => {
    try {
      const r = await Promise.race([
        fetch(url),
        new Promise((_,rej) => setTimeout(() => rej(new Error('timeout')), 4000))
      ]);
      const text = await r.text();
      results[name] = { status: r.status, ok: r.ok, preview: text.slice(0,100) };
    } catch(e) {
      results[name] = { error: e.message };
    }
  }));

  res.status(200).json(results);
}
