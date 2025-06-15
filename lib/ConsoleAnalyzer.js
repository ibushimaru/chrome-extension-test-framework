/**
 * Console使用の分析
 * console.logの使用をコンテキストに応じて評価
 */

class ConsoleAnalyzer {
    constructor() {
        this.patterns = {
            consoleLog: /console\.(log|debug|info|warn|error)\s*\(/g,
            debugComment: /\/\/\s*(debug|test|todo|fixme|hack|temp)/gi,
            developmentFile: /\.(test|spec|mock|stub|development|dev)\.(js|ts)$/i,
            productionExclude: /(dist|build|prod|production|release)\//i
        };
        
        this.thresholds = {
            development: 100,  // 開発ファイルでは100個まで許容
            production: 10,    // 本番コードでは10個まで
            test: Infinity     // テストファイルでは無制限
        };
    }

    /**
     * ファイルタイプを判定
     */
    getFileType(filePath) {
        if (this.patterns.developmentFile.test(filePath)) {
            return 'test';
        }
        if (filePath.includes('/test/') || filePath.includes('/tests/')) {
            return 'test';
        }
        if (filePath.includes('/dev/') || filePath.includes('/development/')) {
            return 'development';
        }
        if (this.patterns.productionExclude.test(filePath)) {
            return 'production-build';
        }
        return 'production';
    }

    /**
     * console使用を分析
     */
    analyze(content, filePath) {
        const fileType = this.getFileType(filePath);
        const matches = content.match(this.patterns.consoleLog) || [];
        const count = matches.length;
        const threshold = this.thresholds[fileType] || this.thresholds.production;
        
        const result = {
            count,
            fileType,
            threshold,
            exceeds: count > threshold,
            severity: this.getSeverity(count, threshold, fileType),
            details: this.getDetails(matches, content)
        };
        
        if (result.exceeds) {
            result.suggestion = this.getSuggestion(fileType, count, threshold);
        }
        
        return result;
    }

    /**
     * 重要度を判定
     */
    getSeverity(count, threshold, fileType) {
        if (fileType === 'test') return 'info';
        if (count === 0) return 'none';
        if (count <= threshold / 2) return 'low';
        if (count <= threshold) return 'medium';
        if (count <= threshold * 2) return 'high';
        return 'critical';
    }

    /**
     * 詳細情報を取得
     */
    getDetails(matches, content) {
        const types = {
            log: 0,
            debug: 0,
            info: 0,
            warn: 0,
            error: 0
        };
        
        matches.forEach(match => {
            const type = match.match(/console\.(\w+)/)[1];
            types[type] = (types[type] || 0) + 1;
        });
        
        return {
            types,
            hasDebugComments: this.patterns.debugComment.test(content)
        };
    }

    /**
     * 修正提案を生成
     */
    getSuggestion(fileType, count, threshold) {
        const suggestions = [];
        
        if (fileType === 'production') {
            suggestions.push(`本番コードでconsole使用が${count}個検出されました（推奨: ${threshold}個以下）`);
            suggestions.push('以下の方法で改善できます:');
            suggestions.push('1. 本番ビルドでconsoleを自動削除するツールを使用');
            suggestions.push('2. 環境変数でconsoleを制御: if (DEBUG) console.log(...)');
            suggestions.push('3. 専用のロガーライブラリを使用');
        } else if (fileType === 'development') {
            suggestions.push(`開発ファイルでのconsole使用は問題ありませんが、${count}個は多すぎる可能性があります`);
            suggestions.push('適切なログレベルを使用することを検討してください');
        }
        
        return suggestions.join('\\n');
    }

    /**
     * レポート用のサマリーを生成
     */
    generateSummary(results) {
        const summary = {
            total: 0,
            byFileType: {},
            bySeverity: {},
            suggestions: []
        };
        
        results.forEach(result => {
            summary.total += result.count;
            
            // ファイルタイプ別
            if (!summary.byFileType[result.fileType]) {
                summary.byFileType[result.fileType] = {
                    files: 0,
                    count: 0
                };
            }
            summary.byFileType[result.fileType].files++;
            summary.byFileType[result.fileType].count += result.count;
            
            // 重要度別
            if (!summary.bySeverity[result.severity]) {
                summary.bySeverity[result.severity] = 0;
            }
            summary.bySeverity[result.severity]++;
        });
        
        // 全体的な提案
        if (summary.byFileType.production && summary.byFileType.production.count > 10) {
            summary.suggestions.push('本番コードでのconsole使用を削減することを推奨します');
        }
        
        return summary;
    }
}

module.exports = ConsoleAnalyzer;