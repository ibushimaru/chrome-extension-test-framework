export class AlarmManager {
    constructor() {
        this.initialized = false;
    }
    
    async initialize() {
        // Initialization logic
        this.initialized = true;
    }
}

export async function initializeAlarmManager() {
    const instance = new AlarmManager();
    await instance.initialize();
    return instance;
}