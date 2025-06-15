/**
 * StructureError - ファイル構造やディレクトリ構成のエラー
 */

const BaseError = require('./BaseError');

class StructureError extends BaseError {
    constructor(options = {}) {
        super({
            ...options,
            severity: options.severity || 'medium'
        });
        
        // Structure-specific properties
        this.path = options.path || '';
        this.expectedStructure = options.expectedStructure || '';
        this.actualStructure = options.actualStructure || '';
        this.missingItems = options.missingItems || [];
        this.unexpectedItems = options.unexpectedItems || [];
        this.recommendations = options.recommendations || [];
    }

    getFormattedMessage() {
        let formatted = super.getFormattedMessage();
        
        if (this.path) {
            formatted = formatted.replace('Error Code:', `Path: ${this.path}\n   Error Code:`);
        }
        
        if (this.missingItems.length > 0) {
            formatted += `   Missing Items:\n`;
            this.missingItems.forEach(item => {
                formatted += `      ❌ ${item}\n`;
            });
        }
        
        if (this.unexpectedItems.length > 0) {
            formatted += `   Unexpected Items:\n`;
            this.unexpectedItems.forEach(item => {
                formatted += `      ⚠️  ${item}\n`;
            });
        }
        
        if (this.recommendations.length > 0) {
            formatted += `   Recommendations:\n`;
            this.recommendations.forEach(rec => {
                formatted += `      💡 ${rec}\n`;
            });
        }
        
        return formatted;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            path: this.path,
            expectedStructure: this.expectedStructure,
            actualStructure: this.actualStructure,
            missingItems: this.missingItems,
            unexpectedItems: this.unexpectedItems,
            recommendations: this.recommendations
        };
    }
}

// Common structure error codes
StructureError.CODES = {
    MISSING_REQUIRED_FILE: 'MISSING_REQUIRED_FILE',
    MISSING_REQUIRED_DIR: 'MISSING_REQUIRED_DIR',
    INVALID_FILE_NAME: 'INVALID_FILE_NAME',
    INVALID_DIR_NAME: 'INVALID_DIR_NAME',
    INCORRECT_FILE_LOCATION: 'INCORRECT_FILE_LOCATION',
    DISORGANIZED_STRUCTURE: 'DISORGANIZED_STRUCTURE',
    DEVELOPMENT_FILES_PRESENT: 'DEVELOPMENT_FILES_PRESENT',
    MISSING_DOCUMENTATION: 'MISSING_DOCUMENTATION',
    DUPLICATE_FILES: 'DUPLICATE_FILES',
    INCONSISTENT_NAMING: 'INCONSISTENT_NAMING'
};

module.exports = StructureError;