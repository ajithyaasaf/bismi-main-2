import admin from 'firebase-admin';
import { initializeApp as initializeClientApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

interface FirebaseConfig {
  isAdmin: boolean;
  db: any;
  app: any;
}

class FirebaseManager {
  private static instance: FirebaseManager;
  private config: FirebaseConfig | null = null;
  private initialized = false;

  private constructor() {}

  static getInstance(): FirebaseManager {
    if (!FirebaseManager.instance) {
      FirebaseManager.instance = new FirebaseManager();
    }
    return FirebaseManager.instance;
  }

  async initialize(): Promise<FirebaseConfig> {
    if (this.initialized && this.config) {
      return this.config;
    }

    try {
      // Try Firebase Admin SDK first (for production/server environments)
      const adminConfig = await this.initializeAdminSDK();
      if (adminConfig) {
        this.config = adminConfig;
        this.initialized = true;
        console.log('✅ Firebase Admin SDK initialized successfully');
        return this.config;
      }
    } catch (error) {
      console.warn('⚠️ Firebase Admin SDK initialization failed:', (error as Error).message);
    }

    try {
      // Fallback to Client SDK (for development environments)
      const clientConfig = await this.initializeClientSDK();
      if (clientConfig) {
        this.config = clientConfig;
        this.initialized = true;
        console.log('✅ Firebase Client SDK initialized successfully');
        return this.config;
      }
    } catch (error) {
      console.error('❌ Firebase Client SDK initialization failed:', (error as Error).message);
    }

    // Final fallback - return null config for in-memory storage
    console.warn('⚠️ Firebase unavailable, using in-memory storage');
    this.config = { isAdmin: false, db: null, app: null };
    this.initialized = true;
    return this.config;
  }

  private async initializeAdminSDK(): Promise<FirebaseConfig | null> {
    // Check if Admin SDK is already initialized
    if (admin.apps.length > 0) {
      return {
        isAdmin: true,
        db: admin.firestore(),
        app: admin.apps[0]
      };
    }

    // Try to initialize with service account key
    const serviceAccount = this.getServiceAccountConfig();
    if (serviceAccount) {
      const app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id
      });

      return {
        isAdmin: true,
        db: admin.firestore(),
        app
      };
    }

    // Try to initialize with project ID only (for environments with default credentials)
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
    if (projectId && this.isProductionEnvironment()) {
      try {
        const app = admin.initializeApp({
          projectId
        });

        // Test the connection
        await admin.firestore().listCollections();

        return {
          isAdmin: true,
          db: admin.firestore(),
          app
        };
      } catch (error) {
        console.warn('Admin SDK with default credentials failed:', (error as Error).message);
        return null;
      }
    }

    return null;
  }

  private async initializeClientSDK(): Promise<FirebaseConfig | null> {
    const firebaseConfig = this.getClientConfig();
    if (!firebaseConfig) {
      return null;
    }

    try {
      const app = initializeClientApp(firebaseConfig);
      const db = getFirestore(app);

      // Connect to emulator in development
      if (this.isDevelopmentEnvironment()) {
        try {
          connectFirestoreEmulator(db, 'localhost', 8080);
          console.log('Connected to Firestore emulator');
        } catch (error) {
          // Emulator connection failed, continue with regular connection
          console.log('Firestore emulator not available, using production');
        }
      }

      return {
        isAdmin: false,
        db,
        app
      };
    } catch (error) {
      console.error('Client SDK initialization failed:', error);
      return null;
    }
  }

  private getServiceAccountConfig(): any {
    try {
      // Try to get from environment variable
      const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
      if (serviceAccountJson) {
        return JSON.parse(serviceAccountJson);
      }

      // Try to get individual fields
      const privateKey = process.env.FIREBASE_PRIVATE_KEY;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const projectId = process.env.FIREBASE_PROJECT_ID;

      if (privateKey && clientEmail && projectId) {
        return {
          type: "service_account",
          project_id: projectId,
          private_key: privateKey.replace(/\\n/g, '\n'),
          client_email: clientEmail,
        };
      }

      return null;
    } catch (error) {
      console.warn('Failed to parse service account configuration:', error);
      return null;
    }
  }

  private getClientConfig(): any {
    const requiredKeys = [
      'VITE_FIREBASE_API_KEY',
      'VITE_FIREBASE_PROJECT_ID',
      'VITE_FIREBASE_AUTH_DOMAIN'
    ];

    const hasRequiredKeys = requiredKeys.every(key => process.env[key]);
    if (!hasRequiredKeys) {
      return null;
    }

    return {
      apiKey: process.env.VITE_FIREBASE_API_KEY,
      authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
      databaseURL: process.env.VITE_FIREBASE_DATABASE_URL,
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.VITE_FIREBASE_APP_ID
    };
  }

  private isDevelopmentEnvironment(): boolean {
    return process.env.NODE_ENV === 'development' || 
           process.env.REPL_ID !== undefined ||
           process.env.CODESPACE_NAME !== undefined;
  }

  private isProductionEnvironment(): boolean {
    return process.env.NODE_ENV === 'production' ||
           process.env.VERCEL !== undefined ||
           process.env.GOOGLE_CLOUD_PROJECT !== undefined;
  }

  getConfig(): FirebaseConfig | null {
    return this.config;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  async healthCheck(): Promise<boolean> {
    if (!this.config || !this.config.db) {
      return false;
    }

    try {
      if (this.config.isAdmin) {
        await admin.firestore().listCollections();
      } else {
        // For client SDK, try a simple operation
        await this.config.db.collection('_health_check').limit(1).get();
      }
      return true;
    } catch (error) {
      console.warn('Firebase health check failed:', error);
      return false;
    }
  }
}

export const firebaseManager = FirebaseManager.getInstance();
export default firebaseManager;