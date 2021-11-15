import { Block, Transaction } from '@liquality/schema'

import { version } from '../package.json'

/**
 * Converts a hex string to the ethereum format
 * @param {*} hash
 */
function ensure0x (hash) {
  return (typeof hash === 'string')
    ? hash.startsWith('0x') ? hash : `0x${hash}`
    : hash
}

/**
 * Converts an ethereum hex string to the standard format
 * @param {*} hash
 */
function remove0x (hash) {
  return (typeof hash === 'string') ? hash.replace(/^0x/, '') : hash
}

function formatEthResponse (obj) {
  if (typeof obj === 'string' || obj instanceof String) {
    obj = remove0x(obj)
  } else if (Array.isArray(obj) && typeof obj[0] === 'object') {
    for (let i = 0; i < obj.length; i++) {
      obj[i] = formatEthResponse(obj[i])
    }
  } else if (Array.isArray(obj)) {
    obj = obj.map(remove0x)
  } else {
    for (let key in obj) {
      if (obj[key] === null) continue
      if (Array.isArray(obj[key])) {
        obj[key] = formatEthResponse(obj[key])
      } else {
        if ((Block.properties[key] &&
          Block.properties[key].type === 'number') ||
          (Transaction.properties[key] &&
          Transaction.properties[key].type === 'number')) {
          obj[key] = parseInt(obj[key])
        } else {
          if (obj[key]) {
            obj[key] = remove0x(obj[key])
          }
        }
      }
    }
  }
  return obj
}

function normalizeTransactionObject (tx, currentHeight) {
  if (tx) {
    if (tx.blockNumber === null) {
      delete tx.blockNumber
    } else if (!isNaN(tx.blockNumber)) {
      tx.confirmations = currentHeight - tx.blockNumber + 1
    }
  }

  return tx
}

export {
  ensure0x,
  remove0x,
  formatEthResponse,
  normalizeTransactionObject,

  version
}
