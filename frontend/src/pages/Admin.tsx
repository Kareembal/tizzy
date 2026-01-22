import { useState, useEffect } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { createPublicClient, createWalletClient, http, custom } from "viem";
import { baseSepolia } from "viem/chains";
import { CONFIG } from "../lib/config";
import { FACTORY_ABI } from "../lib/abis";
import { Header } from "../components/Header";

const client = createPublicClient({ chain: baseSepolia, transport: http(CONFIG.rpcUrl) });

const ADMIN_WALLET = "0x936238391d61067b0480185F7A81834a5Bc7a973".toLowerCase();
const MIN_ETHOS_SCORE = 1400;

interface TopUser {
  username: string;
  score: number;
}

export function Admin() {
  const { authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [userScore, setUserScore] = useState<number | null>(null);
  const [canCreate, setCanCreate] = useState(false);
  
  const [tweetId, setTweetId] = useState("");
  const [username, setUsername] = useState("");
  const [question, setQuestion] = useState("");
  const [duration, setDuration] = useState("86400");

  const wallet = wallets[0];
  const address = wallet?.address?.toLowerCase();
  const twitterUsername = user?.twitter?.username;

  useEffect(() => {
    async function checkPermission() {
      if (address === ADMIN_WALLET) {
        setCanCreate(true);
        setUserScore(9999);
        setLoading(false);
        return;
      }

      if (twitterUsername) {
        try {
          const res = await fetch(
            `${CONFIG.ethos.apiUrl}/score/userkey?userkey=service:x.com:username:${twitterUsername}`,
            { headers: { "X-Ethos-Client": CONFIG.ethos.clientHeader } }
          );
          if (res.ok) {
            const data = await res.json();
            const score = data.score || 0;
            setUserScore(score);
            setCanCreate(score >= MIN_ETHOS_SCORE);
          } else {
            setUserScore(0);
            setCanCreate(false);
          }
        } catch {
          setUserScore(0);
          setCanCreate(false);
        }
      } else {
        setCanCreate(false);
      }
      setLoading(false);
    }
    
    if (authenticated && address) {
      checkPermission();
    } else {
      setLoading(false);
    }
  }, [authenticated, address, twitterUsername]);

  useEffect(() => {
    async function fetchTopUsers() {
      try {
        const res = await fetch(`${CONFIG.ethos.apiUrl}/leaderboard?limit=20`, {
          headers: { "X-Ethos-Client": CONFIG.ethos.clientHeader }
        });
        if (res.ok) {
          const data = await res.json();
          const users = (data.values || data || []).slice(0, 10).map((u: any) => ({
            username: u.username || u.primaryAddress?.slice(0,8) || "unknown",
            score: u.score || 0,
          }));
          setTopUsers(users);
        }
      } catch (e) { console.error(e); }
    }
    fetchTopUsers();
  }, []);

  async function createMarket() {
    if (!wallet || !tweetId || !username || !question || !canCreate) return;
    setCreating(true);
    try {
      const prov = await wallet.getEthereumProvider();
      const wc = createWalletClient({ chain: baseSepolia, transport: custom(prov) });
      const [addr] = await wc.getAddresses();
      
      const userkey = `service:x.com:username:${username}`;
      const hash = await wc.writeContract({
        address: CONFIG.contracts.factory as `0x${string}`,
        abi: FACTORY_ABI,
        functionName: "createMarket",
        args: [tweetId, userkey, question, BigInt(duration)],
        account: addr,
      });
      
      await client.waitForTransactionReceipt({ hash });
      alert("Market created!");
      setTweetId(""); setUsername(""); setQuestion("");
    } catch (e: any) { 
      console.error(e);
      alert(e.message || "Failed");
    }
    setCreating(false);
  }

  function selectUser(u: TopUser) {
    setUsername(u.username);
    setQuestion(`Will @${u.username}'s Ethos score drop after this tweet?`);
  }

  return (
    <>
      <Header />
      <div className="admin">
        <h1>◆ CREATE MARKET</h1>
        
        <div className="disclaimer">
          <span className="disclaimer-icon">ℹ</span>
          <span>Only Tizzy team and accounts with Ethos score above 1,400 can create markets.</span>
        </div>

        {!authenticated ? (
          <div className="access-denied">
            <p>CONNECT WALLET TO CONTINUE</p>
          </div>
        ) : loading ? (
          <div className="access-denied">
            <p>CHECKING PERMISSIONS...</p>
          </div>
        ) : !canCreate ? (
          <div className="access-denied">
            <div className="denied-box">
              <h2>ACCESS DENIED</h2>
              <p>To create markets, you need:</p>
              <ul>
                <li>Be part of Tizzy team, OR</li>
                <li>Have Ethos score ≥ {MIN_ETHOS_SCORE.toLocaleString()}</li>
              </ul>
              {userScore !== null && (
                <p className="your-score">
                  YOUR SCORE: <span className={userScore >= MIN_ETHOS_SCORE ? "pass" : "fail"}>{userScore}</span>
                </p>
              )}
              {!twitterUsername && (
                <p className="hint">Connect Twitter to check your Ethos score</p>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="permission-badge">
              {address === ADMIN_WALLET ? (
                <span className="admin-badge">◆ TEAM</span>
              ) : (
                <span className="score-badge">ETHOS: {userScore}</span>
              )}
            </div>

            <div className="admin-grid">
              <div className="admin-form">
                <h2>MARKET DETAILS</h2>
                <div className="form-group">
                  <label>TWEET ID</label>
                  <input 
                    value={tweetId} 
                    onChange={e => setTweetId(e.target.value)}
                    placeholder="1234567890123456789"
                  />
                  <span className="hint">Number at end of tweet URL</span>
                </div>
                <div className="form-group">
                  <label>USERNAME</label>
                  <input 
                    value={username} 
                    onChange={e => setUsername(e.target.value)}
                    placeholder="elonmusk"
                  />
                </div>
                <div className="form-group">
                  <label>QUESTION</label>
                  <textarea 
                    value={question} 
                    onChange={e => setQuestion(e.target.value)}
                    placeholder="Will this tweet cause their Ethos score to drop?"
                    rows={3}
                  />
                </div>
                <div className="form-group">
                  <label>DURATION</label>
                  <select value={duration} onChange={e => setDuration(e.target.value)}>
                    <option value="3600">1 Hour</option>
                    <option value="21600">6 Hours</option>
                    <option value="86400">24 Hours</option>
                    <option value="259200">3 Days</option>
                  </select>
                </div>
                <button onClick={createMarket} disabled={creating || !tweetId || !username || !question} className="create-btn">
                  {creating ? "CREATING..." : "> CREATE MARKET"}
                </button>
              </div>

              <div className="top-users">
                <h2>TOP ETHOS USERS</h2>
                <p className="hint">Click to auto-fill</p>
                <div className="users-list">
                  {topUsers.map((u, i) => (
                    <button key={i} className="user-item" onClick={() => selectUser(u)}>
                      <span className="rank">#{i + 1}</span>
                      <span className="name">@{u.username}</span>
                      <span className="user-score">{u.score}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
