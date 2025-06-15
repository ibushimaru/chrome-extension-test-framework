import { initializeAPI } from './modules/api-handler.js';
import { setupAlarms } from './modules/alarm-manager.js';
import { NotificationService } from './modules/notification-service.js';
import { StorageManager } from './modules/storage-manager.js';
import { TabManager } from './modules/tab-manager.js';
import { ContextMenuBuilder } from './modules/context-menu.js';
import { MessageHandler } from './utils/message-handler.js';
import { Logger } from '../common/utils/logger.js';
import { CONFIG } from '../common/constants/config.js';

const logger = new Logger('BackgroundService');

// 初期化
chrome.runtime.onInstalled.addListener(async (details) => {
    logger.info('Extension installed', details);
    
    await initializeAPI();
    await setupAlarms();
    await ContextMenuBuilder.build();
    
    if (details.reason === 'install') {
        await StorageManager.setDefaults();
        chrome.tabs.create({ url: 'src/options/options.html' });
    }
});

// メッセージハンドリング
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    return MessageHandler.handle(request, sender, sendResponse);
});

// アラームハンドリング
chrome.alarms.onAlarm.addListener((alarm) => {
    logger.debug('Alarm triggered:', alarm.name);
    // アラーム処理
});

// タブイベント
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    TabManager.handleUpdate(tabId, changeInfo, tab);
});

// コマンドハンドリング
chrome.commands.onCommand.addListener((command) => {
    logger.info('Command received:', command);
    // コマンド処理
});