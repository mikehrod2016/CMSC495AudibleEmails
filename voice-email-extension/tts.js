const readTextAloud = (text) => {
    if (!window.speechSynthesis) {
        alert("Your browser does not support text-to-speech.");
        return;
    }

    let utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 1.0;  // Adjust speaking speed (1.0 is normal)
    utterance.pitch = 1.0; // Adjust pitch (1.0 is normal)
    
    speechSynthesis.speak(utterance);
};

const stopTextToSpeech = () => {
    speechSynthesis.cancel();
};
