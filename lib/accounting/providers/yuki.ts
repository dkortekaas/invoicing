// TODO: Implement yuki adapter
import type { AccountingAdapter } from '../types'

export class YukiAdapter implements AccountingAdapter {
  getAuthUrl(): string { throw new Error('Not implemented') }
  exchangeCodeForTokens(): Promise<never> { throw new Error('Not implemented') }
  refreshAccessToken(): Promise<never> { throw new Error('Not implemented') }
  getAdministrations(): Promise<never> { throw new Error('Not implemented') }
  validateConnection(): Promise<never> { throw new Error('Not implemented') }
  createCustomer(): Promise<never> { throw new Error('Not implemented') }
  updateCustomer(): Promise<never> { throw new Error('Not implemented') }
  findCustomerByEmail(): Promise<never> { throw new Error('Not implemented') }
  createInvoice(): Promise<never> { throw new Error('Not implemented') }
  updateInvoiceStatus(): Promise<never> { throw new Error('Not implemented') }
  createCreditNote(): Promise<never> { throw new Error('Not implemented') }
  getLedgerAccounts(): Promise<never> { throw new Error('Not implemented') }
  getVatCodes(): Promise<never> { throw new Error('Not implemented') }
}
