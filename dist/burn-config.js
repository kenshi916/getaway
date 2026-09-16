// Preview stays enabled until a verified token and deployed GetawayUnlocks registry exist.
// Configure all fields together; the wallet validates the registry's token and prices.
export const BURN_CONFIG={
 enabled:false,testnet:true,chainId:'0xb626',chainName:'Robinhood Chain Testnet',
 rpc:'https://rpc.testnet.chain.robinhood.com',
 token:'',registry:'',symbol:'tGETAWAY',decimals:18,
 explorer:'https://explorer.testnet.chain.robinhood.com',launchpad:'https://ponsfamily.com',
 status:'Open the testnet workshop to deploy or import your test shop'
};
