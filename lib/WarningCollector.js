/**
 * WarningCollector - 警告メッセージの収集と管理
 */

class WarningCollector {
    constructor() {
        this.warnings = [];
        this.originalWarn = console.warn;
        this.isCapturing = false;
    }

    /**
     * 警告の収集を開始
     */
    startCapture() {
        if (this.isCapturing) return;
        
        this.isCapturing = true;
        this.warnings = [];
        
        // console.warnをインターセプト
        console.warn = (...args) => {
            // 警告メッセージを収集
            const message = args.map(arg => 
                typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
            ).join(' ');
            
            // 警告アイコンを除去してクリーンなメッセージを保存
            const cleanMessage = message.replace(/^\s*⚠️\s*/, '').trim();
            if (cleanMessage) {
                this.warnings.push(cleanMessage);
            }
            
            // 元のconsole.warnも呼び出す（quietモードでない限り）
            // 重複を避けるため、quietモードでは出力しない
            if (!global.__QUIET_MODE__) {
                this.originalWarn.apply(console, args);
            }
        };
    }

    /**
     * 警告の収集を停止
     */
    stopCapture() {
        if (!this.isCapturing) return;
        
        this.isCapturing = false;
        console.warn = this.originalWarn;
    }

    /**
     * 収集した警告を取得
     */
    getWarnings() {
        return [...this.warnings];
    }

    /**
     * 警告をクリア
     */
    clear() {
        this.warnings = [];
    }
}

module.exports = WarningCollector;