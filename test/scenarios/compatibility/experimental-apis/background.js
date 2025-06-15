// 実験的なAPIの使用
chrome.offscreen.createDocument({
    url: 'offscreen.html',
    reasons: ['BLOBS'],
    justification: 'Processing blob data in the background'
});

// WebGPU API（実験的）
if (navigator.gpu) {
    navigator.gpu.requestAdapter().then(adapter => {
        console.log('WebGPU adapter:', adapter);
    });
}

// File System Access API（実験的）
if ('showOpenFilePicker' in window) {
    // This API is not available in service workers
    console.log('File System Access API is available');
}

// 将来のAPI（まだ存在しない可能性）
if (chrome.ai) {
    chrome.ai.generateText({
        prompt: 'Hello world',
        model: 'gemini-nano'
    });
}