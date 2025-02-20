// Handles background events
chrome.runtime.onInstalled.addListener(() => {
    console.log("Voice Email Extension Installed!");
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "getAuthToken") {
        chrome.identity.getAuthToken({ interactive: message.interactive}, (token) => {
            if (chrome.runtime.lastError) {
                sendResponse({ error: chrome.runtime.lastError });
                return;
            }
            sendResponse({ token });
        })
        return true; // keep sendResponse open for async response
    }
});


