import { IStorage } from './storage';
import { MemStorage } from './storage';
import { enterpriseStorage } from './enterprise-storage';

interface StorageConfig {
  primary: IStorage;
  fallback: IStorage;
  healthChecker: () => Promise<boolean>;
}

class StorageManager {
  private static instance: StorageManager;
  private config: StorageConfig | null = null;
  private currentStorage: IStorage | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private readonly HEALTH_CHECK_INTERVAL = 30000; // 30 seconds

  private constructor() {}

  static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  async initialize(): Promise<IStorage> {
    if (this.currentStorage) {
      return this.currentStorage;
    }

    try {
      // Use enterprise storage which handles Firebase gracefully
      this.currentStorage = enterpriseStorage;
      
      const fallbackStorage = new MemStorage();
      
      this.config = {
        primary: this.currentStorage,
        fallback: fallbackStorage,
        healthChecker: async () => true // Enterprise storage handles its own fallbacks
      };

      console.log(`Enterprise storage initialized: ${enterpriseStorage.getStorageType()}`);
      return this.currentStorage;

    } catch (error) {
      console.error('Storage initialization failed, using fallback:', error);
      this.currentStorage = new MemStorage();
      return this.currentStorage;
    }
  }

  private startHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      if (!this.config) return;

      try {
        const isHealthy = await this.config.healthChecker();
        const shouldUsePrimary = isHealthy;
        const isUsingPrimary = this.currentStorage === this.config.primary;

        if (shouldUsePrimary && !isUsingPrimary) {
          console.log('Switching to primary storage (health restored)');
          this.currentStorage = this.config.primary;
        } else if (!shouldUsePrimary && isUsingPrimary) {
          console.log('Switching to fallback storage (health issue detected)');
          this.currentStorage = this.config.fallback;
        }
      } catch (error) {
        console.warn('Health check failed:', error);
        if (this.config && this.currentStorage === this.config.primary) {
          console.log('Switching to fallback storage due to error');
          this.currentStorage = this.config.fallback;
        }
      }
    }, this.HEALTH_CHECK_INTERVAL);
  }

  getStorage(): IStorage {
    if (!this.currentStorage) {
      throw new Error('Storage not initialized. Call initialize() first.');
    }
    return this.currentStorage;
  }

  async switchToFallback(): Promise<void> {
    if (this.config) {
      console.log('Manually switching to fallback storage');
      this.currentStorage = this.config.fallback;
    }
  }

  async switchToPrimary(): Promise<void> {
    if (this.config) {
      const isHealthy = await this.config.healthChecker();
      if (isHealthy) {
        console.log('Manually switching to primary storage');
        this.currentStorage = this.config.primary;
      } else {
        throw new Error('Primary storage is not healthy');
      }
    }
  }

  isUsingPrimaryStorage(): boolean {
    return this.config ? this.currentStorage === this.config.primary : false;
  }

  async getStorageStatus(): Promise<{
    current: 'primary' | 'fallback';
    primaryHealthy: boolean;
    fallbackHealthy: boolean;
  }> {
    if (!this.config) {
      return {
        current: 'fallback',
        primaryHealthy: false,
        fallbackHealthy: true
      };
    }

    const primaryHealthy = await this.config.healthChecker();
    const current = this.currentStorage === this.config.primary ? 'primary' : 'fallback';

    return {
      current,
      primaryHealthy,
      fallbackHealthy: true // Memory storage is always healthy
    };
  }

  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    this.currentStorage = null;
    this.config = null;
  }
}

export const storageManager = StorageManager.getInstance();
export default storageManager;