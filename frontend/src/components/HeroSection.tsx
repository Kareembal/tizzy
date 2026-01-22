import { usePrivy } from "@privy-io/react-auth";

export function HeroSection() {
  const { login } = usePrivy();

  return (
    <section className="hero">
      <div className="hero-badge">LIVE ON BASE SEPOLIA</div>
      <h1>
        PREDICTION MARKETS
        <span>FOR ONCHAIN REPUTATION</span>
      </h1>
      <p>
        Bet on whether a KOL's Ethos credibility score will rise or fall after controversial tweets. Powered by Ethos Network.
      </p>
      <button onClick={login} className="hero-btn">
        CONNECT WITH TWITTER
      </button>
      
      <div className="hero-stats">
        <div className="stat">
          <div className="stat-val">$0</div>
          <div className="stat-lbl">TOTAL VOLUME</div>
        </div>
        <div className="stat">
          <div className="stat-val">0</div>
          <div className="stat-lbl">ACTIVE MARKETS</div>
        </div>
        <div className="stat">
          <div className="stat-val">0</div>
          <div className="stat-lbl">TOTAL BETS</div>
        </div>
      </div>
    </section>
  );
}
