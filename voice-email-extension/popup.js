//Controls UI logic
document.getElementById("login").addEventListener("click", authenticateUser);
document.getElementById("fetchEmails").addEventListener("click", fetchEmails);
document.getElementById("startListening").addEventListener("click", startVoiceRecognition); {
    chrome.runtime.sendMessage({ action: "startListening" });
});
