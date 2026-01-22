import { ethers } from "hardhat";

const FACTORY = "0x671bBe23571819d611cc941537edBf90Cd803559";

const MARKETS = [
  {
    tweetId: "1882000000000000001",
    userkey: "service:x.com:username:serpinxbt",
    question: "Will @serpinxbt's Ethos score drop after this tweet?",
    duration: 86400,
  },
  {
    tweetId: "1882000000000000002",
    userkey: "service:x.com:username:waleswoosh",
    question: "Will @waleswoosh's credibility score change this week?",
    duration: 259200,
  },
];

async function main() {
  const factory = await ethers.getContractAt([
    "function createMarket(string,string,string,uint256) returns (address)",
  ], FACTORY);

  for (const m of MARKETS) {
    console.log(`Creating market for ${m.userkey}...`);
    try {
      const tx = await factory.createMarket(m.tweetId, m.userkey, m.question, m.duration);
      const receipt = await tx.wait();
      console.log(`  Created! Tx: ${receipt?.hash}`);
    } catch (e: any) {
      console.log(`  Error: ${e.message}`);
    }
  }
}

main().catch(console.error);
