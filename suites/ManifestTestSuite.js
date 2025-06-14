/**
 * ManifestTestSuite - manifest.jsonの検証テストスイート
 */

const TestSuite = require('../lib/TestSuite');
const TestCase = require('../lib/TestCase');
const Validator = require('../lib/Validator');
const fs = require('fs');
const path = require('path');

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
            
            const allPermissions = [
                ...(manifest.permissions || []),
                ...(manifest.host_permissions || [])
            ];
            
            // 危険なパーミッションの警告
            const dangerousPermissions = ['<all_urls>', 'http://*/*', 'https://*/*'];
            const foundDangerous = allPermissions.filter(p => dangerousPermissions.includes(p));
            
            if (foundDangerous.length > 0) {
                console.warn(`   ⚠️  Broad host permissions detected: ${foundDangerous.join(', ')}`);
            }
            
            // 非推奨のパーミッション
            const deprecatedPermissions = ['background', 'unlimitedStorage'];
            const foundDeprecated = allPermissions.filter(p => deprecatedPermissions.includes(p));
            
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
    }
}

module.exports = ManifestTestSuite;