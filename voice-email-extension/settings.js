chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "startListening") {
        startVoiceRecognition(); // calls from voiceProcessing.js
    }
    else if (message.action === "stopSpeaking") {
        stopVoiceRecognition(); // calls from voiceProcessing.js
    }
});
