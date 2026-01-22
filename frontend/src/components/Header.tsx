import { useState, useEffect } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { Link, useLocation } from "react-router-dom";
import { createPublicClient, http, formatEther } from "viem";
import { baseSepolia } from "viem/chains";
import { CONFIG } from "../lib/config";

const client = createPublicClient({
  chain: baseSepolia,
  transport: http(CONFIG.rpcUrl),
});

export function Header() {
  const { login, logout, authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const location = useLocation();
  const [balance, setBalance] = useState("0");
  const [showMenu, setShowMenu] = useState(false);

  const wallet = wallets[0];
  const address = wallet?.address;
  const shortAddr = address ? `${address.slice(0,6)}...${address.slice(-4)}` : "";

  useEffect(() => {
    if (address) {
      client.getBalance({ address: address as `0x${string}` }).then((bal) => {
        setBalance(parseFloat(formatEther(bal)).toFixed(4));
      });
    }
  }, [address]);

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="logo">
          <div className="logo-icon">◆</div>
          <span>TIZZY</span>
          <span className="logo-tag">TESTNET</span>
        </Link>

        <nav className="nav-links">
          <Link to="/" className={location.pathname === "/" ? "active" : ""}>MARKETS</Link>
          {authenticated && (
            <Link to="/admin" className={location.pathname === "/admin" ? "active" : ""}>CREATE</Link>
          )}
        </nav>

        {authenticated ? (
          <div className="wallet-area">
            <button className="wallet-btn" onClick={() => setShowMenu(!showMenu)}>
              <span className="wallet-bal">{balance} ETH</span>
              <span className="wallet-addr">{shortAddr}</span>
              <span className="chevron">{showMenu ? "▲" : "▼"}</span>
            </button>
            
            {showMenu && (
              <div className="dropdown">
                {user?.twitter?.username && (
                  <div className="dropdown-user">@{user.twitter.username}</div>
                )}
                <div className="dropdown-balance">
                  <span>BALANCE</span>
                  <strong>{balance} ETH</strong>
                </div>
                <button onClick={() => address && navigator.clipboard.writeText(address)} className="dropdown-item">
                  COPY ADDRESS
                </button>
                <button onClick={() => window.open(`https://sepolia.basescan.org/address/${address}`)} className="dropdown-item">
                  VIEW ON EXPLORER
                </button>
                <button onClick={logout} className="dropdown-logout">
                  DISCONNECT
                </button>
              </div>
            )}
          </div>
        ) : (
          <button onClick={login} className="connect-btn">&gt; CONNECT</button>
        )}
      </div>
    </header>
  );
}
