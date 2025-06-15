/**
 * ProfileManager - テストプロファイルの管理
 */

class ProfileManager {
    constructor(config = {}) {
        this.profiles = config.profiles || {};
        this.activeProfile = null;
        
        // デフォルトプロファイル
        this.defaultProfiles = {
            development: {
                name: 'Development',
                description: 'Relaxed rules for development',
                exclude: ['.git', 'node_modules', 'dist', 'build'],
                warningLevels: {
                    'console-logging': 'ignore',
                    'excessive-logging': 'warn',
                    'debug-code': 'ignore',
                    'todo-comments': 'info'
                },
                failOnWarning: false,
                output: ['console']
            },
            production: {
                name: 'Production',
                description: 'Strict rules for production',
                exclude: ['test/**', 'tests/**', '__tests__/**', 'docs/**', 'examples/**', '*.test.js', '*.spec.js'],
                warningLevels: {
                    'console-logging': 'error',
                    'excessive-logging': 'error',
                    'debug-code': 'error',
                    'todo-comments': 'warn',
                    'innerHTML-usage': 'error',
                    'eval-usage': 'error'
                },
                failOnWarning: true,
                output: ['console', 'json', 'html']
            },
            ci: {
                name: 'Continuous Integration',
                description: 'Optimized for CI/CD pipelines',
                exclude: ['node_modules', '.git', 'coverage/**', '.nyc_output/**'],
                warningLevels: {
                    'console-logging': 'error',
                    'debug-code': 'error',
                    'todo-comments': 'ignore'
                },
                failOnWarning: true,
                failOnError: true,
                output: ['json', 'junit'],
                parallel: true,
                reportPath: './test-results'
            },
            quick: {
                name: 'Quick Check',
                description: 'Fast validation for pre-commit hooks',
                exclude: ['node_modules', '.git', 'test/**', 'docs/**', 'examples/**'],
                suites: ['manifest', 'security'], // 重要なテストのみ
                warningLevels: {
                    'console-logging': 'ignore',
                    'excessive-logging': 'ignore'
                },
                failOnError: true,
                output: ['console']
            }
        };
        
        // カスタムプロファイルとデフォルトプロファイルをマージ
        this.allProfiles = { ...this.defaultProfiles, ...this.profiles };
    }

    /**
     * プロファイルを取得
     */
    getProfile(name) {
        if (!name) {
            return null;
        }
        
        const profile = this.allProfiles[name];
        if (!profile) {
            throw new Error(`Profile not found: ${name}`);
        }
        
        return {
            ...profile,
            name: profile.name || name
        };
    }

    /**
     * プロファイルを適用
     */
    applyProfile(name, baseConfig = {}) {
        const profile = this.getProfile(name);
        if (!profile) {
            return baseConfig;
        }
        
        this.activeProfile = name;
        
        // プロファイル設定をベース設定にマージ
        const mergedConfig = { ...baseConfig };
        
        // 各設定項目をマージ
        if (profile.exclude) {
            mergedConfig.exclude = [...(baseConfig.exclude || []), ...profile.exclude];
        }
        
        if (profile.warningLevels) {
            mergedConfig.warningLevels = { ...baseConfig.warningLevels, ...profile.warningLevels };
        }
        
        if (profile.output) {
            mergedConfig.output = {
                ...baseConfig.output,
                format: profile.output
            };
        }
        
        // その他の設定をコピー
        ['failOnWarning', 'failOnError', 'parallel', 'suites', 'reportPath'].forEach(key => {
            if (key in profile) {
                mergedConfig[key] = profile[key];
            }
        });
        
        // プロファイル情報を追加
        mergedConfig.profile = {
            name: profile.name,
            description: profile.description
        };
        
        return mergedConfig;
    }

    /**
     * 利用可能なプロファイル一覧を取得
     */
    listProfiles() {
        return Object.entries(this.allProfiles).map(([key, profile]) => ({
            key,
            name: profile.name || key,
            description: profile.description || 'No description',
            isDefault: key in this.defaultProfiles,
            isActive: key === this.activeProfile
        }));
    }

    /**
     * プロファイルを追加
     */
    addProfile(name, profile) {
        if (name in this.defaultProfiles) {
            throw new Error(`Cannot override default profile: ${name}`);
        }
        
        this.allProfiles[name] = profile;
        this.profiles[name] = profile;
    }

    /**
     * プロファイルを削除
     */
    removeProfile(name) {
        if (name in this.defaultProfiles) {
            throw new Error(`Cannot remove default profile: ${name}`);
        }
        
        delete this.allProfiles[name];
        delete this.profiles[name];
        
        if (this.activeProfile === name) {
            this.activeProfile = null;
        }
    }

    /**
     * プロファイルを検証
     */
    validateProfile(profile) {
        const errors = [];
        
        // 必須フィールドのチェック
        if (!profile.name && !profile.description) {
            errors.push('Profile must have either name or description');
        }
        
        // warningLevelsの検証
        if (profile.warningLevels) {
            const validLevels = ['error', 'warn', 'info', 'ignore'];
            Object.entries(profile.warningLevels).forEach(([key, value]) => {
                if (typeof value === 'string' && !validLevels.includes(value) && value !== 'ignore-in-test-files') {
                    errors.push(`Invalid warning level for ${key}: ${value}`);
                }
            });
        }
        
        // outputの検証
        if (profile.output) {
            const validFormats = ['console', 'json', 'html', 'markdown', 'junit'];
            profile.output.forEach(format => {
                if (!validFormats.includes(format)) {
                    errors.push(`Invalid output format: ${format}`);
                }
            });
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * 現在のプロファイルを取得
     */
    getActiveProfile() {
        return this.activeProfile;
    }

    /**
     * プロファイルをエクスポート
     */
    exportProfile(name) {
        const profile = this.getProfile(name);
        if (!profile) {
            return null;
        }
        
        return JSON.stringify(profile, null, 2);
    }

    /**
     * プロファイルをインポート
     */
    importProfile(name, profileData) {
        let profile;
        
        if (typeof profileData === 'string') {
            try {
                profile = JSON.parse(profileData);
            } catch (error) {
                throw new Error(`Invalid profile data: ${error.message}`);
            }
        } else {
            profile = profileData;
        }
        
        // 検証
        const validation = this.validateProfile(profile);
        if (!validation.valid) {
            throw new Error(`Invalid profile: ${validation.errors.join(', ')}`);
        }
        
        this.addProfile(name, profile);
    }
}

module.exports = ProfileManager;