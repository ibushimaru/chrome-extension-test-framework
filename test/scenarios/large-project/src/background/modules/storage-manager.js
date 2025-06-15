export class StorageManager {
    constructor() {
        this.initialized = false;
    }
    
    async initialize() {
        // Initialization logic
        this.initialized = true;
    }
}

export async function initializeStorageManager() {
    const instance = new StorageManager();
    await instance.initialize();
    return instance;
}