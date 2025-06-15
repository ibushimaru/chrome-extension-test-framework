export class TabManager {
    constructor() {
        this.initialized = false;
    }
    
    async initialize() {
        // Initialization logic
        this.initialized = true;
    }
}

export async function initializeTabManager() {
    const instance = new TabManager();
    await instance.initialize();
    return instance;
}