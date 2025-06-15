export class ApiHandler {
    constructor() {
        this.initialized = false;
    }
    
    async initialize() {
        // Initialization logic
        this.initialized = true;
    }
}

export async function initializeApiHandler() {
    const instance = new ApiHandler();
    await instance.initialize();
    return instance;
}