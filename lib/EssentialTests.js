/**
 * EssentialTests - クイックモードで実行される必須テストの定義
 */

class EssentialTests {
    /**
     * 必須テストのリスト
     * クイックモードではこれらのテストのみが実行される
     */
    static getEssentialTests() {
        return {
            'Manifest Validation': [
                'manifest.json exists',
                'Valid JSON format',
                'Manifest version is 3',
                'Required fields present'
            ],
            'Security Validation': [
                'Content Security Policy validation',
                'No eval() usage',
                'No hardcoded secrets',
                'Least privilege permissions'
            ],
            'Structure Validation': [
                'Required files present',
                'No development files'
            ]
        };
    }
    
    /**
     * テストが必須かどうかを判定
     */
    static isEssential(suiteName, testName) {
        const essentialTests = this.getEssentialTests();
        const suiteTests = essentialTests[suiteName];
        
        if (!suiteTests) {
            return false;
        }
        
        return suiteTests.includes(testName);
    }
    
    /**
     * スイートに必須テストが含まれるかを判定
     */
    static hasEssentialTests(suiteName) {
        const essentialTests = this.getEssentialTests();
        return essentialTests.hasOwnProperty(suiteName);
    }
    
    /**
     * クイックモードの説明を取得
     */
    static getQuickModeDescription() {
        return {
            description: 'Quick mode runs only essential tests for rapid validation',
            benefits: [
                'Faster execution time (typically under 1 second)',
                'Focus on critical security and structure checks',
                'Perfect for pre-commit hooks and CI/CD pipelines',
                'Validates manifest.json integrity',
                'Checks for major security vulnerabilities'
            ],
            skipped: [
                'Performance optimization checks',
                'Detailed file analysis',
                'CSS optimization',
                'Localization validation',
                'Non-critical warnings'
            ]
        };
    }
}

module.exports = EssentialTests;