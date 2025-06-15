/**
 * ValidationError - 検証エラー（manifest.json、設定ファイルなど）
 */

const BaseError = require('./BaseError');

class ValidationError extends BaseError {
    constructor(options = {}) {
        super({
            ...options,
            severity: options.severity || 'high'
        });
        
        // Validation-specific properties
        this.field = options.field || '';
        this.expected = options.expected;
        this.actual = options.actual;
        this.validationRule = options.validationRule || '';
    }

    getFormattedMessage() {
        let formatted = super.getFormattedMessage();
        
        if (this.field) {
            formatted = formatted.replace('Details:', `Field: ${this.field}\n   Details:`);
        }
        
        if (this.expected !== undefined && this.actual !== undefined) {
            formatted = formatted.replace('Details:', 
                `Expected: ${JSON.stringify(this.expected)}\n   Actual: ${JSON.stringify(this.actual)}\n   Details:`);
        }
        
        return formatted;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            field: this.field,
            expected: this.expected,
            actual: this.actual,
            validationRule: this.validationRule
        };
    }
}

// Common validation error codes
ValidationError.CODES = {
    MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
    INVALID_FORMAT: 'INVALID_FORMAT',
    INVALID_TYPE: 'INVALID_TYPE',
    INVALID_VALUE: 'INVALID_VALUE',
    INVALID_LENGTH: 'INVALID_LENGTH',
    INVALID_PATTERN: 'INVALID_PATTERN',
    INVALID_VERSION: 'INVALID_VERSION',
    MISSING_DEPENDENCY: 'MISSING_DEPENDENCY',
    CIRCULAR_DEPENDENCY: 'CIRCULAR_DEPENDENCY',
    DEPRECATED_FIELD: 'DEPRECATED_FIELD'
};

module.exports = ValidationError;