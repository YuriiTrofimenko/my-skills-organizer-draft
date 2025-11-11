import { supabase } from '@/helpers/supabaseConfig'

class TourManager {
  constructor() {
    this.initialized = false
    this._init()
  }

  async _init() {
    // Ждем инициализации аутентификации
    await new Promise(resolve => setTimeout(resolve, 1000))
    this.initialized = true
  }

  // Проверить, завершен ли тур
  async isTourCompleted(tourName) {
    try {
      console.log('🔍 Checking tour completion for:', tourName)
      
      // Ждем инициализации
      if (!this.initialized) {
        await this._init()
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) {
        console.error('Error getting user:', userError)
        return false
      }
      
      if (!user) {
        console.log('❌ No user found')
        return false
      }

      console.log('👤 User ID:', user.id)

      const { data, error } = await supabase
        .from('user_tours')
        .select('completed')
        .eq('user_id', user.id)
        .eq('tour_name', tourName)

      if (error) {
        console.error('❌ Database error:', error)
        return false
      }

      console.log('📊 Tour data from DB:', data)

      // Если нет записей - тур не завершен
      if (!data || data.length === 0) {
        console.log('➡️ Tour not completed (no record found)')
        return false
      }

      const completed = data[0].completed
      console.log(`✅ Tour completion status: ${completed}`)
      return completed
    } catch (error) {
      console.error('💥 Error in isTourCompleted:', error)
      return false
    }
  }

  // Отметить тур как завершенный
  async markTourCompleted(tourName) {
    try {
      console.log('🎯 Marking tour as completed:', tourName)

      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) {
        console.error('Error getting user:', userError)
        return false
      }
      
      if (!user) {
        console.error('❌ No user found, cannot mark tour as completed')
        return false
      }

      console.log('👤 User ID for marking:', user.id)

      // Используем upsert для создания или обновления записи
      const { data, error } = await supabase
        .from('user_tours')
        .upsert({
          user_id: user.id,
          tour_name: tourName,
          completed: true,
          completed_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,tour_name'
        })
        .select()

      if (error) {
        console.error('❌ Error marking tour as completed:', error)
        console.error('Full error details:', JSON.stringify(error, null, 2))
        return false
      }

      console.log('✅ Tour marked as completed successfully:', data)
      return true
    } catch (error) {
      console.error('💥 Error in markTourCompleted:', error)
      return false
    }
  }

  // Отладочный метод для проверки соединения
  async testConnection() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      console.log('🔌 Test connection - User:', user?.id)

      const { data, error } = await supabase
        .from('user_tours')
        .select('count')
        .limit(1)

      if (error) {
        console.error('❌ Test connection failed:', error)
        return false
      }

      console.log('✅ Test connection successful')
      return true
    } catch (error) {
      console.error('💥 Test connection error:', error)
      return false
    }
  }
}

export const tourManager = new TourManager()