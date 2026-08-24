export type QueryMethod = 'GET' | 'POST'
export type QueryAuth = 'bearer' | 'x-api-key' | 'none'

export interface QueryFields {
  remaining?: string
  total?: string
  used?: string
}

export interface QueryOverride {
  url: string
  method: QueryMethod
  auth: QueryAuth
  fields: QueryFields
}
