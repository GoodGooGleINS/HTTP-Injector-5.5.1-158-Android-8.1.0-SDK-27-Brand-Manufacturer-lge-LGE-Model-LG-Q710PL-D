process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0'

const { Client, providers, networks } = require('../../../')
const { BitcoinLedgerProvider, BitcoreRPCProvider } = providers.bitcoin

const bitcoin = new Client()
bitcoin.addProvider(new BitcoreRPCProvider('https://bitcoin.liquality.io/', 'liquality', 'liquality123'))
bitcoin.addProvider(new BitcoinLedgerProvider({ network: networks.bitcoin_testnet, segwit: false }))
// bitcoin.addProvider(new BitcoreRPCProvider('https://bitcoin.liquality.io/', 'liquality', 'liquality123'))

;(async () => {
  try {
    // const [ address ] = await bitcoin.getAddresses(0, 1)
    // console.log(address)
    let d = Date.now()
    try {
      console.log(await bitcoin.getAddresses(0, 100))
      
      console.log('Time taken', `${(Date.now() - d) / 1000}s`)
    } catch (e) {
      console.error(e)
    }
  } catch (e) {
    console.log(e)
  }
})()
