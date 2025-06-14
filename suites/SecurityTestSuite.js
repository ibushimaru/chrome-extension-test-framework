/**
 * SecurityTestSuite - セキュリティ関連の検証テストスイート
 */

const TestSuite = require('../lib/TestSuite');
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
                    throw new Error('CSP contains unsafe-eval directive');
                }
                
                // unsafe-inlineの使用チェック
                if (cspString.includes('unsafe-inline')) {
                    console.warn('   ⚠️  CSP contains unsafe-inline directive');
                }
                
                // httpsの強制
                if (cspString.includes('http:') && !cspString.includes('http://localhost')) {
                    throw new Error('CSP should enforce HTTPS for external resources');
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
                    throw new Error(`External scripts found in ${path.basename(htmlFile)}`);
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
                if (inlineHandlerRegex.test(content)) {
                    throw new Error(`Inline event handlers found in ${path.basename(htmlFile)}`);
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
                if (evalRegex.test(content)) {
                    throw new Error(`eval() usage found in ${path.basename(jsFile)}`);
                }
                
                // Function()コンストラクタの使用チェック
                const functionRegex = /new\s+Function\s*\(/g;
                if (functionRegex.test(content)) {
                    throw new Error(`Function() constructor found in ${path.basename(jsFile)}`);
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
                if (innerHTMLRegex.test(content)) {
                    console.warn(`   ⚠️  innerHTML usage found in ${path.basename(jsFile)} - ensure proper sanitization`);
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
                    throw new Error(`Insecure HTTP URLs found in ${path.basename(file)}`);
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
                if (/localStorage\./g.test(content)) {
                    console.warn(`   ⚠️  localStorage usage in ${path.basename(jsFile)} - consider using chrome.storage API`);
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
                    if (keyword.test(content)) {
                        console.warn(`   ⚠️  Potential sensitive data handling in ${path.basename(jsFile)}`);
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
                if (/document\.write/g.test(content)) {
                    throw new Error(`document.write usage found in ${path.basename(jsFile)}`);
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