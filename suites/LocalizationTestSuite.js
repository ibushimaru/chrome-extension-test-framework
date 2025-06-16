/**
 * LocalizationTestSuite - 多言語対応の検証テストスイート
 */

const TestSuite = require('../lib/TestSuite');
const fs = require('fs');
const path = require('path');

class LocalizationTestSuite extends TestSuite {
    constructor(config) {
        super({
            name: 'Localization Validation',
            description: 'Chrome拡張機能の多言語対応を検証',
            config: config
        });

        this.config = config;
        this.setupTests();
    }

    setupTests() {
        // _localesディレクトリの存在確認
        this.test('Locales directory exists', async (config) => {
            const manifest = await this.loadManifest(config);
            
            // default_localeが設定されている場合、_localesは必須
            if (manifest.default_locale) {
                if (!await this.fileExists('_locales')) {
                    throw new Error('_locales directory is required when default_locale is set');
                }
            } else {
                // default_localeが設定されていない場合
                if (await this.fileExists('_locales')) {
                    // エラーではなく警告にする
                    console.warn('   ⚠️  _locales directory exists but default_locale is not set');
                    console.warn('      Consider setting default_locale in manifest.json or removing _locales');
                } else {
                    console.log('   ℹ️  No localization configured');
                }
                
                // 以降のテストはスキップ
                this.tests = this.tests.slice(0, 1);
                return;
            }
        });

        // デフォルトロケールの検証
        this.test('Default locale validation', async (config) => {
            const manifest = await this.loadManifest(config);
            
            if (!manifest.default_locale) {
                return; // 前のテストでスキップ済み
            }
            
            const defaultLocalePath = path.join('_locales', manifest.default_locale);
            if (!await this.fileExists(defaultLocalePath)) {
                throw new Error(`Default locale directory not found: ${defaultLocalePath}`);
            }
            
            const messagesPath = path.join(defaultLocalePath, 'messages.json');
            if (!await this.fileExists(messagesPath)) {
                throw new Error(`Messages file not found: ${messagesPath}`);
            }
        });

        // サポートされているロケールの一覧
        this.test('Supported locales', async (config) => {
            const manifest = await this.loadManifest(config);
            if (!manifest.default_locale) return;
            
            const localesPath = path.join(config.extensionPath, '_locales');
            if (!fs.existsSync(localesPath)) return;
            
            const locales = await this.readDirectory('_locales');
            console.log(`   🌍 Supported locales: ${locales.join(', ')}`);
            
            // 推奨ロケール（多すぎるので主要なものだけに）
            const recommendedLocales = ['en'];
            const missingRecommended = recommendedLocales.filter(locale => !locales.includes(locale));
            
            if (missingRecommended.length > 0 && !locales.includes('en_US') && !locales.includes('en_GB')) {
                // 英語のバリエーションがない場合のみ警告
                console.log(`   💡 Consider adding English locale: ${missingRecommended.join(', ')}`);
            }
        });

        // messages.jsonの形式検証
        this.test('Messages format validation', async (config) => {
            const manifest = await this.loadManifest(config);
            if (!manifest.default_locale) return;
            
            const localesPath = path.join(config.extensionPath, '_locales');
            if (!fs.existsSync(localesPath)) return;
            
            const locales = await this.readDirectory('_locales');
            
            for (const locale of locales) {
                const messagesPath = path.join('_locales', locale, 'messages.json');
                
                try {
                    const messages = await this.loadJSON(messagesPath);
                    
                    // 各メッセージの形式確認
                    for (const [key, value] of Object.entries(messages)) {
                        if (!value.message) {
                            throw new Error(`Missing 'message' property for key '${key}' in ${locale}`);
                        }
                        
                        // プレースホルダーの検証
                        if (value.placeholders) {
                            const placeholderPattern = /\$([A-Z_]+)\$/g;
                            const usedPlaceholders = value.message.match(placeholderPattern) || [];
                            const definedPlaceholders = Object.keys(value.placeholders);
                            
                            usedPlaceholders.forEach(placeholder => {
                                const name = placeholder.replace(/\$/g, '').toLowerCase();
                                if (!definedPlaceholders.includes(name)) {
                                    console.warn(`   ⚠️  Placeholder ${placeholder} used but not defined in ${locale}/${key}`);
                                }
                            });
                        }
                    }
                } catch (error) {
                    throw new Error(`Invalid messages.json in ${locale}: ${error.message}`);
                }
            }
        });

        // ロケール間の一貫性チェック
        this.test('Consistency across locales', async (config) => {
            const manifest = await this.loadManifest(config);
            if (!manifest.default_locale) return;
            
            const localesPath = path.join(config.extensionPath, '_locales');
            if (!fs.existsSync(localesPath)) return;
            
            const locales = await this.readDirectory('_locales');
            if (locales.length < 2) return; // 比較するロケールが不足
            
            // 各ロケールのメッセージキーを収集
            const messagesByLocale = {};
            
            for (const locale of locales) {
                const messagesPath = path.join('_locales', locale, 'messages.json');
                try {
                    const messages = await this.loadJSON(messagesPath);
                    messagesByLocale[locale] = Object.keys(messages);
                } catch (error) {
                    // エラーは別のテストで処理
                }
            }
            
            // デフォルトロケールのキーを基準に比較
            const defaultKeys = messagesByLocale[manifest.default_locale] || [];
            const issues = [];
            
            for (const [locale, keys] of Object.entries(messagesByLocale)) {
                if (locale === manifest.default_locale) continue;
                
                // 不足しているキー
                const missingKeys = defaultKeys.filter(key => !keys.includes(key));
                if (missingKeys.length > 0) {
                    issues.push(`${locale} is missing: ${missingKeys.join(', ')}`);
                }
                
                // 余分なキー
                const extraKeys = keys.filter(key => !defaultKeys.includes(key));
                if (extraKeys.length > 0) {
                    issues.push(`${locale} has extra: ${extraKeys.join(', ')}`);
                }
            }
            
            if (issues.length > 0) {
                console.warn('   ⚠️  Inconsistencies found:');
                issues.forEach(issue => console.warn(`      - ${issue}`));
            }
        });

        // 国際化の使用状況
        this.test('i18n API usage', async (config) => {
            const manifest = await this.loadManifest(config);
            if (!manifest.default_locale) return;
            
            const allFiles = await this.getAllFiles();
            const jsFiles = allFiles.filter(file => file.endsWith('.js'));
            const htmlFiles = allFiles.filter(file => file.endsWith('.html'));
            
            let i18nUsageCount = 0;
            let hardcodedStrings = [];
            
            // JavaScriptファイルでのi18n使用
            for (const jsFile of jsFiles) {
                const content = await this.loadFile(jsFile);
                
                // chrome.i18n.getMessage()の使用
                const i18nCalls = content.match(/chrome\.i18n\.getMessage\s*\(/g) || [];
                i18nUsageCount += i18nCalls.length;
                
                // ハードコードされた文字列の検出（簡易的）
                const stringLiterals = content.match(/['"]([^'"]{10,})['"](?!\s*[,:])/g) || [];
                const suspiciousStrings = stringLiterals.filter(str => {
                    const cleaned = str.replace(/['"]/g, '');
                    return /[A-Z]/.test(cleaned) && /\s/.test(cleaned); // 大文字とスペースを含む
                });
                
                if (suspiciousStrings.length > 0) {
                    hardcodedStrings.push({ file: jsFile, count: suspiciousStrings.length });
                }
            }
            
            // HTMLファイルでのi18n使用
            for (const htmlFile of htmlFiles) {
                const content = await this.loadFile(htmlFile);
                
                // data-i18n属性やその他の国際化パターン
                const i18nAttributes = content.match(/data-i18n/g) || [];
                i18nUsageCount += i18nAttributes.length;
            }
            
            console.log(`   📊 i18n API usage: ${i18nUsageCount} calls found`);
            
            if (hardcodedStrings.length > 0) {
                console.warn('   ⚠️  Possible hardcoded strings:');
                hardcodedStrings.forEach(({ file, count }) => {
                    console.warn(`      - ${file}: ${count} suspicious strings`);
                });
            }
        });

        // RTL言語サポート
        this.test('RTL language support', async (config) => {
            const manifest = await this.loadManifest(config);
            if (!manifest.default_locale) return;
            
            const localesPath = path.join(config.extensionPath, '_locales');
            if (!fs.existsSync(localesPath)) return;
            
            const locales = await this.readDirectory('_locales');
            const rtlLocales = ['ar', 'he', 'fa', 'ur'];
            const supportedRtl = locales.filter(locale => rtlLocales.includes(locale));
            
            if (supportedRtl.length > 0) {
                console.log(`   🔄 RTL locales supported: ${supportedRtl.join(', ')}`);
                
                // CSSでのRTLサポート確認
                const cssFiles = (await this.getAllFiles()).filter(file => file.endsWith('.css'));
                let rtlSupport = false;
                
                for (const cssFile of cssFiles) {
                    const content = await this.loadFile(cssFile);
                    if (content.includes('dir="rtl"') || content.includes(':dir(rtl)') || content.includes('[dir="rtl"]')) {
                        rtlSupport = true;
                        break;
                    }
                }
                
                if (!rtlSupport) {
                    console.warn('   ⚠️  RTL locales supported but no RTL CSS rules found');
                }
            }
        });
    }
}

module.exports = LocalizationTestSuite;