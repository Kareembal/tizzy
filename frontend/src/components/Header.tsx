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
  const [ethosProfile, setEthosProfile] = useState<{ username: string; avatarUrl: string } | null>(null);

  const wallet = wallets[0];
  const address = wallet?.address;
  const shortAddr = address ? `${address.slice(0,6)}...${address.slice(-4)}` : "";
  
  // Use Twitter data from Privy if available, otherwise use Ethos data
  const twitterUsername = user?.twitter?.username || ethosProfile?.username;
  const avatarUrl = user?.twitter?.profilePictureUrl || ethosProfile?.avatarUrl;

  // Fetch balance
  useEffect(() => {
    if (address) {
      client.getBalance({ address: address as `0x${string}` }).then((bal) => {
        setBalance(parseFloat(formatEther(bal)).toFixed(4));
      }).catch(() => setBalance("0"));
    }
  }, [address]);

  // Fetch Ethos profile by wallet address
  useEffect(() => {
    async function fetchEthosProfile() {
      if (!address || user?.twitter?.username) return; // Skip if already have Twitter data
      
      try {
        const res = await fetch(
          `${CONFIG.ethos.apiUrl}/user/by-address/${address}`,
          { headers: { "X-Ethos-Client": CONFIG.ethos.clientHeader } }
        );
        if (res.ok) {
          const data = await res.json();
          if (data.username) {
            setEthosProfile({
              username: data.username,
              avatarUrl: data.avatarUrl || "",
            });
          }
        }
      } catch (e) {
        console.log("Could not fetch Ethos profile for wallet");
      }
    }
    
    fetchEthosProfile();
  }, [address, user?.twitter?.username]);

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="logo">
          <div className="logo-icon">◆</div>
          <span className="logo-text">TIZZY</span>
          <span className="logo-tag">TESTNET</span>
        </Link>

        <nav className="nav-links">
          <Link to="/" className={location.pathname === "/" ? "active" : ""}>HOME</Link>
          <Link to="/markets" className={location.pathname === "/markets" ? "active" : ""}>MARKETS</Link>
          {authenticated && (
            <Link to="/admin" className={location.pathname === "/admin" ? "active" : ""}>CREATE</Link>
          )}
        </nav>

        {authenticated ? (
          <div className="wallet-area">
            <button className="wallet-btn" onClick={() => setShowMenu(!showMenu)}>
              {avatarUrl && <img src={avatarUrl} alt="" className="header-avatar"/>}
              <div className="wallet-info">
                <span className="wallet-bal">{balance} ETH</span>
                <span className="wallet-addr">{twitterUsername ? `@${twitterUsername}` : shortAddr}</span>
              </div>
              <span className="chevron">{showMenu ? "▲" : "▼"}</span>
            </button>
            
            {showMenu && (
              <div className="dropdown">
                <div className="dropdown-profile">
                  {avatarUrl && <img src={avatarUrl} alt="" className="dropdown-avatar"/>}
                  <div>
                    {twitterUsername && <div className="dropdown-name">@{twitterUsername}</div>}
                    <div className="dropdown-addr">{shortAddr}</div>
                  </div>
                </div>
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
