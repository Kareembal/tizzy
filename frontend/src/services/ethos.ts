import { CONFIG } from "../lib/config";

const headers = { 
  "X-Ethos-Client": CONFIG.ethos.clientHeader,
};

export interface EthosProfile {
  username: string;
  displayName: string;
  avatarUrl: string;
  score: number;
}

// Get score for a specific Twitter user
export async function getScoreByUsername(username: string): Promise<{ score: number } | null> {
  try {
    const userkey = `service:x.com:username:${username}`;
    const res = await fetch(
      `${CONFIG.ethos.apiUrl}/score/userkey?userkey=${encodeURIComponent(userkey)}`,
      { headers }
    );
    if (!res.ok) {
      console.error("Score API failed:", res.status);
      return null;
    }
    return res.json();
  } catch (e) {
    console.error("Score API error:", e);
    return null;
  }
}

// Get user profile by Twitter username
export async function getUserByTwitter(username: string): Promise<EthosProfile | null> {
  try {
    // First get user info
    const res = await fetch(
      `${CONFIG.ethos.apiUrl}/user/by-x/${encodeURIComponent(username)}`,
      { headers }
    );
    if (!res.ok) {
      console.error("User API failed:", res.status);
      return null;
    }
    const data = await res.json();
    return {
      username: data.username || username,
      displayName: data.displayName || username,
      avatarUrl: data.avatarUrl || "",
      score: data.score || 0,
    };
  } catch (e) {
    console.error("User API error:", e);
    return null;
  }
}

// Fetch real top users from Ethos API
export async function getTopUsers(limit = 10): Promise<EthosProfile[]> {
  try {
    // Use the score leaderboard endpoint
    const res = await fetch(
      `${CONFIG.ethos.apiUrl}/score/leaderboard?limit=${limit}`,
      { headers }
    );
    
    if (!res.ok) {
      console.error("Leaderboard API failed:", res.status, await res.text());
      // Try alternative endpoint
      return fetchUsersManually();
    }
    
    const data = await res.json();
    console.log("Leaderboard response:", data);
    
    if (data.values && Array.isArray(data.values)) {
      return data.values.map((u: any) => ({
        username: u.username || u.user?.username || "unknown",
        displayName: u.displayName || u.user?.displayName || "unknown",
        avatarUrl: u.avatarUrl || u.user?.avatarUrl || "",
        score: u.score || u.user?.score || 0,
      }));
    }
    
    return fetchUsersManually();
  } catch (e) {
    console.error("Leaderboard API error:", e);
    return fetchUsersManually();
  }
}

// Fallback: fetch specific users we know
async function fetchUsersManually(): Promise<EthosProfile[]> {
  const usernames = ["serpinxbt", "waleswoosh", "0xqowiyy", "baborthelamb", "coloheyyy"];
  const results: EthosProfile[] = [];
  
  for (const username of usernames) {
    const profile = await getUserByTwitter(username);
    if (profile && profile.score > 0) {
      results.push(profile);
    } else {
      // Try just getting score
      const scoreData = await getScoreByUsername(username);
      if (scoreData) {
        results.push({
          username,
          displayName: username,
          avatarUrl: "",
          score: scoreData.score,
        });
      }
    }
  }
  
  // Sort by score descending
  return results.sort((a, b) => b.score - a.score);
}
