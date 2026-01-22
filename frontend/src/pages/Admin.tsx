import { useState, useEffect } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { createPublicClient, createWalletClient, http, custom } from "viem";
import { baseSepolia } from "viem/chains";
import { CONFIG } from "../lib/config";
import { FACTORY_ABI } from "../lib/abis";
import { Header } from "../components/Header";
import { getUserByTwitter, getTopUsers } from "../services/ethos";
import { saveMarket } from "../lib/firebase";

const client = createPublicClient({ chain: baseSepolia, transport: http(CONFIG.rpcUrl) });

const ADMIN_WALLET = "0x936238391d61067b0480185f7a81834a5bc7a973";
const TEAM_TWITTER = ["0xqowiyy"];
const MIN_ETHOS_SCORE = 1400;

interface TopUser { username: string; avatarUrl: string; score: number; }

export function Admin() {
  const { authenticated, ready, user } = usePrivy();
  const { wallets } = useWallets();
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [userScore, setUserScore] = useState<number | null>(null);
  const [canCreate, setCanCreate] = useState(false);
  const [isTeam, setIsTeam] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [tweetId, setTweetId] = useState("");
  const [username, setUsername] = useState("");
  const [question, setQuestion] = useState("");
  const [duration, setDuration] = useState("86400");

  const wallet = wallets[0];
  const address = wallet?.address?.toLowerCase();
  const twitterUsername = user?.twitter?.username?.toLowerCase();

  useEffect(() => {
    async function checkPermission() {
      if (address === ADMIN_WALLET) {
        setCanCreate(true);
        setIsTeam(true);
        setLoading(false);
        return;
      }

      if (twitterUsername && TEAM_TWITTER.includes(twitterUsername)) {
        setCanCreate(true);
        setIsTeam(true);
        setLoading(false);
        return;
      }

      if (twitterUsername) {
        const profile = await getUserByTwitter(twitterUsername);
        if (profile) {
          setUserScore(profile.score);
          setCanCreate(profile.score >= MIN_ETHOS_SCORE);
        }
      }
      setLoading(false);
    }
    
    if (ready && authenticated) {
      checkPermission();
    } else if (ready) {
      setLoading(false);
    }
  }, [ready, authenticated, address, twitterUsername]);

  useEffect(() => {
    getTopUsers(10).then(users => {
      setTopUsers(users.map(u => ({ username: u.username, avatarUrl: u.avatarUrl, score: u.score })));
    });
  }, []);

  async function switchToBaseSepolia() {
    if (!wallet) return false;
    
    const provider = await wallet.getEthereumProvider();
    
    try {
      // Try to switch chain
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x14a34' }], // 84532 in hex
      });
      return true;
    } catch (switchError: any) {
      // Chain not added, try to add it
      if (switchError.code === 4902) {
        try {
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x14a34',
              chainName: 'Base Sepolia',
              nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
              rpcUrls: ['https://sepolia.base.org'],
              blockExplorerUrls: ['https://sepolia.basescan.org'],
            }],
          });
          return true;
        } catch {
          return false;
        }
      }
      return false;
    }
  }

  async function createMarket() {
    if (!wallet) { setError("Wallet not connected"); return; }
    if (!tweetId.trim()) { setError("Tweet ID required"); return; }
    if (!username.trim()) { setError("Username required"); return; }
    if (!question.trim()) { setError("Question required"); return; }
    
    setCreating(true);
    setError("");
    setSuccess("");
    
    try {
      // Switch to Base Sepolia
      const switched = await switchToBaseSepolia();
      if (!switched) {
        setError("Please switch to Base Sepolia network in your wallet");
        setCreating(false);
        return;
      }
      
      // Small delay after chain switch
      await new Promise(r => setTimeout(r, 1000));
      
      const prov = await wallet.getEthereumProvider();
      const wc = createWalletClient({ chain: baseSepolia, transport: custom(prov) });
      const [addr] = await wc.getAddresses();
      
      const userkey = `service:x.com:username:${username.trim()}`;
      
      const hash = await wc.writeContract({
        address: CONFIG.contracts.factory as `0x${string}`,
        abi: FACTORY_ABI,
        functionName: "createMarket",
        args: [tweetId.trim(), userkey, question.trim(), BigInt(duration)],
        account: addr,
      });
      
      await client.waitForTransactionReceipt({ hash });
      
      await saveMarket({
        address: hash,
        tweetId: tweetId.trim(),
        username: username.trim(),
        question: question.trim(),
        duration: parseInt(duration),
        createdAt: Date.now(),
        createdBy: twitterUsername || addr,
        status: "active",
      });
      
      setSuccess(`Market created! Tx: ${hash.slice(0, 20)}...`);
      setTweetId(""); setUsername(""); setQuestion("");
    } catch (e: any) { 
      console.error(e);
      setError(e.shortMessage || e.message || "Failed");
    }
    setCreating(false);
  }

  return (
    <>
      <Header />
      <div className="admin">
        <h1>◆ CREATE MARKET</h1>
        <div className="disclaimer">
          <span className="disclaimer-icon">ℹ</span>
          <span>Only Tizzy team and accounts with <span className="orange">Ethos score above 1,400</span> can create markets. Make sure you're on <span className="orange">Base Sepolia</span> network.</span>
        </div>

        {!ready ? (
          <div className="access-denied"><p>LOADING...</p></div>
        ) : !authenticated ? (
          <div className="access-denied"><p>CONNECT WALLET TO CONTINUE</p></div>
        ) : loading ? (
          <div className="access-denied"><p>CHECKING PERMISSIONS...</p></div>
        ) : !canCreate ? (
          <div className="access-denied">
            <div className="denied-box">
              <h2>ACCESS DENIED</h2>
              <p>To create markets:</p>
              <ul><li>Be part of Tizzy team, OR</li><li>Have Ethos score ≥ 1,400</li></ul>
              {userScore !== null && <p className="your-score">YOUR SCORE: <span className="fail">{userScore}</span></p>}
              {!twitterUsername && <p className="hint">Connect with Twitter to check your Ethos score</p>}
            </div>
          </div>
        ) : (
          <>
            <div className="permission-badge">
              {isTeam ? <span className="admin-badge">◆ TEAM</span> : <span className="score-badge">ETHOS: {userScore}</span>}
            </div>
            
            {error && <div className="alert error">{error}</div>}
            {success && <div className="alert success">{success}</div>}
            
            <div className="admin-grid">
              <div className="admin-form">
                <h2>MARKET DETAILS</h2>
                <div className="form-group"><label>TWEET ID</label><input value={tweetId} onChange={e=>setTweetId(e.target.value)} placeholder="1234567890123456789"/><span className="hint">Number at end of tweet URL</span></div>
                <div className="form-group"><label>USERNAME</label><input value={username} onChange={e=>setUsername(e.target.value)} placeholder="elonmusk"/></div>
                <div className="form-group"><label>QUESTION</label><textarea value={question} onChange={e=>setQuestion(e.target.value)} placeholder="Will this tweet cause their Ethos score to drop?" rows={3}/></div>
                <div className="form-group"><label>DURATION</label><select value={duration} onChange={e=>setDuration(e.target.value)}><option value="3600">1 Hour</option><option value="21600">6 Hours</option><option value="86400">24 Hours</option><option value="259200">3 Days</option></select></div>
                <button onClick={createMarket} disabled={creating} className="create-btn">{creating ? "CREATING..." : "> CREATE MARKET"}</button>
              </div>
              
              <div className="top-users">
                <h2>TOP ETHOS USERS</h2>
                <p className="hint">Click to auto-fill</p>
                <div className="users-list">
                  {topUsers.map((u,i)=>(
                    <button key={i} className="user-item" onClick={()=>{setUsername(u.username);setQuestion(`Will @${u.username}'s Ethos score drop after this tweet?`);}}>
                      <span className="rank">#{i+1}</span>
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
