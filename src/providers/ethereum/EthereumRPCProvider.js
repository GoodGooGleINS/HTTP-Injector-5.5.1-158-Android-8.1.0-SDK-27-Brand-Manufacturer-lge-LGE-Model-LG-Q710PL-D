import JsonRpcProvider from '../JsonRpcProvider'

import { formatEthResponse, ensureHexEthFormat, normalizeTransactionObject } from './EthereumUtil'

export default class EthereumRPCProvider extends JsonRpcProvider {
  _parseResponse (response) {
    const data = super._parseResponse(response)

    return formatEthResponse(data)
  }

  async getAddresses () {
    return this.jsonrpc('eth_accounts')
  }

  async generateBlock (numberOfBlocks) {
    // Q: throw or silently pass?
    throw new Error('This method isn\'t supported by Ethereum')
  }

  async getBlockByNumber (blockNumber, includeTx) {
    const currentBlock = await this.getBlockHeight()
    const block = await this.jsonrpc('eth_getBlockByNumber', '0x' + blockNumber.toString(16), includeTx)
    if (block) {
      block.transactions = block.transactions.map(tx => normalizeTransactionObject(tx, currentBlock))
    }
    return block
  }

  async getBlockHeight () {
    const hexHeight = await this.jsonrpc('eth_blockNumber')
    return parseInt(hexHeight, '16')
  }

  async getTransactionByHash (txHash) {
    txHash = ensureHexEthFormat(txHash)
    const currentBlock = await this.getBlockHeight()
    const tx = await this.jsonrpc('eth_getTransactionByHash', txHash)
    return normalizeTransactionObject(tx, currentBlock)
  }

  async getTransactionReceipt (txHash) {
    txHash = ensureHexEthFormat(txHash)
    return this.jsonrpc('eth_getTransactionReceipt', txHash)
  }

  async getBalance (addresses) {
    addresses = addresses
      .map(address => String(address))

    const addrs = addresses.map(ensureHexEthFormat)
    const promiseBalances = await Promise.all(addrs.map(address => this.jsonrpc('eth_getBalance', address, 'latest')))
    return promiseBalances.map(balance => parseInt(balance, 16))
      .reduce((acc, balance) => acc + balance, 0)
  }

  async isAddressUsed (address) {
    address = ensureHexEthFormat(String(address))

    const transactionCount = this.jsonrpc('eth_getTransactionCount', address, 'latest')

    return transactionCount > 0
  }
}
