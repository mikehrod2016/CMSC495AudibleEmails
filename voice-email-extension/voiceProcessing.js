// handles speech recognition
let recognition = null;

const startVoiceRecognition = () => {
    if (!("webkitSpeechRecognition" in window)) {
        alert("Sorry, your browser does not support speech recognition.");
        return;
    }

    // stop any existing recognition session
    if (recognition) {
        recognition.stop();
    }

    recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    // explicitly request microphone permission
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(() => {
            setupRecognitionHandlers();
            recognition.start();
        })
        .catch(error => {
            console.error("Microphone permission error:", error);
            chrome.runtime.sendMessage({ action: "micError" });
        });
};

const setupRecognitionHandlers = () => {
    recognition.onstart = () => {
        chrome.runtime.sendMessage({ action: "statusUpdate", status: "Listening..." });
    };

    recognition.onend = () => {
        chrome.runtime.sendMessage({ action: "statusUpdate", status: "Voice recognition ended." });    };

    recognition.onresult = (event) => {
        let command = event.results[0][0].transcript.toLowerCase();
        console.log("Recognized CommandL", command);
        chrome.runtime.sendMessage({ action: "voiceCommand", command });
        processCommand(command);
    };

    // handle recognition errors
    recognition.onerror = (event) => {
        let errorMessage = "Error occurred: ";
        switch(event.error) {
            case 'network':
                errorMessage += "Network error. Check your internet connection.";
                break;
            case 'not-allowed':
                errorMessage += "Microphone access denied.";
                break;
            case 'no-speech':
                errorMessage += "No speech detected.";
                break;
            default:
                errorMessage += event.error;
        }
        chrome.runtime.sendMessage({ action: "statusUpdate", status: errorMessage });
        console.error("Voice Recognition Error:", event.error);
    };
};

const processCommand = (command) => {
    console.log("Processing command:", command);

    // map of supported commands
    const commands = {
        "compose email": () => chrome.tabs.create({ url: "https://mail.google.com/mail/u/0/#inbox?compose=new" }),
        "read my latest email": fetchFirstFiveEmails,
        "delete my last email": deleteLatestEmail,
        "mark as read": markEmailAsRead
    };

    // check if spoken command matches any supported commands
    const matchedCommand = Object.entries(commands).find(([key]) => command.includes(key));

    if (matchedCommand) {
        matchedCommand[1]();
    } else {
        chrome.runtime.sendMessage({ action: "statusUpdate", status: "Command not recognized." });    }
};

// listen for messages from other parts of the extension
chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "startListening") {
        startVoiceRecognition();
    }
    else if (message.action === "stopListening") {
        recognition.stop();
        chrome.runtime.sendMessage({ action: "statusUpdate", status: "Voice recognition stopped." });
    }
});