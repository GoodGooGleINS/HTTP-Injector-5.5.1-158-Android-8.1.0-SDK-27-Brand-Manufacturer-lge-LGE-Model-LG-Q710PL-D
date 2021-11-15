import Provider from '@liquality/provider'
import { padHexStart } from '@liquality/crypto'
import { addressToString, sleep } from '@liquality/utils'
import { remove0x } from '@liquality/ethereum-utils'

import { version } from '../package.json'

const SOL_CLAIM_FUNCTION = '0xbd66528a' // claim(bytes32)
const SOL_REFUND_FUNCTION = '0x590e1ae3' // refund()

export default class EthereumErc20SwapProvider extends Provider {
  createSwapScript (recipientAddress, refundAddress, secretHash, expiration) {
    recipientAddress = remove0x(addressToString(recipientAddress))
    refundAddress = remove0x(addressToString(refundAddress))

    const tokenAddress = remove0x(this.getMethod('getContractAddress')())
    const expirationEncoded = padHexStart(expiration.toString(16), 64)
    const bytecode = [
      '608060405260008054600160a060020a031990811673',
      recipientAddress,
      '1790915560018054821673',
      refundAddress,
      '1790556002805490911673',
      tokenAddress,
      '1790557f',
      secretHash,
      '60035534801561009a57600080fd5b50610414806100aa6000396000f3fe60806040526004361061002c5760e060020a6000350463590e1ae38114610031578063bd66528a14610048575b600080fd5b34801561003d57600080fd5b50610046610072565b005b34801561005457600080fd5b506100466004803603602081101561006b57600080fd5b50356101e9565b7f',
      expirationEncoded,
      '421161009e57600080fd5b600254600154604080517f70a08231000000000000000000000000000000000000000000000000000000008152306004820152905173ffffffffffffffffffffffffffffffffffffffff9384169363a9059cbb93169184916370a0823191602480820192602092909190829003018186803b15801561011c57600080fd5b505afa158015610130573d6000803e3d6000fd5b505050506040513d602081101561014657600080fd5b50516040805160e060020a63ffffffff861602815273ffffffffffffffffffffffffffffffffffffffff909316600484015260248301919091525160448083019260209291908290030181600087803b1580156101a257600080fd5b505af11580156101b6573d6000803e3d6000fd5b505050506040513d60208110156101cc57600080fd5b505060015473ffffffffffffffffffffffffffffffffffffffff16ff5b600354600282604051602001808281526020019150506040516020818303038152906040526040518082805190602001908083835b6020831061023d5780518252601f19909201916020918201910161021e565b51815160209384036101000a60001901801990921691161790526040519190930194509192505080830381855afa15801561027c573d6000803e3d6000fd5b5050506040513d602081101561029157600080fd5b50511461029d57600080fd5b600254600054604080517f70a08231000000000000000000000000000000000000000000000000000000008152306004820152905173ffffffffffffffffffffffffffffffffffffffff9384169363a9059cbb93169184916370a0823191602480820192602092909190829003018186803b15801561031b57600080fd5b505afa15801561032f573d6000803e3d6000fd5b505050506040513d602081101561034557600080fd5b50516040805160e060020a63ffffffff861602815273ffffffffffffffffffffffffffffffffffffffff909316600484015260248301919091525160448083019260209291908290030181600087803b1580156103a157600080fd5b505af11580156103b5573d6000803e3d6000fd5b505050506040513d60208110156103cb57600080fd5b505060005473ffffffffffffffffffffffffffffffffffffffff16fffea165627a7a72305820b4278861f73b5e043b52d6669b023d772371e3ae909ecd4e617dd82afb7d1ffd0029'
    ].join('').toLowerCase()

    return bytecode
  }

  async initiateSwap (value, recipientAddress, refundAddress, secretHash, expiration) {
    const bytecode = this.createSwapScript(recipientAddress, refundAddress, secretHash, expiration)
    const txHash = await this.getMethod('sendTransaction')(null, 0, bytecode)
    let initiationTransactionReceipt = null

    while (initiationTransactionReceipt === null) {
      initiationTransactionReceipt = await this.getMethod('getTransactionReceipt')(txHash)
      await sleep(5000)
    }

    await this.getMethod('sendTransaction')(initiationTransactionReceipt.contractAddress, value)
    return txHash
  }

  async claimSwap (initiationTxHash, recipientAddress, refundAddress, secret, expiration) {
    const initiationTransaction = await this.getMethod('getTransactionReceipt')(initiationTxHash)
    return this.getMethod('sendTransaction')(initiationTransaction.contractAddress, 0, SOL_CLAIM_FUNCTION + secret)
  }

  async refundSwap (initiationTxHash, recipientAddress, refundAddress, secretHash, expiration) {
    const initiationTransaction = await this.getMethod('getTransactionReceipt')(initiationTxHash)
    return this.getMethod('sendTransaction')(initiationTransaction.contractAddress, 0, SOL_REFUND_FUNCTION)
  }

  doesTransactionMatchSwapParams (transaction, recipientAddress, refundAddress, secretHash, expiration) {
    const data = this.createSwapScript(recipientAddress, refundAddress, secretHash, expiration)
    return transaction.input === data
  }

  async doesBalanceMatchValue (contractAddress, value) {
    const balance = await this.getMethod('getBalance')(contractAddress)
    return balance.isEqualTo(value)
  }

  async verifyInitiateSwapTransaction (initiationTxHash, value, recipientAddress, refundAddress, secretHash, expiration) {
    const initiationTransaction = await this.getMethod('getTransactionByHash')(initiationTxHash)
    const initiationTransactionReceipt = await this.getMethod('getTransactionReceipt')(initiationTxHash)
    const transactionMatchesSwapParams = this.doesTransactionMatchSwapParams(
      initiationTransaction,
      recipientAddress,
      refundAddress,
      secretHash,
      expiration
    )
    const balanceMatchValue = await this.doesBalanceMatchValue(initiationTransactionReceipt.contractAddress, value)

    return transactionMatchesSwapParams &&
           initiationTransactionReceipt.status === '1' &&
           balanceMatchValue
  }

  async findContractDeployTransaction (value, recipientAddress, refundAddress, secretHash, expiration) {
    let blockNumber = await this.getMethod('getBlockHeight')()
    let initiateSwapTransaction = false

    while (!initiateSwapTransaction) {
      const block = await this.getMethod('getBlockByNumber')(blockNumber, true)

      if (block) {
        initiateSwapTransaction = block.transactions.find(
          transaction => this.doesTransactionMatchSwapParams(
            transaction,
            recipientAddress,
            refundAddress,
            secretHash,
            expiration
          )
        )

        blockNumber++
      }

      await sleep(5000)
    }

    return initiateSwapTransaction
  }

  async findInitiateSwapTransaction (value, recipientAddress, refundAddress, secretHash, expiration) {
    const tx = await this.findContractDeployTransaction(value, recipientAddress, refundAddress, secretHash, expiration)
    const initiationTransactionReceipt = await this.getMethod('getTransactionReceipt')(tx.hash)
    let contractBalanceMatchesValue = false

    while (!contractBalanceMatchesValue) {
      contractBalanceMatchesValue = await this.doesBalanceMatchValue(initiationTransactionReceipt.contractAddress, value)
      await sleep(5000)
    }

    return tx
  }

  async findClaimSwapTransaction (initiationTxHash) {
    let blockNumber = await this.getMethod('getBlockHeight')()
    let claimSwapTransaction = false

    while (!claimSwapTransaction) {
      const initiationTransaction = await this.getMethod('getTransactionReceipt')(initiationTxHash)
      const block = await this.getMethod('getBlockByNumber')(blockNumber, true)

      if (block && initiationTransaction) {
        const transaction = block.transactions.find(
          transaction => transaction.to === initiationTransaction.contractAddress
        )

        if (transaction) {
          const transactionReceipt = await this.getMethod('getTransactionReceipt')(transaction.hash)
          if (transactionReceipt.status === '1') claimSwapTransaction = transaction
        }

        blockNumber++
      }

      await sleep(5000)
    }

    claimSwapTransaction.secret = await this.getSwapSecret(claimSwapTransaction.hash)

    return claimSwapTransaction
  }

  async getSwapSecret (claimTxHash) {
    const claimTransaction = await this.getMethod('getTransactionByHash')(claimTxHash)
    return claimTransaction.input.substring(8)
  }
}

EthereumErc20SwapProvider.version = version
