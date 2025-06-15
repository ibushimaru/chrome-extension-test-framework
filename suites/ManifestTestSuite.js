/**
 * ManifestTestSuite - manifest.jsonの検証テストスイート
 */

const TestSuite = require('../lib/TestSuite');
const TestCase = require('../lib/TestCase');
const Validator = require('../lib/Validator');
const { ValidationError, StructureError } = require('../lib/errors');
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
                throw new StructureError({
                    code: StructureError.CODES.MISSING_REQUIRED_FILE,
                    message: 'manifest.json file is missing',
                    path: manifestPath,
                    missingItems: ['manifest.json'],
                    suggestion: 'Create a manifest.json file in the root of your extension',
                    example: '{\n  "manifest_version": 3,\n  "name": "My Extension",\n  "version": "1.0.0"\n}',
                    documentation: 'https://developer.chrome.com/docs/extensions/mv3/manifest/'
                });
            }
        });

        // JSONの妥当性確認
        this.test('Valid JSON format', async (config) => {
            const manifestPath = path.join(config.extensionPath, 'manifest.json');
            const content = fs.readFileSync(manifestPath, 'utf8');
            
            try {
                JSON.parse(content);
            } catch (error) {
                throw new ValidationError({
                    code: ValidationError.CODES.INVALID_FORMAT,
                    message: 'Invalid JSON format in manifest.json',
                    field: 'manifest.json',
                    details: {
                        parseError: error.message,
                        line: error.message.match(/position (\d+)/)?.[1] || 'unknown'
                    },
                    suggestion: 'Fix the JSON syntax errors in your manifest.json file',
                    example: 'Use a JSON validator or editor with syntax highlighting',
                    documentation: 'https://developer.chrome.com/docs/extensions/mv3/manifest/'
                });
            }
        });

        // Manifest V3確認
        this.test('Manifest version is 3', async (config) => {
            const manifest = await this.loadManifest(config);
            
            if (manifest.manifest_version !== 3) {
                throw new ValidationError({
                    code: ValidationError.CODES.INVALID_VERSION,
                    message: 'Invalid manifest version',
                    field: 'manifest_version',
                    expected: 3,
                    actual: manifest.manifest_version,
                    severity: 'critical',
                    suggestion: 'Update manifest_version to 3 for Manifest V3 compatibility',
                    example: '"manifest_version": 3',
                    documentation: 'https://developer.chrome.com/docs/extensions/mv3/intro/mv3-migration/'
                });
            }
        });

        // 必須フィールド確認
        this.test('Required fields present', async (config) => {
            const manifest = await this.loadManifest(config);
            
            const required = ['manifest_version', 'name', 'version'];
            const missing = required.filter(field => !(field in manifest));
            
            if (missing.length > 0) {
                const field = missing[0];
                const examples = {
                    name: '"name": "My Extension"',
                    version: '"version": "1.0.0"',
                    manifest_version: '"manifest_version": 3'
                };
                
                throw new ValidationError({
                    code: ValidationError.CODES.MISSING_REQUIRED_FIELD,
                    message: `Required field "${field}" is missing from manifest.json`,
                    field: field,
                    severity: 'critical',
                    details: {
                        missingFields: missing,
                        totalRequired: required.length
                    },
                    suggestion: `Add the "${field}" field to your manifest.json file`,
                    example: examples[field] || `"${field}": "value"`,
                    documentation: 'https://developer.chrome.com/docs/extensions/mv3/manifest/'
                });
            }
        });

        // バージョン形式確認
        this.test('Version format valid', async (config) => {
            const manifest = await this.loadManifest(config);
            
            const versionRegex = /^\d+(\.\d+){0,3}$/;
            if (!versionRegex.test(manifest.version)) {
                throw ValidationError.invalidVersion(manifest.version);
            }
        });

        // 名前の長さ制限
        this.test('Name length within limits', async (config) => {
            const manifest = await this.loadManifest(config);
            
            if (manifest.name && manifest.name.length > 45) {
                throw ValidationError.invalidFieldValue(
                    'name',
                    `${manifest.name.substring(0, 20)}... (${manifest.name.length} characters)`,
                    'string with maximum 45 characters'
                );
            }
        });

        // 説明の長さ制限
        this.test('Description length within limits', async (config) => {
            const manifest = await this.loadManifest(config);
            
            if (manifest.description && manifest.description.length > 132) {
                throw ValidationError.invalidFieldValue(
                    'description',
                    `${manifest.description.substring(0, 30)}... (${manifest.description.length} characters)`,
                    'string with maximum 132 characters'
                );
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
                        throw StructureError.fileNotFound(
                            iconPath,
                            `Icon file for size ${size}x${size} pixels`
                        );
                    }
                }
            }
        });

        // Service Worker（Manifest V3）
        this.test('Service worker configuration', async (config) => {
            const manifest = await this.loadManifest(config);
            
            if (manifest.background) {
                if (!manifest.background.service_worker) {
                    throw ValidationError.missingRequiredField(
                        'background.service_worker',
                        'background configuration'
                    );
                }
                
                // Service Workerファイルの存在確認
                const swPath = path.join(config.extensionPath, manifest.background.service_worker);
                if (!fs.existsSync(swPath)) {
                    throw StructureError.fileNotFound(
                        manifest.background.service_worker,
                        'Service worker handles background tasks for the extension'
                    );
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
                        throw ValidationError.missingRequiredField(
                            `content_scripts[${index}].matches`,
                            'content script configuration'
                        );
                    }
                    
                    // スクリプトファイルの存在確認
                    if (script.js) {
                        script.js.forEach(jsPath => {
                            const fullPath = path.join(config.extensionPath, jsPath);
                            if (!fs.existsSync(fullPath)) {
                                throw StructureError.fileNotFound(
                                    jsPath,
                                    `Content script file (index: ${index})`
                                );
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
                        throw ValidationError.missingRequiredField(
                            `web_accessible_resources[${index}].resources`,
                            'web accessible resources configuration'
                        );
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
                    throw StructureError.fileNotFound(
                        `_locales/${manifest.default_locale}`,
                        'Directory for default locale messages'
                    );
                }
                
                const messagesFile = path.join(localesDir, 'messages.json');
                if (!fs.existsSync(messagesFile)) {
                    throw StructureError.fileNotFound(
                        `_locales/${manifest.default_locale}/messages.json`,
                        'Localization messages file'
                    );
                }
            }
        });
    }
}

module.exports = ManifestTestSuite;