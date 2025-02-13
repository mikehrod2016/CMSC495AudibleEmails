//Controls UI logic
document.getElementById("login").addEventListener("click", authenticateUser);
document.getElementById("fetchEmails").addEventListener("click", fetchFirstFiveEmails);
document.getElementById("startListening").addEventListener("click", startVoiceRecognition); 
document.getElementById("stopSpeaking").addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "startListening" });
});

// open full-tab page
document.getElementById('openPage').addEventListener('click', function() {
    chrome.tabs.create({
        url: '/settings.html'
    });
});

