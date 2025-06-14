/**
 * Chrome Extension Test Framework 設定例
 * このファイルをプロジェクトルートに配置し、
 * cext-test.config.js または .cextrc.js として保存
 */

module.exports = {
    // テスト対象の拡張機能ディレクトリ
    extensionPath: process.cwd(),
    
    // 出力設定
    output: {
        // 出力形式（配列で複数指定可能）
        format: ['console', 'json', 'html', 'markdown'],
        
        // レポートの出力ディレクトリ
        directory: './test-results',
        
        // レポートのファイル名（拡張子は自動付与）
        filename: 'chrome-extension-test-report'
    },
    
    // バリデーション設定
    validation: {
        manifest: true,      // manifest.jsonの検証
        permissions: true,   // パーミッションの検証
        csp: true,          // Content Security Policyの検証
        icons: true,        // アイコンファイルの検証
        locales: true       // 多言語対応の検証
    },
    
    // カスタムルール（関数の配列）
    rules: [
        // 例: カスタムフィールドの必須チェック
        {
            name: 'custom-field-check',
            validate: (manifest) => {
                return manifest.custom_field !== undefined;
            },
            message: 'custom_field is required in manifest.json'
        },
        
        // 例: 特定のパーミッションの禁止
        {
            name: 'no-dangerous-permissions',
            validate: (manifest) => {
                const permissions = manifest.permissions || [];
                return !permissions.includes('debugger');
            },
            message: 'debugger permission is not allowed'
        }
    ],
    
    // プラグイン（関数の配列）
    plugins: [
        // 例: カスタムレポーター追加
        (framework) => {
            framework.addReporter('custom', {
                generate: (results) => {
                    console.log('Custom report:', results.summary);
                }
            });
        }
    ],
    
    // 並列実行（大規模なテストスイートで有効）
    parallel: false,
    
    // タイムアウト（ミリ秒）
    timeout: 30000,
    
    // 環境別設定
    env: {
        // CI環境での設定
        ci: {
            output: {
                format: ['json'],
                directory: './ci-reports'
            },
            parallel: true
        },
        
        // 開発環境での設定
        development: {
            output: {
                format: ['console'],
                directory: './dev-reports'
            }
        }
    },
    
    // テストスイートの選択
    suites: {
        // 特定のスイートを無効化
        disable: [],
        
        // カスタムスイートのみ実行
        only: []
    },
    
    // 無視するファイル/ディレクトリパターン
    ignore: [
        'test/**',
        'docs/**',
        '*.test.js',
        '*.spec.js'
    ],
    
    // 詳細なログ出力
    verbose: false,
    
    // カスタムバリデーター
    validators: {
        // 例: バージョン番号の形式チェック
        'version-format': {
            validate: (manifest) => {
                return /^\d+\.\d+\.\d+$/.test(manifest.version);
            },
            message: 'Version must be in X.Y.Z format'
        }
    },
    
    // フック
    hooks: {
        // テスト開始前
        beforeAll: async (config) => {
            console.log('Starting tests for:', config.extensionPath);
        },
        
        // テスト終了後
        afterAll: async (results) => {
            console.log('Tests completed:', results.summary);
        },
        
        // 各スイート実行前
        beforeSuite: async (suite) => {
            console.log('Running suite:', suite.name);
        },
        
        // 各スイート実行後
        afterSuite: async (suite, results) => {
            console.log('Suite completed:', suite.name);
        }
    }
};

// 環境変数による設定の切り替え
if (process.env.CI) {
    module.exports = {
        ...module.exports,
        ...module.exports.env.ci
    };
}