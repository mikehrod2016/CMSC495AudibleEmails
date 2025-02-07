//Controls UI logic
document.getElementById("startListening").addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "startListening" });
});