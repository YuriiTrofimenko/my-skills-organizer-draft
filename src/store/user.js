import {supabase} from '../helpers/supabaseConfig'
import User from './UserModel'

export default {
  state: {
    user: null,
    lastUpdate: null
  },
  mutations: {
    setUser(state, payload) {
      const currentId = state.user?.id
      const newId = payload?.id
      
      if (currentId !== newId) {
        state.user = payload
        state.lastUpdate = payload ? new Date().getTime() : null
        console.log('👤 User state updated:', payload ? payload.id : 'null')
      } else {
        console.log('👤 User state unchanged, skipping update')
      }
    }
  },
  actions: {
    async loginUser ({commit}, {email, password}) {
      commit('clearError')
      commit('setLoading', true)
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        
        if (error) {
          console.error('❌ Auth error:', error)
          if (error.message.includes('session') || error.message.includes('token')) {
            throw new Error('Authentication session error. Please try again.')
          }
          throw error
        }
        
        const user = new User(
          data.user.id, 
          data.user.user_metadata?.full_name || data.user.email, 
          data.user.user_metadata?.avatar_url,
          data.user.email
        )
        commit('setUser', user)
        commit('setLoading', false)
        
        return user
      } catch (error) {
        console.error('❌ Login failed:', error)
        commit('setLoading', false)
        commit('setError', error.message)
        throw error
      }
    },
    
    loggedUser ({commit}, payload) {
      commit('setUser', new User(payload.uid, payload.displayName, payload.photoURL, payload.email))
    },
    
    async logoutUser ({commit}) {
      commit('setLoading', true)
      try {
        await supabase.auth.signOut()
        commit('setUser', null)
        commit('setLoading', false)
        console.log('✅ User logged out successfully')
      } catch (error) {
        console.error('❌ Logout error:', error)
        commit('setLoading', false)
        commit('setError', error.message)
        throw error
      }
    },
    
    async persistEmail ({commit, getters}) {
      commit('clearError')
      commit('setLoading', true)
      try {
        console.log('getters.user', getters.user)
        if (getters.user) {
          const { data: userdata, error: fetchError } = await supabase
            .from('userdata')
            .select('email')
            .eq('id', getters.user.id)
            .single()
          
          if (fetchError && fetchError.code !== 'PGRST116') {
            throw fetchError
          }
          
          if (!userdata || !userdata.email) {
            const { error: upsertError } = await supabase
              .from('userdata')
              .upsert({
                id: getters.user.id,
                email: getters.user.email
              })
            
            if (upsertError) throw upsertError
          }
        }
        commit('setLoading', false)
      } catch (error) {
        commit('setLoading', false)
        commit('setError', error.message)
        throw error
      }
    }
  },
  getters: {
    user (state) {
      return state.user
    },
    checkUser (state) {
      return state.user !== null
    }
  }
}