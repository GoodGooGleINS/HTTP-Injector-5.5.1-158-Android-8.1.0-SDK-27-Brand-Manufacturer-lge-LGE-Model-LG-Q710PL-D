import Provider from '../../Provider'
import { padHexStart } from '../../crypto'

export default class EthereumSwapProvider extends Provider {
  generateSwap (recipientAddress, refundAddress, secretHash, expiration) {
    const dataSizeBase = 112
    const redeemDestinationBase = 66
    const refundDestinationBase = 89
    const expirationHex = expiration.toString(16)
    const expirationEncoded = padHexStart(expirationHex) // Pad with 0
    const expirationSize = expirationEncoded.length / 2
    const expirationPushOpcode = (0x60 - 1 + expirationSize).toString(16)
    const redeemDestinationEncoded = (redeemDestinationBase + expirationSize).toString(16)
    const refundDestinationEncoded = (refundDestinationBase + expirationSize).toString(16)
    const dataSizeEncoded = (dataSizeBase + expirationSize).toString(16)

    return [
      // Constructor
      '60', dataSizeEncoded, // PUSH1 {dataSizeEncoded}
      '80', // DUP1
      '60', '0b', // PUSH1 0b
      '60', '00', // PUSH1 00
      '39', // CODECOPY
      '60', '00', // PUSH1 00
      'f3', // RETURN

      // Contract
      '60', '20', // PUSH1 20

      // Get secret
      '80', // DUP1
      '60', '00', // PUSH1 00
      '80', // DUP1
      '37', // CALLDATACOPY

      // SHA256
      '60', '21', // PUSH1 21
      '81', // DUP2
      '60', '00', // PUSH1 00
      '80', // DUP1
      '60', '02', // PUSH1 02
      '60', '48', // PUSH1 48
      'f1', // CALL

      // Validate with secretHash
      '7f', secretHash, // PUSH32 {secretHashEncoded}
      '60', '21', // PUSH1 21
      '51', // MLOAD
      '14', // EQ
      '16', // AND (to make sure CALL succeeded)
      // Redeem if secret is valid
      '60', redeemDestinationEncoded, // PUSH1 {redeemDestinationEncoded}
      '57', // JUMPI

      // Check time lock
      expirationPushOpcode, // PUSH{expirationSize}
      expirationEncoded, // {expirationEncoded}
      '42', // TIMESTAMP
      '11', // GT
      // Refund if timelock passed
      '60', refundDestinationEncoded, // PUSH1 {refundDestinationEncoded}
      '57',

      '00', // STOP

      '5b', // JUMPDEST
      '73', recipientAddress, // PUSH20 {recipientAddressEncoded}
      'ff', // SUICIDE

      '5b', // JUMPDEST
      '73', refundAddress, // PUSH20 {refundAddressEncoded}
      'ff' // SUICIDE
    ].join('')
  }

  redeemSwap (secret) {
    return padHexStart(secret, 64)
  }

  refundSwap () {
    return ''
  }
}
