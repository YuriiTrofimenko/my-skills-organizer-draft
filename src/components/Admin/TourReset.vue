<template>
    <div v-if="isAdmin" class="tour-reset">
      <h3>Reset Tours (Admin)</h3>
      <button @click="resetTour('fabric_canvas')">Reset Canvas Tour</button>
      <button @click="resetTour('signin')">Reset SignIn Tour</button>
    </div>
  </template>
  
  <script>
  import { tourManager } from '@/utils/tourManager'
  
  export default {
    name: 'TourReset',
    computed: {
      isAdmin() {
        // Добавьте свою логику проверки админа
        return process.env.NODE_ENV === 'development'
      }
    },
    methods: {
      async resetTour(tourName) {
        if (await tourManager.resetTour(tourName)) {
          alert(`Tour ${tourName} reset successfully`)
        } else {
          alert(`Failed to reset tour ${tourName}`)
        }
      }
    }
  }
  </script>