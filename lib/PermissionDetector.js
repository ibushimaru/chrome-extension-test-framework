/**
 * PermissionDetector - 正確な権限検出
 * 
 * コードから実際に使用されている権限を検出し、
 * ファントム権限（実際には不要な権限）を特定する
 */

class PermissionDetector {
    constructor() {
        // Chrome APIと必要な権限のマッピング
        this.apiPermissionMap = {
            // 権限が必要なAPI
            'chrome.storage.sync': 'storage',
            'chrome.storage.local': 'storage',
            'chrome.storage.managed': 'storage',
            'chrome.storage.session': 'storage',
            
            'chrome.tabs.query': null, // 権限不要（activeTab以外）
            'chrome.tabs.create': null, // 権限不要
            'chrome.tabs.update': null, // 権限不要（URL以外）
            'chrome.tabs.remove': null, // 権限不要
            'chrome.tabs.sendMessage': null, // 権限不要（activeTab以外）
            'chrome.tabs.executeScript': 'tabs', // Manifest V2のみ
            'chrome.tabs.insertCSS': 'tabs', // Manifest V2のみ
            'chrome.tabs.getZoom': 'tabs',
            'chrome.tabs.setZoom': 'tabs',
            
            'chrome.cookies.get': 'cookies',
            'chrome.cookies.getAll': 'cookies',
            'chrome.cookies.set': 'cookies',
            'chrome.cookies.remove': 'cookies',
            
            'chrome.history.search': 'history',
            'chrome.history.getVisits': 'history',
            'chrome.history.addUrl': 'history',
            'chrome.history.deleteUrl': 'history',
            
            'chrome.bookmarks.get': 'bookmarks',
            'chrome.bookmarks.getTree': 'bookmarks',
            'chrome.bookmarks.create': 'bookmarks',
            'chrome.bookmarks.update': 'bookmarks',
            'chrome.bookmarks.remove': 'bookmarks',
            
            'chrome.downloads.download': 'downloads',
            'chrome.downloads.search': 'downloads',
            'chrome.downloads.pause': 'downloads',
            'chrome.downloads.resume': 'downloads',
            'chrome.downloads.cancel': 'downloads',
            
            'chrome.notifications.create': 'notifications',
            'chrome.notifications.update': 'notifications',
            'chrome.notifications.clear': 'notifications',
            
            'chrome.contextMenus.create': 'contextMenus',
            'chrome.contextMenus.update': 'contextMenus',
            'chrome.contextMenus.remove': 'contextMenus',
            
            'chrome.webRequest.onBeforeRequest': 'webRequest',
            'chrome.webRequest.onBeforeSendHeaders': 'webRequest',
            'chrome.webRequest.onCompleted': 'webRequest',
            
            'chrome.webNavigation.onCommitted': 'webNavigation',
            'chrome.webNavigation.onCompleted': 'webNavigation',
            
            'chrome.identity.getAuthToken': 'identity',
            'chrome.identity.removeCachedAuthToken': 'identity',
            'chrome.identity.launchWebAuthFlow': 'identity',
            
            'chrome.management.get': 'management',
            'chrome.management.getAll': 'management',
            'chrome.management.setEnabled': 'management',
            
            'chrome.permissions.request': null, // 権限不要
            'chrome.permissions.remove': null, // 権限不要
            'chrome.permissions.contains': null, // 権限不要
            
            'chrome.alarms.create': 'alarms',
            'chrome.alarms.get': 'alarms',
            'chrome.alarms.clear': 'alarms',
            
            'chrome.idle.queryState': 'idle',
            'chrome.idle.setDetectionInterval': 'idle',
            
            'chrome.power.requestKeepAwake': 'power',
            'chrome.power.releaseKeepAwake': 'power',
            
            'chrome.tts.speak': 'tts',
            'chrome.tts.stop': 'tts',
            'chrome.tts.pause': 'tts',
            
            'chrome.topSites.get': 'topSites',
            
            'chrome.browsingData.remove': 'browsingData',
            'chrome.browsingData.removeHistory': 'browsingData',
            'chrome.browsingData.removeCookies': 'browsingData',
            
            'chrome.contentSettings.cookies.set': 'contentSettings',
            'chrome.contentSettings.javascript.set': 'contentSettings',
            
            'chrome.debugger.attach': 'debugger',
            'chrome.debugger.detach': 'debugger',
            'chrome.debugger.sendCommand': 'debugger',
            
            'chrome.declarativeContent.onPageChanged': 'declarativeContent',
            'chrome.declarativeNetRequest.updateDynamicRules': 'declarativeNetRequest',
            
            'chrome.gcm.register': 'gcm',
            'chrome.gcm.send': 'gcm',
            
            'chrome.proxy.settings.set': 'proxy',
            'chrome.proxy.settings.get': 'proxy',
            
            'chrome.system.cpu.getInfo': 'system.cpu',
            'chrome.system.memory.getInfo': 'system.memory',
            'chrome.system.storage.getInfo': 'system.storage',
            
            'chrome.vpnProvider.createConfig': 'vpnProvider',
            'chrome.vpnProvider.destroyConfig': 'vpnProvider',
            
            // Manifest V3 specific
            'chrome.scripting.executeScript': 'scripting',
            'chrome.scripting.insertCSS': 'scripting',
            'chrome.scripting.removeCSS': 'scripting',
            
            'chrome.action.setIcon': null, // 権限不要
            'chrome.action.setBadgeText': null, // 権限不要
            'chrome.action.setPopup': null, // 権限不要
            
            // 権限不要な一般的なAPI
            'chrome.runtime.sendMessage': null,
            'chrome.runtime.onMessage': null,
            'chrome.runtime.getURL': null,
            'chrome.runtime.getManifest': null,
            'chrome.runtime.id': null,
            'chrome.runtime.lastError': null,
            
            'chrome.i18n.getMessage': null,
            'chrome.i18n.getUILanguage': null,
            
            'chrome.extension.getURL': null, // deprecated but still used
        };

        // ホスト権限が必要なパターン
        this.hostPermissionPatterns = [
            /fetch\s*\(\s*['"`]https?:\/\//,
            /XMLHttpRequest.*\.open\s*\(\s*['"`]\w+['"`]\s*,\s*['"`]https?:\/\//,
            /\$\.ajax\s*\(\s*{[^}]*url\s*:\s*['"`]https?:\/\//,
            /axios\.\w+\s*\(\s*['"`]https?:\/\//
        ];

        // activeTab権限で十分なパターン
        this.activeTabPatterns = [
            /chrome\.tabs\.executeScript\s*\(\s*{/,
            /chrome\.tabs\.insertCSS\s*\(\s*{/,
            /chrome\.tabs\.sendMessage\s*\(/,
            /chrome\.scripting\.executeScript\s*\(\s*{/
        ];
    }

    /**
     * コードから使用されている権限を検出
     */
    detectUsedPermissions(files) {
        const usedPermissions = new Set();
        const usedHostPatterns = new Set();
        const apiUsage = new Map();
        const unusedDeclaredPermissions = new Set();

        // 各ファイルを分析
        files.forEach(file => {
            const { permissions, hosts, apis } = this.analyzeFile(file);
            
            permissions.forEach(p => usedPermissions.add(p));
            hosts.forEach(h => usedHostPatterns.add(h));
            apis.forEach((count, api) => {
                apiUsage.set(api, (apiUsage.get(api) || 0) + count);
            });
        });

        return {
            permissions: Array.from(usedPermissions),
            hostPatterns: Array.from(usedHostPatterns),
            apiUsage: Object.fromEntries(apiUsage),
            needsActiveTab: this.checkActiveTabNeed(files)
        };
    }

    /**
     * ファイルを分析
     */
    analyzeFile(file) {
        const permissions = new Set();
        const hosts = new Set();
        const apis = new Map();

        // Chrome API使用を検出
        Object.entries(this.apiPermissionMap).forEach(([api, permission]) => {
            const regex = new RegExp(api.replace(/\./g, '\\.') + '\\s*\\(', 'g');
            const matches = file.content.match(regex) || [];
            
            if (matches.length > 0) {
                apis.set(api, matches.length);
                if (permission) {
                    permissions.add(permission);
                }
            }
        });

        // ホスト権限を検出
        this.hostPermissionPatterns.forEach(pattern => {
            const matches = file.content.match(pattern) || [];
            matches.forEach(match => {
                const urlMatch = match.match(/https?:\/\/[^'"`\s]+/);
                if (urlMatch) {
                    const url = urlMatch[0];
                    const host = this.extractHostPattern(url);
                    if (host) {
                        hosts.add(host);
                    }
                }
            });
        });

        return { permissions, hosts, apis };
    }

    /**
     * URLからホストパターンを抽出
     */
    extractHostPattern(url) {
        try {
            const urlObj = new URL(url);
            // APIエンドポイントの場合はドメインレベルで権限が必要
            return `${urlObj.protocol}//${urlObj.hostname}/*`;
        } catch (e) {
            return null;
        }
    }

    /**
     * activeTab権限が必要かチェック
     */
    checkActiveTabNeed(files) {
        return files.some(file => 
            this.activeTabPatterns.some(pattern => pattern.test(file.content))
        );
    }

    /**
     * マニフェストと実際の使用を比較
     */
    compareWithManifest(manifest, detectedPermissions) {
        const declaredPermissions = new Set([
            ...(manifest.permissions || []),
            ...(manifest.optional_permissions || [])
        ]);
        
        const declaredHosts = new Set([
            ...(manifest.host_permissions || []),
            // Manifest V2の権限からホストパターンを抽出
            ...(manifest.permissions || []).filter(p => p.includes('://'))
        ]);

        // 未使用の権限
        const unusedPermissions = Array.from(declaredPermissions)
            .filter(p => !p.includes('://') && !detectedPermissions.permissions.includes(p));

        // 不足している権限
        const missingPermissions = detectedPermissions.permissions
            .filter(p => !declaredPermissions.has(p));

        // 未使用のホスト権限
        const unusedHosts = Array.from(declaredHosts)
            .filter(h => !this.isHostPatternUsed(h, detectedPermissions.hostPatterns));

        // 不足しているホスト権限
        const missingHosts = detectedPermissions.hostPatterns
            .filter(h => !this.isHostPatternDeclared(h, declaredHosts));

        return {
            unusedPermissions,
            missingPermissions,
            unusedHosts,
            missingHosts,
            recommendations: this.generateRecommendations({
                unusedPermissions,
                missingPermissions,
                unusedHosts,
                missingHosts,
                detectedPermissions
            })
        };
    }

    /**
     * ホストパターンが使用されているかチェック
     */
    isHostPatternUsed(declared, used) {
        // <all_urls>や*://*/*などの広範なパターン
        if (declared === '<all_urls>' || declared === '*://*/*') {
            return used.length > 0;
        }

        // 特定のパターンマッチング
        return used.some(usedPattern => {
            return this.matchHostPattern(declared, usedPattern);
        });
    }

    /**
     * ホストパターンが宣言されているかチェック
     */
    isHostPatternDeclared(used, declared) {
        return Array.from(declared).some(declaredPattern => {
            return this.matchHostPattern(declaredPattern, used);
        });
    }

    /**
     * ホストパターンのマッチング
     */
    matchHostPattern(pattern, url) {
        // 簡易的なパターンマッチング
        if (pattern === '<all_urls>' || pattern === '*://*/*') {
            return true;
        }

        // パターンを正規表現に変換
        const regexPattern = pattern
            .replace(/\*/g, '.*')
            .replace(/\?/g, '.')
            .replace(/\//g, '\\/')
            .replace(/\./g, '\\.');

        return new RegExp(regexPattern).test(url);
    }

    /**
     * 推奨事項を生成
     */
    generateRecommendations(analysis) {
        const recommendations = [];

        // 未使用の権限
        if (analysis.unusedPermissions.length > 0) {
            recommendations.push({
                type: 'unused-permissions',
                severity: 'WARNING',
                message: `Unused permissions detected: ${analysis.unusedPermissions.join(', ')}`,
                suggestion: 'Remove unused permissions to follow the principle of least privilege'
            });
        }

        // 不足している権限
        if (analysis.missingPermissions.length > 0) {
            recommendations.push({
                type: 'missing-permissions',
                severity: 'ERROR',
                message: `Missing required permissions: ${analysis.missingPermissions.join(', ')}`,
                suggestion: 'Add these permissions to manifest.json to ensure functionality'
            });
        }

        // 広範なホスト権限
        if (analysis.unusedHosts.includes('<all_urls>') || analysis.unusedHosts.includes('*://*/*')) {
            recommendations.push({
                type: 'broad-host-permissions',
                severity: 'WARNING',
                message: 'Broad host permissions detected but not fully utilized',
                suggestion: 'Consider using activeTab or limiting to specific domains'
            });
        }

        // activeTabの推奨
        if (analysis.detectedPermissions.needsActiveTab && 
            !analysis.declaredPermissions?.has('activeTab')) {
            recommendations.push({
                type: 'activeTab-recommended',
                severity: 'INFO',
                message: 'Consider using activeTab permission',
                suggestion: 'activeTab is safer than broad host permissions for user-initiated actions'
            });
        }

        return recommendations;
    }

    /**
     * 権限の使用状況レポート
     */
    generateUsageReport(apiUsage) {
        const report = [];
        
        // 使用頻度でソート
        const sortedApis = Object.entries(apiUsage)
            .sort(([, a], [, b]) => b - a);

        report.push('API Usage Report:');
        sortedApis.forEach(([api, count]) => {
            const permission = this.apiPermissionMap[api];
            const permissionInfo = permission ? ` (requires: ${permission})` : ' (no permission needed)';
            report.push(`  ${api}: ${count} calls${permissionInfo}`);
        });

        return report.join('\n');
    }
}

module.exports = PermissionDetector;