import jwt from 'jsonwebtoken';
import { isTokenBlacklisted } from '../services/tokenBlacklist.js';
import { success } from 'zod';

export async function authUser(req, res, next) {
    const token = req.cookies.token;

    if(!token){
        return res.status(401).json({
            message: "Unauthorized Access",
            success: false,
            err: "No token provided"
        })
    }

    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        if(await isTokenBlacklisted(token)) {
            return res.status(401).json({
                message: "Unauthorized access!",
                success: false,
                err: "Token revoked"
            })
        }

        req.user = decoded

        next()
    }
    catch(err){
        return res.status(401).json({
            message: "Unauthorized Access",
            success: false,
            err: "Invalid Token"
        })
    }
}