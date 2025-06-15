/**
 * WarningManager - 警告レベルと除外設定の管理
 */

const path = require('path');

class WarningManager {
    constructor(config = {}) {
        this.warningLevels = config.warningLevels || {};
        this.knownIssues = config.knownIssues || [];
        this.defaultLevels = {
            'error': ['critical', 'error'],
            'warn': ['warning', 'warn'],
            'info': ['info', 'notice'],
            'ignore': ['ignore', 'skip']
        };
    }

    /**
     * 警告レベルを取得
     */
    getWarningLevel(warningType, context = {}) {
        const config = this.warningLevels[warningType];
        
        if (!config) {
            return 'warn'; // デフォルトは警告
        }
        
        // 文字列の場合
        if (typeof config === 'string') {
            // テストファイル内では無視する設定
            if (config === 'ignore-in-test-files' && context.file && this.isTestFile(context.file)) {
                return 'ignore';
            } else if (config === 'ignore-in-test-files' && (!context.file || !this.isTestFile(context.file))) {
                return 'warn'; // テストファイル以外ではwarn
            }
            return config;
        }
        
        // オブジェクトの場合
        if (typeof config === 'object') {
            // ファイル除外チェック
            if (config.excludeFiles && context.file) {
                const shouldExclude = config.excludeFiles.some(pattern => {
                    return this.matchPattern(context.file, pattern);
                });
                if (shouldExclude) {
                    return 'ignore';
                }
            }
            
            // 閾値チェック
            if (config.threshold && context.count !== undefined) {
                if (context.count < config.threshold) {
                    return 'ignore';
                }
            }
            
            return config.severity || 'warn';
        }
        
        return 'warn';
    }

    /**
     * 既知の問題かチェック
     */
    isKnownIssue(file, issueType) {
        return this.knownIssues.some(known => {
            return (known.file === file || this.matchPattern(file, known.file)) &&
                   known.issue === issueType;
        });
    }

    /**
     * 既知の問題の理由を取得
     */
    getKnownIssueReason(file, issueType) {
        const known = this.knownIssues.find(k => {
            return (k.file === file || this.matchPattern(file, k.file)) &&
                   k.issue === issueType;
        });
        return known ? known.reason : null;
    }

    /**
     * 警告をフィルタリング
     */
    filterWarnings(warnings) {
        return warnings.filter(warning => {
            const level = this.getWarningLevel(warning.type, {
                file: warning.file,
                count: warning.count
            });
            
            // 無視レベルの場合は除外
            if (level === 'ignore') {
                return false;
            }
            
            // 既知の問題の場合
            if (this.isKnownIssue(warning.file, warning.type)) {
                const reason = this.getKnownIssueReason(warning.file, warning.type);
                warning.knownIssue = true;
                warning.knownReason = reason;
                warning.severity = 'info'; // 既知の問題は情報レベルに下げる
            } else {
                warning.severity = level;
            }
            
            return true;
        });
    }

    /**
     * 警告を重要度でグループ化
     */
    groupWarningsBySeverity(warnings) {
        const groups = {
            error: [],
            warn: [],
            info: []
        };
        
        warnings.forEach(warning => {
            const level = warning.severity || this.getWarningLevel(warning.type, {
                file: warning.file,
                count: warning.count
            });
            
            if (groups[level]) {
                groups[level].push(warning);
            } else {
                groups.warn.push(warning); // 不明なレベルは警告として扱う
            }
        });
        
        return groups;
    }

    /**
     * テストファイルかどうか判定
     */
    isTestFile(filePath) {
        if (!filePath) return false;
        
        const testPatterns = [
            /\.test\.(js|ts)$/,
            /\.spec\.(js|ts)$/,
            /test-.*\.(js|ts)$/,
            /.*-test\.(js|ts)$/,
            /test\//,
            /tests\//,
            /__tests__\//
        ];
        
        return testPatterns.some(pattern => pattern.test(filePath));
    }

    /**
     * パターンマッチング
     */
    matchPattern(filePath, pattern) {
        if (!filePath || !pattern) return false;
        
        // 完全一致
        if (filePath === pattern) return true;
        
        // グロブパターン
        if (pattern.includes('*')) {
            const regex = pattern
                .replace(/\./g, '\\.')
                .replace(/\*/g, '.*')
                .replace(/\?/g, '.');
            return new RegExp('^' + regex + '$').test(filePath);
        }
        
        // 部分一致（ディレクトリ）
        if (pattern.endsWith('/')) {
            return filePath.startsWith(pattern);
        }
        
        return false;
    }

    /**
     * 警告メッセージをフォーマット
     */
    formatWarning(warning) {
        const icon = this.getSeverityIcon(warning.severity);
        const color = this.getSeverityColor(warning.severity);
        
        let message = `${icon} ${warning.message}`;
        
        if (warning.file) {
            message += ` (${warning.file})`;
        }
        
        if (warning.knownIssue) {
            message += ` [Known: ${warning.knownReason}]`;
        }
        
        return {
            message,
            color,
            severity: warning.severity
        };
    }

    /**
     * 重要度アイコンを取得
     */
    getSeverityIcon(severity) {
        const icons = {
            error: '❌',
            warn: '⚠️',
            info: 'ℹ️',
            ignore: '⏭️'
        };
        return icons[severity] || '•';
    }

    /**
     * 重要度カラーを取得
     */
    getSeverityColor(severity) {
        const colors = {
            error: '\x1b[31m', // 赤
            warn: '\x1b[33m',  // 黄
            info: '\x1b[36m',  // シアン
            ignore: '\x1b[90m' // グレー
        };
        return colors[severity] || '';
    }

    /**
     * 設定を更新
     */
    updateConfig(config) {
        if (config.warningLevels) {
            this.warningLevels = { ...this.warningLevels, ...config.warningLevels };
        }
        if (config.knownIssues) {
            this.knownIssues = [...this.knownIssues, ...config.knownIssues];
        }
    }
}

module.exports = WarningManager;