const DB_NAME = 'smartgen-local-voice'
const DB_VERSION = 1
const STORE_NAME = 'voiceProfiles'

const getProfileId = (ownerId) => `default:${String(ownerId || 'local')}`

const openDatabase = () => new Promise((resolve, reject) => {
  if (!('indexedDB' in window)) {
    reject(new Error('Local voice storage is not supported in this browser.'))
    return
  }

  const request = window.indexedDB.open(DB_NAME, DB_VERSION)
  request.onupgradeneeded = () => {
    const database = request.result
    if (!database.objectStoreNames.contains(STORE_NAME)) {
      database.createObjectStore(STORE_NAME, { keyPath: 'id' })
    }
  }
  request.onsuccess = () => resolve(request.result)
  request.onerror = () => reject(request.error || new Error('Could not open local voice storage.'))
})

const runTransaction = async (mode, operation) => {
  const database = await openDatabase()
  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, mode)
      const store = transaction.objectStore(STORE_NAME)
      const request = operation(store)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error || new Error('Local voice storage request failed.'))
    })
  } finally {
    database.close()
  }
}

export const saveDefaultVoiceSample = async (file, referenceText, ownerId) => {
  if (!file) throw new Error('A voice sample is required.')

  const profile = {
    id: getProfileId(ownerId),
    audio: file,
    fileName: file.name || 'smartgen-default-voice.webm',
    mimeType: file.type || 'audio/webm',
    size: file.size || 0,
    referenceText: String(referenceText || '').trim(),
    updatedAt: new Date().toISOString()
  }

  await runTransaction('readwrite', (store) => store.put(profile))
  return profile
}

export const getDefaultVoiceSample = async (ownerId) => {
  const profile = await runTransaction('readonly', (store) => store.get(getProfileId(ownerId)))
  if (!profile?.audio) return null

  const file = profile.audio instanceof File
    ? profile.audio
    : new File([profile.audio], profile.fileName, {
      type: profile.mimeType || profile.audio.type || 'audio/webm',
      lastModified: Date.parse(profile.updatedAt) || Date.now()
    })

  return { ...profile, file }
}

export const deleteDefaultVoiceSample = async (ownerId) => {
  await runTransaction('readwrite', (store) => store.delete(getProfileId(ownerId)))
}
