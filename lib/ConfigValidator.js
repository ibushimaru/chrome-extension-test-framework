/**
 * 設定ファイルのバリデーター
 * 設定の妥当性をチェックし、問題があれば警告やエラーを出力
 */

class ConfigValidator {
    constructor() {
        this.errors = [];
        this.warnings = [];
    }

    /**
     * 設定を検証
     */
    validate(config) {
        this.errors = [];
        this.warnings = [];

        // 基本的な型チェック
        if (typeof config !== 'object' || config === null) {
            this.errors.push('Configuration must be an object');
            return false;
        }

        // 各フィールドの検証
        this.validateExtensionPath(config);
        this.validateOutput(config);
        this.validateValidation(config);
        this.validateExcludeInclude(config);
        this.validateProfile(config);
        this.validateConsoleThresholds(config);
        this.validateAllowedDevFiles(config);
        this.validateTimeout(config);
        this.validateConflicts(config);

        return this.errors.length === 0;
    }

    /**
     * 拡張機能パスの検証
     */
    validateExtensionPath(config) {
        if (config.extensionPath !== undefined) {
            if (typeof config.extensionPath !== 'string') {
                this.errors.push('extensionPath must be a string');
            }
        }
    }

    /**
     * 出力設定の検証
     */
    validateOutput(config) {
        if (!config.output) return;

        if (typeof config.output !== 'object') {
            this.errors.push('output must be an object');
            return;
        }

        // format検証
        if (config.output.format) {
            const validFormats = ['console', 'json', 'html', 'markdown', 'junit'];
            if (!Array.isArray(config.output.format)) {
                this.errors.push('output.format must be an array');
            } else {
                config.output.format.forEach(format => {
                    if (!validFormats.includes(format)) {
                        this.errors.push(`Invalid output format: ${format}. Valid formats: ${validFormats.join(', ')}`);
                    }
                });
            }
        }

        // directory検証
        if (config.output.directory !== undefined && typeof config.output.directory !== 'string') {
            this.errors.push('output.directory must be a string');
        }

        // filename検証
        if (config.output.filename !== undefined && typeof config.output.filename !== 'string') {
            this.errors.push('output.filename must be a string');
        }
    }

    /**
     * バリデーション設定の検証
     */
    validateValidation(config) {
        if (!config.validation) return;

        if (typeof config.validation !== 'object') {
            this.errors.push('validation must be an object');
            return;
        }

        const validKeys = ['manifest', 'permissions', 'csp', 'icons', 'locales'];
        Object.keys(config.validation).forEach(key => {
            if (!validKeys.includes(key)) {
                this.warnings.push(`Unknown validation key: ${key}`);
            }
            if (typeof config.validation[key] !== 'boolean') {
                this.errors.push(`validation.${key} must be a boolean`);
            }
        });
    }

    /**
     * exclude/includeパターンの検証
     */
    validateExcludeInclude(config) {
        ['exclude', 'include'].forEach(key => {
            if (config[key] !== undefined) {
                if (!Array.isArray(config[key])) {
                    this.errors.push(`${key} must be an array`);
                } else {
                    config[key].forEach((pattern, index) => {
                        if (typeof pattern !== 'string') {
                            this.errors.push(`${key}[${index}] must be a string`);
                        }
                    });
                }
            }
        });
    }

    /**
     * プロファイル設定の検証
     */
    validateProfile(config) {
        if (config.profile === undefined) return;

        const validProfiles = ['development', 'production', 'ci', 'quick', 'security-focused', 'performance', 'minimal'];
        if (typeof config.profile === 'string') {
            if (!validProfiles.includes(config.profile)) {
                this.warnings.push(`Unknown profile: ${config.profile}. Valid profiles: ${validProfiles.join(', ')}`);
            }
        } else if (typeof config.profile === 'object') {
            // カスタムプロファイルの検証
            if (!config.profile.name) {
                this.errors.push('Custom profile must have a name');
            }
        } else {
            this.errors.push('profile must be a string or object');
        }
    }

    /**
     * console閾値の検証
     */
    validateConsoleThresholds(config) {
        if (!config.consoleThresholds) return;

        if (typeof config.consoleThresholds !== 'object') {
            this.errors.push('consoleThresholds must be an object');
            return;
        }

        Object.entries(config.consoleThresholds).forEach(([key, value]) => {
            if (typeof value !== 'number' || value < 0) {
                this.errors.push(`consoleThresholds.${key} must be a non-negative number`);
            }
        });
    }

    /**
     * allowedDevFilesの検証
     */
    validateAllowedDevFiles(config) {
        if (config.allowedDevFiles !== undefined) {
            if (!Array.isArray(config.allowedDevFiles)) {
                this.errors.push('allowedDevFiles must be an array');
            } else {
                config.allowedDevFiles.forEach((file, index) => {
                    if (typeof file !== 'string') {
                        this.errors.push(`allowedDevFiles[${index}] must be a string`);
                    }
                });
            }
        }
    }

    /**
     * タイムアウトの検証
     */
    validateTimeout(config) {
        if (config.timeout !== undefined) {
            if (typeof config.timeout !== 'number' || config.timeout <= 0) {
                this.errors.push('timeout must be a positive number');
            }
            if (config.timeout < 1000) {
                this.warnings.push('timeout is very low (< 1000ms), tests may fail prematurely');
            }
        }
    }

    /**
     * 設定の競合をチェック
     */
    validateConflicts(config) {
        // プロファイルと個別設定の競合
        if (config.profile && typeof config.profile === 'string') {
            if (config.profile === 'production' && config.failOnWarning === false) {
                this.warnings.push('production profile sets failOnWarning to true, but config explicitly sets it to false');
            }
            if (config.profile === 'development' && config.failOnError === true) {
                this.warnings.push('development profile sets failOnError to false, but config explicitly sets it to true');
            }
        }

        // exclude と include の競合
        if (config.exclude && config.include) {
            this.warnings.push('Both exclude and include patterns are specified. Include patterns take precedence.');
        }

        // 並列実行とウォッチモードの競合
        if (config.parallel && config.watch) {
            this.warnings.push('Parallel execution with watch mode may cause unexpected behavior');
        }
    }

    /**
     * エラーとワーニングを取得
     */
    getResults() {
        return {
            valid: this.errors.length === 0,
            errors: this.errors,
            warnings: this.warnings
        };
    }

    /**
     * 結果を表示
     */
    displayResults() {
        if (this.errors.length > 0) {
            console.error('\n❌ Configuration Errors:');
            this.errors.forEach(error => {
                console.error(`   - ${error}`);
            });
        }

        if (this.warnings.length > 0) {
            console.warn('\n⚠️  Configuration Warnings:');
            this.warnings.forEach(warning => {
                console.warn(`   - ${warning}`);
            });
        }

        if (this.errors.length === 0 && this.warnings.length === 0) {
            console.log('✅ Configuration is valid');
        }
    }
}

module.exports = ConfigValidator;