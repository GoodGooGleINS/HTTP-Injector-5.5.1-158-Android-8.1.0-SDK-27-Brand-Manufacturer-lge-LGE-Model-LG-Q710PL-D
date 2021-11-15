import JsonRpcProvider from '../JsonRpcProvider'

import { formatEthResponse, ensureHexEthFormat } from './EthereumUtil'

export default class EthereumRPCProvider extends JsonRpcProvider {
  _parseResponse (response) {
    const data = super._parseResponse(response)

    return formatEthResponse(data)
  }

  async getAddresses () {
    return this.rpc('eth_accounts')
  }

  async generateBlock (numberOfBlocks) {
    // Q: throw or silently pass?
    throw new Error('This method isn\'t supported by Ethereum')
  }

  async getBlockByNumber (blockNumber, includeTx) {
    return this.rpc('eth_getBlockByNumber', blockNumber, includeTx)
  }

  async getTransactionByHash (txHash) {
    txHash = ensureHexEthFormat(txHash)
    return this.rpc('eth_getTransactionByHash', txHash)
  }

  async getBalance (addresses) {
    const addrs = addresses.map(ensureHexEthFormat)
    const promiseBalances = await Promise.all(addrs.map(address => this.rpc('eth_getBalance', address, 'latest')))
    return promiseBalances.map(balance => parseInt(balance, 16))
      .reduce((acc, balance) => acc + balance, 0)
  }
}
