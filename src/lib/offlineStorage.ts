/**
 * IndexedDB Offline Persistence & Storage Engine
 * Provides structured offline caching, client draft preservation, 
 * offline mutation queue, and storage quota diagnostics.
 */

const DB_NAME = 'caoms_offline_vault_v1';
const DB_VERSION = 1;

export interface OfflineAction {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
  retryCount: number;
  status: 'pending' | 'syncing' | 'failed';
}

export interface CachedItem<T = any> {
  key: string;
  value: T;
  timestamp: number;
  expiresAt?: number;
}

export interface OfflineDraft {
  id: string;
  category: 'engagement_letter' | 'sop' | 'task_note' | 'compliance_filing';
  title: string;
  content: any;
  updatedAt: number;
}

class OfflineStorageEngine {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB is not supported in this environment.'));
        return;
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // General key-value cache store with index on expiresAt
        if (!db.objectStoreNames.contains('app_cache')) {
          const cacheStore = db.createObjectStore('app_cache', { keyPath: 'key' });
          cacheStore.createIndex('expiresAt', 'expiresAt', { unique: false });
        }

        // Offline mutation queue
        if (!db.objectStoreNames.contains('offline_queue')) {
          const queueStore = db.createObjectStore('offline_queue', { keyPath: 'id' });
          queueStore.createIndex('timestamp', 'timestamp', { unique: false });
          queueStore.createIndex('status', 'status', { unique: false });
        }

        // Offline drafts store
        if (!db.objectStoreNames.contains('offline_drafts')) {
          const draftsStore = db.createObjectStore('offline_drafts', { keyPath: 'id' });
          draftsStore.createIndex('category', 'category', { unique: false });
          draftsStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  // --- App Cache Operations ---

  async setCache<T = any>(key: string, value: T, ttlMs?: number): Promise<void> {
    try {
      const db = await this.getDB();
      const item: CachedItem<T> = {
        key,
        value,
        timestamp: Date.now(),
        expiresAt: ttlMs ? Date.now() + ttlMs : undefined,
      };

      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('app_cache', 'readwrite');
        const store = tx.objectStore('app_cache');
        const req = store.put(item);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('Offline cache set failed:', err);
    }
  }

  async getCache<T = any>(key: string): Promise<T | null> {
    try {
      const db = await this.getDB();
      return await new Promise<T | null>((resolve, reject) => {
        const tx = db.transaction('app_cache', 'readonly');
        const store = tx.objectStore('app_cache');
        const req = store.get(key);
        req.onsuccess = () => {
          const item: CachedItem<T> | undefined = req.result;
          if (!item) {
            resolve(null);
            return;
          }
          if (item.expiresAt && item.expiresAt < Date.now()) {
            // Expired: prune in background
            this.deleteCache(key);
            resolve(null);
            return;
          }
          resolve(item.value);
        };
        req.onerror = () => reject(req.error);
      });
    } catch {
      return null;
    }
  }

  async deleteCache(key: string): Promise<void> {
    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('app_cache', 'readwrite');
        const store = tx.objectStore('app_cache');
        const req = store.delete(key);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('Offline cache delete failed:', err);
    }
  }

  // --- Offline Mutation Queue Operations ---

  async enqueueAction(type: string, payload: any): Promise<string> {
    const id = `act_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const action: OfflineAction = {
      id,
      type,
      payload,
      timestamp: Date.now(),
      retryCount: 0,
      status: 'pending',
    };

    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('offline_queue', 'readwrite');
        const store = tx.objectStore('offline_queue');
        const req = store.put(action);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.error('Failed to enqueue offline action:', err);
    }
    return id;
  }

  async getPendingActions(): Promise<OfflineAction[]> {
    try {
      const db = await this.getDB();
      return await new Promise<OfflineAction[]>((resolve, reject) => {
        const tx = db.transaction('offline_queue', 'readonly');
        const store = tx.objectStore('offline_queue');
        const req = store.getAll();
        req.onsuccess = () => {
          const list: OfflineAction[] = req.result || [];
          resolve(list.sort((a, b) => a.timestamp - b.timestamp));
        };
        req.onerror = () => reject(req.error);
      });
    } catch {
      return [];
    }
  }

  async removeAction(id: string): Promise<void> {
    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('offline_queue', 'readwrite');
        const store = tx.objectStore('offline_queue');
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('Failed to remove offline action:', err);
    }
  }

  // --- Offline Drafts Operations ---

  async saveDraft(draft: OfflineDraft): Promise<void> {
    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('offline_drafts', 'readwrite');
        const store = tx.objectStore('offline_drafts');
        const req = store.put({ ...draft, updatedAt: Date.now() });
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('Failed to save offline draft:', err);
    }
  }

  async getDraft(id: string): Promise<OfflineDraft | null> {
    try {
      const db = await this.getDB();
      return await new Promise<OfflineDraft | null>((resolve, reject) => {
        const tx = db.transaction('offline_drafts', 'readonly');
        const store = tx.objectStore('offline_drafts');
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return null;
    }
  }

  async getAllDrafts(): Promise<OfflineDraft[]> {
    try {
      const db = await this.getDB();
      return await new Promise<OfflineDraft[]>((resolve, reject) => {
        const tx = db.transaction('offline_drafts', 'readonly');
        const store = tx.objectStore('offline_drafts');
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return [];
    }
  }

  async deleteDraft(id: string): Promise<void> {
    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('offline_drafts', 'readwrite');
        const store = tx.objectStore('offline_drafts');
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('Failed to delete offline draft:', err);
    }
  }

  // --- Storage Diagnostics ---

  async getDiagnostics(): Promise<{
    quota: number;
    usage: number;
    usagePercent: number;
    pendingQueueCount: number;
    cachedItemsCount: number;
    draftsCount: number;
    isSupported: boolean;
  }> {
    let quota = 0;
    let usage = 0;
    let usagePercent = 0;

    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        quota = estimate.quota || 0;
        usage = estimate.usage || 0;
        usagePercent = quota > 0 ? Math.round((usage / quota) * 100) : 0;
      } catch (e) {
        console.warn('Storage estimate unavailable', e);
      }
    }

    let pendingQueueCount = 0;
    let cachedItemsCount = 0;
    let draftsCount = 0;

    try {
      const db = await this.getDB();
      pendingQueueCount = await this.countStore(db, 'offline_queue');
      cachedItemsCount = await this.countStore(db, 'app_cache');
      draftsCount = await this.countStore(db, 'offline_drafts');
    } catch {
      // Ignored if DB cannot open
    }

    return {
      quota,
      usage,
      usagePercent,
      pendingQueueCount,
      cachedItemsCount,
      draftsCount,
      isSupported: typeof window !== 'undefined' && !!window.indexedDB,
    };
  }

  private countStore(db: IDBDatabase, storeName: string): Promise<number> {
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.count();
        req.onsuccess = () => resolve(req.result || 0);
        req.onerror = () => resolve(0);
      } catch {
        resolve(0);
      }
    });
  }
}

export const offlineStorage = new OfflineStorageEngine();
