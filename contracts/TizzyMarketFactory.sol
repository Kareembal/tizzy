// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./TizzyMarket.sol";

contract TizzyMarketFactory is Ownable {
    address[] public markets;
    mapping(string => address) public marketByTweetId;
    
    address public treasury;
    address public resolver;
    uint256 public defaultFeeBps = 200;
    uint256 public defaultMinBet = 0.0001 ether;
    uint256 public defaultMaxBetPerWallet = 0.1 ether;
    uint256 public defaultDuration = 24 hours;
    
    event MarketCreated(address indexed market, string tweetId, string authorUserkey, string question, uint256 closesAt);
    event TreasuryUpdated(address newTreasury);
    event ResolverUpdated(address newResolver);
    
    constructor(address _treasury, address _resolver) Ownable(msg.sender) {
        treasury = _treasury;
        resolver = _resolver;
    }
    
    function createMarket(
        string memory _tweetId,
        string memory _authorUserkey,
        string memory _question,
        uint256 _duration
    ) external onlyOwner returns (address) {
        require(marketByTweetId[_tweetId] == address(0), "Exists");
        require(_duration > 0, "Invalid duration");
        
        TizzyMarket market = new TizzyMarket(
            _tweetId, _authorUserkey, _question,
            _duration > 0 ? _duration : defaultDuration,
            defaultMinBet, defaultMaxBetPerWallet, defaultFeeBps,
            treasury, resolver, owner()
        );
        
        address addr = address(market);
        markets.push(addr);
        marketByTweetId[_tweetId] = addr;
        
        emit MarketCreated(addr, _tweetId, _authorUserkey, _question, block.timestamp + _duration);
        return addr;
    }
    
    function setTreasury(address _treasury) external onlyOwner {
        treasury = _treasury;
        emit TreasuryUpdated(_treasury);
    }
    
    function setResolver(address _resolver) external onlyOwner {
        resolver = _resolver;
        emit ResolverUpdated(_resolver);
    }
    
    function setDefaults(uint256 _feeBps, uint256 _minBet, uint256 _maxBet, uint256 _duration) external onlyOwner {
        require(_feeBps <= 1000, "Fee too high");
        defaultFeeBps = _feeBps;
        defaultMinBet = _minBet;
        defaultMaxBetPerWallet = _maxBet;
        defaultDuration = _duration;
    }
    
    function getMarketsCount() external view returns (uint256) { return markets.length; }
    
    function getMarkets(uint256 _offset, uint256 _limit) external view returns (address[] memory) {
        uint256 total = markets.length;
        if (_offset >= total) return new address[](0);
        uint256 end = _offset + _limit > total ? total : _offset + _limit;
        address[] memory result = new address[](end - _offset);
        for (uint256 i = _offset; i < end; i++) result[i - _offset] = markets[i];
        return result;
    }
}
