import firebase from 'firebase/app'

import Dep from './DependencyModel'

export default ({
  state: {
    deps: []
  },
  mutations: {
    newDep (
      state,
      {
        id,
        fromNodeId,
        toNodeId
      }
    ) {
      state.deps.push({
        id,
        fromNodeId,
        toNodeId
      })
    },
    loadDeps (state, payload) {
      state.deps = payload
    },
    deleteDep (state, payload) {
      const deletedDep = state.deps.find(dep => dep.id === payload.id)
      state.deps.splice(state.deps.indexOf(deletedDep), 1)
    }
  },
  actions: {
    async newDep ({commit, getters}, payload) {
      commit('clearError')
      commit('setLoading', true)
      try {
        // Use helped class
        const newDep = new Dep(
          payload.fromNodeId,
          payload.toNodeId
        )
        const dep = await firebase.database().ref(getters.user.id + '/dependencies').push(newDep)
        // Send mutation
        commit('newDep', {
          ...newDep,
          id: dep.key
        })

        commit('setLoading', false)
      } catch (error) {
        commit('setLoading', false)
        commit('setError', error.message)
        throw error
      }
    },
    async loadDeps ({commit, getters}) {
      commit('clearError')
      commit('setLoading', true)
      try {
        const depsResponse =
          await firebase.database()
            .ref(getters.user.id + '/dependencies')
            .once('value')
        const deps = depsResponse.val()
        // console.log(deps)
        if (deps != null) {
          const depsArray = []
          Object.keys(deps).forEach(key => {
            const d = deps[key]
            depsArray.push(
              new Dep(
                d.fromNodeId,
                d.toNodeId,
                key
              )
            )
          })
          // Send mutation
          commit('loadDeps', depsArray)
        }

        commit('setLoading', false)
      } catch (error) {
        commit('setLoading', false)
        commit('setError', error.message)
        throw error
      }
    },
    async deleteDep ({commit, getters}, id) {
      commit('clearError')
      commit('setLoading', true)
      try {
        await firebase.database().ref(getters.user.id + '/dependencies').child(id).remove()
        commit('deleteNode', {id})
        commit('setLoading', false)
      } catch (error) {
        commit('setLoading', false)
        commit('setError', error.message)
        throw error
      }
    }
  },
  getters: {
    deps (state) {
      return state.deps
    }
  }
})
