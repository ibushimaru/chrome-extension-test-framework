/**
 * SecurityTestSuite - セキュリティ関連の検証テストスイート
 */

const TestSuite = require('../lib/TestSuite');
const { SecurityError, ValidationError } = require('../lib/errors');
const fs = require('fs');
const path = require('path');

class SecurityTestSuite extends TestSuite {
    constructor(config) {
        super({
            name: 'Security Validation',
            description: 'Chrome拡張機能のセキュリティ要件を検証'
        });

        this.config = config;
        this.setupTests();
    }

    setupTests() {
        // CSP（Content Security Policy）検証
        this.test('Content Security Policy validation', async (config) => {
            const manifestPath = path.join(config.extensionPath, 'manifest.json');
            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            
            if (manifest.content_security_policy) {
                const cspString = JSON.stringify(manifest.content_security_policy);
                
                // unsafe-evalの使用チェック
                if (cspString.includes('unsafe-eval')) {
                    throw new SecurityError(
                        'Content Security Policy contains unsafe-eval directive',
                        {
                            code: 'UNSAFE_CSP_EVAL',
                            severity: 'critical',
                            suggestion: 'Remove unsafe-eval from CSP. Use JSON.parse() instead of eval() for data parsing',
                            documentation: 'https://developer.chrome.com/docs/extensions/mv3/manifest/content_security_policy/'
                        }
                    );
                }
                
                // unsafe-inlineの使用チェック
                if (cspString.includes('unsafe-inline')) {
                    console.warn('   ⚠️  CSP contains unsafe-inline directive');
                }
                
                // httpsの強制
                if (cspString.includes('http:') && !cspString.includes('http://localhost')) {
                    throw new SecurityError(
                        'Content Security Policy allows insecure HTTP resources',
                        {
                            code: 'INSECURE_CSP_HTTP',
                            severity: 'high',
                            suggestion: 'Use HTTPS for all external resources. Only allow http://localhost for development',
                            documentation: 'https://developer.chrome.com/docs/extensions/mv3/security/#https'
                        }
                    );
                }
            }
        });

        // 外部スクリプトの検証
        this.test('No external script loading', async (config) => {
            const htmlFiles = await this.findFiles(config.extensionPath, '.html');
            
            for (const htmlFile of htmlFiles) {
                const content = fs.readFileSync(htmlFile, 'utf8');
                
                // 外部スクリプトタグのチェック
                const externalScriptRegex = /<script[^>]+src=["']https?:\/\/(?!localhost)/gi;
                const matches = content.match(externalScriptRegex);
                
                if (matches) {
                    throw SecurityError.externalScript(
                        path.relative(config.extensionPath, htmlFile),
                        matches[0]
                    );
                }
            }
        });

        // インラインスクリプトの検証
        this.test('No inline scripts in HTML', async (config) => {
            const htmlFiles = await this.findFiles(config.extensionPath, '.html');
            
            for (const htmlFile of htmlFiles) {
                const content = fs.readFileSync(htmlFile, 'utf8');
                
                // インラインスクリプトのチェック
                const inlineScriptRegex = /<script[^>]*>[\s\S]*?<\/script>/gi;
                const scriptTags = content.match(inlineScriptRegex) || [];
                
                const inlineScripts = scriptTags.filter(tag => !tag.includes('src='));
                
                if (inlineScripts.length > 0) {
                    console.warn(`   ⚠️  Inline scripts found in ${path.basename(htmlFile)}`);
                }
                
                // onclickなどのインラインイベントハンドラ
                const inlineHandlerRegex = /\son\w+\s*=/gi;
                const handlerMatch = content.match(inlineHandlerRegex);
                if (handlerMatch) {
                    throw new SecurityError(
                        `Inline event handlers (${handlerMatch[0]}) violate Chrome Extension CSP`,
                        {
                            code: 'INLINE_EVENT_HANDLER',
                            file: path.relative(config.extensionPath, htmlFile),
                            severity: 'critical',
                            suggestion: 'Use addEventListener() in a separate JavaScript file instead of inline handlers',
                            example: `// Instead of:
<button onclick="doSomething()">Click</button>

// Use:
<button id="myButton">Click</button>

// In your JS file:
document.getElementById('myButton').addEventListener('click', doSomething);`,
                            documentation: 'https://developer.chrome.com/docs/extensions/mv3/security/#inline_script'
                        }
                    );
                }
            }
        });

        // eval使用の検証
        this.test('No eval() usage', async (config) => {
            const jsFiles = await this.findFiles(config.extensionPath, '.js');
            
            for (const jsFile of jsFiles) {
                const content = fs.readFileSync(jsFile, 'utf8');
                
                // eval()の使用チェック
                const evalRegex = /\beval\s*\(/g;
                const evalMatch = content.match(evalRegex);
                if (evalMatch) {
                    // Find line number
                    const lines = content.substring(0, evalMatch.index).split('\n');
                    const line = lines.length;
                    throw SecurityError.unsafeEval(
                        path.relative(config.extensionPath, jsFile),
                        line
                    );
                }
                
                // Function()コンストラクタの使用チェック
                const functionRegex = /new\s+Function\s*\(/g;
                const functionMatch = content.match(functionRegex);
                if (functionMatch) {
                    const lines = content.substring(0, functionMatch.index).split('\n');
                    const line = lines.length;
                    throw new SecurityError(
                        'Function() constructor is equivalent to eval() and violates CSP',
                        {
                            code: 'UNSAFE_FUNCTION_CONSTRUCTOR',
                            file: path.relative(config.extensionPath, jsFile),
                            line,
                            severity: 'critical',
                            suggestion: 'Use regular function declarations or arrow functions instead',
                            example: `// Instead of:
const fn = new Function('x', 'return x * 2');

// Use:
const fn = (x) => x * 2;
// Or:
function fn(x) { return x * 2; }`,
                            documentation: 'https://developer.chrome.com/docs/extensions/mv3/security/#eval'
                        }
                    );
                }
            }
        });

        // innerHTMLの安全な使用
        this.test('Safe innerHTML usage', async (config) => {
            const jsFiles = await this.findFiles(config.extensionPath, '.js');
            
            for (const jsFile of jsFiles) {
                const content = fs.readFileSync(jsFile, 'utf8');
                
                // innerHTMLの使用を検出
                const innerHTMLRegex = /\.innerHTML\s*=/g;
                const innerHTMLMatch = content.match(innerHTMLRegex);
                if (innerHTMLMatch) {
                    const lines = content.substring(0, innerHTMLMatch.index).split('\n');
                    const line = lines.length;
                    const error = SecurityError.unsafeInnerHTML(
                        path.relative(config.extensionPath, jsFile),
                        line
                    );
                    console.warn(error.getFormattedMessage());
                }
                
                // outerHTMLの使用を検出
                const outerHTMLRegex = /\.outerHTML\s*=/g;
                if (outerHTMLRegex.test(content)) {
                    console.warn(`   ⚠️  outerHTML usage found in ${path.basename(jsFile)} - ensure proper sanitization`);
                }
            }
        });

        // HTTPSの使用確認
        this.test('HTTPS enforcement', async (config) => {
            const files = await this.findFiles(config.extensionPath, ['.js', '.html', '.json']);
            
            for (const file of files) {
                const content = fs.readFileSync(file, 'utf8');
                
                // HTTPのURLを検出（localhostを除く）
                const httpRegex = /http:\/\/(?!localhost|127\.0\.0\.1)/gi;
                const matches = content.match(httpRegex);
                
                if (matches) {
                    throw SecurityError.httpResource(
                        path.relative(config.extensionPath, file),
                        matches[0]
                    );
                }
            }
        });

        // パーミッションの最小権限原則
        this.test('Least privilege permissions', async (config) => {
            const manifestPath = path.join(config.extensionPath, 'manifest.json');
            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            
            // 過度に広範なパーミッション
            const broadPermissions = [
                '<all_urls>',
                'http://*/*',
                'https://*/*',
                '*://*/*'
            ];
            
            const permissions = [
                ...(manifest.permissions || []),
                ...(manifest.host_permissions || [])
            ];
            
            const foundBroad = permissions.filter(p => broadPermissions.includes(p));
            
            if (foundBroad.length > 0) {
                console.warn(`   ⚠️  Overly broad permissions: ${foundBroad.join(', ')}`);
            }
            
            // 危険なAPIパーミッション
            const dangerousAPIs = [
                'debugger',
                'management',
                'proxy',
                'webRequest',
                'webRequestBlocking'
            ];
            
            const foundDangerous = permissions.filter(p => dangerousAPIs.includes(p));
            
            if (foundDangerous.length > 0) {
                console.warn(`   ⚠️  Powerful API permissions: ${foundDangerous.join(', ')}`);
            }
        });

        // ストレージの安全な使用
        this.test('Secure storage usage', async (config) => {
            const jsFiles = await this.findFiles(config.extensionPath, '.js');
            
            for (const jsFile of jsFiles) {
                const content = fs.readFileSync(jsFile, 'utf8');
                
                // localStorage使用の警告（chrome.storage推奨）
                const localStorageMatch = content.match(/localStorage\./g);
                if (localStorageMatch) {
                    console.warn(`   ⚠️  localStorage usage in ${path.basename(jsFile)} - consider using chrome.storage API for better security and sync capabilities`);
                }
                
                // 機密情報の可能性があるキーワード
                const sensitiveKeywords = [
                    /password/i,
                    /secret/i,
                    /token/i,
                    /api[_-]?key/i,
                    /private[_-]?key/i
                ];
                
                sensitiveKeywords.forEach(keyword => {
                    const match = content.match(keyword);
                    if (match) {
                        const lines = content.substring(0, match.index).split('\n');
                        const line = lines.length;
                        const error = SecurityError.insecureStorage(
                            path.relative(config.extensionPath, jsFile),
                            line,
                            match[0]
                        );
                        console.warn(error.getFormattedMessage());
                    }
                });
            }
        });

        // XSSの潜在的リスク
        this.test('XSS vulnerability check', async (config) => {
            const jsFiles = await this.findFiles(config.extensionPath, '.js');
            
            for (const jsFile of jsFiles) {
                const content = fs.readFileSync(jsFile, 'utf8');
                
                // documentWriteの使用
                const docWriteMatch = content.match(/document\.write/g);
                if (docWriteMatch) {
                    throw new SecurityError(
                        'document.write() can introduce XSS vulnerabilities and is blocked by CSP',
                        {
                            code: 'UNSAFE_DOCUMENT_WRITE',
                            file: path.relative(config.extensionPath, jsFile),
                            severity: 'critical',
                            suggestion: 'Use DOM methods like createElement() and appendChild() instead',
                            example: `// Instead of:
document.write('<div>Content</div>');

// Use:
const div = document.createElement('div');
div.textContent = 'Content';
document.body.appendChild(div);`,
                            documentation: 'https://developer.chrome.com/docs/extensions/mv3/security/#dom-based-xss'
                        }
                    );
                }
                
                // insertAdjacentHTMLの使用
                if (/\.insertAdjacentHTML/g.test(content)) {
                    console.warn(`   ⚠️  insertAdjacentHTML usage in ${path.basename(jsFile)} - ensure proper sanitization`);
                }
            }
        });

        // メッセージパッシングのセキュリティ
        this.test('Message passing security', async (config) => {
            const jsFiles = await this.findFiles(config.extensionPath, '.js');
            
            for (const jsFile of jsFiles) {
                const content = fs.readFileSync(jsFile, 'utf8');
                
                // メッセージリスナーの検証
                if (/chrome\.runtime\.onMessage(External)?\.addListener/g.test(content)) {
                    // 送信元の検証が行われているか
                    if (!/sender\.(id|url|origin)/g.test(content)) {
                        console.warn(`   ⚠️  Message listener in ${path.basename(jsFile)} should verify sender`);
                    }
                }
                
                // postMessageの使用
                if (/window\.postMessage/g.test(content)) {
                    console.warn(`   ⚠️  window.postMessage usage in ${path.basename(jsFile)} - ensure origin validation`);
                }
            }
        });
    }

    /**
     * ファイルを検索
     */
    async findFiles(dir, extensions) {
        const files = [];
        const exts = Array.isArray(extensions) ? extensions : [extensions];
        
        const walk = (currentDir) => {
            const entries = fs.readdirSync(currentDir);
            
            entries.forEach(entry => {
                const fullPath = path.join(currentDir, entry);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory() && !entry.startsWith('.') && entry !== 'node_modules') {
                    walk(fullPath);
                } else if (stat.isFile()) {
                    if (exts.some(ext => fullPath.endsWith(ext))) {
                        files.push(fullPath);
                    }
                }
            });
        };
        
        walk(dir);
        return files;
    }
}

module.exports = SecurityTestSuite;