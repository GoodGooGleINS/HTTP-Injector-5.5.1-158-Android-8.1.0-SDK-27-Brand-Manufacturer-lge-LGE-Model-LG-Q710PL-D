import BitcoinLedgerProvider from '@liquality/bitcoin-ledger-provider'
import BitcoinRpcProvider from '@liquality/bitcoin-rpc-provider'
import BitcoinNodeWalletProvider from '@liquality/bitcoin-node-wallet-provider'
import BitcoinSwapProvider from '@liquality/bitcoin-swap-provider'
import BitcoinEsploraApiProvider from '@liquality/bitcoin-esplora-api-provider'
import * as BitcoinNetworks from '@liquality/bitcoin-networks'
import * as BitcoinUtils from '@liquality/bitcoin-utils'

import EthereumErc20Provider from '@liquality/ethereum-erc20-provider'
import EthereumErc20SwapProvider from '@liquality/ethereum-erc20-swap-provider'
import EthereumLedgerProvider from '@liquality/ethereum-ledger-provider'
import EthereumMetaMaskProvider from '@liquality/ethereum-metamask-provider'
import EthereumRpcProvider from '@liquality/ethereum-rpc-provider'
import EthereumSwapProvider from '@liquality/ethereum-swap-provider'
import * as EthereumNetworks from '@liquality/ethereum-networks'
import * as EthereumUtils from '@liquality/ethereum-utils'

const bitcoin = {
  BitcoinLedgerProvider,
  BitcoinRpcProvider,
  BitcoinNodeWalletProvider,
  BitcoinSwapProvider,
  BitcoinEsploraApiProvider,
  BitcoinNetworks,
  BitcoinUtils,
  networks: BitcoinNetworks
}

const ethereum = {
  EthereumErc20Provider,
  EthereumErc20SwapProvider,
  EthereumLedgerProvider,
  EthereumMetaMaskProvider,
  EthereumRpcProvider,
  EthereumSwapProvider,
  EthereumNetworks,
  EthereumUtils,
  networks: EthereumNetworks
}

export {
  bitcoin,
  ethereum
}
