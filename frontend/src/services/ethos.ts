import { CONFIG } from "../lib/config";

const headers = { "X-Ethos-Client": CONFIG.ethos.clientHeader };

export async function getScoreByUsername(username: string) {
  try {
    const userkey = `service:x.com:username:${username}`;
    const res = await fetch(
      `${CONFIG.ethos.apiUrl}/score/userkey?userkey=${encodeURIComponent(userkey)}`,
      { headers }
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
