/**
 * EnvironmentDetector - 環境を考慮した検出
 * 
 * 開発環境、テスト環境、本番環境を識別し、
 * 環境に応じて適切な検証レベルを適用する
 */

class EnvironmentDetector {
    constructor() {
        // 環境を示すパターン
        this.environmentPatterns = {
            development: {
                files: [
                    /\.dev\.(js|ts)$/,
                    /\.development\.(js|ts)$/,
                    /dev-.*\.(js|ts)$/,
                    /webpack\.dev\.config\.js$/
                ],
                directories: [
                    /\/dev\//,
                    /\/development\//,
                    /\/sandbox\//,
                    /\/playground\//
                ],
                code: [
                    /process\.env\.NODE_ENV\s*===?\s*['"]development['"]/,
                    /DEBUG\s*=\s*true/,
                    /\/\/\s*@dev-only/,
                    /\/\*\s*dev-only\s*\*\//
                ]
            },
            test: {
                files: [
                    /\.test\.(js|ts)$/,
                    /\.spec\.(js|ts)$/,
                    /\.e2e\.(js|ts)$/,
                    /__tests__\//,
                    /test-.*\.(js|ts)$/
                ],
                directories: [
                    /\/test\//,
                    /\/tests\//,
                    /\/spec\//,
                    /\/__tests__\//,
                    /\/e2e\//
                ],
                code: [
                    /describe\s*\(/,
                    /it\s*\(/,
                    /test\s*\(/,
                    /expect\s*\(/,
                    /jest\./,
                    /mocha\./
                ]
            },
            production: {
                files: [
                    /\.min\.(js|css)$/,
                    /\.prod\.(js|ts)$/,
                    /\.production\.(js|ts)$/,
                    /bundle\.(js|css)$/
                ],
                directories: [
                    /\/dist\//,
                    /\/build\//,
                    /\/release\//,
                    /\/production\//
                ],
                code: [
                    /process\.env\.NODE_ENV\s*===?\s*['"]production['"]/,
                    /\/\/\s*@prod-only/,
                    /\/\*\s*prod-only\s*\*\//
                ]
            }
        };

        // 環境固有の許可パターン
        this.environmentAllowances = {
            development: {
                console: true,           // console使用OK
                debugCode: true,         // デバッグコードOK
                localStorage: 'warning', // localStorageは警告レベル
                hardcodedValues: 'warning' // ハードコードされた値は警告
            },
            test: {
                console: true,           // テストでのconsole使用OK
                mockData: true,          // モックデータOK
                hardcodedValues: true,   // テスト用の固定値OK
                dangerousFunctions: 'warning' // 危険な関数は警告
            },
            production: {
                console: false,          // console使用NG
                debugCode: false,        // デバッグコードNG
                localStorage: false,     // localStorage使用NG
                hardcodedValues: false   // ハードコードされた値NG
            }
        };
    }

    /**
     * ファイルの環境を検出
     */
    detectEnvironment(filePath, content) {
        const environments = [];

        // ファイルパスから判定
        for (const [env, patterns] of Object.entries(this.environmentPatterns)) {
            // ファイル名パターン
            if (patterns.files.some(pattern => pattern.test(filePath))) {
                environments.push(env);
            }

            // ディレクトリパターン
            if (patterns.directories.some(pattern => pattern.test(filePath))) {
                environments.push(env);
            }

            // コード内容から判定
            if (content && patterns.code.some(pattern => pattern.test(content))) {
                environments.push(env);
            }
        }

        // 複数の環境が検出された場合の優先順位
        if (environments.includes('test')) return 'test';
        if (environments.includes('development')) return 'development';
        if (environments.includes('production')) return 'production';

        // デフォルトは本番環境として扱う（安全側に倒す）
        return 'production';
    }

    /**
     * 環境に基づいて検証レベルを調整
     */
    adjustSeverityForEnvironment(issue, environment) {
        const allowances = this.environmentAllowances[environment];
        
        // console使用
        if (issue.type === 'console') {
            if (allowances.console) {
                return 'ignore';
            }
        }

        // localStorage使用
        if (issue.type === 'localStorage') {
            if (allowances.localStorage === true) {
                return 'ignore';
            } else if (allowances.localStorage === 'warning') {
                return 'low';
            }
        }

        // ハードコードされた値
        if (issue.type === 'hardcoded-secret' || issue.type === 'api-key') {
            if (environment === 'test' && issue.context && issue.context.includes('mock')) {
                return 'ignore'; // テストのモックデータ
            }
            if (allowances.hardcodedValues === true) {
                return 'ignore';
            } else if (allowances.hardcodedValues === 'warning') {
                return 'medium';
            }
        }

        // デバッグコード
        if (issue.type === 'debug-code') {
            if (allowances.debugCode) {
                return 'ignore';
            }
        }

        // 元の深刻度を返す
        return issue.severity;
    }

    /**
     * 条件付きコードかどうかを判定
     */
    isConditionalCode(content, position) {
        // positionの前後のコードを取得
        const before = content.substring(Math.max(0, position - 500), position);
        const after = content.substring(position, Math.min(content.length, position + 200));

        // 環境チェックの条件文
        const envCheckPatterns = [
            /if\s*\(\s*process\.env\.NODE_ENV/,
            /if\s*\(\s*DEBUG\s*\)/,
            /if\s*\(\s*__DEV__\s*\)/,
            /if\s*\(\s*DEVELOPMENT\s*\)/,
            /if\s*\(\s*!PRODUCTION\s*\)/
        ];

        return envCheckPatterns.some(pattern => {
            const matchBefore = before.match(pattern);
            if (matchBefore) {
                // 対応する閉じ括弧がposition以降にあるか確認
                const openBraces = (before.match(/{/g) || []).length;
                const closeBraces = (before.match(/}/g) || []).length;
                return openBraces > closeBraces;
            }
            return false;
        });
    }

    /**
     * ビルドツールの設定ファイルかどうか
     */
    isBuildConfig(filePath) {
        const buildConfigPatterns = [
            /webpack\.config\.(js|ts)$/,
            /rollup\.config\.(js|ts)$/,
            /vite\.config\.(js|ts)$/,
            /gulpfile\.(js|ts)$/,
            /Gruntfile\.(js|ts)$/,
            /\.babelrc(\.js)?$/,
            /tsconfig\.json$/,
            /jest\.config\.(js|ts)$/
        ];

        return buildConfigPatterns.some(pattern => pattern.test(filePath));
    }

    /**
     * CI/CD設定ファイルかどうか
     */
    isCIConfig(filePath) {
        const ciPatterns = [
            /\.github\/workflows\//,
            /\.gitlab-ci\.yml$/,
            /\.travis\.yml$/,
            /\.circleci\/config\.yml$/,
            /Jenkinsfile$/,
            /\.drone\.yml$/
        ];

        return ciPatterns.some(pattern => pattern.test(filePath));
    }

    /**
     * 環境固有のファイルかどうか
     */
    isEnvironmentSpecificFile(filePath) {
        const envFilePatterns = [
            /\.env(\.\w+)?$/,
            /config\/(development|test|production)\.(js|json)$/,
            /environments\//
        ];

        return envFilePatterns.some(pattern => pattern.test(filePath));
    }

    /**
     * コンテキストに基づいた推奨事項を生成
     */
    getEnvironmentRecommendation(issue, environment) {
        const recommendations = {
            console: {
                development: 'Consider using a proper logging library with log levels',
                test: 'Console output is acceptable in tests',
                production: 'Remove all console statements or use a build tool to strip them'
            },
            localStorage: {
                development: 'Consider using chrome.storage API even in development',
                test: 'Use mock storage in tests instead of real localStorage',
                production: 'Must use chrome.storage API in production'
            },
            'hardcoded-secret': {
                development: 'Use environment variables or a config file',
                test: 'Use mock values that are clearly marked as test data',
                production: 'Never hardcode secrets in production code'
            },
            'debug-code': {
                development: 'Wrap debug code in environment checks',
                test: 'Debug code is acceptable in test files',
                production: 'All debug code must be removed for production'
            }
        };

        return recommendations[issue.type]?.[environment] || issue.suggestion;
    }

    /**
     * ファイルの役割を推測
     */
    inferFileRole(filePath, content) {
        const roles = [];

        // 設定ファイル
        if (this.isBuildConfig(filePath) || this.isCIConfig(filePath)) {
            roles.push('config');
        }

        // テストファイル
        if (this.environmentPatterns.test.files.some(p => p.test(filePath))) {
            roles.push('test');
        }

        // エントリーポイント
        if (filePath.includes('index.') || filePath.includes('main.') || filePath.includes('app.')) {
            roles.push('entry-point');
        }

        // ユーティリティ
        if (filePath.includes('util') || filePath.includes('helper') || filePath.includes('lib')) {
            roles.push('utility');
        }

        // Chrome拡張機能固有
        if (filePath.includes('background')) roles.push('background-script');
        if (filePath.includes('content')) roles.push('content-script');
        if (filePath.includes('popup')) roles.push('popup-script');
        if (filePath.includes('options')) roles.push('options-page');

        return roles;
    }
}

module.exports = EnvironmentDetector;