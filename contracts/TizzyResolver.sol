// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./TizzyMarket.sol";

contract TizzyResolver is Ownable {
    mapping(address => bool) public isResolver;
    uint256 public resolutionDelay = 1 hours;
    bool public paused;
    
    event ResolverAdded(address indexed resolver);
    event ResolverRemoved(address indexed resolver);
    event MarketResolved(address indexed market, TizzyMarket.Outcome outcome);
    event MarketInvalidated(address indexed market);
    event Paused();
    event Unpaused();
    
    constructor() Ownable(msg.sender) {
        isResolver[msg.sender] = true;
        emit ResolverAdded(msg.sender);
    }
    
    modifier onlyResolver() {
        require(isResolver[msg.sender], "Not authorized");
        _;
    }
    
    modifier whenNotPaused() {
        require(!paused, "Paused");
        _;
    }
    
    function resolveYes(address _market) external onlyResolver whenNotPaused {
        TizzyMarket market = TizzyMarket(_market);
        require(block.timestamp >= market.closesAt() + resolutionDelay, "Too early");
        market.resolveMarket(TizzyMarket.Outcome.YES);
        emit MarketResolved(_market, TizzyMarket.Outcome.YES);
    }
    
    function resolveNo(address _market) external onlyResolver whenNotPaused {
        TizzyMarket market = TizzyMarket(_market);
        require(block.timestamp >= market.closesAt() + resolutionDelay, "Too early");
        market.resolveMarket(TizzyMarket.Outcome.NO);
        emit MarketResolved(_market, TizzyMarket.Outcome.NO);
    }
    
    function invalidate(address _market) external onlyResolver whenNotPaused {
        TizzyMarket(_market).invalidateMarket();
        emit MarketInvalidated(_market);
    }
    
    function addResolver(address _resolver) external onlyOwner {
        isResolver[_resolver] = true;
        emit ResolverAdded(_resolver);
    }
    
    function removeResolver(address _resolver) external onlyOwner {
        isResolver[_resolver] = false;
        emit ResolverRemoved(_resolver);
    }
    
    function setResolutionDelay(uint256 _delay) external onlyOwner {
        require(_delay <= 24 hours, "Too long");
        resolutionDelay = _delay;
    }
    
    function pause() external onlyOwner { paused = true; emit Paused(); }
    function unpause() external onlyOwner { paused = false; emit Unpaused(); }
}
