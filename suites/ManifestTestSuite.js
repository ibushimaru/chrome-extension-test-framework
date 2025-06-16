/**
 * ManifestTestSuite - manifest.jsonの検証テストスイート
 */

const TestSuite = require('../lib/TestSuite');
const TestCase = require('../lib/TestCase');
const Validator = require('../lib/Validator');
const fs = require('fs');
const path = require('path');
const PermissionsAnalyzer = require('../lib/PermissionsAnalyzer');
const PermissionDetector = require('../lib/PermissionDetector');

class ManifestTestSuite extends TestSuite {
    constructor(config) {
        super({
            name: 'Manifest Validation',
            description: 'Chrome拡張機能のmanifest.jsonを検証',
            config: config  // configを親クラスに渡す
        });

        this.config = config;
        this.setupTests();
    }

    setupTests() {
        // manifest.jsonの存在確認
        this.test('manifest.json exists', async (config) => {
            const manifestPath = path.join(config.extensionPath, 'manifest.json');
            if (!fs.existsSync(manifestPath)) {
                throw new Error('manifest.json not found');
            }
        });

        // JSONの妥当性確認
        this.test('Valid JSON format', async (config) => {
            const manifestPath = path.join(config.extensionPath, 'manifest.json');
            const content = fs.readFileSync(manifestPath, 'utf8');
            
            try {
                JSON.parse(content);
            } catch (error) {
                throw new Error(`Invalid JSON: ${error.message}`);
            }
        });

        // Manifest V3確認
        this.test('Manifest version is 3', async (config) => {
            const manifest = await this.loadManifest(config);
            
            if (manifest.manifest_version !== 3) {
                throw new Error(`Expected manifest_version 3, got ${manifest.manifest_version}`);
            }
        });

        // 必須フィールド確認
        this.test('Required fields present', async (config) => {
            const manifest = await this.loadManifest(config);
            
            const required = ['manifest_version', 'name', 'version'];
            const missing = required.filter(field => !(field in manifest));
            
            if (missing.length > 0) {
                throw new Error(`Missing required fields: ${missing.join(', ')}`);
            }
        });

        // バージョン形式確認
        this.test('Version format valid', async (config) => {
            const manifest = await this.loadManifest(config);
            
            const versionRegex = /^\d+(\.\d+){0,3}$/;
            if (!versionRegex.test(manifest.version)) {
                throw new Error(`Invalid version format: ${manifest.version}`);
            }
        });

        // 名前の長さ制限
        this.test('Name length within limits', async (config) => {
            const manifest = await this.loadManifest(config);
            
            if (manifest.name && manifest.name.length > 45) {
                throw new Error(`Name too long: ${manifest.name.length} characters (max 45)`);
            }
        });

        // 説明の長さ制限
        this.test('Description length within limits', async (config) => {
            const manifest = await this.loadManifest(config);
            
            if (manifest.description && manifest.description.length > 132) {
                throw new Error(`Description too long: ${manifest.description.length} characters (max 132)`);
            }
        });

        // アイコンの検証
        this.test('Icons configuration', async (config) => {
            const manifest = await this.loadManifest(config);
            
            if (manifest.icons) {
                const recommendedSizes = ['16', '48', '128'];
                const missingSizes = recommendedSizes.filter(size => !(size in manifest.icons));
                
                if (missingSizes.length > 0) {
                    console.warn(`   ⚠️  Missing recommended icon sizes: ${missingSizes.join(', ')}`);
                }
                
                // 各アイコンファイルの存在確認
                for (const [size, iconPath] of Object.entries(manifest.icons)) {
                    const fullPath = path.join(config.extensionPath, iconPath);
                    if (!fs.existsSync(fullPath)) {
                        throw new Error(`Icon file not found: ${iconPath}`);
                    }
                }
            }
        });

        // Service Worker（Manifest V3）
        this.test('Service worker configuration', async (config) => {
            const manifest = await this.loadManifest(config);
            
            if (manifest.background) {
                if (!manifest.background.service_worker) {
                    throw new Error('Manifest V3 requires service_worker in background');
                }
                
                // Service Workerファイルの存在確認
                const swPath = path.join(config.extensionPath, manifest.background.service_worker);
                if (!fs.existsSync(swPath)) {
                    throw new Error(`Service worker file not found: ${manifest.background.service_worker}`);
                }
            }
        });

        // Content Scripts検証
        this.test('Content scripts validation', async (config) => {
            const manifest = await this.loadManifest(config);
            
            if (manifest.content_scripts) {
                manifest.content_scripts.forEach((script, index) => {
                    // matchesパターンの確認
                    if (!script.matches || script.matches.length === 0) {
                        throw new Error(`Content script ${index} missing matches pattern`);
                    }
                    
                    // スクリプトファイルの存在確認
                    if (script.js) {
                        script.js.forEach(jsPath => {
                            const fullPath = path.join(config.extensionPath, jsPath);
                            if (!fs.existsSync(fullPath)) {
                                throw new Error(`Content script file not found: ${jsPath}`);
                            }
                        });
                    }
                });
            }
        });

        // パーミッション検証
        this.test('Permissions validation', async (config) => {
            const manifest = await this.loadManifest(config);
            
            // 詳細な権限分析
            const permAnalyzer = new PermissionsAnalyzer();
            const analysis = permAnalyzer.analyze(manifest);
            
            // センシティブな権限がある場合は詳細を表示
            if (analysis.sensitivePermissions.length > 0) {
                console.warn('   ⚠️  Sensitive permissions detected:');
                analysis.sensitivePermissions.forEach(perm => {
                    console.warn(`      • ${perm.name}: ${perm.description}`);
                });
            }
            
            // 幅広いホスト権限の警告
            const broadHostPerms = analysis.hostPermissions.filter(h => h.risk === 'high');
            if (broadHostPerms.length > 0) {
                console.warn('   🌐 Broad host permissions detected:');
                broadHostPerms.forEach(host => {
                    console.warn(`      • ${host.pattern}: ${host.description}`);
                });
            }
            
            // 推奨事項を表示
            if (analysis.recommendations.length > 0 && config.verbose) {
                console.log('   💡 Permission recommendations:');
                analysis.recommendations.forEach(rec => {
                    console.log(`      • ${rec.message}`);
                });
            }
            
            // 非推奨のパーミッション
            const deprecatedPermissions = ['background', 'unlimitedStorage'];
            const foundDeprecated = (manifest.permissions || []).filter(p => deprecatedPermissions.includes(p));
            
            if (foundDeprecated.length > 0) {
                console.warn(`   ⚠️  Deprecated permissions: ${foundDeprecated.join(', ')}`);
            }
        });

        // Web Accessible Resources検証
        this.test('Web accessible resources', async (config) => {
            const manifest = await this.loadManifest(config);
            
            if (manifest.web_accessible_resources) {
                manifest.web_accessible_resources.forEach((resource, index) => {
                    if (!resource.resources || resource.resources.length === 0) {
                        throw new Error(`Web accessible resource ${index} missing resources`);
                    }
                    
                    if (!resource.matches || resource.matches.length === 0) {
                        console.warn(`   ⚠️  Web accessible resource ${index} has no matches restriction`);
                    }
                });
            }
        });

        // デフォルトロケール検証
        this.test('Default locale validation', async (config) => {
            const manifest = await this.loadManifest(config);
            
            if (manifest.default_locale) {
                const localesDir = path.join(config.extensionPath, '_locales', manifest.default_locale);
                if (!fs.existsSync(localesDir)) {
                    throw new Error(`Default locale directory not found: _locales/${manifest.default_locale}`);
                }
                
                const messagesFile = path.join(localesDir, 'messages.json');
                if (!fs.existsSync(messagesFile)) {
                    throw new Error(`Messages file not found for default locale: ${manifest.default_locale}`);
                }
            }
        });

        // Chrome Action API検証（Manifest V3）
        this.test('Chrome action API validation', async (config) => {
            const manifest = await this.loadManifest(config);
            
            // 廃止されたAPIの使用チェック
            if (manifest.browser_action) {
                throw new Error('browser_action is deprecated in Manifest V3. Use action instead.');
            }
            
            if (manifest.page_action) {
                throw new Error('page_action is deprecated in Manifest V3. Use action instead.');
            }
            
            // action APIの検証
            if (manifest.action) {
                // default_popupの検証
                if (manifest.action.default_popup) {
                    const popupPath = path.join(config.extensionPath, manifest.action.default_popup);
                    if (!fs.existsSync(popupPath)) {
                        throw new Error(`Action popup file not found: ${manifest.action.default_popup}`);
                    }
                    
                    // HTMLファイルかチェック
                    if (!manifest.action.default_popup.endsWith('.html')) {
                        console.warn(`   ⚠️  Action popup should be an HTML file`);
                    }
                }
                
                // default_iconの検証
                if (manifest.action.default_icon) {
                    if (typeof manifest.action.default_icon === 'string') {
                        // 文字列の場合
                        const iconPath = path.join(config.extensionPath, manifest.action.default_icon);
                        if (!fs.existsSync(iconPath)) {
                            throw new Error(`Action icon file not found: ${manifest.action.default_icon}`);
                        }
                    } else if (typeof manifest.action.default_icon === 'object') {
                        // オブジェクトの場合（推奨）
                        const recommendedSizes = ['16', '24', '32'];
                        for (const [size, iconPath] of Object.entries(manifest.action.default_icon)) {
                            const fullPath = path.join(config.extensionPath, iconPath);
                            if (!fs.existsSync(fullPath)) {
                                throw new Error(`Action icon file not found: ${iconPath}`);
                            }
                        }
                        
                        // 推奨サイズの確認
                        const missingSizes = recommendedSizes.filter(size => !(size in manifest.action.default_icon));
                        if (missingSizes.length > 0) {
                            console.warn(`   ⚠️  Missing recommended action icon sizes: ${missingSizes.join(', ')}`);
                        }
                    }
                }
                
                // default_titleの検証
                if (manifest.action.default_title && manifest.action.default_title.length > 40) {
                    console.warn(`   ⚠️  Action title might be too long: ${manifest.action.default_title.length} characters`);
                }
            }
        });

        // Declarative Net Request API検証
        this.test('Declarative net request validation', async (config) => {
            const manifest = await this.loadManifest(config);
            
            // webRequestの使用チェック（制限されている）
            if (manifest.permissions?.includes('webRequest')) {
                console.warn(`   ⚠️  webRequest permission is limited in Manifest V3. Consider using declarativeNetRequest`);
            }
            
            // declarativeNetRequestの検証
            if (manifest.declarative_net_request) {
                const dnr = manifest.declarative_net_request;
                
                // ルールリソースの検証
                if (dnr.rule_resources) {
                    dnr.rule_resources.forEach((resource, index) => {
                        if (!resource.id) {
                            throw new Error(`Rule resource ${index} missing id`);
                        }
                        
                        if (!resource.path) {
                            throw new Error(`Rule resource ${resource.id} missing path`);
                        }
                        
                        // ルールファイルの存在確認
                        const rulePath = path.join(config.extensionPath, resource.path);
                        if (!fs.existsSync(rulePath)) {
                            throw new Error(`Rule file not found: ${resource.path}`);
                        }
                        
                        // ルールファイルの検証
                        try {
                            const ruleContent = fs.readFileSync(rulePath, 'utf8');
                            const rules = JSON.parse(ruleContent);
                            
                            if (!Array.isArray(rules)) {
                                throw new Error(`Rule file ${resource.path} must contain an array of rules`);
                            }
                            
                            // ルール数の制限チェック
                            if (resource.enabled && rules.length > 5000) {
                                console.warn(`   ⚠️  Rule resource ${resource.id} has ${rules.length} rules (max 5000 for enabled rulesets)`);
                            }
                        } catch (error) {
                            if (error.name === 'SyntaxError') {
                                throw new Error(`Invalid JSON in rule file ${resource.path}: ${error.message}`);
                            }
                            throw error;
                        }
                    });
                }
            }
        });

        // Chrome Scripting API検証
        this.test('Chrome scripting API validation', async (config) => {
            const manifest = await this.loadManifest(config);
            
            // scripting権限の確認
            const hasScriptingPermission = manifest.permissions?.includes('scripting');
            const hasActiveTabPermission = manifest.permissions?.includes('activeTab');
            
            // JavaScriptファイルでのAPI使用をチェック
            const jsFiles = this.findJavaScriptFiles(config.extensionPath);
            let usesOldAPI = false;
            let usesNewAPI = false;
            let oldAPIUsage = [];
            let newAPIUsage = [];
            
            for (const file of jsFiles) {
                const content = fs.readFileSync(file, 'utf8');
                const relativePath = path.relative(config.extensionPath, file);
                
                // 旧API（tabs.executeScript）の使用検出
                if (/chrome\.tabs\.executeScript/g.test(content)) {
                    usesOldAPI = true;
                    oldAPIUsage.push(relativePath);
                }
                
                // 旧API（tabs.insertCSS）の使用検出
                if (/chrome\.tabs\.insertCSS/g.test(content)) {
                    usesOldAPI = true;
                    oldAPIUsage.push(relativePath);
                }
                
                // 新API（scripting.executeScript）の使用検出
                if (/chrome\.scripting\.executeScript/g.test(content)) {
                    usesNewAPI = true;
                    newAPIUsage.push(relativePath);
                    
                    // scripting権限がない場合
                    if (!hasScriptingPermission) {
                        throw new Error('chrome.scripting API is used but "scripting" permission is not declared');
                    }
                }
                
                // 新API（scripting.insertCSS）の使用検出
                if (/chrome\.scripting\.insertCSS/g.test(content)) {
                    usesNewAPI = true;
                    newAPIUsage.push(relativePath);
                    
                    if (!hasScriptingPermission) {
                        throw new Error('chrome.scripting API is used but "scripting" permission is not declared');
                    }
                }
                
                // 新API（scripting.removeCSS）の使用検出
                if (/chrome\.scripting\.removeCSS/g.test(content)) {
                    usesNewAPI = true;
                    newAPIUsage.push(relativePath);
                    
                    if (!hasScriptingPermission) {
                        throw new Error('chrome.scripting API is used but "scripting" permission is not declared');
                    }
                }
            }
            
            // 旧APIの使用に対する警告
            if (usesOldAPI) {
                console.warn(`   ⚠️  Deprecated API usage detected:`);
                [...new Set(oldAPIUsage)].forEach(file => {
                    console.warn(`      - ${file}: tabs.executeScript/insertCSS is deprecated`);
                });
                console.warn(`   💡 Migrate to chrome.scripting API for Manifest V3 compatibility`);
            }
            
            // host_permissionsの確認（scripting APIに必要）
            if (usesNewAPI && !manifest.host_permissions && !hasActiveTabPermission) {
                console.warn(`   ⚠️  chrome.scripting API requires host_permissions or activeTab permission`);
            }
            
            // optional_host_permissionsの確認
            if (manifest.optional_host_permissions && usesNewAPI) {
                console.log(`   ℹ️  Optional host permissions detected. Ensure proper permission handling in code`);
            }
        });

        // Minimum Chrome Version検証
        this.test('Minimum Chrome version', async (config) => {
            const manifest = await this.loadManifest(config);
            
            // Manifest V3の最小バージョン
            const MANIFEST_V3_MIN_VERSION = 88;
            
            if (manifest.minimum_chrome_version) {
                const version = parseInt(manifest.minimum_chrome_version.split('.')[0]);
                
                if (version < MANIFEST_V3_MIN_VERSION) {
                    throw new Error(`Minimum Chrome version ${version} is too low for Manifest V3. Requires Chrome ${MANIFEST_V3_MIN_VERSION} or higher`);
                }
                
                // 特定のAPIに必要なバージョン
                const apiRequirements = {
                    'chrome.action': 88,
                    'chrome.scripting': 88,
                    'chrome.storage.session': 102,
                    'chrome.declarativeNetRequest': 84
                };
                
                // 使用されているAPIをチェック
                const warnings = [];
                if (manifest.action && version < apiRequirements['chrome.action']) {
                    warnings.push(`chrome.action requires Chrome ${apiRequirements['chrome.action']}+`);
                }
                if (manifest.permissions?.includes('scripting') && version < apiRequirements['chrome.scripting']) {
                    warnings.push(`chrome.scripting requires Chrome ${apiRequirements['chrome.scripting']}+`);
                }
                if (manifest.permissions?.includes('storage') && version < apiRequirements['chrome.storage.session']) {
                    console.warn(`   ℹ️  chrome.storage.session requires Chrome ${apiRequirements['chrome.storage.session']}+`);
                }
                
                if (warnings.length > 0) {
                    warnings.forEach(warning => console.warn(`   ⚠️  ${warning}`));
                }
            } else {
                console.warn(`   ⚠️  No minimum_chrome_version specified. Consider setting it to 88 or higher for Manifest V3`);
            }
        });

        // ファントム権限の検出（実際に使用されていない権限）
        this.test('Phantom permissions detection', async (config) => {
            const manifest = await this.loadManifest(config);
            const detector = new PermissionDetector();
            
            // すべてのJavaScriptファイルを取得
            const jsFiles = await this.getAllFiles('', [], { skipExclude: false });
            const files = [];
            
            for (const filePath of jsFiles.filter(f => f.endsWith('.js'))) {
                const fullPath = path.join(config.extensionPath, filePath);
                const content = fs.readFileSync(fullPath, 'utf8');
                files.push({ path: filePath, content });
            }
            
            // 使用されている権限を検出
            const detectedPermissions = detector.detectUsedPermissions(files);
            
            // マニフェストと比較
            const comparison = detector.compareWithManifest(manifest, detectedPermissions);
            
            // 未使用の権限を報告
            if (comparison.unusedPermissions.length > 0) {
                console.warn('   ⚠️  Unused permissions detected (phantom permissions):');
                comparison.unusedPermissions.forEach(perm => {
                    console.warn(`      • ${perm} - declared but not used in code`);
                });
                console.warn('   💡 Consider removing unused permissions to follow the principle of least privilege');
            }
            
            // 不足している権限を報告
            if (comparison.missingPermissions.length > 0) {
                throw new Error(`Missing required permissions: ${comparison.missingPermissions.join(', ')}`);
            }
            
            // 広範なホスト権限の警告
            if (comparison.unusedHosts.length > 0) {
                const broadPatterns = comparison.unusedHosts.filter(h => 
                    h === '<all_urls>' || h === '*://*/*' || h === 'http://*/*' || h === 'https://*/*'
                );
                if (broadPatterns.length > 0) {
                    console.warn('   ⚠️  Overly broad host permissions detected:');
                    broadPatterns.forEach(pattern => {
                        console.warn(`      • ${pattern} - consider using activeTab or specific domains`);
                    });
                }
            }
            
            // API使用状況のサマリー（verboseモード）
            if (config.verbose && Object.keys(detectedPermissions.apiUsage).length > 0) {
                console.log('   📊 Chrome API usage detected:');
                Object.entries(detectedPermissions.apiUsage)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 10)
                    .forEach(([api, count]) => {
                        console.log(`      • ${api}: ${count} calls`);
                    });
            }
        });
    }

    /**
     * JavaScriptファイルを検索
     */
    findJavaScriptFiles(extensionPath) {
        const files = [];
        
        function traverse(dir) {
            try {
                const items = fs.readdirSync(dir);
                
                for (const item of items) {
                    const itemPath = path.join(dir, item);
                    const stat = fs.statSync(itemPath);
                    
                    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
                        traverse(itemPath);
                    } else if (stat.isFile() && item.endsWith('.js')) {
                        files.push(itemPath);
                    }
                }
            } catch (error) {
                // ディレクトリが読めない場合はスキップ
            }
        }
        
        traverse(extensionPath);
        return files;
    }
}

module.exports = ManifestTestSuite;