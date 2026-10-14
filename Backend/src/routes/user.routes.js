import { Router } from 'express'
import { register, verifyEmail, resendVerificationEmail, login, getMe, logout } from '../controllers/auth.controller.js';
import { registerValidator, loginValidator } from '../validators/auth.validator.js';
import { authUser } from '../middleware/auth.middleware.js';

const authRouter = Router()


// @route POST /api/auth/register
// @desc Register new user
// @access Public

authRouter.post("/register", registerValidator, register)

authRouter.post("/login", loginValidator, login)

authRouter.get("/verifyEmail", verifyEmail)

authRouter.post("/resend-verification", resendVerificationEmail)

authRouter.get("/get-me", authUser, getMe)

authRouter.post("/logout", logout)

export default authRouter;