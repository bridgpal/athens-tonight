import { getDeployStore, getStore } from '@netlify/blobs'

export const EVENTS_STORE_NAME = 'athens-bands'
export const EVENTS_BLOB_KEY = 'events'

export const getEventsStore = () => {
  const deployContext = globalThis.Netlify?.context?.deploy?.context
  if (deployContext === 'production') {
    return getStore(EVENTS_STORE_NAME)
  }
  return getDeployStore(EVENTS_STORE_NAME)
}
