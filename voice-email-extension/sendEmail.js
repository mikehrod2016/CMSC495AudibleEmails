//Sends emails via Gmail API
const composeEmailWithVoice = () => {
    let recipient = prompt("Speak the recipient's email address:");
    if (!recipient) return;

    let subject = prompt("Speak the subject:");
    if (!subject) return;

    let body = prompt("Speak the message body:");
    if (!body) return;

    sendEmail(recipient, subject, body);
};

const sendEmail = (recipient, subject, message) => {
    chrome.storage.local.get("accessToken", (data) => {
        let emailContent = `To: ${recipient}\nSubject: ${subject}\n\n${message}`;
        let encodedEmail = btoa(emailContent).replace(/\+/g, '-').replace(/\//g, '_');

        fetch("https://www.googleapis.com/gmail/v1/users/me/messages/send", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${data.accessToken}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ raw: encodedEmail })
        })
        .then(() => alert("Email sent successfully!"))
        .catch(error => console.error("Error sending email:", error));
    });
};
