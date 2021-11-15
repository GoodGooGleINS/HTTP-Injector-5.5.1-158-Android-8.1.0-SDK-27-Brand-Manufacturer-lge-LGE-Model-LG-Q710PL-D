import Provider from '../../Provider'

import { isFunction } from 'lodash'
import { formatEthResponse, ensureEthFormat } from './EthereumUtil'
import { BigNumber } from 'bignumber.js'

export default class EthereumMetaMaskProvider extends Provider {
  constructor (metamaskProvider) {
    super()
    if (!isFunction(metamaskProvider.sendAsync)) {
      throw new Error('Invalid MetaMask Provider')
    }

    this._metamaskProvider = metamaskProvider
  }

  _toMM (method, ...params) {
    return new Promise((resolve, reject) => {
      this
        ._metamaskProvider
        .sendAsync({ method, params }, (err, data) => {
          if (err) {
            reject(err)
            return
          }

          if (!data) {
            reject(new Error('Something went wrong'))
            return
          }

          if (!data.result) {
            reject(new Error('Something went wrong'))
            return
          }

          const formattedResult = formatEthResponse(data.result)

          resolve(formattedResult)
        })
    })
  }

  async getAddresses () {
    return this._toMM('eth_accounts')
  }

  async signMessage (message) {
    const hex = Buffer.from(message).toString('hex')
    const addresses = await this.getAddresses()
    const from = addresses[0]

    return this._toMM('personal_sign', `0x${hex}`, `0x${from}`)
  }

  async sendTransaction (to, value, data, from) {
    value = BigNumber(value).toString(16)

    const tx = {
      from, to, value, data
    }

    return this._toMM('eth_sendTransaction', tx)
  }

  async getBlockByNumber (blockNumber, includeTx) {
    return this._toMM('eth_getBlockByNumber', '0x' + blockNumber.toString(16), includeTx)
  }

  async getTransactionByHash (txHash) {
    txHash = ensureEthFormat(txHash)
    return this._toMM('eth_getTransactionByHash', txHash)
  }
}
