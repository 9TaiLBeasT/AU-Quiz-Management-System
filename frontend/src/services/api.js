import axios from 'axios'
import { supabase } from './supabase'

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
    headers: {
        'Content-Type': 'application/json',
    },
})

// Automatically attach the Supabase JWT to every request.
// IMPORTANT: If Authorization is already set (e.g. passed directly from onAuthStateChange),
// skip calling getSession() — calling it inside onAuthStateChange causes a deadlock.
apiClient.interceptors.request.use(async (config) => {
    if (!config.headers.Authorization) {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.access_token) {
            config.headers.Authorization = `Bearer ${session.access_token}`
        }
    }
    return config
})

// Handle 401 — try to refresh the session first, only sign out if refresh fails
let isRefreshing = false
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const original = error.config
        if (error.response?.status === 401 && !original._retried && !isRefreshing) {
            original._retried = true
            isRefreshing = true
            try {
                const { data, error: refreshError } = await supabase.auth.refreshSession()
                isRefreshing = false
                if (refreshError || !data?.session?.access_token) {
                    // Refresh failed — real auth issue, sign out
                    await supabase.auth.signOut()
                    window.location.href = '/login'
                    return Promise.reject(error)
                }
                // Refresh succeeded — retry original request with new token
                original.headers.Authorization = `Bearer ${data.session.access_token}`
                return apiClient(original)
            } catch {
                isRefreshing = false
                await supabase.auth.signOut()
                window.location.href = '/login'
                return Promise.reject(error)
            }
        }
        return Promise.reject(error)
    }
)

export default apiClient
