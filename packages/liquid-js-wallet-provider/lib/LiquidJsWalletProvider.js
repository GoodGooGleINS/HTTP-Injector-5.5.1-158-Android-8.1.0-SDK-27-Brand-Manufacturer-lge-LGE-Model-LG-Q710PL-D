import LiquidWalletProvider from '@liquality/liquid-wallet-provider'

import { address, ECPair, Psbt } from 'liquidjs-lib'
import * as slip77 from 'slip77'
import * as bip32 from 'bip32'
import { mnemonicToSeed } from 'bip39'

export default class LiquidJsWalletProvider extends LiquidWalletProvider {
  constructor (network, mnemonic, addressType = 'blech32') {
    super(network, addressType, [network])

    if (!mnemonic) throw new Error('Mnemonic should not be empty')

    this._mnemonic = mnemonic
  }

  async seedNode () {
    if (this._seedNode) return this._seedNode

    const seed = await mnemonicToSeed(this._mnemonic)
    this._seedNode = bip32.fromSeed(seed, this._network)

    return this._seedNode
  }

  async blindingNode () {
    if (this._blindingNode) return this._blindingNode

    const seed = await mnemonicToSeed(this._mnemonic)
    this._blindingNode = slip77.fromSeed(seed)

    return this._blindingNode
  }

  async baseDerivationNode () {
    if (this._baseDerivationNode) return this._baseDerivationNode

    const baseNode = await this.seedNode()
    this._baseDerivationNode = baseNode.derivePath(this._baseDerivationPath)

    return this._baseDerivationNode
  }

  async keyPair (derivationPath) {
    const node = await this.seedNode()
    const wif = node.derivePath(derivationPath).toWIF()
    return ECPair.fromWIF(wif, this._network)
  }

  async blindingKeyPair (scriptPubKey) {
    const node = await this.blindingNode()
    const { publicKey, privateKey } = node.derive(scriptPubKey)
    return { publicKey, privateKey }
  }

  async getConnectedNetwork () {
    return this._network
  }

  async isWalletAvailable () {
    return true
  }

  /**
   * Create and returns empty PSET transaction
   * @returns {liquid.Psbt}
   */
  createPset () {
    const pset = new Psbt({ network: this.network })
    return pset
  }

  decodePset (psetBase64) {
    let pset
    try {
      pset = Psbt.fromBase64(psetBase64)
    } catch (ignore) {
      throw new Error('Invalid pset')
    }

    return pset
  }

  /**
   * Update the given PSET transaction and adds given inputs and outputs
   * @param {string} pset
   * @param {Array} inputs
   * @param {Array} outputs
   * @returns {liquid.Psbt}
   */
  updatePset (pset, inputs, outputs) {
    // TODO proper implements going from explorer utxos, checking witness and nonWitnessUtxos and so on
    // let pset = this.decodePset(psetBase64)

    pset.addInputs(inputs)
    pset.addOutputs(outputs)

    return pset
  }

  /**
   * Blinds a complete pset (with explicit fee output). The confidential addresses of the inputs and outputs should be given as ordered array.
   * NOTICE: The order of the addresses should reflect the one in the PSET.UnsignedTx
   *
   * @param {liquid.Psbt} pset
   * @param {Array} inputAddresses
   * @param {Array} outputAddresses
   */
  async blindPset (pset, inputAddresses = [], outputAddresses = []) {
    // const pset = this.decodePset(psetBase64)

    const blindingPrivKeysOfInputs = await Promise.all(inputAddresses.map(async addr => {
      const wallet = await this.getWalletAddress(addr)
      return wallet.blindingPrivateKey
    }))

    const blindingPubKeysOfOutputs = outputAddresses.map(addr => {
      return (address.fromConfidential(addr)).blindingKey
    })

    try {
      pset.blindOutputs(blindingPrivKeysOfInputs, blindingPubKeysOfOutputs)
    } catch (e) {
      console.error(e)
    }

    return pset
  }

  /**
   * Returns a pset with inputs signed with the keys of the given addresses
   * @param {liquid.Psbt} pset
   * @param {Array} addresses
   * @returns {string}
   */
  async signPset (pset, addresses = []) {
    // const pset = this.decodePset(psetBase64)

    await Promise.all(addresses.map(async addr => {
      const wallet = await this.getWalletAddress(addr)
      const keyPair = await this.keyPair(wallet.derivationPath)
      pset.data.inputs.forEach((p, i) => {
        try { pset.signInput(i, keyPair) } catch (ignore) { return undefined }
      })
    }))

    return pset
  }
}
