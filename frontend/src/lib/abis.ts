export const FACTORY_ABI = [
  {
    name: "createMarket",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "_tweetId", type: "string" },
      { name: "_authorUserkey", type: "string" },
      { name: "_question", type: "string" },
      { name: "_duration", type: "uint256" }
    ],
    outputs: [{ type: "address" }]
  },
  {
    name: "getMarketsCount",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }]
  },
  {
    name: "getMarkets",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "_offset", type: "uint256" },
      { name: "_limit", type: "uint256" }
    ],
    outputs: [{ type: "address[]" }]
  },
  {
    name: "marketByTweetId",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "", type: "string" }],
    outputs: [{ type: "address" }]
  }
] as const;

export const MARKET_ABI = [
  {
    name: "bet",
    type: "function",
    stateMutability: "payable",
    inputs: [{ name: "_isYes", type: "bool" }],
    outputs: []
  },
  {
    name: "claim",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: []
  },
  {
    name: "getMarketInfo",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { type: "string" },
      { type: "string" },
      { type: "string" },
      { type: "uint8" },
      { type: "uint8" },
      { type: "uint256" },
      { type: "uint256" },
      { type: "uint256" }
    ]
  },
  {
    name: "getOdds",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { name: "yesOdds", type: "uint256" },
      { name: "noOdds", type: "uint256" }
    ]
  },
  {
    name: "yesBets",
    type: "function",
    stateMutability: "view",
    inputs: [{ type: "address" }],
    outputs: [{ type: "uint256" }]
  },
  {
    name: "noBets",
    type: "function",
    stateMutability: "view",
    inputs: [{ type: "address" }],
    outputs: [{ type: "uint256" }]
  },
  {
    name: "yesPool",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }]
  },
  {
    name: "noPool",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }]
  },
  {
    name: "status",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint8" }]
  },
  {
    name: "closesAt",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }]
  }
] as const;
