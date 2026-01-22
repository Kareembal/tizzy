export const FACTORY_ABI = [
  "function createMarket(string,string,string,uint256) returns (address)",
  "function markets(uint256) view returns (address)",
  "function marketByTweetId(string) view returns (address)",
  "function getMarketsCount() view returns (uint256)",
  "function getMarkets(uint256,uint256) view returns (address[])",
] as const;

export const MARKET_ABI = [
  "function bet(bool) payable",
  "function claim()",
  "function getMarketInfo() view returns (string,string,string,uint8,uint8,uint256,uint256,uint256)",
  "function getOdds() view returns (uint256,uint256)",
  "function yesBets(address) view returns (uint256)",
  "function noBets(address) view returns (uint256)",
  "function hasClaimed(address) view returns (bool)",
  "function yesPool() view returns (uint256)",
  "function noPool() view returns (uint256)",
  "function status() view returns (uint8)",
  "function closesAt() view returns (uint256)",
] as const;
