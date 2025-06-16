/**
 * SummaryReporter - テスト結果の簡潔なサマリーを生成
 */

class SummaryReporter {
    constructor(options = {}) {
        this.detailed = options.detailed || false;
        this.quiet = options.quiet || false;
    }
    
    /**
     * テスト結果のサマリーを生成
     */
    generateSummary(results) {
        const summary = {
            overview: this.generateOverview(results),
            criticalIssues: this.getCriticalIssues(results),
            warnings: this.getWarnings(results),
            suggestions: this.getSuggestions(results)
        };
        
        return summary;
    }
    
    /**
     * 概要情報を生成
     */
    generateOverview(results) {
        const totalTests = results.summary.total;
        const passed = results.summary.passed;
        const failed = results.summary.failed;
        const successRate = results.summary.successRate;
        
        return {
            totalTests,
            passed,
            failed,
            successRate,
            status: failed === 0 ? 'SUCCESS' : 'FAILED',
            duration: results.duration
        };
    }
    
    /**
     * 重大な問題を抽出
     */
    getCriticalIssues(results) {
        const issues = [];
        
        results.suites.forEach(suite => {
            suite.tests.forEach(test => {
                if (test.status === 'failed' && test.error) {
                    const enhanced = test.error.enhanced;
                    if (enhanced && enhanced.level === 'critical') {
                        issues.push({
                            suite: suite.name,
                            test: test.name,
                            message: test.error.message,
                            category: enhanced.category,
                            suggestion: enhanced.suggestions ? enhanced.suggestions[0] : null
                        });
                    }
                }
            });
        });
        
        return issues;
    }
    
    /**
     * 警告を抽出
     */
    getWarnings(results) {
        const warnings = [];
        const seenWarnings = new Set();
        
        // スイートレベルの警告
        results.suites.forEach(suite => {
            if (suite.warnings && suite.warnings.length > 0) {
                suite.warnings.forEach(warning => {
                    if (!seenWarnings.has(warning)) {
                        seenWarnings.add(warning);
                        warnings.push({
                            type: 'suite',
                            suite: suite.name,
                            message: warning
                        });
                    }
                });
            }
        });
        
        // テストレベルの警告（failedではないがwarningを出力したもの）
        results.suites.forEach(suite => {
            suite.tests.forEach(test => {
                if (test.status === 'passed' && test.warnings) {
                    test.warnings.forEach(warning => {
                        const key = `${suite.name}:${warning}`;
                        if (!seenWarnings.has(key)) {
                            seenWarnings.add(key);
                            warnings.push({
                                type: 'test',
                                suite: suite.name,
                                test: test.name,
                                message: warning
                            });
                        }
                    });
                }
            });
        });
        
        return warnings;
    }
    
    /**
     * 改善提案を生成
     */
    getSuggestions(results) {
        const suggestions = [];
        const categories = {
            SECURITY_ERROR: [],
            PERFORMANCE_ERROR: [],
            CODE_QUALITY: [],
            VALIDATION_ERROR: []
        };
        
        // エラーから提案を収集
        results.suites.forEach(suite => {
            suite.tests.forEach(test => {
                if (test.error && test.error.enhanced) {
                    const enhanced = test.error.enhanced;
                    const category = enhanced.category;
                    
                    if (categories[category] && enhanced.suggestions) {
                        enhanced.suggestions.forEach(suggestion => {
                            if (!categories[category].includes(suggestion)) {
                                categories[category].push(suggestion);
                            }
                        });
                    }
                }
            });
        });
        
        // カテゴリごとに最も重要な提案を選択
        Object.entries(categories).forEach(([category, items]) => {
            if (items.length > 0) {
                suggestions.push({
                    category,
                    priority: this.getCategoryPriority(category),
                    suggestions: items.slice(0, 3) // 各カテゴリ最大3つ
                });
            }
        });
        
        // 優先度でソート
        suggestions.sort((a, b) => a.priority - b.priority);
        
        return suggestions;
    }
    
    /**
     * カテゴリの優先度を取得
     */
    getCategoryPriority(category) {
        const priorities = {
            SECURITY_ERROR: 1,
            VALIDATION_ERROR: 2,
            PERFORMANCE_ERROR: 3,
            CODE_QUALITY: 4
        };
        
        return priorities[category] || 5;
    }
    
    /**
     * コンソール出力用のフォーマット
     */
    formatForConsole(summary) {
        const lines = [];
        
        // ヘッダー
        if (!this.quiet) {
            lines.push('\n' + '='.repeat(60));
            lines.push('📊 TEST SUMMARY');
            lines.push('='.repeat(60));
        }
        
        // 概要
        const overview = summary.overview;
        const statusIcon = overview.status === 'SUCCESS' ? '✅' : '❌';
        const statusColor = overview.status === 'SUCCESS' ? '\x1b[32m' : '\x1b[31m';
        const resetColor = '\x1b[0m';
        
        lines.push(`${statusIcon} ${statusColor}${overview.status}${resetColor} - ${overview.passed}/${overview.totalTests} tests passed (${overview.successRate}%)`);
        
        // 重大な問題
        if (summary.criticalIssues.length > 0) {
            lines.push('\n🚨 CRITICAL ISSUES:');
            summary.criticalIssues.forEach(issue => {
                lines.push(`   • ${issue.message}`);
                if (issue.suggestion && this.detailed) {
                    lines.push(`     💡 ${issue.suggestion}`);
                }
            });
        }
        
        // 警告（quietモードでない場合のみ）
        if (!this.quiet && summary.warnings.length > 0) {
            lines.push('\n⚠️  WARNINGS:');
            const maxWarnings = this.detailed ? 10 : 5;
            summary.warnings.slice(0, maxWarnings).forEach(warning => {
                lines.push(`   • ${warning.message}`);
            });
            
            if (summary.warnings.length > maxWarnings) {
                lines.push(`   ... and ${summary.warnings.length - maxWarnings} more warnings`);
            }
        }
        
        // 改善提案（detailedモードの場合のみ）
        if (this.detailed && summary.suggestions.length > 0) {
            lines.push('\n💡 SUGGESTIONS:');
            summary.suggestions.forEach(suggestionGroup => {
                lines.push(`   ${this.getCategoryLabel(suggestionGroup.category)}:`);
                suggestionGroup.suggestions.forEach(suggestion => {
                    lines.push(`   • ${suggestion}`);
                });
            });
        }
        
        // フッター
        if (!this.quiet) {
            lines.push('='.repeat(60));
            lines.push(`⏱️  Total time: ${this.formatDuration(overview.duration)}`);
        }
        
        return lines.join('\n');
    }
    
    /**
     * カテゴリのラベルを取得
     */
    getCategoryLabel(category) {
        const labels = {
            SECURITY_ERROR: '🔒 Security',
            PERFORMANCE_ERROR: '⚡ Performance',
            CODE_QUALITY: '📝 Code Quality',
            VALIDATION_ERROR: '✓ Validation'
        };
        
        return labels[category] || category;
    }
    
    /**
     * 時間をフォーマット
     */
    formatDuration(ms) {
        if (ms < 1000) {
            return `${ms}ms`;
        }
        
        const seconds = (ms / 1000).toFixed(1);
        return `${seconds}s`;
    }
}

module.exports = SummaryReporter;