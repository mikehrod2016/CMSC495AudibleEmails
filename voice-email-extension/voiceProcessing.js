//Handles speech recognition
const startVoiceRecognition = () => {
    if (!("webkitSpeechRecognition" in window)) {
        alert("Your browser does not support speech recognition.");
        return;
    }

    let recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => {
        document.getElementById("status").innerText = "Listening...";
    };

    recognition.onresult = (event) => {
        let command = event.results[0][0].transcript.toLowerCase();
        document.getElementById("status").innerText = `Heard: ${command}`;
        processCommand(command);
    };

    recognition.onerror = (event) => {
        document.getElementById("status").innerText = "Error. Try again.";
        console.error("Voice Recognition Error:", event.error);
    };

    recognition.start();
};

const processCommand = (command) => {
    if (command.includes("compose email")) {
        chrome.tabs.create({ url: "https://mail.google.com/mail/u/0/#inbox?compose=new" });
    } else if (command.includes("read my latest email")) {
        fetchFirstFiveEmails();
    } else if (command.includes("delete my last email")) {
        deleteLatestEmail();
    } else if (command.includes("save draft")) {
        saveDraft();
    } else if (command.includes("mark my last email as read")) {
        markEmailAsRead();
    } else {
        alert("Command not recognized. Please try again.");
    }
};

chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "startListening") {
        startVoiceRecognition();
    }
});

