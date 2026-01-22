// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TizzyMarket is ReentrancyGuard, Ownable {
    enum Status { OPEN, CLOSED, RESOLVED, INVALID }
    enum Outcome { NONE, YES, NO }

    string public tweetId;
    string public authorUserkey;
    string public question;
    uint256 public createdAt;
    uint256 public closesAt;
    uint256 public resolvedAt;
    
    Status public status;
    Outcome public outcome;
    
    uint256 public yesPool;
    uint256 public noPool;
    
    uint256 public feeBps;
    address public treasury;
    address public resolver;
    
    mapping(address => uint256) public yesBets;
    mapping(address => uint256) public noBets;
    mapping(address => bool) public hasClaimed;
    
    uint256 public minBet;
    uint256 public maxBetPerWallet;
    
    event BetPlaced(address indexed bettor, bool isYes, uint256 amount);
    event MarketClosed();
    event MarketResolved(Outcome outcome);
    event MarketInvalidated();
    event WinningsClaimed(address indexed claimer, uint256 amount);
    
    constructor(
        string memory _tweetId,
        string memory _authorUserkey,
        string memory _question,
        uint256 _duration,
        uint256 _minBet,
        uint256 _maxBetPerWallet,
        uint256 _feeBps,
        address _treasury,
        address _resolver,
        address _owner
    ) Ownable(_owner) {
        tweetId = _tweetId;
        authorUserkey = _authorUserkey;
        question = _question;
        createdAt = block.timestamp;
        closesAt = block.timestamp + _duration;
        minBet = _minBet;
        maxBetPerWallet = _maxBetPerWallet;
        feeBps = _feeBps;
        treasury = _treasury;
        resolver = _resolver;
        status = Status.OPEN;
        outcome = Outcome.NONE;
    }
    
    modifier onlyResolver() {
        require(msg.sender == resolver, "Only resolver");
        _;
    }
    
    modifier whenOpen() {
        require(status == Status.OPEN, "Not open");
        require(block.timestamp < closesAt, "Ended");
        _;
    }
    
    function bet(bool _isYes) external payable whenOpen nonReentrant {
        require(msg.value >= minBet, "Below min");
        uint256 currentBet = _isYes ? yesBets[msg.sender] : noBets[msg.sender];
        require(currentBet + msg.value <= maxBetPerWallet, "Exceeds max");
        
        if (_isYes) {
            yesBets[msg.sender] += msg.value;
            yesPool += msg.value;
        } else {
            noBets[msg.sender] += msg.value;
            noPool += msg.value;
        }
        emit BetPlaced(msg.sender, _isYes, msg.value);
    }
    
    function closeMarket() external {
        require(status == Status.OPEN, "Not open");
        require(block.timestamp >= closesAt, "Not ended");
        status = Status.CLOSED;
        emit MarketClosed();
    }
    
    function resolveMarket(Outcome _outcome) external onlyResolver {
        require(status == Status.CLOSED || (status == Status.OPEN && block.timestamp >= closesAt), "Not ready");
        require(_outcome == Outcome.YES || _outcome == Outcome.NO, "Invalid");
        
        if (status == Status.OPEN) {
            status = Status.CLOSED;
            emit MarketClosed();
        }
        
        status = Status.RESOLVED;
        outcome = _outcome;
        resolvedAt = block.timestamp;
        
        uint256 losingPool = (_outcome == Outcome.YES) ? noPool : yesPool;
        uint256 fee = (losingPool * feeBps) / 10000;
        
        if (fee > 0 && treasury != address(0)) {
            (bool sent, ) = treasury.call{value: fee}("");
            require(sent, "Fee failed");
        }
        emit MarketResolved(_outcome);
    }
    
    function invalidateMarket() external onlyResolver {
        require(status != Status.RESOLVED, "Already resolved");
        status = Status.INVALID;
        emit MarketInvalidated();
    }
    
    function claim() external nonReentrant {
        require(!hasClaimed[msg.sender], "Claimed");
        uint256 payout = 0;
        
        if (status == Status.INVALID) {
            payout = yesBets[msg.sender] + noBets[msg.sender];
        } else if (status == Status.RESOLVED) {
            uint256 winningBet;
            uint256 winningPool;
            uint256 losingPool;
            
            if (outcome == Outcome.YES) {
                winningBet = yesBets[msg.sender];
                winningPool = yesPool;
                losingPool = noPool;
            } else {
                winningBet = noBets[msg.sender];
                winningPool = noPool;
                losingPool = yesPool;
            }
            
            if (winningBet > 0 && winningPool > 0) {
                uint256 fee = (losingPool * feeBps) / 10000;
                uint256 distributable = losingPool - fee;
                payout = winningBet + (winningBet * distributable) / winningPool;
            }
        } else {
            revert("Not resolved");
        }
        
        require(payout > 0, "No winnings");
        hasClaimed[msg.sender] = true;
        (bool sent, ) = msg.sender.call{value: payout}("");
        require(sent, "Payout failed");
        emit WinningsClaimed(msg.sender, payout);
    }
    
    function getOdds() external view returns (uint256 yesOdds, uint256 noOdds) {
        uint256 total = yesPool + noPool;
        if (total == 0) return (5000, 5000);
        yesOdds = (yesPool * 10000) / total;
        noOdds = (noPool * 10000) / total;
    }
    
    function getPotentialPayout(uint256 _amount, bool _isYes) external view returns (uint256) {
        uint256 winPool = _isYes ? yesPool + _amount : noPool + _amount;
        uint256 losePool = _isYes ? noPool : yesPool;
        uint256 fee = (losePool * feeBps) / 10000;
        return _amount + (_amount * (losePool - fee)) / winPool;
    }
    
    function getMarketInfo() external view returns (
        string memory, string memory, string memory, Status, Outcome, uint256, uint256, uint256
    ) {
        return (tweetId, authorUserkey, question, status, outcome, yesPool, noPool, closesAt);
    }
}
