import userModel from "../models/user.model.js";
import jwt from 'jsonwebtoken';
import { sendEmail } from "../services/mail.service.js";
import { cookie } from "express-validator";

const SERVER_URL = process.env.SERVER_URL || "http://localhost:3000"
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173"

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
}

async function sendVerificationEmail(user) {

    const emailVerificationToken = jwt.sign({
        email: user.email,
    }, process.env.JWT_SECRET, {
        expiresIn: "3d"
    })

    await sendEmail({
        to: user.email,
        subject: "Welcome to Quantix!",
        html: `<p>Hi ${user.username},</p><p>Thank you for registering at <strong>Quantix</strong>. We're excited to have you on board!</p>
        <p>Please verify your email address by clicking the link below:</p>
        <a href='${SERVER_URL}/api/auth/verifyEmail?token=${emailVerificationToken}'>Verify Email</a>
        <p>This link expires in 3 days.</p>
        <p>Best Regards,<br>Quantix Team</p>`
    })
}

export async function register(req, res) {

    const { username, email, password } = req.body;

    const isUserAlreadyExists = await userModel.findOne({
        $or: [{ email }, { username }]
    })

    if (isUserAlreadyExists) {
        return res.status(400).json({
            message: "User with same credentials already exists",
            success: false,
            err: "User already exists"
        })
    }

    const user = await userModel.create({
        username,
        email,
        password
    })

    try {

        await sendVerificationEmail(user)
    }
    catch (err) {
        console.error("Failed to send verification email:", err)
    }

    res.status(201).json({
        message: "User registerd successfully",
        success: true,
        user: {
            id: user._id,
            username: user.username,
            email: user.email
        }
    })
}

export async function resendVerificationEmail(req, res) {
    const { email } = req.body

    if (!email) {
        return res.status(400).json({
            message: "Email is required",
            success: false,
            err: "Email missing"
        })
    }

    const user = await userModel.findOne({ email })

    if (!user) {
        return res.status(404).json({
            message: "No account found with that email",
            success: false,
            err: "User not found"
        })
    }

    if (user.verified) {
        return res.status(400).json({
            message: "This email is already verified. You can login.",
            success: false,
            err: "Already verified"
        })
    }

    try {
        await sendVerificationEmail(user)
    }
    catch (err) {
        console.error("Failed to resend verification email:", err)
        return res.status(500).json({
            message: "Couldn't send the email right now. Please try again in a moment.",
            success: false,
            err: "Mail service failed"
        })
    }

    res.status(200).json({
        message: "Verification email sent. Please check your inbox.",
        success: true
    })
}

export async function login(req, res) {
    const { email, password } = req.body

    const user = await userModel.findOne({ email })

    if (!user) {
        return res.status(400).json({
            message: "Invalid email or password",
            success: false,
            err: "User not found"
        })
    }

    const isPasswordMatch = await user.comparePassword(password)

    if (!isPasswordMatch) {
        return res.status(400).json({
            message: "Invalid credentials",
            success: false,
            err: "Incorrect Password "
        })
    }

    if (!user.verified) {
        return res.status(400).json({
            message: "Please verify you email before logging in!",
            success: false,
            err: "Email not verified"
        })
    }

    const token = jwt.sign({
        id: user._id,
        username: user.username
    }, process.env.JWT_SECRET, { expiresIn: "7d" },)

    res.cookie('token', token, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000
    })

    res.status(200).json({
        message: "User LoggedIN",
        success: true,
        user: {
            id: user._id,
            username: user.username,
            email: user.email
        }
    })
}

export async function verifyEmail(req, res) {
    const { token } = req.query

    // Every outcome redirects to the frontend so the user always lands on a real page
    const redirectToApp = (status, email) => {
        const params = new URLSearchParams({ status })
        if (email) params.set('email', email)
        return res.redirect(`${FRONTEND_URL}/verify-email?${params.toString()}`)
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        const user = await userModel.findOne({ email: decoded.email })

        if (!user) {
            return redirectToApp('invalid')
        }

        if (user.verified) {
            return redirectToApp('already', user.email)
        }

        user.verified = true;

        await user.save();

        return redirectToApp('success', user.email)

    }
    catch (err) {
        if (err.name === 'TokenExpiredError') {
            // The token is unusable but still readable, so the page can offer a resend
            return redirectToApp('expired', jwt.decode(token)?.email)
        }

        return redirectToApp('invalid')
    }


}

export async function getMe(req, res) {
    const userId = req.user.id

    const user = await userModel.findById(userId).select("-password");

    if (!user) {
        return res.status(404).json({
            message: "User not found",
            success: false,
            err: "User not found"
        })
    }

    res.status(200).json({
        message: "User details fetched successfully",
        success: true,
        user
    })
}

export async function logout(req, res) {
    res.clearCookie('token', cookieOptions)

    res.status(200).json({
        message: "User logged out successfully",
        success: true
    })
}