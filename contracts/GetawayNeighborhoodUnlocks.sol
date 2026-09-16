// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
interface ITestBurnToken is IERC20 {function burnFrom(address account,uint256 amount) external;}
/// @notice A fixed-price testnet catalog; no owner, upgrades or withdrawals.
contract GetawayNeighborhoodUnlocks is ReentrancyGuard {
    ITestBurnToken public immutable token;
    uint256 public constant ITEM_COUNT = 14;
    mapping(uint256 => uint256) public prices;
    mapping(address => uint256) public ownedMask;
    event Unlocked(address indexed account,uint256 indexed itemId,uint256 amount);
    constructor(address tokenAddress) {
        require(block.chainid == 46630 || block.chainid == 1337, "Testnet only");
        require(tokenAddress.code.length > 0,"Token required");
        token=ITestBurnToken(tokenAddress);
        uint256[14] memory costs=[uint256(600),1200,1800,2500,900,1400,2500,4000,6000,800,1000,300,900,650];
        for(uint256 i;i<14;++i)prices[i+1]=costs[i]*1 ether;
    }
    function unlock(uint256 itemId,uint256 expectedPrice) external nonReentrant {
        require(itemId>0&&itemId<=ITEM_COUNT,"Unknown item");
        uint256 bit=1<<itemId;require(ownedMask[msg.sender]&bit==0,"Already owned");
        uint256 price=prices[itemId];require(expectedPrice==price,"Review price");
        uint256 supply=token.totalSupply();uint256 balance=token.balanceOf(msg.sender);
        ownedMask[msg.sender]|=bit;token.burnFrom(msg.sender,price);
        require(token.totalSupply()+price==supply&&token.balanceOf(msg.sender)+price==balance,"Burn not verified");
        emit Unlocked(msg.sender,itemId,price);
    }
}
