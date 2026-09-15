// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IBurnableToken is IERC20 {
    function burnFrom(address account, uint256 amount) external;
}

/// @notice Permanent, non-transferable game unlocks purchased with true ERC20 burns.
/// @dev No owner, withdrawals, upgrades, arbitrary destinations, or post-deploy price changes.
contract GetawayUnlocks is ReentrancyGuard {
    IBurnableToken public immutable token;
    uint256 public constant ITEM_COUNT = 9;
    mapping(uint256 => uint256) public prices;
    mapping(address => uint256) public ownedMask;
    event Unlocked(address indexed account, uint256 indexed itemId, uint256 amount);
    error InvalidToken();
    error InvalidItem();
    error AlreadyOwned();
    error PriceMismatch();
    error BurnNotVerified();

    constructor(address tokenAddress, uint256[9] memory costs) {
        if (tokenAddress.code.length == 0) revert InvalidToken();
        token = IBurnableToken(tokenAddress);
        for (uint256 i; i < ITEM_COUNT; ++i) {
            if (costs[i] == 0) revert PriceMismatch();
            prices[i + 1] = costs[i];
        }
    }

    function unlock(uint256 itemId, uint256 expectedPrice) external nonReentrant {
        if (itemId == 0 || itemId > ITEM_COUNT) revert InvalidItem();
        uint256 bit = 1 << itemId;
        if (ownedMask[msg.sender] & bit != 0) revert AlreadyOwned();
        uint256 price = prices[itemId];
        if (expectedPrice != price) revert PriceMismatch();
        uint256 supplyBefore = token.totalSupply();
        uint256 balanceBefore = token.balanceOf(msg.sender);
        ownedMask[msg.sender] |= bit;
        token.burnFrom(msg.sender, price);
        if (token.totalSupply() + price != supplyBefore || token.balanceOf(msg.sender) + price != balanceBefore) {
            revert BurnNotVerified();
        }
        emit Unlocked(msg.sender, itemId, price);
    }
}
