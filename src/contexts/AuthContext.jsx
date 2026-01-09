import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => {
  return useContext(AuthContext)
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (sessionUser) => {
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
  }, [])

  // 1. Initial Session & Auth Listener (Run once)
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        fetchProfile(session.user)
      } else {
        setUser(null)
        setLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  // 2. Real-time Profile Syncing (Run when user changes)
  useEffect(() => {
    if (!user?.id) return

    const channelName = `profile-sync-${user.id}`
    const profileSubscription = supabase
      .channel(channelName)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${user.id}`
      }, payload => {
        setUser(prev => {
          // Only update if we have a previous user to merge with
          if (!prev) return payload.new;
          return { ...prev, ...payload.new };
        })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(profileSubscription)
    }
  }, [user?.id])

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
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Error during sign out:', error)
    } finally {
      setUser(null)
    }
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
