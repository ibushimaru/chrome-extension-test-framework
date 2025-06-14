/**
 * Validator - Chrome拡張機能の検証ユーティリティ
 */

const fs = require('fs');
const path = require('path');

class Validator {
    constructor() {
        this.validators = new Map();
        this.registerBuiltinValidators();
    }

    /**
     * ビルトインバリデーターを登録
     */
    registerBuiltinValidators() {
        // Manifest V3検証
        this.register('manifestVersion', {
            validate: (manifest) => {
                return manifest.manifest_version === 3;
            },
            message: 'Manifest version must be 3'
        });

        // 必須フィールド検証
        this.register('requiredFields', {
            validate: (manifest) => {
                const required = ['manifest_version', 'name', 'version'];
                return required.every(field => field in manifest);
            },
            message: 'Missing required manifest fields'
        });

        // バージョン形式検証
        this.register('versionFormat', {
            validate: (manifest) => {
                if (!manifest.version) return false;
                return /^\d+(\.\d+){0,3}$/.test(manifest.version);
            },
            message: 'Version must be in format X.Y.Z.W'
        });

        // パーミッション検証
        this.register('permissions', {
            validate: (manifest) => {
                const dangerous = ['<all_urls>', 'http://*/*', 'https://*/*'];
                const permissions = manifest.permissions || [];
                const hostPermissions = manifest.host_permissions || [];
                const allPermissions = [...permissions, ...hostPermissions];
                
                // 危険なパーミッションの警告
                const hasDangerous = allPermissions.some(p => 
                    dangerous.includes(p)
                );
                
                if (hasDangerous) {
                    console.warn('   ⚠️  Broad host permissions detected');
                }
                
                return true; // 警告のみ、失敗にはしない
            },
            message: 'Permission validation'
        });

        // CSP検証
        this.register('contentSecurityPolicy', {
            validate: (manifest) => {
                const csp = manifest.content_security_policy;
                if (!csp) return true;
                
                // unsafe-eval, unsafe-inlineのチェック
                const hasUnsafe = JSON.stringify(csp).includes('unsafe-');
                if (hasUnsafe) {
                    console.warn('   ⚠️  Unsafe CSP directives detected');
                }
                
                return true;
            },
            message: 'CSP validation'
        });

        // アイコン検証
        this.register('icons', {
            validate: (manifest, config) => {
                if (!manifest.icons) return true;
                
                const sizes = Object.keys(manifest.icons);
                const recommended = ['16', '48', '128'];
                
                return recommended.every(size => sizes.includes(size));
            },
            message: 'Recommended icon sizes: 16, 48, 128'
        });

        // Service Worker検証（Manifest V3）
        this.register('serviceWorker', {
            validate: (manifest, config) => {
                if (!manifest.background) return true;
                
                return 'service_worker' in manifest.background;
            },
            message: 'Manifest V3 requires service_worker in background'
        });
    }

    /**
     * バリデーターを登録
     */
    register(name, validator) {
        this.validators.set(name, validator);
    }

    /**
     * バリデーターを取得
     */
    get(name) {
        return this.validators.get(name);
    }

    /**
     * 検証を実行
     */
    async validate(name, data, config) {
        const validator = this.validators.get(name);
        
        if (!validator) {
            throw new Error(`Validator "${name}" not found`);
        }

        try {
            const result = await validator.validate(data, config);
            return {
                valid: result,
                message: validator.message
            };
        } catch (error) {
            return {
                valid: false,
                message: error.message
            };
        }
    }

    /**
     * 複数の検証を実行
     */
    async validateAll(validatorNames, data, config) {
        const results = [];
        
        for (const name of validatorNames) {
            const result = await this.validate(name, data, config);
            results.push({
                name,
                ...result
            });
        }
        
        return results;
    }

    /**
     * ファイル存在検証ヘルパー
     */
    static fileExists(extensionPath, filePath) {
        const fullPath = path.join(extensionPath, filePath);
        return fs.existsSync(fullPath);
    }

    /**
     * JSONファイル検証ヘルパー
     */
    static isValidJSON(content) {
        try {
            JSON.parse(content);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * 正規表現パターンマッチングヘルパー
     */
    static matchPattern(content, pattern) {
        const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);
        return regex.test(content);
    }

    /**
     * 数値範囲検証ヘルパー
     */
    static inRange(value, min, max) {
        const num = parseFloat(value);
        return !isNaN(num) && num >= min && num <= max;
    }

    /**
     * 配列包含検証ヘルパー
     */
    static contains(array, items) {
        return items.every(item => array.includes(item));
    }

    /**
     * オブジェクトキー検証ヘルパー
     */
    static hasKeys(obj, keys) {
        return keys.every(key => key in obj);
    }
}

// シングルトンインスタンスをエクスポート
module.exports = new Validator();