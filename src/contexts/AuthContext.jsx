import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => {
  return useContext(AuthContext)
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async (sessionUser) => {
      if (!sessionUser) {
        setUser(null)
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', sessionUser.id)
          .single()

        if (data) {
          setUser({ ...sessionUser, ...data })
        } else {
          setUser(sessionUser)
        }
      } catch (error) {
        console.error('Error fetching user profile:', error)
        setUser(sessionUser)
      } finally {
        setLoading(false)
      }
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      fetchProfile(session?.user)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      fetchProfile(session?.user)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/login`
      }
    })
    if (error) throw error
  }

  const signInWithEmail = async (email) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/login`
      }
    })
    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const value = {
    user,
    loading,
    signInWithGoogle,
    signInWithEmail,
    signOut
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
