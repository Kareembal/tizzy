import { useState, useEffect } from "react";
import { createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";
import { CONFIG } from "../lib/config";
import { FACTORY_ABI, MARKET_ABI } from "../lib/abis";
import { MarketCard } from "./MarketCard";

interface Market {
  address: string;
  tweetId: string;
  question: string;
  authorUserkey: string;
  yesPool: bigint;
  noPool: bigint;
  status: number;
  closesAt: number;
}

const client = createPublicClient({
  chain: baseSepolia,
  transport: http(CONFIG.rpcUrl),
});

export function MarketsList() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadMarkets() {
    try {
      const count = await client.readContract({
        address: CONFIG.contracts.factory as `0x${string}`,
        abi: FACTORY_ABI,
        functionName: "getMarketsCount",
      }) as bigint;

      if (count === 0n) {
        setMarkets([]);
        setLoading(false);
        return;
      }

      const addrs = await client.readContract({
        address: CONFIG.contracts.factory as `0x${string}`,
        abi: FACTORY_ABI,
        functionName: "getMarkets",
        args: [0n, count],
      }) as string[];

      const data = await Promise.all(
        addrs.map(async (addr) => {
          const info = await client.readContract({
            address: addr as `0x${string}`,
            abi: MARKET_ABI,
            functionName: "getMarketInfo",
          }) as [string, string, string, number, number, bigint, bigint, bigint];
          return {
            address: addr,
            tweetId: info[0],
            authorUserkey: info[1],
            question: info[2],
            status: info[3],
            yesPool: info[5],
            noPool: info[6],
            closesAt: Number(info[7]),
          };
        })
      );
      setMarkets(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  useEffect(() => { loadMarkets(); }, []);

  if (loading) return <div className="loading">LOADING MARKETS...</div>;

  return (
    <section className="markets">
      <div className="markets-header">
        <h2>◆ ACTIVE MARKETS</h2>
        <button onClick={loadMarkets} className="refresh-btn">↻ REFRESH</button>
      </div>
      {markets.length === 0 ? (
        <div className="empty">NO ACTIVE MARKETS. CHECK BACK SOON.</div>
      ) : (
        <div className="markets-grid">
          {markets.map((m) => <MarketCard key={m.address} market={m} onUpdate={loadMarkets} />)}
        </div>
      )}
    </section>
  );
}
