import { useState, useEffect } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { createPublicClient, createWalletClient, http, parseEther, formatEther, custom } from "viem";
import { baseSepolia } from "viem/chains";
import { CONFIG } from "../lib/config";
import { MARKET_ABI } from "../lib/abis";
import { getScoreByUsername } from "../services/ethos";

interface Props {
  market: { address: string; tweetId: string; question: string; authorUserkey: string; yesPool: bigint; noPool: bigint; status: number; closesAt: number; };
  onUpdate: () => void;
}

const client = createPublicClient({ chain: baseSepolia, transport: http(CONFIG.rpcUrl) });
const STATUS = ["LIVE", "CLOSED", "RESOLVED", "VOID"];

export function MarketCard({ market, onUpdate }: Props) {
  const { authenticated } = usePrivy();
  const { wallets } = useWallets();
  const [amount, setAmount] = useState("0.001");
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [time, setTime] = useState("");
  const [side, setSide] = useState<"yes"|"no"|null>(null);

  const user = market.authorUserkey.split(":").pop() || "";
  const total = market.yesPool + market.noPool;
  const yesP = total > 0n ? Number((market.yesPool * 100n) / total) : 50;

  useEffect(() => {
    if (user) getScoreByUsername(user).then(d => d && setScore(d.score));
  }, [user]);

  useEffect(() => {
    const tick = () => {
      const diff = market.closesAt - Math.floor(Date.now()/1000);
      if (diff <= 0) setTime("ENDED");
      else if (diff < 3600) setTime(`${Math.floor(diff/60)}M`);
      else if (diff < 86400) setTime(`${Math.floor(diff/3600)}H`);
      else setTime(`${Math.floor(diff/86400)}D`);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [market.closesAt]);

  async function bet() {
    if (!wallets[0] || !side) return;
    setLoading(true);
    try {
      const prov = await wallets[0].getEthereumProvider();
      const wc = createWalletClient({ chain: baseSepolia, transport: custom(prov) });
      const [addr] = await wc.getAddresses();
      const hash = await wc.writeContract({
        address: market.address as `0x${string}`,
        abi: MARKET_ABI,
        functionName: "bet",
        args: [side === "yes"],
        value: parseEther(amount),
        account: addr,
      });
      await client.waitForTransactionReceipt({ hash });
      setSide(null);
      onUpdate();
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  return (
    <div className="card">
      <div className="card-top">
        <div className="author">
          @{user}
          {score !== null && <span className="score">{score}</span>}
        </div>
        <div className={`status s${market.status}`}>{STATUS[market.status]}</div>
      </div>
      
      <h3 className="question">{market.question}</h3>
      
      <div className="odds">
        <div className="bar"><div className="yes-bar" style={{width:`${yesP}%`}}></div></div>
        <div className="labels">
          <span className="yes">YES {yesP}%</span>
          <span className="no">NO {100-yesP}%</span>
        </div>
      </div>
      
      <div className="pools">
        <div className="pool">
          <span>YES POOL</span>
          <strong>{parseFloat(formatEther(market.yesPool)).toFixed(4)}</strong>
        </div>
        <div className="pool">
          <span>NO POOL</span>
          <strong>{parseFloat(formatEther(market.noPool)).toFixed(4)}</strong>
        </div>
      </div>
      
      <div className="footer">
        <span>◷ {time}</span>
        <a href={`https://x.com/i/status/${market.tweetId}`} target="_blank" rel="noopener">
          VIEW TWEET →
        </a>
      </div>
      
      {authenticated && market.status === 0 && (
        <div className="betting">
          <div className="sides">
            <button className={`side-btn ${side==="yes"?"sel":""}`} onClick={()=>setSide("yes")}>YES</button>
            <button className={`side-btn ${side==="no"?"sel":""}`} onClick={()=>setSide("no")}>NO</button>
          </div>
          {side && (
            <div className="bet-row">
              <input 
                type="number" 
                value={amount} 
                onChange={e=>setAmount(e.target.value)} 
                step="0.001" 
                min="0.0001"
                placeholder="0.001"
              />
              <button onClick={bet} disabled={loading} className={`bet-btn ${side}`}>
                {loading ? "..." : `BET ${side.toUpperCase()}`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
