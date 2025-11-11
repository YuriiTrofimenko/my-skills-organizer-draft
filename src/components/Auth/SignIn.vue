<template lang="pug">
.wrapper
  section
    .container
      .row.grid-center
        .col-xs-12.col-md-4.auth__form
          h1.ui-title-1 {{$t('signin.header')}}
          p {{$t('signin.description')}}
        // Ячейка сетки для отображения формы входа в учетную запись
        // и ссылки на обучающее видео
        .col-xs-12.col-md-4
          // Контейнер для рендеринга интерфейса аутентификации
          #supabase-auth-container
            .auth-form
              .form-group
                label Email
                input.form-control(v-model="email" type="email" placeholder="Enter your email")
              .form-group
                label Password
                input.form-control(v-model="password" type="password" placeholder="Enter your password")
              .form-group
                button.btn.btn-primary(@click="signIn" :disabled="loading") {{ loading ? 'Signing in...' : 'Sign In' }}
                button.btn.btn-secondary(@click="signUp" :disabled="loading") {{ loading ? 'Signing up...' : 'Sign Up' }}
              .form-group
                button.btn.btn-google(@click="signInWithGoogle" :disabled="loading") Sign in with Google
              .error-message(v-if="error") {{ error }}
          // Кнопка просмотра обучающего видео
          VideoTutorialButton(:url="$t('video-tutorial-button.url')")
          v-tour(name='signin' :steps='steps' :callbacks="signinTourCallbacks")
            template(slot-scope='tour')
              transition(name='fade')
                v-step(v-if='tour.currentStep === index' v-for='(step, index) of tour.steps' :key='index' :step='step' :previous-step='tour.previousStep' :next-step='tour.nextStep' :stop='tour.stop' :is-first='tour.isFirst' :is-last='tour.isLast' :labels='tour.labels')
</template>

<script>
import { supabase } from '@/helpers/supabaseConfig'
import VideoTutorialButton from '../Common/VideoTutorialButton.vue'
import { tourManager } from '@/utils/tourManager'

export default {
  name: 'signin',
  components: {
    VideoTutorialButton
  },
  data () {
    return {
      email: '',
      password: '',
      loading: false,
      error: '',
      signinTourCallbacks: {
        onStop: this.StopCallback
      }
    }
  },
  computed: {
    steps () {
      return [
        {
          target: '#supabase-auth-container',
          content: this.$t('signin.vtour.signinGoogle')
        }
      ]
    }
  },
  mounted () {
    /* if (!this.$cookies.get('vtour_signin_finished')) {
      this.$tours['signin'].start()
    } */
    if (!this.$cookies.get('vtour_signin_finished')) {
      this.checkAndStartTour()
    }
  },
  methods: {
    async checkAndStartTour() {
      try {
        console.log('=== SIGNIN TOUR CHECK ===')
        
        await tourManager.testConnection()
        
        const tourCompleted = await tourManager.isTourCompleted('signin')
        console.log('Signin tour should start:', !tourCompleted)
        
        if (!tourCompleted) {
          console.log('🚀 Starting signin tour')
          this.$nextTick(() => {
            this.$tours['signin'].start()
          })
        } else {
          console.log('⏩ Skipping signin tour - already completed')
        }
      } catch (error) {
        console.error('💥 Error in checkAndStartTour:', error)
      }
    },

    async StopCallback() {
      try {
        console.log('=== SIGNIN TOUR COMPLETED ===')
        if (this.$tours['signin'].isLast) {
          console.log('🏁 Signin tour finished, saving to DB...')
          const success = await tourManager.markTourCompleted('signin')
          if (success) {
            console.log('💾 Successfully saved signin tour completion to DB')
          } else {
            console.error('💥 FAILED to save signin tour completion to DB')
          }
        }
      } catch (error) {
        console.error('💥 Error in StopCallback:', error)
      }
    },
    async signIn() {
      this.loading = true
      this.error = ''
      
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: this.email,
          password: this.password
        })
        
        if (error) throw error
        
        console.log('✅ Sign in successful')
        
        // ПРИНУДИТЕЛЬНЫЙ РЕДИРЕКТ ПОСЛЕ УСПЕШНОГО ВХОДА
        if (data.user) {
          // Обновляем состояние пользователя в хранилище
          this.$store.commit('setUser', {
            id: data.user.id,
            name: data.user.user_metadata?.full_name || data.user.email,
            photoURL: data.user.user_metadata?.avatar_url,
            email: data.user.email
          })
          
          // Редирект на главную страницу
          this.$router.push('/')
        }
        
      } catch (error) {
        this.error = error.message
      } finally {
        this.loading = false
      }
    },
    
    async signUp () {
      this.loading = true
      this.error = ''
      
      try {
        const { data, error } = await supabase.auth.signUp({
          email: this.email,
          password: this.password
        })
        
        if (error) throw error
        
        this.error = 'Check your email for the confirmation link!'
      } catch (error) {
        this.error = error.message
      } finally {
        this.loading = false
      }
    },
    
    async signInWithGoogle () {
      this.loading = true
      this.error = ''
      
      try {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/`
          }
        })
        
        if (error) throw error
      } catch (error) {
        this.error = error.message
        this.loading = false
      }
    },
    
    StopCallback () {
      if (this.$tours['signin'].isLast) {
        this.$cookies.set('vtour_signin_finished', true)
      }
    }
  }
}
</script>

<style lang="stylus" scoped>
  .auth__form
    text-align left !important
  
  .auth-form
    .form-group
      margin-bottom 1rem
      
      label
        display block
        margin-bottom 0.5rem
        font-weight bold
      
      input.form-control
        width 100%
        padding 0.5rem
        border 1px solid #ccc
        border-radius 4px
        font-size 1rem
      
      button
        padding 0.5rem 1rem
        margin-right 0.5rem
        border none
        border-radius 4px
        cursor pointer
        font-size 1rem
        
        &.btn-primary
          background-color #007bff
          color white
          
          &:hover
            background-color #0056b3
        
        &.btn-secondary
          background-color #6c757d
          color white
          
          &:hover
            background-color #545b62
        
        &.btn-google
          background-color #db4437
          color white
          
          &:hover
            background-color #c23321
        
        &:disabled
          opacity 0.6
          cursor not-allowed
  
  .error-message
    color #dc3545
    margin-top 1rem
    padding 0.5rem
    background-color #f8d7da
    border 1px solid #f5c6cb
    border-radius 4px
</style>
