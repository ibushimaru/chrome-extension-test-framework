/**
 * PerformanceError - パフォーマンス関連のエラー
 */

const BaseError = require('./BaseError');

class PerformanceError extends BaseError {
    constructor(options = {}) {
        super({
            ...options,
            severity: options.severity || 'medium'
        });
        
        // Performance-specific properties
        this.metric = options.metric || '';
        this.threshold = options.threshold;
        this.actualValue = options.actualValue;
        this.impact = options.impact || '';
        this.optimizationTips = options.optimizationTips || [];
        this.affectedResources = options.affectedResources || [];
    }

    getFormattedMessage() {
        let formatted = super.getFormattedMessage();
        
        if (this.metric) {
            formatted = formatted.replace('Error Code:', `Metric: ${this.metric}\n   Error Code:`);
        }
        
        if (this.threshold !== undefined && this.actualValue !== undefined) {
            formatted += `   Performance Issue:\n`;
            formatted += `      Threshold: ${this.formatValue(this.threshold)}\n`;
            formatted += `      Actual: ${this.formatValue(this.actualValue)}\n`;
            const percentage = ((this.actualValue - this.threshold) / this.threshold * 100).toFixed(1);
            formatted += `      Exceeded by: ${percentage}%\n`;
        }
        
        if (this.impact) {
            formatted += `   Impact: ${this.impact}\n`;
        }
        
        if (this.affectedResources.length > 0) {
            formatted += `   Affected Resources:\n`;
            this.affectedResources.forEach(resource => {
                formatted += `      📁 ${resource}\n`;
            });
        }
        
        if (this.optimizationTips.length > 0) {
            formatted += `   Optimization Tips:\n`;
            this.optimizationTips.forEach((tip, index) => {
                formatted += `      ${index + 1}. ${tip}\n`;
            });
        }
        
        return formatted;
    }

    formatValue(value) {
        if (typeof value === 'number') {
            // Format file sizes
            if (this.metric.toLowerCase().includes('size')) {
                if (value > 1024 * 1024) {
                    return `${(value / (1024 * 1024)).toFixed(2)} MB`;
                } else if (value > 1024) {
                    return `${(value / 1024).toFixed(2)} KB`;
                } else {
                    return `${value} bytes`;
                }
            }
            // Format time
            if (this.metric.toLowerCase().includes('time')) {
                if (value > 1000) {
                    return `${(value / 1000).toFixed(2)}s`;
                } else {
                    return `${value}ms`;
                }
            }
        }
        return String(value);
    }

    toJSON() {
        return {
            ...super.toJSON(),
            metric: this.metric,
            threshold: this.threshold,
            actualValue: this.actualValue,
            impact: this.impact,
            optimizationTips: this.optimizationTips,
            affectedResources: this.affectedResources
        };
    }
}

// Common performance error codes
PerformanceError.CODES = {
    FILE_SIZE_EXCEEDED: 'FILE_SIZE_EXCEEDED',
    BUNDLE_SIZE_EXCEEDED: 'BUNDLE_SIZE_EXCEEDED',
    IMAGE_NOT_OPTIMIZED: 'IMAGE_NOT_OPTIMIZED',
    LOADING_TIME_EXCEEDED: 'LOADING_TIME_EXCEEDED',
    MEMORY_LEAK_DETECTED: 'MEMORY_LEAK_DETECTED',
    INEFFICIENT_ALGORITHM: 'INEFFICIENT_ALGORITHM',
    EXCESSIVE_DOM_MANIPULATION: 'EXCESSIVE_DOM_MANIPULATION',
    UNMINIFIED_CODE: 'UNMINIFIED_CODE',
    MISSING_LAZY_LOADING: 'MISSING_LAZY_LOADING',
    RENDER_BLOCKING_RESOURCES: 'RENDER_BLOCKING_RESOURCES'
};

module.exports = PerformanceError;