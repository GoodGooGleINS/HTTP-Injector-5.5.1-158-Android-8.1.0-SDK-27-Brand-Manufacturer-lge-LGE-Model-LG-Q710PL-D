import { findKey } from 'lodash'

import { base58, padHexStart } from '@liquality/crypto'
import networks from '@liquality/bitcoin-networks'
import coinselect from 'coinselect'
import coinselectAccumulative from 'coinselect/accumulative'
import { version } from '../package.json'

function calculateFee (numInputs, numOutputs, feePerByte) {
  return ((numInputs * 148) + (numOutputs * 34) + 10) * feePerByte
}

/**
 * Get compressed pubKey from pubKey.
 * @param {!string} pubKey - 65 byte string with prefix, x, y.
 * @return {string} Returns the compressed pubKey of uncompressed pubKey.
 */
function compressPubKey (pubKey) {
  const x = pubKey.substring(2, 66)
  const y = pubKey.substring(66, 130)
  const even = parseInt(y.substring(62, 64), 16) % 2 === 0
  const prefix = even ? '02' : '03'

  return prefix + x
}

/**
 * Get a network object from an address
 * @param {string} address The bitcoin address
 * @return {Network}
 */
function getAddressNetwork (address) {
  // TODO: can this be simplified using just bitcoinjs-lib??
  let networkKey
  // bech32
  networkKey = findKey(networks, network => address.startsWith(network.bech32))
  // base58
  if (!networkKey) {
    const prefix = base58.decode(address).toString('hex').substring(0, 2)
    networkKey = findKey(networks, network => {
      const pubKeyHashPrefix = padHexStart((network.pubKeyHash).toString(16), 2)
      const scriptHashPrefix = padHexStart((network.scriptHash).toString(16), 2)
      return [pubKeyHashPrefix, scriptHashPrefix].includes(prefix)
    })
  }
  return networks[networkKey]
}

function selectCoins (utxos, targets, feeRate, minRelayFee, fixedInputs = []) {
  let selectUtxos = utxos
  let inputs, outputs
  let fee = 0

  // Default coinselect won't accumulate some inputs
  // TODO: does coinselect need to be modified to ABSOLUTELY not skip an input?
  const coinselectStrat = fixedInputs.length ? coinselectAccumulative : coinselect
  if (fixedInputs.length) {
    selectUtxos = [ // Order fixed inputs to the start of the list so they are used
      ...fixedInputs,
      ...utxos.filter(utxo => !fixedInputs.find(input => input.vout === utxo.vout && input.txid === utxo.txid))
    ]
  }

  for (let feePerByte = feeRate; fee < minRelayFee; feePerByte++) {
    ({ inputs, outputs, fee } = coinselectStrat(selectUtxos, targets, Math.ceil(feePerByte)))
  }
  return { inputs, outputs, fee }
}

const AddressTypes = [
  'legacy', 'p2sh-segwit', 'bech32'
]

export {
  calculateFee,
  compressPubKey,
  getAddressNetwork,
  selectCoins,
  AddressTypes,
  version
}
