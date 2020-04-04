import firebase from 'firebase/app'

import User from './UserModel'

export default {
  state: {
    user: null
  },
  mutations: {
    setUser (state, payload) {
      state.user = payload
    }
  },
  actions: {
    // Login page
    // Сейчас не используется, так как аутентификация только при помощи службы Гугл
    async loginUser ({commit}, {email, password}) {
      commit('clearError')
      commit('setLoading', true)
      try {
        // logic
        const user = await firebase.auth().signInWithEmailAndPassword(email, password)
        commit('setUser', new User(user.user.uid, user.user.displayName, user.user.photoURL))

        commit('setLoading', false)
      } catch (error) {
        commit('setLoading', false)
        commit('setError', error.message)
        throw error
      }
    },
    // Logged
    loggedUser ({commit}, payload) {
      // Send mutation new uid used helped Class
      commit('setUser', new User(payload.uid, payload.displayName, payload.photoURL, payload.email))
    },
    // Logout
    logoutUser ({commit}) {
      firebase.auth().signOut()
      // Send mutation null
      commit('setUser', null)
    },
    // Сохранение email пользователя в firebase, если ранее не был сохранен
    async persistEmail ({commit, getters}) {
      commit('clearError')
      commit('setLoading', true)
      try {
        console.log('getters.user', getters.user)
        if (getters.user) {
          const emailResponse =
            await firebase.database()
              .ref(getters.user.id + '/userdata/email')
              .once('value')
          // Get value
          const email = emailResponse.val()
          // Если email не существует в firebase
          if (!email) {
            // создаем ветвь в firebase в структуре данных текущего пользователя
            await firebase.database().ref(getters.user.id).child('userdata').child('email').push({'email': 'empty'})
            // и заносим туде значение email
            await firebase.database().ref(getters.user.id).child('userdata').child('email').set(getters.user.email)
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
    // Return user (for get id)
    user (state) {
      return state.user
    },
    // Check User (for logged)
    checkUser (state) {
      return state.user !== null
    }
  }
}
