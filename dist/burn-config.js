// Preview stays enabled until a verified token and deployed GetawayUnlocks registry exist.
// Configure all fields together; the wallet validates the registry's token and prices.
export const BURN_CONFIG={
 enabled:false,chainId:'0x1237',chainName:'Robinhood Chain',
 rpc:'https://rpc.mainnet.chain.robinhood.com',
 token:'',registry:'',symbol:'GETAWAY',decimals:18,
 explorer:'https://robinhoodchain.blockscout.com',launchpad:'https://ponsfamily.com',
 status:'Waiting for the GETAWAY token launch and unlock contract'
};
