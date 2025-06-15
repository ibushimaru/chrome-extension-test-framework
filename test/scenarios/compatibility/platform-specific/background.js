// プラットフォーム検出
const platform = navigator.platform;
const isWindows = platform.includes('Win');
const isMac = platform.includes('Mac');
const isLinux = platform.includes('Linux');

// Windows特有の機能
if (isWindows) {
    // Windows レジストリアクセス（Native Messaging経由）
    chrome.runtime.sendNativeMessage(
        'com.example.windows_registry',
        {action: 'read', key: 'HKEY_CURRENT_USER\\Software\\Example'},
        response => console.log('Registry data:', response)
    );
}

// macOS特有の機能
if (isMac) {
    // macOS通知センター統合
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon.png',
        title: 'macOS Notification',
        message: 'Using native macOS notification features',
        buttons: [{title: 'Open in Finder'}]
    });
}

// Linux特有の機能
if (isLinux) {
    // Linux デスクトップ統合
    if (chrome.system && chrome.system.display) {
        chrome.system.display.getInfo(displays => {
            console.log('X11/Wayland displays:', displays);
        });
    }
}

// ChromeOS特有のAPI
if (chrome.enterprise && chrome.enterprise.deviceAttributes) {
    chrome.enterprise.deviceAttributes.getDeviceSerialNumber(
        serialNumber => console.log('ChromeOS device:', serialNumber)
    );
}