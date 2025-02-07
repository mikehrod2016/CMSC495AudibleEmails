//Fetches and replies to emails
const sendEmail = (recipient, subject, message) => {
    const email = {
        to: recipient,
        subject: subject,
        body: message
    };

    fetch("https://www.googleapis.com/gmail/v1/users/me/messages/send", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${accessToken}`, // OAuth2 Token
            "Content-Type": "application/json"
        },
        body: JSON.stringify(email)
    }).then(response => {
        if (response.ok) {
            alert("Email sent successfully!");
        } else {
            alert("Failed to send email.");
        }
    });
};