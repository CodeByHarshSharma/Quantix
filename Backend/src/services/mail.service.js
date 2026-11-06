import nodemailer from 'nodemailer';
import dns from 'node:dns';

dns.setDefaultResultOrder('ipv4first')

const transport = nodemailer.createTransport({
    
    service: 'gmail',
    auth: {
        type: 'OAuth2',
        user: process.env.GOOGLE_USER,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
        clientId: process.env.GOOGLE_CLIENT_ID
    }
})

transport.verify()
    .then(() => {
        console.log("Email transporter is ready to send emails")
    })
    .catch((error) => {
        console.error("Email transporter verification failed:", error)
    })


export async function sendEmail({ to, subject, html, text }) {
    const mailOptions = {
        from: process.env.GOOGLE_USER,
        to,
        subject,
        html,
        text
    }

    const details = await transport.sendMail(mailOptions)
    console.log("Email sent:", details)
}