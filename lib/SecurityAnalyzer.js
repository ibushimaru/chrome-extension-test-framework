/**
 * SecurityAnalyzer
 * Chrome拡張機能の高度なセキュリティ分析を行うクラス
 */

const fs = require('fs');
const path = require('path');
const ChromePatternRecognizer = require('./ChromePatternRecognizer');

class SecurityAnalyzer {
    constructor(options = {}) {
        this.options = options;
        this.chromeRecognizer = new ChromePatternRecognizer();
        
        // セキュリティパターンの定義
        this.patterns = {
            // APIキーのパターン
            apiKeys: [
                { name: 'Generic API Key', pattern: /(?:const|let|var)\s+\w*(?:api[_-]?key|API[_-]?KEY)\w*\s*=\s*['"][^'"]+['"]/, severity: 'critical' },
                { name: 'Hardcoded API Key', pattern: /['"]?api[_-]?key['"]?\s*[:=]\s*['"][a-zA-Z0-9\-_]{20,}['"]/, severity: 'critical' },
                { name: 'AWS Access Key', pattern: /AKIA[0-9A-Z]{16}/, severity: 'critical' },
                { name: 'Google API Key', pattern: /AIza[0-9A-Za-z\-_]{35}/, severity: 'critical' },
                { name: 'Firebase API Key', pattern: /AIza[0-9A-Za-z\-_]{35}/, severity: 'critical' },
                { name: 'Private Key', pattern: /-----BEGIN (RSA |EC )?PRIVATE KEY-----/, severity: 'critical' },
                { name: 'OAuth Secret', pattern: /['"]?client[_-]?secret['"]?\s*[:=]\s*['"][a-zA-Z0-9\-_]{20,}['"]/, severity: 'critical' },
                { name: 'Hardcoded Secret', pattern: /(?:const|let|var)\s+\w*(?:secret|SECRET)\w*\s*=\s*['"][^'"]+['"]/, severity: 'critical' },
                { name: 'Hardcoded Token', pattern: /(?:const|let|var)\s+\w*(?:token|TOKEN)\w*\s*=\s*['"][^'"]+['"]/, severity: 'critical' },
                { name: 'Password in Code', pattern: /(?:const|let|var)\s+\w*(?:password|PASSWORD)\w*\s*=\s*['"][^'"]+['"]/, severity: 'critical' },
                { name: 'Password Assignment', pattern: /['"]?password['"]?\s*[:=]\s*['"][^'"]{6,}['"]/, severity: 'high' },
                { name: 'Token Assignment', pattern: /['"]?token['"]?\s*[:=]\s*['"][a-zA-Z0-9\-_.]{20,}['"]/, severity: 'high' }
            ],
            
            // 安全でないストレージパターン
            insecureStorage: [
                { name: 'localStorage with sensitive data', pattern: /localStorage\.(setItem|getItem)\s*\(\s*['"]?(password|token|key|secret|credential)/, severity: 'high' },
                { name: 'sessionStorage with sensitive data', pattern: /sessionStorage\.(setItem|getItem)\s*\(\s*['"]?(password|token|key|secret|credential)/, severity: 'medium' },
                { name: 'Cookie without secure flag', pattern: /document\.cookie\s*=(?!.*;\s*secure)/, severity: 'medium' },
                { name: 'IndexedDB with sensitive data', pattern: /indexedDB.*?(password|token|key|secret|credential)/, severity: 'medium' },
                { name: 'chrome.storage with password', pattern: /chrome\.storage\.(local|sync)\.set\s*\(\s*\{[^}]*password[^}]*\}/, severity: 'critical' },
                { name: 'chrome.storage with token', pattern: /chrome\.storage\.(local|sync)\.set\s*\(\s*\{[^}]*token[^}]*\}/, severity: 'high' },
                { name: 'chrome.storage with credit card', pattern: /chrome\.storage\.(local|sync)\.set\s*\(\s*\{[^}]*credit[Cc]ard[^}]*\}/, severity: 'critical' },
                { name: 'chrome.storage with API key', pattern: /chrome\.storage\.(local|sync)\.set\s*\(\s*\{[^}]*apiKey[^}]*\}/, severity: 'critical' }
            ],
            
            // 危険な関数の使用
            dangerousFunctions: [
                { name: 'eval()', pattern: /\beval\s*\(/, severity: 'critical' },
                { name: 'Function constructor', pattern: /new\s+Function\s*\(/, severity: 'critical' },
                { name: 'setTimeout with string', pattern: /setTimeout\s*\(\s*['"]/, severity: 'high' },
                { name: 'setInterval with string', pattern: /setInterval\s*\(\s*['"]/, severity: 'high' },
                { name: 'document.write', pattern: /document\.(write|writeln)\s*\(/, severity: 'medium' }
            ],
            
            // XSS脆弱性パターン
            xssVulnerabilities: [
                { name: 'innerHTML with user input', pattern: /\.innerHTML\s*=\s*[^'"]/, severity: 'high' },
                { name: 'outerHTML with user input', pattern: /\.outerHTML\s*=\s*[^'"]/, severity: 'high' },
                { name: 'insertAdjacentHTML', pattern: /\.insertAdjacentHTML\s*\(/, severity: 'medium' },
                { name: 'jQuery html() with variables', pattern: /\$\([^)]+\)\.html\s*\(\s*[^'"]/, severity: 'medium' }
            ],
            
            // 安全でない通信
            insecureCommunication: [
                { name: 'HTTP URL', pattern: /http:\/\/(?!localhost|127\.0\.0\.1)/, severity: 'medium' },
                { name: 'Unvalidated postMessage', pattern: /addEventListener\s*\(\s*['"]message['"].*?\{(?!.*origin\s*[!=]==)/, severity: 'high' },
                { name: 'wildcard postMessage target', pattern: /postMessage\s*\([^,]+,\s*['"]\*['"]/, severity: 'high' }
            ]
        };
        
        this.results = {
            issues: [],
            stats: {
                critical: 0,
                high: 0,
                medium: 0,
                low: 0,
                info: 0
            },
            scannedFiles: 0
        };
    }
    
    /**
     * 拡張機能全体を分析
     */
    async analyze(extensionPath) {
        this.results = {
            issues: [],
            stats: {
                critical: 0,
                high: 0,
                medium: 0,
                low: 0,
                info: 0
            },
            scannedFiles: 0
        };
        
        await this.scanDirectory(extensionPath);
        return this.results;
    }
    
    /**
     * ディレクトリを再帰的にスキャン
     */
    async scanDirectory(dir, basePath = '') {
        const entries = await fs.promises.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            const relativePath = path.join(basePath, entry.name);
            
            if (entry.isDirectory()) {
                // node_modules等はスキップ
                if (!['node_modules', '.git', 'test', 'tests', 'dist'].includes(entry.name)) {
                    await this.scanDirectory(fullPath, relativePath);
                }
            } else if (entry.isFile()) {
                await this.scanFile(fullPath, relativePath);
            }
        }
    }
    
    /**
     * ファイルをスキャン
     */
    async scanFile(filePath, relativePath) {
        const ext = path.extname(filePath).toLowerCase();
        
        // スキャン対象のファイルタイプ
        if (['.js', '.html', '.json', '.css'].includes(ext)) {
            this.results.scannedFiles++;
            
            try {
                const content = await fs.promises.readFile(filePath, 'utf8');
                
                // 各パターンカテゴリをチェック
                if (ext === '.js') {
                    this.checkPatterns(content, relativePath, this.patterns.apiKeys);
                    this.checkPatterns(content, relativePath, this.patterns.insecureStorage);
                    this.checkPatterns(content, relativePath, this.patterns.dangerousFunctions);
                    this.checkPatterns(content, relativePath, this.patterns.xssVulnerabilities);
                    this.checkPatterns(content, relativePath, this.patterns.insecureCommunication);
                } else if (ext === '.html') {
                    this.checkHTMLSecurity(content, relativePath);
                } else if (ext === '.json' && path.basename(filePath) === 'manifest.json') {
                    await this.checkManifestSecurity(content, relativePath);
                }
            } catch (error) {
                // ファイル読み取りエラーは無視
            }
        }
    }
    
    /**
     * パターンをチェック
     */
    checkPatterns(content, filePath, patterns) {
        const lines = content.split('\n');
        
        patterns.forEach(patternDef => {
            const matches = content.matchAll(new RegExp(patternDef.pattern, 'g'));
            
            for (const match of matches) {
                const lineNumber = this.getLineNumber(content, match.index);
                const line = lines[lineNumber - 1];
                
                this.addIssue({
                    file: filePath,
                    line: lineNumber,
                    type: patternDef.name,
                    severity: patternDef.severity,
                    message: `${patternDef.name} detected`,
                    code: line ? line.trim() : '',
                    pattern: patternDef.pattern.toString()
                });
            }
        });
    }
    
    /**
     * HTMLのセキュリティチェック
     */
    checkHTMLSecurity(content, filePath) {
        // インラインスクリプト
        const inlineScripts = content.match(/<script[^>]*>[\s\S]*?<\/script>/gi) || [];
        inlineScripts.forEach((script, index) => {
            if (!script.includes('src=')) {
                this.addIssue({
                    file: filePath,
                    line: this.getLineNumber(content, content.indexOf(script)),
                    type: 'Inline Script',
                    severity: 'high',
                    message: 'Inline scripts are not allowed in Chrome extensions',
                    code: script.substring(0, 50) + '...'
                });
            }
        });
        
        // インラインイベントハンドラ
        const eventHandlers = content.match(/\son\w+\s*=\s*["'][^"']+["']/gi) || [];
        eventHandlers.forEach(handler => {
            this.addIssue({
                file: filePath,
                line: this.getLineNumber(content, content.indexOf(handler)),
                type: 'Inline Event Handler',
                severity: 'high',
                message: 'Inline event handlers are not allowed',
                code: handler
            });
        });
        
        // 危険なリンク
        const dangerousLinks = content.match(/href\s*=\s*["']javascript:/gi) || [];
        dangerousLinks.forEach(link => {
            this.addIssue({
                file: filePath,
                line: this.getLineNumber(content, content.indexOf(link)),
                type: 'JavaScript URL',
                severity: 'high',
                message: 'JavaScript URLs are not allowed',
                code: link
            });
        });
    }
    
    /**
     * manifest.jsonのセキュリティチェック
     */
    async checkManifestSecurity(content, filePath) {
        try {
            const manifest = JSON.parse(content);
            
            // 過剰な権限
            if (manifest.permissions) {
                const dangerousPermissions = [
                    'debugger',
                    'pageCapture',
                    'privacy',
                    'proxy',
                    'system.cpu',
                    'system.memory',
                    'system.storage'
                ];
                
                manifest.permissions.forEach(perm => {
                    if (dangerousPermissions.includes(perm)) {
                        this.addIssue({
                            file: filePath,
                            line: 0,
                            type: 'Dangerous Permission',
                            severity: 'high',
                            message: `Dangerous permission requested: ${perm}`,
                            code: perm
                        });
                    }
                });
                
                // <all_urls>権限
                if (manifest.permissions.includes('<all_urls>')) {
                    this.addIssue({
                        file: filePath,
                        line: 0,
                        type: 'Overly Broad Permission',
                        severity: 'critical',
                        message: '<all_urls> permission is too broad',
                        code: '<all_urls>'
                    });
                }
            }
            
            // 過剰なhost permissions
            if (manifest.host_permissions) {
                manifest.host_permissions.forEach(host => {
                    if (host === '<all_urls>' || host === '*://*/*') {
                        this.addIssue({
                            file: filePath,
                            line: 0,
                            type: 'Overly Broad Host Permission',
                            severity: 'high',
                            message: `Host permission too broad: ${host}`,
                            code: host
                        });
                    }
                });
            }
            
            // 安全でないCSP
            if (manifest.content_security_policy) {
                const csp = manifest.content_security_policy.extension_pages || manifest.content_security_policy;
                if (csp.includes('unsafe-inline') || csp.includes('unsafe-eval')) {
                    this.addIssue({
                        file: filePath,
                        line: 0,
                        type: 'Unsafe CSP',
                        severity: 'critical',
                        message: 'Content Security Policy contains unsafe directives',
                        code: csp
                    });
                }
            }
        } catch (error) {
            // JSON解析エラーは無視
        }
    }
    
    /**
     * 問題を追加
     */
    addIssue(issue) {
        this.results.issues.push(issue);
        this.results.stats[issue.severity]++;
    }
    
    /**
     * 行番号を取得
     */
    getLineNumber(content, index) {
        return content.substring(0, index).split('\n').length;
    }
    
    /**
     * レポートを生成
     */
    generateReport() {
        const report = {
            summary: {
                totalIssues: this.results.issues.length,
                scannedFiles: this.results.scannedFiles,
                ...this.results.stats
            },
            issuesByFile: {},
            issuesBySeverity: {
                critical: [],
                high: [],
                medium: [],
                low: [],
                info: []
            }
        };
        
        // ファイル別に整理
        this.results.issues.forEach(issue => {
            if (!report.issuesByFile[issue.file]) {
                report.issuesByFile[issue.file] = [];
            }
            report.issuesByFile[issue.file].push(issue);
            report.issuesBySeverity[issue.severity].push(issue);
        });
        
        return report;
    }
}

module.exports = SecurityAnalyzer;