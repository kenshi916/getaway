// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
/// @notice Free test tokens. Never deploy this faucet token on mainnet.
contract GetawayTestToken is ERC20Burnable {
    mapping(address => uint256) public nextClaim;
    constructor() ERC20("GETAWAY Test Token", "tGETAWAY") {
        require(block.chainid == 46630 || block.chainid == 1337, "Testnet only");
    }
    function faucet() external {
        require(block.timestamp >= nextClaim[msg.sender], "Try tomorrow");
        nextClaim[msg.sender] = block.timestamp + 1 days;
        _mint(msg.sender, 25000 ether);
    }
}
