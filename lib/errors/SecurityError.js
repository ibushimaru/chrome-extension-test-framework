/**
 * SecurityError - セキュリティ関連のエラー
 */

const BaseError = require('./BaseError');

class SecurityError extends BaseError {
    constructor(options = {}) {
        super({
            ...options,
            severity: options.severity || 'critical'
        });
        
        // Security-specific properties
        this.vulnerability = options.vulnerability || '';
        this.impact = options.impact || '';
        this.risk = options.risk || 'high'; // critical, high, medium, low
        this.cwe = options.cwe || ''; // Common Weakness Enumeration ID
        this.affectedFiles = options.affectedFiles || [];
    }

    getFormattedMessage() {
        let formatted = `🚨 ${this.name}: ${this.message}\n`;
        formatted += `   Error Code: ${this.code}\n`;
        formatted += `   Risk Level: ${this.risk.toUpperCase()}\n`;
        
        if (this.vulnerability) {
            formatted += `   Vulnerability: ${this.vulnerability}\n`;
        }
        
        if (this.impact) {
            formatted += `   Impact: ${this.impact}\n`;
        }
        
        if (this.cwe) {
            formatted += `   CWE: ${this.cwe}\n`;
        }
        
        if (this.affectedFiles.length > 0) {
            formatted += `   Affected Files:\n`;
            this.affectedFiles.forEach(file => {
                formatted += `      - ${file}\n`;
            });
        }
        
        if (this.details && Object.keys(this.details).length > 0) {
            formatted += `   Details:\n`;
            for (const [key, value] of Object.entries(this.details)) {
                formatted += `      ${key}: ${JSON.stringify(value)}\n`;
            }
        }
        
        if (this.suggestion) {
            formatted += `   🛡️ Security Fix: ${this.suggestion}\n`;
        }
        
        if (this.example) {
            formatted += `   Secure Example:\n`;
            const exampleLines = this.example.split('\n');
            exampleLines.forEach(line => {
                formatted += `      ${line}\n`;
            });
        }
        
        if (this.documentation) {
            formatted += `   📚 Security Docs: ${this.documentation}\n`;
        }
        
        return formatted;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            vulnerability: this.vulnerability,
            impact: this.impact,
            risk: this.risk,
            cwe: this.cwe,
            affectedFiles: this.affectedFiles
        };
    }
}

// Common security error codes
SecurityError.CODES = {
    UNSAFE_EVAL: 'UNSAFE_EVAL',
    UNSAFE_INLINE_SCRIPT: 'UNSAFE_INLINE_SCRIPT',
    UNSAFE_EXTERNAL_SCRIPT: 'UNSAFE_EXTERNAL_SCRIPT',
    MISSING_CSP: 'MISSING_CSP',
    WEAK_CSP: 'WEAK_CSP',
    XSS_VULNERABILITY: 'XSS_VULNERABILITY',
    INJECTION_VULNERABILITY: 'INJECTION_VULNERABILITY',
    INSECURE_COMMUNICATION: 'INSECURE_COMMUNICATION',
    EXCESSIVE_PERMISSIONS: 'EXCESSIVE_PERMISSIONS',
    SENSITIVE_DATA_EXPOSURE: 'SENSITIVE_DATA_EXPOSURE',
    MISSING_INPUT_VALIDATION: 'MISSING_INPUT_VALIDATION',
    INSECURE_STORAGE: 'INSECURE_STORAGE'
};

module.exports = SecurityError;