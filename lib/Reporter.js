/**
 * Reporter - テスト結果のレポート生成
 */

const fs = require('fs');
const path = require('path');

class Reporter {
    constructor(config) {
        this.config = config;
        this.reporters = new Map();
        this.registerBuiltinReporters();
    }

    /**
     * ビルトインレポーターを登録
     */
    registerBuiltinReporters() {
        // コンソールレポーター
        this.register('console', {
            generate: (results) => {
                console.log('\n' + '═'.repeat(60));
                console.log('📊 テスト結果サマリー');
                console.log('═'.repeat(60));
                
                const summary = results.summary;
                console.log(`✅ 成功: ${summary.passed}`);
                console.log(`❌ 失敗: ${summary.failed}`);
                console.log(`⏭️  スキップ: ${summary.skipped}`);
                console.log(`📈 成功率: ${summary.successRate}%`);
                console.log(`⏱️  実行時間: ${results.duration}ms`);
                
                if (summary.errors && summary.errors.length > 0) {
                    console.log('\n❌ エラー詳細:');
                    summary.errors.forEach(error => {
                        console.log(`\n[${error.suite}] ${error.test}`);
                        console.log(`   ${error.error.message}`);
                    });
                }
                
                console.log('\n' + '═'.repeat(60));
            }
        });

        // JSONレポーター
        this.register('json', {
            generate: async (results) => {
                const outputPath = path.join(
                    this.config.output.directory,
                    `${this.config.output.filename || 'test-report'}.json`
                );
                
                await this.ensureDirectory(this.config.output.directory);
                
                const jsonContent = JSON.stringify(results, null, 2);
                fs.writeFileSync(outputPath, jsonContent);
                
                console.log(`📄 JSONレポート生成: ${outputPath}`);
            }
        });

        // HTMLレポーター
        this.register('html', {
            generate: async (results) => {
                const outputPath = path.join(
                    this.config.output.directory,
                    `${this.config.output.filename || 'test-report'}.html`
                );
                
                await this.ensureDirectory(this.config.output.directory);
                
                const htmlContent = this.generateHTML(results);
                fs.writeFileSync(outputPath, htmlContent);
                
                console.log(`🌐 HTMLレポート生成: ${outputPath}`);
            }
        });

        // Markdownレポーター
        this.register('markdown', {
            generate: async (results) => {
                const outputPath = path.join(
                    this.config.output.directory,
                    `${this.config.output.filename || 'test-report'}.md`
                );
                
                await this.ensureDirectory(this.config.output.directory);
                
                const mdContent = this.generateMarkdown(results);
                fs.writeFileSync(outputPath, mdContent);
                
                console.log(`📝 Markdownレポート生成: ${outputPath}`);
            }
        });
    }

    /**
     * レポーターを登録
     */
    register(name, reporter) {
        this.reporters.set(name, reporter);
    }

    /**
     * レポートを生成
     */
    async generate(results) {
        const formats = Array.isArray(this.config.output.format) 
            ? this.config.output.format 
            : [this.config.output.format];
        
        for (const format of formats) {
            const reporter = this.reporters.get(format);
            if (reporter) {
                await reporter.generate(results);
            } else {
                console.warn(`⚠️  Unknown report format: ${format}`);
            }
        }
    }

    /**
     * ディレクトリを確保
     */
    async ensureDirectory(dirPath) {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    }

    /**
     * HTML形式のレポートを生成
     */
    generateHTML(results) {
        const summary = results.summary;
        const statusColors = {
            passed: '#28a745',
            failed: '#dc3545',
            skipped: '#6c757d'
        };

        return `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chrome Extension Test Report</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .header {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }
        h1 {
            margin: 0 0 20px 0;
            color: #2c3e50;
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .summary-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            text-align: center;
        }
        .summary-card h3 {
            margin: 0 0 10px 0;
            color: #666;
            font-size: 14px;
            text-transform: uppercase;
        }
        .summary-card .value {
            font-size: 36px;
            font-weight: bold;
            margin: 0;
        }
        .success-rate {
            color: ${summary.successRate >= 80 ? '#28a745' : summary.successRate >= 50 ? '#ffc107' : '#dc3545'};
        }
        .suite {
            background: white;
            margin-bottom: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .suite-header {
            background: #f8f9fa;
            padding: 15px 20px;
            border-bottom: 1px solid #dee2e6;
            cursor: pointer;
        }
        .suite-header h2 {
            margin: 0;
            font-size: 18px;
            color: #495057;
        }
        .test {
            padding: 10px 20px;
            border-bottom: 1px solid #f0f0f0;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .test:last-child {
            border-bottom: none;
        }
        .test-status {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            flex-shrink: 0;
        }
        .test-status.passed {
            background: #28a745;
        }
        .test-status.failed {
            background: #dc3545;
        }
        .test-status.skipped {
            background: #6c757d;
        }
        .test-name {
            flex: 1;
            font-weight: 500;
        }
        .test-duration {
            color: #666;
            font-size: 14px;
        }
        .error {
            background: #f8d7da;
            color: #721c24;
            padding: 10px;
            margin: 10px 20px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 12px;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            color: #666;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🧪 Chrome Extension Test Report</h1>
        <p>Framework Version: ${results.framework} | Generated: ${new Date(results.timestamp).toLocaleString()}</p>
    </div>

    <div class="summary">
        <div class="summary-card">
            <h3>Total Tests</h3>
            <p class="value">${summary.total}</p>
        </div>
        <div class="summary-card">
            <h3>Passed</h3>
            <p class="value" style="color: #28a745">${summary.passed}</p>
        </div>
        <div class="summary-card">
            <h3>Failed</h3>
            <p class="value" style="color: #dc3545">${summary.failed}</p>
        </div>
        <div class="summary-card">
            <h3>Success Rate</h3>
            <p class="value success-rate">${summary.successRate}%</p>
        </div>
    </div>

    ${results.suites.map(suite => `
        <div class="suite">
            <div class="suite-header">
                <h2>${suite.name}</h2>
                ${suite.description ? `<p style="margin: 5px 0 0 0; color: #666">${suite.description}</p>` : ''}
            </div>
            <div class="suite-body">
                ${suite.tests.map(test => `
                    <div class="test">
                        <div class="test-status ${test.status}"></div>
                        <div class="test-name">${test.name}</div>
                        <div class="test-duration">${test.duration || 0}ms</div>
                    </div>
                    ${test.error ? `<div class="error">${test.error.message}</div>` : ''}
                `).join('')}
            </div>
        </div>
    `).join('')}

    <div class="footer">
        <p>Chrome Extension Test Framework v${results.framework} | Execution time: ${results.duration}ms</p>
    </div>
</body>
</html>`;
    }

    /**
     * Markdown形式のレポートを生成
     */
    generateMarkdown(results) {
        const summary = results.summary;
        
        let md = `# Chrome Extension Test Report\n\n`;
        md += `**Generated:** ${new Date(results.timestamp).toLocaleString()}\n`;
        md += `**Framework Version:** ${results.framework}\n`;
        md += `**Extension Path:** ${results.config.extensionPath}\n\n`;
        
        md += `## Summary\n\n`;
        md += `| Metric | Value |\n`;
        md += `|--------|-------|\n`;
        md += `| Total Tests | ${summary.total} |\n`;
        md += `| Passed | ${summary.passed} |\n`;
        md += `| Failed | ${summary.failed} |\n`;
        md += `| Skipped | ${summary.skipped} |\n`;
        md += `| Success Rate | ${summary.successRate}% |\n`;
        md += `| Execution Time | ${results.duration}ms |\n\n`;
        
        md += `## Test Results\n\n`;
        
        results.suites.forEach(suite => {
            md += `### ${suite.name}\n`;
            if (suite.description) {
                md += `> ${suite.description}\n`;
            }
            md += `\n`;
            
            suite.tests.forEach(test => {
                const icon = test.status === 'passed' ? '✅' : 
                           test.status === 'failed' ? '❌' : '⏭️';
                md += `- ${icon} ${test.name} (${test.duration || 0}ms)\n`;
                
                if (test.error) {
                    md += `  - Error: ${test.error.message}\n`;
                }
            });
            md += `\n`;
        });
        
        if (summary.errors.length > 0) {
            md += `## Error Details\n\n`;
            summary.errors.forEach(error => {
                md += `### [${error.suite}] ${error.test}\n`;
                md += `\`\`\`\n${error.error.message}\n\`\`\`\n\n`;
            });
        }
        
        return md;
    }
}

module.exports = Reporter;