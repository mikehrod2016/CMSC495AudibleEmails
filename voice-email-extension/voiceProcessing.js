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
        console.log("Listening...");
    };

    recognition.onresult = (event) => {
        let command = event.results[0][0].transcript.toLowerCase();
        console.log("Command received:", command);
        processCommand(command);
    };

    recognition.onerror = (event) => {
        console.error("Error:", event.error);
    };

    recognition.start();
};

const processCommand = (command) => {
    if (command.includes("compose email")) {
        chrome.tabs.create({ url: "https://mail.google.com/mail/u/0/#inbox?compose=new" });
    } else if (command.includes("read emails")) {
        alert("Reading latest email... (Feature in Progress)");
    } else {
        alert("Command not recognized.");
    }
};

chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "startListening") {
        startVoiceRecognition();
    }
});

