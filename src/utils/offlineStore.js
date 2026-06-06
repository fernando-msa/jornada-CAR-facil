/**
 * Offline Store Utility using IndexedDB
 * Handles local draft storage and synchronization for Seu Raimundo's offline field data.
 */

const DB_NAME = 'JornadaCarFacilDB';
const STORE_NAME = 'car_drafts';
const DB_VERSION = 1;

/**
 * Open or initialize the database
 */
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = event => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'cpf' });
      }
    };

    request.onsuccess = event => {
      resolve(event.target.result);
    };

    request.onerror = event => {
      reject('IndexedDB failed to open: ' + event.target.error);
    };
  });
}

/**
 * Save draft data locally
 * @param {string} cpf - Key identifier
 * @param {Object} data - Form data and geospatial polygons
 */
export async function saveLocalDraft(cpf, data) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const record = { cpf, data, lastUpdated: new Date().toISOString() };
      
      const request = store.put(record);

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('IndexedDB save error:', error);
    // Fallback to localStorage if IndexedDB is blocked
    localStorage.setItem(`car_draft_${cpf}`, JSON.stringify(data));
    return true;
  }
}

/**
 * Load draft data locally
 * @param {string} cpf
 */
export async function getLocalDraft(cpf) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(cpf);

      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result.data);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('IndexedDB load error, trying localStorage:', error);
    const localData = localStorage.getItem(`car_draft_${cpf}`);
    return localData ? JSON.parse(localData) : null;
  }
}

/**
 * Lists all unsynced local drafts
 */
export async function getAllLocalDrafts() {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    return [];
  }
}

/**
 * Remove local draft after successful online synchronization
 * @param {string} cpf 
 */
export async function clearLocalDraft(cpf) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(cpf);

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    localStorage.removeItem(`car_draft_${cpf}`);
    return true;
  }
}
