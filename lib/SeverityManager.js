/**
 * SeverityManager - 重要度レベル管理
 * 
 * 問題の重要度を統一的に管理し、
 * ERROR/WARNING/INFO レベルに分類する
 */

class SeverityManager {
    constructor(options = {}) {
        // 重要度レベルの定義
        this.levels = {
            ERROR: {
                name: 'ERROR',
                symbol: '❌',
                color: 'red',
                priority: 3,
                exitCode: 1,
                description: 'Critical issues that must be fixed'
            },
            WARNING: {
                name: 'WARNING',
                symbol: '⚠️',
                color: 'yellow',
                priority: 2,
                exitCode: 0,
                description: 'Issues that should be addressed'
            },
            INFO: {
                name: 'INFO',
                symbol: 'ℹ️',
                color: 'blue',
                priority: 1,
                exitCode: 0,
                description: 'Suggestions for improvement'
            }
        };

        // 旧形式から新形式へのマッピング
        this.legacyMapping = {
            'critical': 'ERROR',
            'high': 'ERROR',
            'medium': 'WARNING',
            'low': 'INFO',
            'info': 'INFO',
            'ignore': null
        };

        // イシュータイプごとのデフォルト重要度
        this.defaultSeverities = {
            // セキュリティ関連
            'eval': 'ERROR',
            'unsafe-innerHTML': 'ERROR',
            'hardcoded-secret': 'ERROR',
            'api-key': 'ERROR',
            'xss': 'ERROR',
            'sql-injection': 'ERROR',
            
            // Chrome拡張機能固有
            'missing-permission': 'ERROR',
            'excessive-permission': 'WARNING',
            'content-script-injection': 'ERROR',
            'unsafe-message-passing': 'WARNING',
            
            // コード品質
            'console': 'WARNING',
            'debug-code': 'WARNING',
            'deprecated-api': 'WARNING',
            'localStorage': 'WARNING',
            
            // パフォーマンス
            'large-file': 'WARNING',
            'slow-regex': 'WARNING',
            'memory-leak': 'WARNING',
            
            // 構造・規約
            'naming-convention': 'INFO',
            'file-structure': 'INFO',
            'missing-documentation': 'INFO',
            'code-style': 'INFO'
        };

        // カスタマイズ可能な設定
        this.customSeverities = options.customSeverities || {};
        this.strictMode = options.strictMode || false;
    }

    /**
     * 重要度を正規化
     */
    normalizeSeverity(severity) {
        // すでに新形式の場合
        if (this.levels[severity]) {
            return severity;
        }

        // 旧形式の場合
        const mapped = this.legacyMapping[severity];
        if (mapped !== undefined) {
            return mapped;
        }

        // デフォルト
        return 'WARNING';
    }

    /**
     * イシューの重要度を決定
     */
    determineSeverity(issue, context = {}) {
        // カスタム設定を優先
        if (this.customSeverities[issue.type]) {
            return this.normalizeSeverity(this.customSeverities[issue.type]);
        }

        // 環境による調整
        if (context.environment) {
            const adjusted = this.adjustForEnvironment(issue, context.environment);
            if (adjusted) return adjusted;
        }

        // ファイルの役割による調整
        if (context.fileRole) {
            const adjusted = this.adjustForFileRole(issue, context.fileRole);
            if (adjusted) return adjusted;
        }

        // デフォルトの重要度
        if (this.defaultSeverities[issue.type]) {
            return this.defaultSeverities[issue.type];
        }

        // 旧形式の重要度を変換
        if (issue.severity) {
            return this.normalizeSeverity(issue.severity);
        }

        return 'WARNING';
    }

    /**
     * 環境に基づく調整
     */
    adjustForEnvironment(issue, environment) {
        // 開発環境での調整
        if (environment === 'development') {
            if (issue.type === 'console') return 'INFO';
            if (issue.type === 'debug-code') return 'INFO';
            if (issue.type === 'hardcoded-secret' && issue.value && issue.value.includes('test')) {
                return 'WARNING';
            }
        }

        // テスト環境での調整
        if (environment === 'test') {
            if (['console', 'debug-code', 'hardcoded-secret'].includes(issue.type)) {
                return 'INFO';
            }
        }

        // 本番環境では厳しく
        if (environment === 'production' && this.strictMode) {
            if (issue.type === 'console') return 'ERROR';
            if (issue.type === 'debug-code') return 'ERROR';
        }

        return null;
    }

    /**
     * ファイルの役割に基づく調整
     */
    adjustForFileRole(issue, fileRole) {
        // 設定ファイルでは一部の問題を許容
        if (fileRole.includes('config')) {
            if (issue.type === 'hardcoded-secret') return 'WARNING';
        }

        // テストファイルでは緩和
        if (fileRole.includes('test')) {
            if (['console', 'hardcoded-secret', 'eval'].includes(issue.type)) {
                return 'INFO';
            }
        }

        // バックグラウンドスクリプトでは厳格に
        if (fileRole.includes('background-script')) {
            if (issue.type === 'eval') return 'ERROR';
            if (issue.type === 'localStorage') return 'ERROR';
        }

        return null;
    }

    /**
     * 重要度に基づいてフィルタリング
     */
    filterBySeverity(issues, minLevel = 'INFO') {
        const minPriority = this.levels[minLevel]?.priority || 0;
        
        return issues.filter(issue => {
            const severity = this.determineSeverity(issue);
            const priority = this.levels[severity]?.priority || 0;
            return priority >= minPriority;
        });
    }

    /**
     * 重要度でグループ化
     */
    groupBySeverity(issues) {
        const groups = {
            ERROR: [],
            WARNING: [],
            INFO: []
        };

        issues.forEach(issue => {
            const severity = this.determineSeverity(issue);
            if (groups[severity]) {
                groups[severity].push(issue);
            }
        });

        return groups;
    }

    /**
     * 統計情報を生成
     */
    generateStatistics(issues) {
        const stats = {
            total: issues.length,
            byLevel: {
                ERROR: 0,
                WARNING: 0,
                INFO: 0
            },
            byType: {}
        };

        issues.forEach(issue => {
            const severity = this.determineSeverity(issue);
            stats.byLevel[severity]++;

            if (!stats.byType[issue.type]) {
                stats.byType[issue.type] = {
                    count: 0,
                    severities: {}
                };
            }
            stats.byType[issue.type].count++;
            stats.byType[issue.type].severities[severity] = 
                (stats.byType[issue.type].severities[severity] || 0) + 1;
        });

        return stats;
    }

    /**
     * 終了コードを決定
     */
    determineExitCode(issues, options = {}) {
        const stats = this.generateStatistics(issues);

        // エラーがある場合
        if (stats.byLevel.ERROR > 0) {
            return 1;
        }

        // 警告で失敗させるオプション
        if (options.failOnWarning && stats.byLevel.WARNING > 0) {
            return 1;
        }

        return 0;
    }

    /**
     * フォーマット済みメッセージを生成
     */
    formatMessage(issue, options = {}) {
        const severity = this.determineSeverity(issue);
        const level = this.levels[severity];

        let message = '';

        // シンボルを含める
        if (options.includeSymbol !== false) {
            message += `${level.symbol} `;
        }

        // 重要度を含める
        if (options.includeSeverity !== false) {
            message += `[${level.name}] `;
        }

        // 位置情報
        if (issue.file && issue.line) {
            message += `${issue.file}:${issue.line}`;
            if (issue.column) {
                message += `:${issue.column}`;
            }
            message += ' - ';
        }

        // メッセージ本文
        message += issue.message;

        // コンテキスト
        if (options.includeContext && issue.context) {
            message += `\n  Context: ${issue.context}`;
        }

        // 提案
        if (options.includeSuggestion && issue.suggestion) {
            message += `\n  Suggestion: ${issue.suggestion}`;
        }

        return message;
    }

    /**
     * サマリーを生成
     */
    generateSummary(issues) {
        const stats = this.generateStatistics(issues);
        const parts = [];

        if (stats.byLevel.ERROR > 0) {
            parts.push(`${this.levels.ERROR.symbol} ${stats.byLevel.ERROR} errors`);
        }
        if (stats.byLevel.WARNING > 0) {
            parts.push(`${this.levels.WARNING.symbol} ${stats.byLevel.WARNING} warnings`);
        }
        if (stats.byLevel.INFO > 0) {
            parts.push(`${this.levels.INFO.symbol} ${stats.byLevel.INFO} info`);
        }

        if (parts.length === 0) {
            return '✅ No issues found';
        }

        return parts.join(', ');
    }

    /**
     * プロファイルごとの重要度設定
     */
    applyProfile(profileName) {
        const profiles = {
            strict: {
                console: 'ERROR',
                'debug-code': 'ERROR',
                'unused-permission': 'ERROR',
                'code-style': 'WARNING'
            },
            balanced: {
                console: 'WARNING',
                'debug-code': 'WARNING',
                'unused-permission': 'WARNING',
                'code-style': 'INFO'
            },
            lenient: {
                console: 'INFO',
                'debug-code': 'INFO',
                'unused-permission': 'INFO',
                'code-style': 'INFO'
            }
        };

        const profile = profiles[profileName];
        if (profile) {
            Object.assign(this.customSeverities, profile);
        }
    }
}

module.exports = SeverityManager;