/**
 * BaseError - カスタムエラーの基底クラス
 */

class BaseError extends Error {
    constructor(options = {}) {
        const message = options.message || 'An error occurred';
        super(message);
        
        this.name = this.constructor.name;
        this.code = options.code || 'UNKNOWN_ERROR';
        this.severity = options.severity || 'medium'; // critical, high, medium, low
        this.details = options.details || {};
        this.suggestion = options.suggestion || '';
        this.example = options.example || '';
        this.documentation = options.documentation || '';
        this.timestamp = new Date().toISOString();
        
        // スタックトレースを維持
        Error.captureStackTrace(this, this.constructor);
    }

    /**
     * エラーの詳細情報を取得
     */
    getDetails() {
        return {
            name: this.name,
            code: this.code,
            message: this.message,
            severity: this.severity,
            details: this.details,
            suggestion: this.suggestion,
            example: this.example,
            documentation: this.documentation,
            timestamp: this.timestamp,
            stack: this.stack
        };
    }

    /**
     * フォーマットされたエラーメッセージを取得
     */
    getFormattedMessage() {
        let formatted = `❌ ${this.name}: ${this.message}\n`;
        formatted += `   Error Code: ${this.code}\n`;
        
        if (this.details && Object.keys(this.details).length > 0) {
            formatted += `   Details:\n`;
            for (const [key, value] of Object.entries(this.details)) {
                formatted += `      ${key}: ${JSON.stringify(value)}\n`;
            }
        }
        
        if (this.suggestion) {
            formatted += `   💡 Suggestion: ${this.suggestion}\n`;
        }
        
        if (this.example) {
            formatted += `   Example:\n`;
            const exampleLines = this.example.split('\n');
            exampleLines.forEach(line => {
                formatted += `      ${line}\n`;
            });
        }
        
        if (this.documentation) {
            formatted += `   📚 Documentation: ${this.documentation}\n`;
        }
        
        return formatted;
    }

    /**
     * JSON形式でエラー情報を出力
     */
    toJSON() {
        return {
            name: this.name,
            code: this.code,
            message: this.message,
            severity: this.severity,
            details: this.details,
            suggestion: this.suggestion,
            example: this.example,
            documentation: this.documentation,
            timestamp: this.timestamp
        };
    }

    /**
     * 重要度に応じたアイコンを取得
     */
    getSeverityIcon() {
        const icons = {
            critical: '🚨',
            high: '❗',
            medium: '⚠️',
            low: 'ℹ️'
        };
        return icons[this.severity] || '❓';
    }

    /**
     * 重要度に応じた色コードを取得（ANSI）
     */
    getSeverityColor() {
        const colors = {
            critical: '\x1b[31m', // Red
            high: '\x1b[33m',     // Yellow
            medium: '\x1b[36m',   // Cyan
            low: '\x1b[37m'       // White
        };
        return colors[this.severity] || '\x1b[0m';
    }
}

module.exports = BaseError;