document.addEventListener('DOMContentLoaded', function() {
    // debugging
    console.log("DOM Content Loaded in voiceProcessing.js");
    console.log("fetchFirstFiveEmails exists:", typeof window.fetchFirstFiveEmails === 'function');
    console.log("stopTextToSpeech exists:", typeof window.stopTextToSpeech === 'function');

    // Wait for required functions to be available
    const checkFunctions = () => {
        if (typeof window.fetchFirstFiveEmails === 'function' &&
            typeof window.stopTextToSpeech === 'function' &&
            typeof window.readTextAloud === 'function' &&
            typeof window.deleteLatestEmail === 'function' &&
            typeof window.markEmailAsRead === 'function' &&
            typeof window.readEmailByNumber === 'function' &&
            typeof window.deleteEmailByNumber === 'function') {

            // Now initialize speech recognition
            initializeSpeechRecognition();
        } else {
            console.log("Waiting for functions to be available...");
            setTimeout(checkFunctions, 100); // Check again in 100ms
        }
    };

    // Start checking for functions
    checkFunctions();

    function initializeSpeechRecognition() {
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

            setupRecognitionHandlers();
            recognition.start();

            chrome.runtime.sendMessage({
                action: "statusUpdate",
                status: "Listening started successfully..."
            });
        };

        const setupRecognitionHandlers = () => {
            recognition.onstart = () => {
                chrome.runtime.sendMessage({
                    action: "statusUpdate",
                    status: "Listening..."
                });
            };

            recognition.onend = () => {
                chrome.runtime.sendMessage({
                    action: "statusUpdate",
                    status: "Voice recognition ended."
                });
            };

            recognition.onresult = (event) => {
                let command = event.results[0][0].transcript.toLowerCase();
                console.log("Recognized Command", command);
                chrome.runtime.sendMessage({
                    action: "voiceCommand",
                    command
                });
                processCommand(command);
            };

            // handle recognition errors
            recognition.onerror = (event) => {
                let errorMessage = "Error occurred: ";
                switch (event.error) {
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
                chrome.runtime.sendMessage({
                    action: "statusUpdate",
                    status: errorMessage
                });
                console.error("Voice Recognition Error:", event.error);
            };
        };

        const processCommand = (command) => {
            console.log("Processing command:", command);

            // map of supported commands
            const commands = {
                "compose email": () => chrome.tabs.create({
                    url: "https://mail.google.com/mail/u/0/#inbox?compose=new"
                }),
                "read my latest email": () => window.fetchFirstFiveEmails(),
                "stop speaking": () => window.stopTextToSpeech(),
                "delete my last email": () => window.deleteLatestEmail(),
                "mark as read": () => window.markEmailAsRead()
            }

            // check if spoken command matches any supported commands
            const matchedCommand = Object.entries(commands).find(([key]) => command.includes(key));

            if (matchedCommand) {
                matchedCommand[1]();
            } else {
                // read email by number command
                const readEmailNumber = command.match(/read email (\d+)/);
                if (readEmailNumber && readEmailNumber[1]) {
                    const emailNumber = parseInt(readEmailNumber[1]);
                    window.readEmailByNumber(emailNumber);
                    return;
                }
                // delete email by number command
                const deleteEmailNumber = command.match(/delete (\d+)/);
                if (deleteEmailNumber && deleteEmailNumber[1]) {
                    const emailNumber = parseInt(deleteEmailNumber[1]);
                    window.deleteEmailByNumber(emailNumber);
                    return;
                }

                chrome.runtime.sendMessage({
                    action: "statusUpdate",
                    status: "Command not recognized."
                });
                window.readTextAloud("Sorry, I didn't understand that.");
            }
        };

        // listen for messages from other parts of the extension
        chrome.runtime.onMessage.addListener((message) => {
            if (message.action === "startListening") {
                startVoiceRecognition();
            } else if (message.action === "stopListening") {
                recognition.stop();
                chrome.runtime.sendMessage({
                    action: "statusUpdate",
                    status: "Voice recognition stopped."
                });
            }
        });

        window.startVoiceRecognition = startVoiceRecognition;
    }
});