import { google, oauth2_v2 } from 'googleapis';
import MailComposer from 'nodemailer/lib/mail-composer/index.js';

const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
)

auth.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
})

const gmail = google.gmail({
    version: 'v1', auth 
})

export async function sendEmail({ to, subject, html, text }) {
    const message = await new MailComposer({
        from: process.env.GOOGLE_USER,
        to,
        subject,
        html,
        text
    }).compile().build();

    const res = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
            raw: message.toString('base64url')
        }
    })
    console.log("Email sent:", res.data.id)
}