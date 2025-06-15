export class ContextMenu {
    constructor() {
        this.initialized = false;
    }
    
    async initialize() {
        // Initialization logic
        this.initialized = true;
    }
}

export async function initializeContextMenu() {
    const instance = new ContextMenu();
    await instance.initialize();
    return instance;
}