import BaseError from 'standard-error'

function createError (name) {
  class CALError extends BaseError {}
  CALError.prototype.name = name
  return CALError
}

export const StandardError = createError('StandardError')
export const ProviderNotFoundError = createError('ProviderNotFoundError')
export const InvalidProviderError = createError('InvalidProviderError')
export const DuplicateProviderError = createError('DuplicateProviderError')
export const NoProviderError = createError('NoProviderError')
export const UnsupportedMethodError = createError('UnsupportedMethodError')
export const UnimplementedMethodError = createError('UnimplementedMethodError')
export const InvalidProviderResponseError = createError('InvalidProviderResponseError')
export const WalletError = createError('WalletError')
export const NodeError = createError('NodeError')
