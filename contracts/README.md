# GETAWAY token unlocks

The published collection runs in **demo mode**. No token address, network, or live unlock contract has been configured, and no public-network deployment has been made.

`GetawayUnlocks.sol` accepts an ERC20 token with a standard `burnFrom(address,uint256)` implementation. It grants one permanent, non-transferable item to the burning wallet. Supply and wallet balance must both decrease by the exact price in the same transaction. If anything fails, the burn and unlock revert together. The contract has no owner, price update, upgrade, or withdrawal function.

Pons's published V2 token source is described as using ERC20Burnable. Verify the actual project token's deployed implementation before integrating it; V1 or other tokens must not be assumed compatible. A transfer to a dead address is not the burn operation implemented here.

## Stable item IDs

| ID | Item | Demo whole-token price |
| --- | --- | ---: |
| 1 | Afterglow car skin | 600 |
| 2 | Midnight car skin | 1,200 |
| 3 | Heatwave car skin | 1,800 |
| 4 | Ghost Chrome car skin | 2,500 |
| 5 | Night Bandit driver | 900 |
| 6 | Off Duty driver | 1,400 |
| 7 | Alley Cat | 2,500 |
| 8 | Night Cab | 4,000 |
| 9 | Ironhide | 6,000 |

IDs must stay stable. Constructor prices are a `uint256[9]` in this order, expressed in the token's smallest units, not floating-point numbers. The preview prices are examples, not approved launch economics. Real prices are read from the deployed registry by the client and shown again before confirmation.

## Activation

1. Confirm the real token contract, chain ID, decimals, burn support, and intended prices with the project owner. Keep `BURN_CONFIG.enabled` false until the remaining steps are complete.
2. Run `npm ci` and `npm run test:burn`. The latter compiles with Solidity 0.8.30, OpenZeppelin 5.4.0, optimizer 200, and Shanghai EVM output. The generated ABI and creation bytecode are in `artifacts/GetawayUnlocks.json`; the frontend method selectors are regenerated in `dist/burn-methods.mjs`.
3. Review and deploy `GetawayUnlocks` through the owner's authorized wallet with the token address and nine exact prices. Verify the deployed source/bytecode, token getter, and every price. Run the wallet approval, burn, and ownership flow on the selected test network before enabling it for real funds. No deployment key belongs in the website or repository.
4. Set `enabled`, hexadecimal `chainId`, `token`, `registry`, `symbol`, and `decimals` together in `dist/burn-config.js`. Update the announced footer CA in `dist/site-config.js`. Configure only verified addresses for this project, not factory or pool addresses.
5. Publish. In live mode the UI reads `ownedMask(account)` from the registry and ignores demo ownership. The wallet checks the network, token, and decimals, approves the exact required amount, submits the burn, waits for a successful receipt, and rereads ownership. An existing nonzero insufficient allowance is reset before setting the exact amount. Account/network changes clear the wallet's local ownership state.

The game is a client-side solo game; local tampering does not create an on-chain entitlement. Banked arcade credits and demo balances have no relationship to the real token. Unlocks do not produce transferable NFTs, rewards, or cash payouts. Current tests cover the contract and wallet integration on a local EVM and the collection UI in a simulated DOM/renderer; they are not a security audit or physical-device test.

## Primary references

- [Pons launchpad source and V2 token description](https://github.com/ponsdotdev/ponsfamily/blob/main/README.md)
- [OpenZeppelin ERC20 and ERC20Burnable](https://docs.openzeppelin.com/contracts/5.x/api/token/erc20)
- [EIP-1193 wallet provider API](https://eips.ethereum.org/EIPS/eip-1193)
