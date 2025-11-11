<template lang="pug">
  .wrapper
    header
      .navbar
        .container
          .navbar-content
            router-link.header-logo(
              to="/"
            ) Skills Organizr
            // Главное меню в мобильном исполнении
            // с инлайн-обработчиком клика
            .button-burger(
              @click="menuShow = !menuShow"
              :class="{ active: menuShow }"
            )
              span.line.line-1
              span.line.line-2
              span.line.line-3
            .navbar-list__wrapper(
              :class="{ active: menuShow }"
            )
              ul.navbar-list
                // Динамическое формирование пунктов меню из массива linkMenu
                li.navbar-item(
                  v-for="link in linkMenu"
                  :key="link.title"
                  @click="menuShow = false"
                )
                  router-link.navbar-link(
                    :to="`${link.url}`"
                  ) {{ link.title }}
                // Статическое формирование пункта меню "Language"
                li.navbar-item
                  span.lang-icon(
                    @click="setLocale('en')"
                    :class="{ 'active-lang': this.$i18n.locale === 'en' }"
                  )
                    img(src="/flags/en.png" width="20" height="15" alt="English")
                  span.lang-icon(
                    @click="setLocale('ru')"
                    :class="{ 'active-lang': this.$i18n.locale === 'ru' }"  
                  )
                    img(src="/flags/ru.png" width="20" height="15" alt="Русский")
                // Статическое формирование пункта меню "Выйти"
                li.navbar-item(
                  v-if="checkUser"
                  @click='signOut'
                )
                  span.navbar-link {{$t('app.signout')}} ({{userData.name}})
                    img(:src="userData.photo" style="height: 32px; width: 32px; border-radius: 50%")
    // Место для отображения компонента, соответствующего текущему маршруту
    router-view
    // Анимированная заставка для отображения во время выполнения операций с данными
    .cssload-loader(v-show="isLoading")
      .cssload-inner.cssload-one
      .cssload-inner.cssload-two
      .cssload-inner.cssload-three
</template>

<script>
import store from './store'
export default {
  data () {
    return {
      menuShow: false
    }
  },
  props: ['lastUser'],
  created () {
    // Auth state is now handled in main.js with Supabase
  },
  computed: {
    checkUser () {
      return store.getters.checkUser
    },
    userData () {
      return store.getters.user
    },
    isLoading () {
      return this.$store.getters.loading
    },
    linkMenu () {
      return (this.checkUser) ? [
        {title: this.$t('home.home'), url: '/'},
        {title: this.$t('templates.templates'), url: '/templates'},
        {title: this.$t('about.about'), url: '/about'}
      ] : [
        {title: this.$t('signin.signin'), url: '/signin'},
        {title: this.$t('about.about'), url: '/about'}
      ]
    }
  },
  // Наблюдение за значением route
  watch: {
    $route (to, from) {
      // Если нет текущего пользователя
      // и текущий роут не "Вход"
      if (!this.checkUser && (to.name !== 'signin' && to.name !== 'about')) {
        // Переадресуем пользователя на раздел "Вход"
        this.$router.push('/signin')
      }
      // Иначе переадресуем на желаемый раздел сайта
    },
    isLoading(newVal, oldVal) {
      console.log('👀 App isLoading changed:', oldVal, '->', newVal)
      if (newVal === true) {
        // Запускаем таймер для обнаружения зависаний
        setTimeout(() => {
          if (this.isLoading === true) {
            console.warn('⚠️ Loading state stuck for too long!')
            console.log('📊 Current state:', {
              route: this.$route.path,
              user: this.checkUser,
              loadingStack: this.$store.getters.loadingStack
            })
          }
        }, 5000)
      }
    }
  },
  methods: {
    async signOut () {
      // Call logout from store (now uses Supabase)
      await this.$store.dispatch('logoutUser')
    },
    setLocale (locale) {
      store.dispatch('setLocale', locale)
    }
  }
}
</script>

<style lang="stylus">
  @import './assets/stylus/main.styl'
</style>
<style scoped lang="stylus">
  .lang-icon
    margin-left 5px
    margin-right 5px
  .active-lang
    border 4px double green
</style>
