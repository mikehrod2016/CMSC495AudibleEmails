document.getElementById("startListening").addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "startListening" });
});