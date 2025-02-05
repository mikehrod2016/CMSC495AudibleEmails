
const sendReply = (messageId, message) => {
    chrome.storage.local.get("accessToken", (data) => {
        fetch(`https://www.googleapis.com/gmail/v1/users/me/messages/${messageId}`, {
            headers: { Authorization: `Bearer ${data.accessToken}` }
        })
        .then(response => response.json())
        .then(email => {
            let recipient = email.payload.headers.find(header => header.name === "From").value;
            let subject = "Re: " + (email.payload.headers.find(header => header.name === "Subject")?.value || "No Subject");

            let rawEmail = `To: ${recipient}\nSubject: ${subject}\n\n${message}`;
            let encodedEmail = btoa(rawEmail).replace(/\+/g, '-').replace(/\//g, '_');

            fetch("https://www.googleapis.com/gmail/v1/users/me/messages/send", {
                method: "POST",
                headers: { Authorization: `Bearer ${data.accessToken}` },
                body: JSON.stringify({ raw: encodedEmail })
            })
            .then(() => alert("Reply sent successfully!"));
        });
    });
};
