export class Logger {
    constructor(context) {
        this.context = context;
        this.enabled = true;
    }
    
    info(...args) {
        if (this.enabled) {
            console.log(`[${this.context}]`, ...args);
        }
    }
    
    debug(...args) {
        if (this.enabled && this.debugMode) {
            console.debug(`[${this.context}]`, ...args);
        }
    }
    
    error(...args) {
        console.error(`[${this.context}]`, ...args);
    }
}