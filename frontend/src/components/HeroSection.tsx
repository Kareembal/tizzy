import { useState, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useNavigate } from "react-router-dom";
import { createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";
import { CONFIG } from "../lib/config";
import { FACTORY_ABI } from "../lib/abis";

const client = createPublicClient({
  chain: baseSepolia,
  transport: http(CONFIG.rpcUrl),
});

export function HeroSection() {
  const { login, authenticated } = usePrivy();
  const navigate = useNavigate();
  const [marketCount, setMarketCount] = useState(0);

  useEffect(() => {
    async function fetchStats() {
      try {
        const count = await client.readContract({
          address: CONFIG.contracts.factory as `0x${string}`,
          abi: FACTORY_ABI,
          functionName: "getMarketsCount",
        }) as bigint;
        setMarketCount(Number(count));
      } catch {}
    }
    fetchStats();
  }, []);

  const handleClick = () => {
    authenticated ? navigate("/markets") : login();
  };

  return (
    <section className="hero">
      <img src="https://avatars.githubusercontent.com/u/108554348?s=200&v=4" alt="" className="deco-logo deco-base" />
      <img src="/ethos.jpeg" alt="" className="deco-logo deco-ethos" />
      
      <div className="hero-badge">LIVE ON BASE SEPOLIA</div>
      <h1>PREDICTION MARKETS<span>FOR <span className="orange">ONCHAIN</span> REPUTATION</span></h1>
      <p>Bet on whether a KOL's <span className="orange">Ethos credibility score</span> will rise or fall after controversial tweets.</p>
      <button onClick={handleClick} className="hero-btn">{authenticated ? "GET STARTED" : "CONNECT WITH TWITTER"}</button>
      
      <div className="hero-stats">
        <div className="stat"><div className="stat-val">$0</div><div className="stat-lbl">TOTAL VOLUME</div></div>
        <div className="stat"><div className="stat-val">{marketCount}</div><div className="stat-lbl">ACTIVE <span className="orange">MARKETS</span></div></div>
        <div className="stat"><div className="stat-val">0</div><div className="stat-lbl">TOTAL BETS</div></div>
      </div>
      
      <div className="powered-by">
        <span className="powered-text">POWERED BY</span>
        <img src="https://avatars.githubusercontent.com/u/108554348?s=200&v=4" alt="Base" className="powered-logo" />
        <span className="powered-sep">×</span>
        <img src="/ethos.jpeg" alt="Ethos" className="powered-logo" />
      </div>
    </section>
  );
}
