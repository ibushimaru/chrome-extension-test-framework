/**
 * ConfigLoader - 設定ファイルの読み込み
 */

const fs = require('fs');
const path = require('path');
const ConfigValidator = require('./ConfigValidator');

class ConfigLoader {
    constructor() {
        this.supportedFormats = ['.json', '.js', '.config.js'];
        this.validator = new ConfigValidator();
    }

    /**
     * 設定ファイルを読み込み
     */
    async load(configPath) {
        // パスが指定されていない場合、デフォルトの設定ファイルを探す
        if (!configPath) {
            configPath = this.findDefaultConfig();
            if (!configPath) {
                return {}; // 設定ファイルが見つからない場合は空オブジェクトを返す
            }
        }

        // 絶対パスに変換
        const absolutePath = path.isAbsolute(configPath) 
            ? configPath 
            : path.join(process.cwd(), configPath);

        // ファイルの存在確認
        if (!fs.existsSync(absolutePath)) {
            throw new Error(`Config file not found: ${configPath}`);
        }

        // 拡張子によって読み込み方法を変える
        const ext = path.extname(absolutePath);
        let config;
        
        switch (ext) {
            case '.json':
                config = this.loadJSON(absolutePath);
                break;
            case '.js':
                config = this.loadJS(absolutePath);
                break;
            default:
                throw new Error(`Unsupported config format: ${ext}`);
        }
        
        // 設定をバリデーション
        const isValid = this.validator.validate(config);
        if (!isValid) {
            this.validator.displayResults();
            throw new Error('Invalid configuration');
        }
        
        // 警告がある場合は表示
        if (this.validator.warnings.length > 0) {
            this.validator.displayResults();
        }
        
        return config;
    }

    /**
     * JSONファイルを読み込み
     */
    loadJSON(filePath) {
        const content = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(content);
    }

    /**
     * JavaScriptファイルを読み込み
     */
    loadJS(filePath) {
        // キャッシュをクリアして最新の設定を読み込む
        delete require.cache[filePath];
        return require(filePath);
    }

    /**
     * デフォルトの設定ファイルを探す
     */
    findDefaultConfig(extensionPath = process.cwd()) {
        const configNames = [
            'cext-test.config.js',
            'cext-test.config.json',
            'chrome-extension-test.config.js',
            'chrome-extension-test.config.json',
            '.cextrc.js',
            '.cextrc.json'
        ];

        // まず拡張機能のディレクトリ内を探す
        for (const name of configNames) {
            const configPath = path.join(extensionPath, name);
            if (fs.existsSync(configPath)) {
                console.log(`📁 Found config file: ${name} in extension directory`);
                return configPath;
            }
        }

        // 次に現在の作業ディレクトリを探す（後方互換性のため）
        if (extensionPath !== process.cwd()) {
            for (const name of configNames) {
                const configPath = path.join(process.cwd(), name);
                if (fs.existsSync(configPath)) {
                    console.log(`📁 Found config file: ${name} in working directory`);
                    return configPath;
                }
            }
        }

        return null;
    }

    /**
     * 設定をマージ
     */
    merge(baseConfig, ...configs) {
        return configs.reduce((merged, config) => {
            return this.deepMerge(merged, config);
        }, baseConfig);
    }

    /**
     * ディープマージ
     */
    deepMerge(target, source) {
        const output = Object.assign({}, target);
        
        if (this.isObject(target) && this.isObject(source)) {
            Object.keys(source).forEach(key => {
                if (this.isObject(source[key])) {
                    if (!(key in target)) {
                        Object.assign(output, { [key]: source[key] });
                    } else {
                        output[key] = this.deepMerge(target[key], source[key]);
                    }
                } else {
                    Object.assign(output, { [key]: source[key] });
                }
            });
        }
        
        return output;
    }

    /**
     * オブジェクトかどうか判定
     */
    isObject(item) {
        return item && typeof item === 'object' && !Array.isArray(item);
    }

    /**
     * 環境変数から設定を読み込み
     */
    loadFromEnv(prefix = 'CEXT_') {
        const config = {};
        
        Object.keys(process.env).forEach(key => {
            if (key.startsWith(prefix)) {
                const configKey = key
                    .substring(prefix.length)
                    .toLowerCase()
                    .replace(/_/g, '.');
                
                // ドット記法をオブジェクトに変換
                this.setNestedProperty(config, configKey, process.env[key]);
            }
        });
        
        return config;
    }

    /**
     * ネストされたプロパティを設定
     */
    setNestedProperty(obj, path, value) {
        const keys = path.split('.');
        let current = obj;
        
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!(key in current)) {
                current[key] = {};
            }
            current = current[key];
        }
        
        // 値の型を推測
        const parsedValue = this.parseValue(value);
        current[keys[keys.length - 1]] = parsedValue;
    }

    /**
     * 値の型を推測して変換
     */
    parseValue(value) {
        // boolean
        if (value === 'true') return true;
        if (value === 'false') return false;
        
        // number
        if (/^\d+$/.test(value)) return parseInt(value, 10);
        if (/^\d*\.\d+$/.test(value)) return parseFloat(value);
        
        // array
        if (value.startsWith('[') && value.endsWith(']')) {
            try {
                return JSON.parse(value);
            } catch {
                // JSONパースに失敗した場合はカンマ区切りとして扱う
                return value.slice(1, -1).split(',').map(s => s.trim());
            }
        }
        
        // object
        if (value.startsWith('{') && value.endsWith('}')) {
            try {
                return JSON.parse(value);
            } catch {
                // JSONパースに失敗した場合は文字列として扱う
            }
        }
        
        return value;
    }

    /**
     * 設定を検証
     */
    validate(config, schema) {
        // 簡易的な検証（必要に応じて拡張可能）
        const errors = [];
        
        // 必須フィールドのチェック
        if (schema.required) {
            schema.required.forEach(field => {
                if (!(field in config)) {
                    errors.push(`Missing required field: ${field}`);
                }
            });
        }
        
        // 型チェック
        if (schema.properties) {
            Object.keys(schema.properties).forEach(key => {
                if (key in config) {
                    const expectedType = schema.properties[key].type;
                    const actualType = Array.isArray(config[key]) ? 'array' : typeof config[key];
                    
                    if (expectedType && expectedType !== actualType) {
                        errors.push(`Invalid type for ${key}: expected ${expectedType}, got ${actualType}`);
                    }
                }
            });
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }
}

module.exports = ConfigLoader;