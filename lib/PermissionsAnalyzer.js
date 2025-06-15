/**
 * PermissionsAnalyzer
 * Chrome拡張機能の権限を詳細に分析するクラス
 */

class PermissionsAnalyzer {
    constructor() {
        // 権限の分類と説明
        this.permissionCategories = {
            sensitive: {
                permissions: {
                    'debugger': 'Can attach to browser tabs and intercept network traffic',
                    'declarativeNetRequest': 'Can block or modify network requests',
                    'declarativeNetRequestFeedback': 'Can receive information about blocked requests',
                    'downloads': 'Can manage downloads',
                    'geolocation': 'Can access your location',
                    'management': 'Can manage other extensions',
                    'nativeMessaging': 'Can communicate with native applications',
                    'privacy': 'Can change privacy settings',
                    'proxy': 'Can control proxy settings',
                    'system.cpu': 'Can access CPU information',
                    'system.memory': 'Can access memory information',
                    'system.storage': 'Can access storage device information',
                    'vpnProvider': 'Can configure VPN connections',
                    'webRequest': 'Can observe and analyze network traffic',
                    'webRequestBlocking': 'Can block network requests'
                },
                hostPermissions: {
                    '<all_urls>': 'Can access data on all websites',
                    'http://*/*': 'Can access data on all HTTP websites',
                    'https://*/*': 'Can access data on all HTTPS websites',
                    '*://*/*': 'Can access data on all websites',
                    'file:///*': 'Can access local files on your computer'
                }
            },
            moderate: {
                permissions: {
                    'bookmarks': 'Can read and modify bookmarks',
                    'browsingData': 'Can remove browsing data',
                    'contentSettings': 'Can change content settings',
                    'cookies': 'Can access cookies',
                    'history': 'Can access browsing history',
                    'tabs': 'Can access browser tabs',
                    'topSites': 'Can access most visited sites',
                    'webNavigation': 'Can access browser navigation history'
                }
            },
            low: {
                permissions: {
                    'activeTab': 'Can access current tab when clicked',
                    'alarms': 'Can schedule code to run periodically',
                    'contextMenus': 'Can add items to context menu',
                    'idle': 'Can detect when machine is idle',
                    'notifications': 'Can display notifications',
                    'storage': 'Can store data locally',
                    'unlimitedStorage': 'Can store unlimited amount of data'
                }
            }
        };
    }

    /**
     * 権限を分析
     */
    analyze(manifest) {
        const results = {
            totalPermissions: 0,
            sensitivePermissions: [],
            moderatePermissions: [],
            lowRiskPermissions: [],
            unknownPermissions: [],
            hostPermissions: [],
            recommendations: []
        };

        // 通常の権限を分析
        const permissions = manifest.permissions || [];
        permissions.forEach(permission => {
            results.totalPermissions++;
            
            if (this.permissionCategories.sensitive.permissions[permission]) {
                results.sensitivePermissions.push({
                    name: permission,
                    description: this.permissionCategories.sensitive.permissions[permission],
                    risk: 'high'
                });
            } else if (this.permissionCategories.moderate.permissions[permission]) {
                results.moderatePermissions.push({
                    name: permission,
                    description: this.permissionCategories.moderate.permissions[permission],
                    risk: 'moderate'
                });
            } else if (this.permissionCategories.low.permissions[permission]) {
                results.lowRiskPermissions.push({
                    name: permission,
                    description: this.permissionCategories.low.permissions[permission],
                    risk: 'low'
                });
            } else {
                results.unknownPermissions.push({
                    name: permission,
                    description: 'Unknown permission - may be custom or deprecated',
                    risk: 'unknown'
                });
            }
        });

        // ホスト権限を分析
        const hostPermissions = manifest.host_permissions || [];
        hostPermissions.forEach(pattern => {
            results.totalPermissions++;
            
            const sensitivePattern = this.permissionCategories.sensitive.hostPermissions[pattern];
            if (sensitivePattern) {
                results.hostPermissions.push({
                    pattern: pattern,
                    description: sensitivePattern,
                    risk: 'high',
                    scope: 'all-sites'
                });
            } else if (pattern.includes('*')) {
                results.hostPermissions.push({
                    pattern: pattern,
                    description: `Can access data on: ${pattern}`,
                    risk: 'moderate',
                    scope: this.analyzeHostScope(pattern)
                });
            } else {
                results.hostPermissions.push({
                    pattern: pattern,
                    description: `Can access data on: ${pattern}`,
                    risk: 'low',
                    scope: 'specific-site'
                });
            }
        });

        // 推奨事項を生成
        this.generateRecommendations(results);

        return results;
    }

    /**
     * ホストパターンのスコープを分析
     */
    analyzeHostScope(pattern) {
        if (pattern.includes('://*/*')) {
            return 'all-sites';
        } else if (pattern.includes('*://')) {
            return 'all-protocols';
        } else if (pattern.includes('/*')) {
            return 'entire-domain';
        } else {
            return 'specific-pages';
        }
    }

    /**
     * 推奨事項を生成
     */
    generateRecommendations(results) {
        // 過剰な権限の警告
        if (results.sensitivePermissions.length > 3) {
            results.recommendations.push({
                type: 'warning',
                message: 'Extension requests many sensitive permissions. Consider if all are necessary.',
                details: 'Having too many permissions increases security risk and may deter users from installing.'
            });
        }

        // 広範なホスト権限の警告
        const broadHostPerms = results.hostPermissions.filter(h => h.scope === 'all-sites');
        if (broadHostPerms.length > 0) {
            results.recommendations.push({
                type: 'warning',
                message: 'Extension requests access to all websites. Consider using activeTab or specific domains.',
                details: 'Broad host permissions are a security risk. Use "activeTab" for user-initiated actions.'
            });
        }

        // webRequestBlockingの警告
        const hasWebRequestBlocking = results.sensitivePermissions.some(p => p.name === 'webRequestBlocking');
        if (hasWebRequestBlocking) {
            results.recommendations.push({
                type: 'info',
                message: 'Consider migrating to declarativeNetRequest API (Manifest V3).',
                details: 'webRequestBlocking is being phased out in favor of declarativeNetRequest.'
            });
        }

        // 権限の組み合わせチェック
        const hasTabsAndHistory = 
            results.moderatePermissions.some(p => p.name === 'tabs') &&
            results.moderatePermissions.some(p => p.name === 'history');
        
        if (hasTabsAndHistory) {
            results.recommendations.push({
                type: 'info',
                message: 'Extension can track detailed browsing activity with tabs + history permissions.',
                details: 'This combination allows complete browsing history tracking.'
            });
        }
    }

    /**
     * 詳細なレポートを生成
     */
    generateReport(results) {
        const lines = [];

        lines.push('📊 Permissions Analysis Report');
        lines.push(`   Total permissions requested: ${results.totalPermissions}`);
        
        if (results.sensitivePermissions.length > 0) {
            lines.push('\n🚨 Sensitive Permissions:');
            results.sensitivePermissions.forEach(perm => {
                lines.push(`   • ${perm.name}: ${perm.description}`);
            });
        }

        if (results.moderatePermissions.length > 0) {
            lines.push('\n⚠️  Moderate Risk Permissions:');
            results.moderatePermissions.forEach(perm => {
                lines.push(`   • ${perm.name}: ${perm.description}`);
            });
        }

        if (results.lowRiskPermissions.length > 0) {
            lines.push('\n✅ Low Risk Permissions:');
            results.lowRiskPermissions.forEach(perm => {
                lines.push(`   • ${perm.name}: ${perm.description}`);
            });
        }

        if (results.hostPermissions.length > 0) {
            lines.push('\n🌐 Host Permissions:');
            results.hostPermissions.forEach(host => {
                const riskIcon = host.risk === 'high' ? '🚨' : host.risk === 'moderate' ? '⚠️' : '✅';
                lines.push(`   ${riskIcon} ${host.pattern}: ${host.description}`);
            });
        }

        if (results.recommendations.length > 0) {
            lines.push('\n💡 Recommendations:');
            results.recommendations.forEach(rec => {
                lines.push(`   ${rec.type === 'warning' ? '⚠️' : 'ℹ️'} ${rec.message}`);
                if (rec.details) {
                    lines.push(`      ${rec.details}`);
                }
            });
        }

        return lines.join('\n');
    }
}

module.exports = PermissionsAnalyzer;