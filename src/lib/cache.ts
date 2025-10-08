/**
 * Système de cache en mémoire pour optimiser les performances
 * Réduit le nombre de requêtes Supabase et améliore la réactivité
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class DataCache {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes par défaut

  /**
   * Récupère une donnée du cache
   * @param key Clé du cache
   * @param ttl Durée de vie en millisecondes (optionnel)
   * @returns Données ou null si expirées/inexistantes
   */
  get<T>(key: string, ttl: number = this.defaultTTL): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      console.log(`❌ Cache MISS: ${key}`);
      return null;
    }
    
    const age = Date.now() - entry.timestamp;
    
    if (age > ttl) {
      this.cache.delete(key);
      console.log(`⏰ Cache EXPIRED: ${key} (age: ${Math.round(age/1000)}s)`);
      return null;
    }
    
    console.log(`✅ Cache HIT: ${key} (age: ${Math.round(age/1000)}s, ttl: ${Math.round(ttl/1000)}s)`);
    return entry.data;
  }

  /**
   * Stocke une donnée dans le cache
   * @param key Clé du cache
   * @param data Données à stocker
   */
  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    console.log(`💾 Cache SET: ${key}`);
  }

  /**
   * Invalide le cache (tout ou selon un pattern)
   * @param pattern Pattern optionnel pour invalider sélectivement
   */
  invalidate(pattern?: string): void {
    if (!pattern) {
      const count = this.cache.size;
      this.cache.clear();
      console.log(`🗑️  Cache cleared (${count} entries)`);
      return;
    }

    let count = 0;
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
        count++;
      }
    }
    
    if (count > 0) {
      console.log(`🗑️  Cache invalidated: ${count} entries matching '${pattern}'`);
    }
  }

  /**
   * Nettoie automatiquement les entrées expirées
   */
  private startAutoCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      let cleanedCount = 0;
      
      for (const [key, entry] of this.cache.entries()) {
        if (now - entry.timestamp > this.defaultTTL) {
          this.cache.delete(key);
          cleanedCount++;
        }
      }
      
      if (cleanedCount > 0) {
        console.log(`🧹 Auto-cleanup: ${cleanedCount} expired entries removed`);
      }
    }, 10 * 60 * 1000); // Toutes les 10 minutes
  }

  /**
   * Retourne les statistiques du cache
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Instance singleton
export const cache = new DataCache();

// Démarrer le nettoyage automatique
if (typeof window !== 'undefined') {
  (cache as any).startAutoCleanup();
}

// Exposer dans window pour debug
if (typeof window !== 'undefined') {
  (window as any).dataCache = cache;
  console.log('💾 Data cache initialized. Use window.dataCache.getStats() to inspect.');
}
