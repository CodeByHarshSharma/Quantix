import { useDispatch } from "react-redux";
import { register, login, getMe, resendVerification, logout } from "../service/auth.api";
import { setUser, setLoading, setError } from "../auth.slice";
import { resetChat } from "../../chat/chat.slice";

export function useAuth() {

    const dispatch = useDispatch()

    async function handleRegister({ email, username, password }){
        try{
            dispatch(setLoading(true))
            const data = await register({ email, username, password })
            return data
        }
        catch(error){
            dispatch(setError(error.response?.data?.message || "Registration Failed!"))
            throw error
        }
        finally{
            dispatch(setLoading(false))
        }
    }

    async function handleResendVerification({ email }){
        try{
            const data = await resendVerification({ email })
            return data
        }
        catch(error){
            dispatch(setError(error.response?.data?.message || "Couldn't resend the verification email!"))
            throw error
        }
    }

    async function handleLogin({ email, password }) {
        try{
            dispatch(setLoading(true))
            const data = await login({ email, password })
            dispatch(setUser(data.user))
            return data
        }
        catch(error){
            dispatch(setError(error.response?.data?.message || "Login Failed!"))
            throw error
        }
        finally{
            dispatch(setLoading(false))
        }
    }

    async function handleGetMe(){
        try{
            dispatch(setLoading(true))
            const data = await getMe()
            dispatch(setUser(data.user))
        }
        catch(error){
            dispatch(setError(error.response?.data?.message || "Failed to fetch user data"))
        }
        finally{
            dispatch(setLoading(false))
        }
    }

    async function handleLogout(){
        try{
            await logout()
            dispatch(setUser(null))
            dispatch(setError(null))
            dispatch(resetChat())
        }
        catch(error){
            dispatch(setError(error.response?.data?.message || "Logout failed"))
            throw error
        }
    }

    return{
        handleRegister, handleLogin, handleGetMe, handleResendVerification, handleLogout
    }
}