import { initializeApp } from "firebase/app";
import { getDatabase, ref, push, set, onValue, get } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyD8CUluaHqkpgH3EYxxCpjD4PwOF8uiDJ8",
  authDomain: "tizzy-fa82c.firebaseapp.com",
  projectId: "tizzy-fa82c",
  storageBucket: "tizzy-fa82c.firebasestorage.app",
  messagingSenderId: "402155574826",
  appId: "1:402155574826:web:b2ab1e7f6352d799601553",
  measurementId: "G-ZDM1HTEML9",
  databaseURL: "https://tizzy-fa82c-default-rtdb.firebaseio.com",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export interface MarketData {
  address: string;
  tweetId: string;
  username: string;
  question: string;
  duration: number;
  createdAt: number;
  createdBy: string;
  status: "active" | "closed" | "resolved";
}

export async function saveMarket(market: MarketData) {
  const marketsRef = ref(db, "markets");
  const newMarketRef = push(marketsRef);
  await set(newMarketRef, market);
  return newMarketRef.key;
}

export async function getMarkets(): Promise<MarketData[]> {
  const marketsRef = ref(db, "markets");
  const snapshot = await get(marketsRef);
  if (!snapshot.exists()) return [];
  
  const data = snapshot.val();
  return Object.values(data) as MarketData[];
}

export function subscribeToMarkets(callback: (markets: MarketData[]) => void) {
  const marketsRef = ref(db, "markets");
  return onValue(marketsRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    const data = snapshot.val();
    callback(Object.values(data) as MarketData[]);
  });
}
