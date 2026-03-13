import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../services/supabase'
import apiClient from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [session, setSession] = useState(null)
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)
    const [profileMissing, setProfileMissing] = useState(false)

    // IMPORTANT: Pass token directly to avoid deadlock inside onAuthStateChange.
    // Calling supabase.auth.getSession() inside onAuthStateChange causes a lock
    // in Supabase's auth state machine — so we pass the token ourselves.
    const fetchProfile = async (userId, accessToken) => {
        try {
            const res = await apiClient.get(`/auth/profile/${userId}`, {
                headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
            })
            setProfile(res.data)
            setProfileMissing(false)
        } catch (err) {
            setProfile(null)
            setProfileMissing(err?.response?.status === 404)
        }
    }

    useEffect(() => {
        let initialized = false

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setSession(session)
            if (session?.user) {
                // Pass access_token directly — avoids calling getSession() inside this callback
                await fetchProfile(session.user.id, session.access_token)
            } else {
                setProfile(null)
                setProfileMissing(false)
            }
            if (!initialized) {
                initialized = true
                setLoading(false)
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    const signIn = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        return data
    }

    const signOut = async () => {
        await supabase.auth.signOut()
        setSession(null)
        setProfile(null)
        setProfileMissing(false)
    }

    return (
        <AuthContext.Provider value={{ session, profile, loading, profileMissing, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used within AuthProvider')
    return ctx
}
