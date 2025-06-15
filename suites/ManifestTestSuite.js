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
                throw new ValidationError({
                    code: ValidationError.CODES.INVALID_VERSION,
                    message: 'Invalid version format',
                    field: 'version',
                    actual: manifest.version,
                    expected: 'X.Y.Z format (e.g., 1.0.0)',
                    severity: 'high',
                    suggestion: 'Use semantic versioning format: major.minor.patch',
                    example: '"version": "1.0.0"',
                    documentation: 'https://developer.chrome.com/docs/extensions/mv3/manifest/version/'
                });
            }
        });

        // 名前の長さ制限
        this.test('Name length within limits', async (config) => {
            const manifest = await this.loadManifest(config);
            
            if (manifest.name && manifest.name.length > 45) {
                throw new ValidationError({
                    code: ValidationError.CODES.INVALID_FIELD_VALUE,
                    message: 'Name exceeds maximum length of 45 characters',
                    field: 'name',
                    actual: `${manifest.name.substring(0, 20)}... (${manifest.name.length} characters)`,
                    expected: 'string with maximum 45 characters',
                    severity: 'medium',
                    suggestion: 'Shorten the extension name to 45 characters or less',
                    example: '"name": "My Extension"',
                    documentation: 'https://developer.chrome.com/docs/extensions/mv3/manifest/name/'
                });
            }
        });

        // 説明の長さ制限
        this.test('Description length within limits', async (config) => {
            const manifest = await this.loadManifest(config);
            
            if (manifest.description && manifest.description.length > 132) {
                throw new ValidationError({
                    code: ValidationError.CODES.INVALID_FIELD_VALUE,
                    message: 'Description exceeds maximum length of 132 characters',
                    field: 'description',
                    actual: `${manifest.description.substring(0, 30)}... (${manifest.description.length} characters)`,
                    expected: 'string with maximum 132 characters',
                    severity: 'medium',
                    suggestion: 'Shorten the description to 132 characters or less',
                    example: '"description": "A brief description of your extension"',
                    documentation: 'https://developer.chrome.com/docs/extensions/mv3/manifest/description/'
                });
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
                        throw new StructureError({
                            code: StructureError.CODES.MISSING_REQUIRED_FILE,
                            message: `Icon file not found: ${iconPath}`,
                            path: iconPath,
                            missingItems: [iconPath],
                            severity: 'high',
                            suggestion: `Add the icon file at ${iconPath} or update the path in manifest.json`,
                            example: `Place a ${size}x${size} pixel PNG image at: ${iconPath}`,
                            documentation: 'https://developer.chrome.com/docs/extensions/mv3/manifest/icons/'
                        });
                    }
                }
            }
        });

        // Service Worker（Manifest V3）
        this.test('Service worker configuration', async (config) => {
            const manifest = await this.loadManifest(config);
            
            if (manifest.background) {
                if (!manifest.background.service_worker) {
                    throw new ValidationError({
                        code: ValidationError.CODES.MISSING_REQUIRED_FIELD,
                        message: 'Service worker is required for background scripts in Manifest V3',
                        field: 'background.service_worker',
                        severity: 'critical',
                        suggestion: 'Add a service_worker field to the background object',
                        example: '"background": {\n  "service_worker": "background.js"\n}',
                        documentation: 'https://developer.chrome.com/docs/extensions/mv3/background_pages/'
                    });
                }
                
                // Service Workerファイルの存在確認
                const swPath = path.join(config.extensionPath, manifest.background.service_worker);
                if (!fs.existsSync(swPath)) {
                    throw new StructureError({
                        code: StructureError.CODES.MISSING_REQUIRED_FILE,
                        message: `Service worker file not found: ${manifest.background.service_worker}`,
                        path: manifest.background.service_worker,
                        missingItems: [manifest.background.service_worker],
                        severity: 'critical',
                        suggestion: `Create the service worker file at ${manifest.background.service_worker}`,
                        example: 'Service worker handles background tasks for the extension',
                        documentation: 'https://developer.chrome.com/docs/extensions/mv3/service_workers/'
                    });
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
                        throw new ValidationError({
                            code: ValidationError.CODES.MISSING_REQUIRED_FIELD,
                            message: `Content script at index ${index} is missing matches patterns`,
                            field: `content_scripts[${index}].matches`,
                            severity: 'critical',
                            suggestion: 'Add matches patterns to specify which pages the content script should run on',
                            example: '"matches": ["https://*.example.com/*"]',
                            documentation: 'https://developer.chrome.com/docs/extensions/mv3/content_scripts/'
                        });
                    }
                    
                    // スクリプトファイルの存在確認
                    if (script.js) {
                        script.js.forEach(jsPath => {
                            const fullPath = path.join(config.extensionPath, jsPath);
                            if (!fs.existsSync(fullPath)) {
                                throw new StructureError({
                                    code: StructureError.CODES.MISSING_REQUIRED_FILE,
                                    message: `Content script file not found: ${jsPath}`,
                                    path: jsPath,
                                    missingItems: [jsPath],
                                    severity: 'critical',
                                    details: {
                                        scriptIndex: index
                                    },
                                    suggestion: `Create the content script file at ${jsPath}`,
                                    example: `Content script file (index: ${index})`,
                                    documentation: 'https://developer.chrome.com/docs/extensions/mv3/content_scripts/'
                                });
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
                        throw new ValidationError({
                            code: ValidationError.CODES.MISSING_REQUIRED_FIELD,
                            message: `Web accessible resource at index ${index} is missing resources array`,
                            field: `web_accessible_resources[${index}].resources`,
                            severity: 'high',
                            suggestion: 'Add a resources array listing the files to make accessible',
                            example: '"resources": ["images/*.png", "styles/*.css"]',
                            documentation: 'https://developer.chrome.com/docs/extensions/mv3/manifest/web_accessible_resources/'
                        });
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
                    throw new StructureError({
                        code: StructureError.CODES.MISSING_REQUIRED_FILE,
                        message: `Default locale directory not found: _locales/${manifest.default_locale}`,
                        path: `_locales/${manifest.default_locale}`,
                        missingItems: [`_locales/${manifest.default_locale}`],
                        severity: 'high',
                        suggestion: `Create the locale directory at _locales/${manifest.default_locale}`,
                        example: 'Directory for default locale messages',
                        documentation: 'https://developer.chrome.com/docs/extensions/reference/i18n/'
                    });
                }
                
                const messagesFile = path.join(localesDir, 'messages.json');
                if (!fs.existsSync(messagesFile)) {
                    throw new StructureError({
                        code: StructureError.CODES.MISSING_REQUIRED_FILE,
                        message: `Messages file not found for default locale: _locales/${manifest.default_locale}/messages.json`,
                        path: `_locales/${manifest.default_locale}/messages.json`,
                        missingItems: [`_locales/${manifest.default_locale}/messages.json`],
                        severity: 'high',
                        suggestion: `Create a messages.json file in _locales/${manifest.default_locale}/`,
                        example: '{\n  "appName": {\n    "message": "My Extension"\n  }\n}',
                        documentation: 'https://developer.chrome.com/docs/extensions/reference/i18n/'
                    });
                }
            }
        });
    }
}

module.exports = ManifestTestSuite;