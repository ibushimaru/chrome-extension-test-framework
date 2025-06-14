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
            description: 'Chrome拡張機能の国際化対応を検証'
        });

        this.config = config;
        this.setupTests();
    }

    setupTests() {
        // ローカライゼーションの基本構造
        this.test('Localization structure', async (config) => {
            const manifestPath = path.join(config.extensionPath, 'manifest.json');
            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            
            // default_localeが設定されている場合
            if (manifest.default_locale) {
                const localesDir = path.join(config.extensionPath, '_locales');
                
                if (!fs.existsSync(localesDir)) {
                    throw new Error('_locales directory not found but default_locale is set');
                }
                
                // デフォルトロケールの存在確認
                const defaultLocaleDir = path.join(localesDir, manifest.default_locale);
                if (!fs.existsSync(defaultLocaleDir)) {
                    throw new Error(`Default locale directory not found: ${manifest.default_locale}`);
                }
                
                // messages.jsonの存在確認
                const messagesPath = path.join(defaultLocaleDir, 'messages.json');
                if (!fs.existsSync(messagesPath)) {
                    throw new Error(`messages.json not found in default locale: ${manifest.default_locale}`);
                }
            }
        });

        // messages.jsonの形式検証
        this.test('Messages file format', async (config) => {
            const localesDir = path.join(config.extensionPath, '_locales');
            
            if (fs.existsSync(localesDir)) {
                const locales = fs.readdirSync(localesDir).filter(f => 
                    fs.statSync(path.join(localesDir, f)).isDirectory()
                );
                
                for (const locale of locales) {
                    const messagesPath = path.join(localesDir, locale, 'messages.json');
                    
                    if (!fs.existsSync(messagesPath)) {
                        throw new Error(`messages.json missing in locale: ${locale}`);
                    }
                    
                    // JSONの妥当性
                    let messages;
                    try {
                        messages = JSON.parse(fs.readFileSync(messagesPath, 'utf8'));
                    } catch (error) {
                        throw new Error(`Invalid JSON in ${locale}/messages.json: ${error.message}`);
                    }
                    
                    // メッセージ形式の検証
                    Object.entries(messages).forEach(([key, value]) => {
                        if (!value.message) {
                            throw new Error(`Missing 'message' property for key '${key}' in ${locale}`);
                        }
                        
                        // キーの命名規則
                        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) {
                            console.warn(`   ⚠️  Non-standard message key: ${key} in ${locale}`);
                        }
                        
                        // プレースホルダーの検証
                        if (value.placeholders) {
                            const placeholderRefs = value.message.match(/\$([A-Z_]+)\$/g) || [];
                            const definedPlaceholders = Object.keys(value.placeholders);
                            
                            placeholderRefs.forEach(ref => {
                                const name = ref.slice(1, -1).toLowerCase();
                                if (!definedPlaceholders.includes(name)) {
                                    console.warn(`   ⚠️  Undefined placeholder ${ref} in ${locale}/${key}`);
                                }
                            });
                        }
                    });
                }
            }
        });

        // ロケール間の一貫性
        this.test('Locale consistency', async (config) => {
            const localesDir = path.join(config.extensionPath, '_locales');
            
            if (fs.existsSync(localesDir)) {
                const locales = fs.readdirSync(localesDir).filter(f => 
                    fs.statSync(path.join(localesDir, f)).isDirectory()
                );
                
                if (locales.length < 2) return; // 複数言語がない場合はスキップ
                
                // 各ロケールのキーを収集
                const localeKeys = new Map();
                
                locales.forEach(locale => {
                    const messagesPath = path.join(localesDir, locale, 'messages.json');
                    if (fs.existsSync(messagesPath)) {
                        const messages = JSON.parse(fs.readFileSync(messagesPath, 'utf8'));
                        localeKeys.set(locale, new Set(Object.keys(messages)));
                    }
                });
                
                // 基準となるロケール（最初のもの）
                const [baseLocale, baseKeys] = localeKeys.entries().next().value;
                
                // 他のロケールと比較
                localeKeys.forEach((keys, locale) => {
                    if (locale === baseLocale) return;
                    
                    // 不足しているキー
                    const missingKeys = [...baseKeys].filter(key => !keys.has(key));
                    if (missingKeys.length > 0) {
                        console.warn(`   ⚠️  Missing keys in ${locale}: ${missingKeys.join(', ')}`);
                    }
                    
                    // 余分なキー
                    const extraKeys = [...keys].filter(key => !baseKeys.has(key));
                    if (extraKeys.length > 0) {
                        console.warn(`   ⚠️  Extra keys in ${locale}: ${extraKeys.join(', ')}`);
                    }
                });
            }
        });

        // manifest.jsonの国際化
        this.test('Manifest localization', async (config) => {
            const manifestPath = path.join(config.extensionPath, 'manifest.json');
            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            
            // 国際化可能なフィールド
            const localizableFields = ['name', 'description', 'short_name'];
            const localizedFields = [];
            
            localizableFields.forEach(field => {
                if (manifest[field] && manifest[field].startsWith('__MSG_') && manifest[field].endsWith('__')) {
                    localizedFields.push(field);
                }
            });
            
            if (localizedFields.length > 0 && !manifest.default_locale) {
                throw new Error('Localized fields found but default_locale not set');
            }
            
            // ローカライズされたフィールドのメッセージ存在確認
            if (localizedFields.length > 0 && manifest.default_locale) {
                const messagesPath = path.join(
                    config.extensionPath, 
                    '_locales', 
                    manifest.default_locale, 
                    'messages.json'
                );
                
                if (fs.existsSync(messagesPath)) {
                    const messages = JSON.parse(fs.readFileSync(messagesPath, 'utf8'));
                    
                    localizedFields.forEach(field => {
                        const messageKey = manifest[field].slice(6, -2); // __MSG_key__ -> key
                        if (!messages[messageKey]) {
                            throw new Error(`Message key '${messageKey}' not found for manifest.${field}`);
                        }
                    });
                }
            }
        });

        // サポートされているロケール
        this.test('Supported locales', async (config) => {
            const localesDir = path.join(config.extensionPath, '_locales');
            
            if (fs.existsSync(localesDir)) {
                const locales = fs.readdirSync(localesDir).filter(f => 
                    fs.statSync(path.join(localesDir, f)).isDirectory()
                );
                
                console.log(`   📍 Supported locales: ${locales.join(', ')}`);
                
                // 推奨される主要言語
                const majorLocales = ['en', 'es', 'fr', 'de', 'ja', 'zh_CN', 'pt_BR', 'ru'];
                const supportedMajor = majorLocales.filter(l => 
                    locales.some(locale => locale.startsWith(l))
                );
                
                if (supportedMajor.length < 3) {
                    console.warn('   ⚠️  Consider supporting more major languages for wider reach');
                }
                
                // ロケールコードの妥当性
                locales.forEach(locale => {
                    if (!/^[a-z]{2}(_[A-Z]{2})?$/.test(locale)) {
                        console.warn(`   ⚠️  Non-standard locale code: ${locale}`);
                    }
                });
            }
        });

        // HTMLファイルの国際化
        this.test('HTML localization', async (config) => {
            const htmlFiles = await this.findFilesByExtension(config.extensionPath, '.html');
            
            htmlFiles.forEach(htmlFile => {
                const content = fs.readFileSync(htmlFile, 'utf8');
                
                // __MSG_形式の使用確認
                const msgPattern = /__MSG_(\w+)__/g;
                const matches = content.match(msgPattern) || [];
                
                if (matches.length > 0) {
                    const manifestPath = path.join(config.extensionPath, 'manifest.json');
                    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
                    
                    if (!manifest.default_locale) {
                        throw new Error(`Localization used in ${path.basename(htmlFile)} but default_locale not set`);
                    }
                }
                
                // data-i18n属性の使用（一般的なパターン）
                if (content.includes('data-i18n')) {
                    console.log(`   ✅ data-i18n attributes found in ${path.basename(htmlFile)}`);
                }
            });
        });

        // JavaScriptの国際化API使用
        this.test('JavaScript i18n API usage', async (config) => {
            const jsFiles = await this.findFilesByExtension(config.extensionPath, '.js');
            
            jsFiles.forEach(jsFile => {
                const content = fs.readFileSync(jsFile, 'utf8');
                
                // chrome.i18n.getMessage の使用
                if (content.includes('chrome.i18n.getMessage')) {
                    console.log(`   ✅ i18n API used in ${path.basename(jsFile)}`);
                    
                    // getMessage呼び出しのパターン
                    const getMessageCalls = content.match(/chrome\.i18n\.getMessage\s*\(\s*['"`](\w+)['"`]/g) || [];
                    
                    if (getMessageCalls.length > 0) {
                        const manifestPath = path.join(config.extensionPath, 'manifest.json');
                        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
                        
                        if (!manifest.default_locale) {
                            console.warn(`   ⚠️  i18n API used but default_locale not set`);
                        }
                    }
                }
                
                // ハードコードされた文字列の検出
                const hardcodedStrings = content.match(/["'`]([A-Z][a-z]+ [a-z]+.*?)["'`]/g) || [];
                if (hardcodedStrings.length > 10) {
                    console.warn(`   ⚠️  Many hardcoded strings in ${path.basename(jsFile)} - consider i18n`);
                }
            });
        });

        // 数値・日付の国際化
        this.test('Number and date formatting', async (config) => {
            const jsFiles = await this.findFilesByExtension(config.extensionPath, '.js');
            
            jsFiles.forEach(jsFile => {
                const content = fs.readFileSync(jsFile, 'utf8');
                
                // Intl APIの使用
                const intlUsage = {
                    NumberFormat: content.includes('Intl.NumberFormat'),
                    DateTimeFormat: content.includes('Intl.DateTimeFormat'),
                    RelativeTimeFormat: content.includes('Intl.RelativeTimeFormat')
                };
                
                const usedIntl = Object.entries(intlUsage)
                    .filter(([_, used]) => used)
                    .map(([api]) => api);
                
                if (usedIntl.length > 0) {
                    console.log(`   ✅ Intl API used in ${path.basename(jsFile)}: ${usedIntl.join(', ')}`);
                }
                
                // 日付の手動フォーマット
                if (/\d{1,2}\/\d{1,2}\/\d{4}/.test(content) || /getMonth\(\)/.test(content)) {
                    console.warn(`   ⚠️  Manual date formatting in ${path.basename(jsFile)} - consider Intl.DateTimeFormat`);
                }
                
                // 通貨記号のハードコード
                if (/[$€£¥₹]/.test(content)) {
                    console.warn(`   ⚠️  Hardcoded currency symbols in ${path.basename(jsFile)} - consider Intl.NumberFormat`);
                }
            });
        });

        // RTL言語のサポート
        this.test('RTL language support', async (config) => {
            const localesDir = path.join(config.extensionPath, '_locales');
            
            if (fs.existsSync(localesDir)) {
                const locales = fs.readdirSync(localesDir).filter(f => 
                    fs.statSync(path.join(localesDir, f)).isDirectory()
                );
                
                // RTL言語
                const rtlLocales = ['ar', 'he', 'fa', 'ur'];
                const hasRTL = locales.some(locale => 
                    rtlLocales.some(rtl => locale.startsWith(rtl))
                );
                
                if (hasRTL) {
                    // CSSでのRTLサポート確認
                    const cssFiles = await this.findFilesByExtension(config.extensionPath, '.css');
                    let rtlSupport = false;
                    
                    cssFiles.forEach(cssFile => {
                        const content = fs.readFileSync(cssFile, 'utf8');
                        if (content.includes('[dir="rtl"]') || content.includes(':dir(rtl)')) {
                            rtlSupport = true;
                        }
                    });
                    
                    if (!rtlSupport) {
                        console.warn('   ⚠️  RTL locales found but no RTL CSS support detected');
                    }
                }
            }
        });
    }

    /**
     * 拡張子でファイルを検索
     */
    async findFilesByExtension(dir, extension) {
        const files = [];
        
        const walk = (currentDir) => {
            const entries = fs.readdirSync(currentDir);
            
            entries.forEach(entry => {
                const fullPath = path.join(currentDir, entry);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory() && !entry.startsWith('.') && entry !== 'node_modules') {
                    walk(fullPath);
                } else if (stat.isFile() && fullPath.endsWith(extension)) {
                    files.push(fullPath);
                }
            });
        };
        
        walk(dir);
        return files;
    }
}

module.exports = LocalizationTestSuite;