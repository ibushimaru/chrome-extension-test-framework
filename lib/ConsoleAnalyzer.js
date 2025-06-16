/**
 * Console使用の分析
 * console.logの使用をコンテキストに応じて評価
 */

class ConsoleAnalyzer {
    constructor(config = {}) {
        this.patterns = {
            consoleLog: /console\.(log|debug|info|warn|error|table|trace|assert|group|groupEnd|groupCollapsed|time|timeEnd|timeLog|count|countReset|dir|dirxml|profile|profileEnd)\s*\(/g,
            consoleDestructuring: /const\s*\{[^}]*(?:log|debug|info|warn|error)[^}]*\}\s*=\s*console/g,
            consoleAlias: /const\s+\w+\s*=\s*console\.(log|debug|info|warn|error)/g,
            debugComment: /\/\/\s*(debug|test|todo|fixme|hack|temp)/gi,
            developmentFile: /\.(test|spec|mock|stub|development|dev)\.(js|ts)$/i,
            productionExclude: /(dist|build|prod|production|release)\//i
        };
        
        // デフォルトの閾値（環境別）
        const defaultThresholds = {
            development: 100,      // 開発ファイルでは100個まで許容
            production: 10,        // 本番コードでは10個まで
            test: Infinity,        // テストファイルでは無制限
            'service-worker': 5,   // Service Workerは最小限に
            'content-script': 15,  // Content Scriptは少し緩和
            'production-build': Infinity  // ビルド成果物は無視
        };
        
        // 設定ファイルからの閾値をマージ
        this.thresholds = Object.assign({}, defaultThresholds, config.consoleThresholds || {});
        
        // consoleメソッド別の乗数（error/warnは許容度高め）
        this.methodWeights = {
            log: 1.0,
            debug: 1.0,
            info: 0.8,
            warn: 0.3,
            error: 0.2,
            table: 1.0,
            trace: 0.5,
            group: 0.5,
            time: 0.3
        };
    }

    /**
     * ファイルタイプを判定（より詳細な環境検出）
     */
    getFileType(filePath) {
        // テストファイル
        if (this.patterns.developmentFile.test(filePath)) {
            return 'test';
        }
        if (filePath.includes('/test/') || filePath.includes('/tests/') || 
            filePath.includes('/__tests__/') || filePath.includes('/spec/')) {
            return 'test';
        }
        
        // デバッグ・開発用ファイル
        if (filePath.includes('/debug/') || filePath.includes('/dev/') || 
            filePath.includes('/development/') || filePath.includes('/demo/')) {
            return 'development';
        }
        
        // ビルド成果物（無視すべき）
        if (this.patterns.productionExclude.test(filePath)) {
            return 'production-build';
        }
        
        // Service Worker（特別扱い）
        if (filePath.includes('service-worker') || filePath.includes('background')) {
            return 'service-worker';
        }
        
        // Content Script（特別扱い）
        if (filePath.includes('content') || filePath.includes('inject')) {
            return 'content-script';
        }
        
        // その他は本番コード
        return 'production';
    }

    /**
     * console使用を分析
     */
    analyze(content, filePath) {
        const fileType = this.getFileType(filePath);
        
        // Direct console method calls
        const directMatches = content.match(this.patterns.consoleLog) || [];
        
        // Destructured console methods
        const destructureMatches = content.match(this.patterns.consoleDestructuring) || [];
        
        // Aliased console methods
        const aliasMatches = content.match(this.patterns.consoleAlias) || [];
        
        const allMatches = [...directMatches, ...destructureMatches, ...aliasMatches];
        const details = this.getDetails(allMatches, content, destructureMatches.length > 0, aliasMatches.length > 0);
        
        // 加重カウントを計算
        const weightedCount = this.calculateWeightedCount(details.types);
        const actualCount = allMatches.length;
        const threshold = this.thresholds[fileType] || this.thresholds.production;
        
        const result = {
            count: actualCount,
            weightedCount,
            fileType,
            threshold,
            exceeds: weightedCount > threshold,
            severity: this.getSeverity(weightedCount, threshold, fileType),
            details
        };
        
        if (result.exceeds) {
            result.suggestion = this.getSuggestion(fileType, actualCount, threshold, details);
        }
        
        return result;
    }

    /**
     * 重要度を判定（環境を考慮）
     */
    getSeverity(count, threshold, fileType) {
        // テストファイルとビルド成果物は常に情報レベル
        if (fileType === 'test' || fileType === 'production-build') return 'info';
        
        // Service Workerは厳しく判定
        if (fileType === 'service-worker') {
            if (count === 0) return 'none';
            if (count <= 2) return 'low';
            if (count <= threshold) return 'medium';
            if (count <= threshold * 1.5) return 'high';
            return 'critical';
        }
        
        // 通常の判定
        if (count === 0) return 'none';
        if (count <= threshold / 2) return 'low';
        if (count <= threshold) return 'medium';
        if (count <= threshold * 2) return 'high';
        return 'critical';
    }

    /**
     * 詳細情報を取得
     */
    getDetails(matches, content, hasDestructuring, hasAliasing) {
        const types = {
            log: 0,
            debug: 0,
            info: 0,
            warn: 0,
            error: 0,
            table: 0,
            trace: 0,
            group: 0,
            time: 0,
            other: 0
        };
        
        matches.forEach(match => {
            const typeMatch = match.match(/console\.(\w+)/);
            if (typeMatch) {
                const type = typeMatch[1];
                if (types.hasOwnProperty(type)) {
                    types[type]++;
                } else {
                    types.other++;
                }
            }
        });
        
        return {
            types,
            hasDebugComments: this.patterns.debugComment.test(content),
            hasDestructuring,
            hasAliasing
        };
    }

    /**
     * 修正提案を生成
     */
    getSuggestion(fileType, count, threshold, details) {
        const suggestions = [];
        
        if (fileType === 'production') {
            suggestions.push(`本番コードでconsole使用が${count}個検出されました（推奨: ${threshold}個以下）`);
            suggestions.push('以下の方法で改善できます:');
            suggestions.push('1. 本番ビルドでconsoleを自動削除するツールを使用');
            suggestions.push('2. 環境変数でconsoleを制御: if (DEBUG) console.log(...)');
            suggestions.push('3. 専用のロガーライブラリを使用');
            
            if (details.hasDestructuring || details.hasAliasing) {
                suggestions.push('\n⚠️  間接的なconsole使用が検出されました（デストラクチャリングまたはエイリアス）');
            }
        } else if (fileType === 'development') {
            suggestions.push(`開発ファイルでのconsole使用は問題ありませんが、${count}個は多すぎる可能性があります`);
            suggestions.push('適切なログレベルを使用することを検討してください');
        } else if (fileType === 'service-worker') {
            suggestions.push(`Service Workerでconsole使用が${count}個検出されました（推奨: ${threshold}個以下）`);
            suggestions.push('Service Workerでのconsole使用は最小限にすべきです:');
            suggestions.push('1. パフォーマンスへの影響を考慮');
            suggestions.push('2. chrome.runtime.lastErrorのチェックのみに限定');
            suggestions.push('3. デバッグ時のみ有効化: if (chrome.runtime.id.includes("development"))');
        } else if (fileType === 'content-script') {
            suggestions.push(`Content Scriptでconsole使用が${count}個検出されました（推奨: ${threshold}個以下）`);
            suggestions.push('Content Scriptでのconsole使用に注意:');
            suggestions.push('1. ホストページのコンソールを汚染しないよう配慮');
            suggestions.push('2. プレフィックスを付ける: console.log("[Extension]", ...)');
            suggestions.push('3. 本番環境では無効化を推奨');
        }
        
        // console.errorとconsole.warnの使用を推奨
        if (details.types.log > 0 && (details.types.error > 0 || details.types.warn > 0)) {
            const errorWarnRatio = (details.types.error + details.types.warn) / details.types.log;
            if (errorWarnRatio < 0.3) {
                suggestions.push('\n💡 console.logの代わりにconsole.warnやconsole.errorの使用を検討してください');
            }
        }
        
        return suggestions.join('\n');
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
    
    /**
     * メソッド別の重みづけでカウントを計算
     */
    calculateWeightedCount(types) {
        let weighted = 0;
        for (const [method, count] of Object.entries(types)) {
            const weight = this.methodWeights[method] || 1.0;
            weighted += count * weight;
        }
        return Math.round(weighted);
    }
}

module.exports = ConsoleAnalyzer;