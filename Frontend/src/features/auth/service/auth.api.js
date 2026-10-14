import axios from 'axios';

const api = axios.create({
    baseURL: '',
    withCredentials: true
})

export async function register({ email, username, password }) {
    try {
        const response = await api.post("/api/auth/register", { email, username, password })
        return response.data
    }
    catch(error){
        throw error
    }
}

export async function login({ email, password }) {
    try{
        const response = await api.post("/api/auth/login", { email, password })
        return response.data
    }
    catch(error){
        throw error
    }
}

export async function resendVerification({ email }) {
    try{
        const response = await api.post("/api/auth/resend-verification", { email })
        return response.data
    }
    catch(error){
        throw error
    }
}

export async function getMe() {
    try{
        const response = await api.get("/api/auth/get-me")
        return response.data
    }
    catch(error){
        throw error
    }
}

export async function logout() {
    try{
        const response = await api.post("/api/auth/logout")
        return response.data
    }
    catch(error){
        throw error
    }
}