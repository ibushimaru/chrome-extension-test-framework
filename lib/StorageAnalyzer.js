/**
 * StorageAnalyzer - Chrome拡張機能のストレージ使用パターンを分析
 * localStorageの使用検出とchrome.storage APIへの移行推奨
 */

const fs = require('fs');
const path = require('path');

class StorageAnalyzer {
    constructor(config = {}) {
        this.config = config;
        this.issues = [];
        this.storageUsage = {
            localStorage: [],
            sessionStorage: [],
            chromeStorageLocal: [],
            chromeStorageSync: [],
            chromeStorageSession: []
        };
    }

    /**
     * ストレージ使用パターンを分析
     */
    async analyze(extensionPath) {
        this.issues = [];
        this.storageUsage = {
            localStorage: [],
            sessionStorage: [],
            chromeStorageLocal: [],
            chromeStorageSync: [],
            chromeStorageSession: []
        };

        // JavaScriptファイルを検索
        const jsFiles = this.findJavaScriptFiles(extensionPath);
        
        for (const file of jsFiles) {
            await this.analyzeFile(file, extensionPath);
        }

        return {
            issues: this.issues,
            usage: this.storageUsage,
            summary: this.generateSummary()
        };
    }

    /**
     * JavaScriptファイルを検索
     */
    findJavaScriptFiles(extensionPath) {
        const files = [];
        
        function traverse(dir) {
            const items = fs.readdirSync(dir);
            
            for (const item of items) {
                const itemPath = path.join(dir, item);
                const stat = fs.statSync(itemPath);
                
                if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
                    traverse(itemPath);
                } else if (stat.isFile() && (item.endsWith('.js') || item.endsWith('.ts'))) {
                    files.push(itemPath);
                }
            }
        }
        
        traverse(extensionPath);
        return files;
    }

    /**
     * ファイルを分析
     */
    async analyzeFile(filePath, extensionPath) {
        const content = fs.readFileSync(filePath, 'utf8');
        const relativePath = path.relative(extensionPath, filePath);
        
        // localStorageの使用検出
        this.detectLocalStorage(content, relativePath);
        
        // sessionStorageの使用検出
        this.detectSessionStorage(content, relativePath);
        
        // chrome.storage APIの使用検出
        this.detectChromeStorage(content, relativePath);
        
        // ストレージサイズの問題検出
        this.detectStorageSizeIssues(content, relativePath);
    }

    /**
     * localStorageの使用を検出
     */
    detectLocalStorage(content, filePath) {
        const patterns = [
            /localStorage\.setItem\s*\(/g,
            /localStorage\.getItem\s*\(/g,
            /localStorage\.removeItem\s*\(/g,
            /localStorage\.clear\s*\(/g,
            /localStorage\[['"`][\w-]+['"`]\]/g,
            /window\.localStorage/g
        ];

        const matches = [];
        patterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                const line = content.substring(0, match.index).split('\n').length;
                matches.push({
                    line,
                    code: match[0]
                });
            }
        });

        if (matches.length > 0) {
            this.storageUsage.localStorage.push({
                file: filePath,
                occurrences: matches.length,
                locations: matches
            });

            this.issues.push({
                type: 'DEPRECATED_STORAGE',
                severity: 'warning',
                file: filePath,
                message: `localStorage is deprecated in extensions. Use chrome.storage.local instead`,
                occurrences: matches.length,
                suggestion: 'Migrate to chrome.storage.local for better performance and cross-device sync capability'
            });
        }
    }

    /**
     * sessionStorageの使用を検出
     */
    detectSessionStorage(content, filePath) {
        const patterns = [
            /sessionStorage\.setItem\s*\(/g,
            /sessionStorage\.getItem\s*\(/g,
            /sessionStorage\.removeItem\s*\(/g,
            /sessionStorage\.clear\s*\(/g,
            /sessionStorage\[['"`][\w-]+['"`]\]/g
        ];

        const matches = [];
        patterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                const line = content.substring(0, match.index).split('\n').length;
                matches.push({
                    line,
                    code: match[0]
                });
            }
        });

        if (matches.length > 0) {
            this.storageUsage.sessionStorage.push({
                file: filePath,
                occurrences: matches.length,
                locations: matches
            });

            this.issues.push({
                type: 'DEPRECATED_STORAGE',
                severity: 'warning',
                file: filePath,
                message: `sessionStorage is deprecated in extensions. Use chrome.storage.session instead`,
                occurrences: matches.length,
                suggestion: 'Migrate to chrome.storage.session for tab-specific storage'
            });
        }
    }

    /**
     * chrome.storage APIの使用を検出
     */
    detectChromeStorage(content, filePath) {
        // chrome.storage.local
        const localPatterns = [
            /chrome\.storage\.local\.set\s*\(/g,
            /chrome\.storage\.local\.get\s*\(/g,
            /chrome\.storage\.local\.remove\s*\(/g,
            /chrome\.storage\.local\.clear\s*\(/g
        ];

        let localMatches = 0;
        localPatterns.forEach(pattern => {
            const matches = content.match(pattern);
            if (matches) localMatches += matches.length;
        });

        if (localMatches > 0) {
            this.storageUsage.chromeStorageLocal.push({
                file: filePath,
                occurrences: localMatches
            });
        }

        // chrome.storage.sync
        const syncPatterns = [
            /chrome\.storage\.sync\.set\s*\(/g,
            /chrome\.storage\.sync\.get\s*\(/g,
            /chrome\.storage\.sync\.remove\s*\(/g,
            /chrome\.storage\.sync\.clear\s*\(/g
        ];

        let syncMatches = 0;
        syncPatterns.forEach(pattern => {
            const matches = content.match(pattern);
            if (matches) syncMatches += matches.length;
        });

        if (syncMatches > 0) {
            this.storageUsage.chromeStorageSync.push({
                file: filePath,
                occurrences: syncMatches
            });
        }

        // chrome.storage.session
        const sessionPatterns = [
            /chrome\.storage\.session\.set\s*\(/g,
            /chrome\.storage\.session\.get\s*\(/g,
            /chrome\.storage\.session\.remove\s*\(/g,
            /chrome\.storage\.session\.clear\s*\(/g
        ];

        let sessionMatches = 0;
        sessionPatterns.forEach(pattern => {
            const matches = content.match(pattern);
            if (matches) sessionMatches += matches.length;
        });

        if (sessionMatches > 0) {
            this.storageUsage.chromeStorageSession.push({
                file: filePath,
                occurrences: sessionMatches
            });
        }
    }

    /**
     * ストレージサイズの問題を検出
     */
    detectStorageSizeIssues(content, filePath) {
        // 大きなデータを保存しようとしているパターンを検出
        const patterns = [
            {
                pattern: /chrome\.storage\.sync\.set\s*\(\s*\{[^}]{1000,}/g,
                message: 'Large data in chrome.storage.sync detected. Sync storage has strict size limits',
                suggestion: 'Use chrome.storage.local for large data. Sync storage is limited to 8KB per item'
            },
            {
                pattern: /JSON\.stringify\s*\([^)]+\)\.length\s*>\s*8192/g,
                message: 'Checking for 8KB limit suggests large data storage',
                suggestion: 'Consider chunking large data or using chrome.storage.local'
            }
        ];

        patterns.forEach(({ pattern, message, suggestion }) => {
            if (pattern.test(content)) {
                this.issues.push({
                    type: 'STORAGE_SIZE_WARNING',
                    severity: 'warning',
                    file: filePath,
                    message,
                    suggestion
                });
            }
        });

        // chrome.storage.sync の制限に関する警告
        if (content.includes('chrome.storage.sync')) {
            const quotaChecks = [
                /QUOTA_BYTES_PER_ITEM/,
                /QUOTA_BYTES/,
                /MAX_ITEMS/
            ];

            const hasQuotaCheck = quotaChecks.some(check => check.test(content));
            
            if (!hasQuotaCheck) {
                this.issues.push({
                    type: 'MISSING_QUOTA_CHECK',
                    severity: 'info',
                    file: filePath,
                    message: 'chrome.storage.sync usage detected without quota checks',
                    suggestion: 'Consider implementing quota checks. Sync storage limits: 8KB/item, 100KB total, 512 items max'
                });
            }
        }
    }

    /**
     * サマリーを生成
     */
    generateSummary() {
        const totalLocalStorage = this.storageUsage.localStorage.reduce((sum, item) => sum + item.occurrences, 0);
        const totalSessionStorage = this.storageUsage.sessionStorage.reduce((sum, item) => sum + item.occurrences, 0);
        const totalChromeStorage = 
            this.storageUsage.chromeStorageLocal.reduce((sum, item) => sum + item.occurrences, 0) +
            this.storageUsage.chromeStorageSync.reduce((sum, item) => sum + item.occurrences, 0) +
            this.storageUsage.chromeStorageSession.reduce((sum, item) => sum + item.occurrences, 0);

        return {
            deprecatedStorageUsage: totalLocalStorage + totalSessionStorage,
            chromeStorageUsage: totalChromeStorage,
            migrationNeeded: totalLocalStorage + totalSessionStorage > 0,
            recommendations: this.generateRecommendations()
        };
    }

    /**
     * 推奨事項を生成
     */
    generateRecommendations() {
        const recommendations = [];

        if (this.storageUsage.localStorage.length > 0) {
            recommendations.push({
                priority: 'high',
                type: 'migration',
                message: 'Migrate from localStorage to chrome.storage.local',
                details: 'localStorage is synchronous and can block the main thread. chrome.storage.local is asynchronous and more performant.'
            });
        }

        if (this.storageUsage.sessionStorage.length > 0) {
            recommendations.push({
                priority: 'high',
                type: 'migration',
                message: 'Migrate from sessionStorage to chrome.storage.session',
                details: 'chrome.storage.session provides tab-specific storage with better integration with the extension lifecycle.'
            });
        }

        if (this.storageUsage.chromeStorageSync.length > 0) {
            recommendations.push({
                priority: 'medium',
                type: 'optimization',
                message: 'Implement proper quota management for chrome.storage.sync',
                details: 'Monitor storage quota usage and implement fallback to local storage when approaching limits.'
            });
        }

        return recommendations;
    }
}

module.exports = StorageAnalyzer;