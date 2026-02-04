import { getStore } from '@netlify/blobs'

export const EVENTS_STORE_NAME = 'athens-bands'
export const EVENTS_BLOB_KEY = 'events'

export const getEventsStore = () => {
  return getStore(EVENTS_STORE_NAME)
}
