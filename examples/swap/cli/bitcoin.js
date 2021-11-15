process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0

const { Client, providers, networks, crypto } = require('../../../dist/index.cjs.js')
const chains = {}

chains.bitcoin = new Client()
chains.bitcoin.addProvider(new providers.bitcoin.BitcoreRPCProvider('https://btc-testnet.leep.it/', 'bitcoin', 'local321'))
chains.bitcoin.addProvider(new providers.bitcoin.BitcoinLedgerProvider({ network: networks.bitcoin_testnet, segwit: false }))
chains.bitcoin.addProvider(new providers.bitcoin.BitcoinSwapProvider({ network: networks.bitcoin_testnet }))
// chains.bitcoin.addProvider(new providers.bitcoin.BitcoinJsLibSwapProvider({ network: networks.bitcoin }))
async function doSwap () {
  chains.bitcoin.generateSecret('test').then(secret => {
    chains.bitcoin.getUnusedAddress().then(address => {
      const secretHash = crypto.sha256(secret)
      const recipientAddress = address.address
      const refundAddress = address.address
      const expiration = 1468194353
      const value = 10000

      console.log('Secret Hash:', secretHash)
      console.log('Recipient Address:', recipientAddress)
      console.log('Refund Address:', refundAddress)
      console.log('Expirey:', expiration)
      console.log('Value:', value)
      chains.bitcoin.createSwapScript(recipientAddress, refundAddress, secretHash, expiration).then(result => {
        console.log('Create Swap:', result)
      })

      chains.bitcoin.initiateSwap(value, recipientAddress, refundAddress, secretHash, expiration).then(initTxId => { // init
        console.log('Initiate Swap', initTxId)
        console.log('Finding swap transaction')
        // chains.bitcoin.getMethod('generateBlock')(1).then((txid) => {console.log("Mining Block", txid)})
        chains.bitcoin.findInitiateSwapTransaction(value, recipientAddress, refundAddress, secretHash, expiration).then(result => { // find
          if (result._raw.txid === initTxId) { // TODO, check for more than one TX!
            console.log('Block has TXID') //
            chains.bitcoin.verifyInitiateSwapTransaction(initTxId, value, recipientAddress, refundAddress, secretHash, expiration).then(isVerified => { // verify
              if (isVerified) {
                console.log('Transaction Verified on chain!', initTxId)
                // chains.bitcoin.getMethod('dumpPrivKey')(recipientAddress).then((WIF) => {
                const WIF = null
                //  console.log("WIF", WIF)
                chains.bitcoin.claimSwap(initTxId, recipientAddress, refundAddress, secret, expiration, WIF).then(claimSwapTxId => {
                  console.log('Verifying Swap!', claimSwapTxId)
                  // chains.bitcoin.getMethod('generateBlock')(1).then((txid) => {console.log("Mining Block", txid)})
                  console.log('Racias', initTxId, secretHash)
                  chains.bitcoin.findClaimSwapTransaction(initTxId, recipientAddress, refundAddress, secretHash, expiration).then(result => {
                    console.log('Done Swap', result)
                    doSwap()
                  })
                }).catch((error) => {
                  console.log('Error here', error)
                  doSwap()
                })
              // })
              }
            })
          }
        })
      })
    })
  })
}

doSwap()
