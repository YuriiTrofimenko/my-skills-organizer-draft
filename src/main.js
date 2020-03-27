// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import router from './router'
import store from './store'

import firebase from 'firebase/app'
import 'firebase/auth'
import 'firebase/database'
import 'firebase/messaging'
// import 'firebase/notifications'
// import 'firebase/storage'
import {config} from './helpers/firebaseConfig'

import Vuelidate from 'vuelidate'
// import TreeView from 'vue-json-tree-view'

import VueTour from 'vue-tour'
import VueCookies from 'vue-cookies'
import VTooltip from 'v-tooltip'

import { library } from '@fortawesome/fontawesome-svg-core'
import { faUserSecret, faFileImport, faEdit, faTrash, faPlay } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

import { i18n } from './plugins/i18n'

import FlagIcon from 'vue-flag-icon'

import { longClickDirective } from 'vue-long-click'

library.add(faUserSecret, faFileImport, faEdit, faTrash, faPlay)

require('vue-tour/dist/vue-tour.css')

Vue.use(Vuelidate)
Vue.use(VueTour)
Vue.use(VueCookies)
Vue.use(VTooltip)
Vue.use(FlagIcon)
Vue.component('font-awesome-icon', FontAwesomeIcon)

Vue.directive('longclick', longClickDirective({delay: 1200, interval: 0}))

VueCookies.config('365d')

Vue.config.productionTip = false

Vue.prototype.$firebaseMessagingTokenKey = null
Vue.prototype.$lastUser = null

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  store,
  i18n,
  components: { App },
  template: '<App/>',
  propData: {
    firebaseMessagingTokenKey: this.$firebaseMessagingTokenKey,
    lastUser: this.$lastUser
  },
  created () {
    firebase.initializeApp(config)
    const FIREBASE_MESSAGING = firebase.messaging()
    const FIREBASE_DATABASE = firebase.database()
    const MAIN_THIS = this
    // Обработчик входа/выхода пользователя в аккаунт
    firebase.auth().onAuthStateChanged((user) => {
      // Если есть текущий пользователь
      if (user) {
        // Запоминаем его модель в глобальную переменную
        MAIN_THIS.$lastUser = user
        /* // TODO
        const LOCALE = MAIN_THIS.$store.getters.locale
        import(`./lang/${LOCALE}.json`)
          .then((msgs) => {
            this.$i18n.setLocaleMessage(LOCALE, msgs)
            this.$i18n.locale = LOCALE
          }) */
        // Переходим на главный раздел сайта
        MAIN_THIS.$router.push('/')
        // Получение уведомлений при помощи firebase.notifications() здесь отключено
        // как менее универсальное, чем firebase.messaging(),
        // которое принимает и обрабатывает уведомления
        // во всех режимах клиентского приложения единообразно
        // const FIREBASE_NOTIFICATIONS = firebase.notifications()
        // Пара ключей из раздела
        // https://console.firebase.google.com/project/my-skills-organizer/settings/cloudmessaging/
        // Веб-конфигурация -> Сертификаты для Web Push
        FIREBASE_MESSAGING.usePublicVapidKey('BCcFXVYoeQk-AE5PWLAoZIjsKsSvZ6Jo-F0qL8HfvgcFLz7PVeHxXTbmCdD9x7kWecCBHKGq1Z9s05CqZpqW1Z0')
        // Подключение обработчика уведомлений для фонового режима клиентской стороны
        navigator.serviceWorker.register('./static/js/firebase-messaging-sw.js')
          .then((registration) => {
            FIREBASE_MESSAGING.useServiceWorker(registration)
          }).then(() => {
            // При первом посещении сайта спросить у пользователя:
            // разрешить или блокировать входящие уведомления
            return FIREBASE_MESSAGING.requestPermission()
          }).then(() => {
            // Запросить от системы сообщений токен,
            // который будет идентифицировать подписку на уведомления.
            // Если данный клиент не запрашивал ранее токен - получается новый токен,
            // иначе - предоставляется ранее выданный
            console.log('Notification permission granted.')
            return FIREBASE_MESSAGING.getToken()
          }).then(token => {
            // console.log('a new token', token)
            // return FIREBASE_MESSAGING.getToken().then((token) => {
            // На основе идентификатора текущего пользователя
            // формируем путь к узлу с токенами в хранилище firebase
            FIREBASE_DATABASE.ref(MAIN_THIS.$store.getters.user.id + '/tokens')
              .orderByChild('token')
              .equalTo(token)
              .once('value', function (snapshot) {
                // Отфильтровываем один токен, равный текущему.
                // Проверяем, существует ли искомый токен из firebase.
                // Если нет - отправляем эту запись в firebase
                // и запрашиваем у firebase ключ, созданный ею для записи токена
                if (!snapshot.exists()) {
                  MAIN_THIS.$firebaseMessagingTokenKey = FIREBASE_DATABASE.ref(MAIN_THIS.$store.getters.user.id + '/tokens')
                    .push({
                      token: token
                    }).key
                } else {
                  // Иначе - читаем элемент массива с найденным токеном
                  // и сохраняем его ключ
                  const tokens = snapshot.val()
                  if (tokens != null) {
                    MAIN_THIS.$firebaseMessagingTokenKey = Object.keys(tokens)[0]
                  }
                }
                // Сохраняем текущий токен в локальное хранилище
                MAIN_THIS.$store.dispatch('setTokenKey', MAIN_THIS.$firebaseMessagingTokenKey)
              })
            // })
          }).catch(err => {
            console.log(err)
          })
        // Подключение обработчика уведомлений для активного режима клиентской стороны
        FIREBASE_MESSAGING.onMessage(function (payload) {
          console.log('Message received. ', payload)
          // Обработку уведомлений в активном режиме задает программист на фронтенде.
          // Показываем стандартное окно подтверждения.
          // Если пользователь кликнул "Да"
          if (window.confirm(payload.notification.title + ' ' + payload.notification.body + ' Refresh the page?')) {
            // They clicked Yes
            // Запращиваем данные об узлах с сервера
            MAIN_THIS.$store.dispatch('loadNodes')
          }
        })
      } else {
        // Если текущего пользователя нет -
        // зануляем данные о последнем пользователе,
        // о токене подписки на уведомления
        // и переходим на раздел "Вход"
        MAIN_THIS.$lastUser = null
        MAIN_THIS.$firebaseMessagingTokenKey = null
        MAIN_THIS.$router.push('/signin')
      }
    })
  }
})
