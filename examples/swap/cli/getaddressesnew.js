process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0'

const { Client, providers, networks } = require('../../../')
const { BitcoinLedgerProvider, BitcoreRPCProvider } = providers.bitcoin

const bitcoin = new Client()
bitcoin.addProvider(new BitcoreRPCProvider('http://localhost:18332', 'bitcoin', 'local321'))
bitcoin.addProvider(new BitcoinLedgerProvider({ network: networks.bitcoin_testnet, segwit: false }))
//bitcoin.addProvider(new BitcoreRPCProvider('https://bitcoin.liquality.io/', 'liquality', 'liquality123'))
// bitcoin.addProvider(new BitcoreRPCProvider('https://bitcoin.liquality.io/', 'liquality', 'liquality123'))

;(async () => {
  try {
    // console.log(address)
    let d = Date.now()
    try {
      const addresses = await bitcoin.getAddresses(0, 50)
      console.log(addresses)
      /*
      var xpubkeys = await bitcoin.getAddressExtendedPubKeys("49'/1'/0'")
      console.log(xpubkeys[0])
      var bjs = require("bitcoinjs-lib")
      var node = bjs.HDNode.fromBase58(xpubkeys[0], bjs.networks.testnet);
      for ( var i = 0; i < 30; i++ ) { 
        console.log(node.derivePath("0/" + i).getAddress()); 
      }
      */
      
      console.log('Time taken', `${(Date.now() - d) / 1000}s`)
    } catch (e) {
      console.error(e)
    }
  } catch (e) {
    console.log(e)
  }
})()
