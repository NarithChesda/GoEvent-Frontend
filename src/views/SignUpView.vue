<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4 relative overflow-hidden">
    <!-- Background Elements -->
    <div class="absolute inset-0">
      <div class="absolute top-0 right-0 w-96 h-96 bg-purple-300/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
      <div class="absolute bottom-0 left-0 w-80 h-80 bg-blue-300/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
    </div>
    
    <div class="relative z-10 w-full max-w-lg">
      <!-- Logo and Header -->
      <div class="text-center mb-8">
        <RouterLink to="/" class="inline-flex items-center space-x-3 mb-8">
          <div class="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <CalendarDays class="w-7 h-7 text-white" />
          </div>
          <span class="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">GoEvent</span>
        </RouterLink>
        <h2 class="text-4xl font-bold text-slate-900 mb-2">
          Create account
        </h2>
        <p class="text-slate-600">
          Start organizing amazing events today
        </p>
      </div>

      <!-- Main Form Card -->
      <div class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-2xl p-8">
        <form class="space-y-6" @submit.prevent="handleSignUp">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="first-name" class="block text-sm font-semibold text-slate-700">
                First name
              </label>
              <div class="mt-1">
                <input
                  id="first-name"
                  name="first-name"
                  type="text"
                  autocomplete="given-name"
                  required
                  v-model="form.firstName"
                  class="w-full px-4 py-3 border border-slate-200 rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm text-slate-900 font-medium"
                  placeholder="John"
                />
              </div>
            </div>

            <div>
              <label for="last-name" class="block text-sm font-semibold text-slate-700">
                Last name
              </label>
              <div class="mt-1">
                <input
                  id="last-name"
                  name="last-name"
                  type="text"
                  autocomplete="family-name"
                  required
                  v-model="form.lastName"
                  class="w-full px-4 py-3 border border-slate-200 rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm text-slate-900 font-medium"
                  placeholder="Doe"
                />
              </div>
            </div>
          </div>

          <div>
            <label for="email" class="block text-sm font-semibold text-slate-700">
              Email address
            </label>
            <div class="mt-1">
              <input
                id="email"
                name="email"
                type="email"
                autocomplete="email"
                required
                v-model="form.email"
                class="w-full px-4 py-3 border rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm text-slate-900 font-medium"
                :class="fieldErrors.email ? 'border-red-300 focus:ring-red-500' : 'border-slate-200'"
                placeholder="john@example.com"
              />
              <div v-if="fieldErrors.email" class="mt-1 text-sm text-red-600">
                {{ fieldErrors.email[0] }}
              </div>
            </div>
          </div>

          <div>
            <label for="password" class="block text-sm font-semibold text-slate-700">
              Password
            </label>
            <div class="mt-1 relative">
              <input
                id="password"
                name="password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="new-password"
                required
                v-model="form.password"
                class="w-full px-4 py-3 border border-slate-200 rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm text-slate-900 font-medium pr-12"
                placeholder="Create a password"
              />
              <div class="absolute inset-y-0 right-0 pr-3 flex items-center">
                <button
                  type="button"
                  @click="showPassword = !showPassword"
                  class="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <Eye v-if="!showPassword" class="h-5 w-5" />
                  <EyeOff v-else class="h-5 w-5" />
                </button>
              </div>
            </div>
            <div class="mt-2">
              <div class="flex items-center space-x-2 text-sm">
                <div class="flex space-x-1">
                  <div 
                    v-for="i in 4" 
                    :key="i"
                    class="w-2 h-2 rounded-full"
                    :class="passwordStrength >= i ? 'bg-green-500' : 'bg-gray-200'"
                  ></div>
                </div>
                <span class="text-slate-500">{{ passwordStrengthText }}</span>
              </div>
            </div>
          </div>

          <div>
            <label for="confirm-password" class="block text-sm font-semibold text-slate-700">
              Confirm password
            </label>
            <div class="mt-1">
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autocomplete="new-password"
                required
                v-model="form.confirmPassword"
                class="w-full px-4 py-3 border border-slate-200 rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm text-slate-900 font-medium"
                placeholder="Confirm your password"
              />
            </div>
            <div v-if="form.confirmPassword && !passwordsMatch" class="mt-1 text-sm text-red-600">
              Passwords do not match
            </div>
          </div>

          <div class="flex items-center">
            <input
              id="agree-terms"
              name="agree-terms"
              type="checkbox"
              required
              v-model="form.agreeTerms"
              class="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 focus:ring-2"
            />
            <label for="agree-terms" class="ml-2 block text-sm font-medium text-slate-700">
              I agree to the 
              <a href="#" class="text-blue-600 hover:text-blue-500">Terms of Service</a>
              and 
              <a href="#" class="text-blue-600 hover:text-blue-500">Privacy Policy</a>
            </label>
          </div>

          <!-- Error Message -->
          <div v-if="errorMessage" class="p-4 bg-red-50 border border-red-200 rounded-xl">
            <div class="flex items-center">
              <AlertCircle class="h-5 w-5 text-red-600 mr-2" />
              <span class="text-red-700 text-sm">{{ errorMessage }}</span>
            </div>
          </div>

          <!-- Success Message -->
          <div v-if="successMessage" class="p-4 bg-green-50 border border-green-200 rounded-xl">
            <div class="flex items-center">
              <div class="h-5 w-5 bg-green-500 rounded-full mr-2 flex items-center justify-center">
                <div class="h-2 w-2 bg-white rounded-full"></div>
              </div>
              <span class="text-green-700 text-sm">{{ successMessage }}</span>
            </div>
          </div>

          <div>
            <button
              type="submit"
              :disabled="authStore.isLoading || !passwordsMatch || !form.agreeTerms"
              class="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg flex justify-center items-center"
            >
              <Loader2 v-if="authStore.isLoading" class="animate-spin -ml-1 mr-3 h-5 w-5" />
              {{ authStore.isLoading ? 'Creating account...' : 'Create account' }}
            </button>
          </div>

          <div class="mt-6">
            <div class="relative">
              <div class="absolute inset-0 flex items-center">
                <div class="w-full border-t border-slate-200" />
              </div>
              <div class="relative flex justify-center text-sm">
                <span class="px-4 bg-white/80 text-slate-500 font-medium">Or continue with</span>
              </div>
            </div>

            <div class="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                class="flex items-center justify-center px-4 py-3 border border-slate-200 rounded-xl bg-white/50 backdrop-blur-sm hover:bg-white/80 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 group"
              >
                <svg class="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span class="text-sm font-medium text-slate-700 group-hover:text-slate-900 ml-2">Google</span>
              </button>

              <button
                type="button"
                class="flex items-center justify-center px-4 py-3 border border-slate-200 rounded-xl bg-white/50 backdrop-blur-sm hover:bg-white/80 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 group"
              >
                <Github class="h-5 w-5 text-slate-600 group-hover:text-slate-900" />
                <span class="text-sm font-medium text-slate-700 group-hover:text-slate-900 ml-2">GitHub</span>
              </button>
            </div>
          </div>
        </form>
        
        <!-- Footer Link -->
        <div class="mt-8 text-center">
          <p class="text-sm text-slate-600">
            Already have an account? 
            <RouterLink to="/signin" class="font-semibold text-blue-600 hover:text-blue-700 transition-colors">
              Sign in here
            </RouterLink>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { CalendarDays, Eye, EyeOff, Loader2, Github, AlertCircle } from 'lucide-vue-next'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const form = ref({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  agreeTerms: false
})

const showPassword = ref(false)
const errorMessage = ref('')
const fieldErrors = ref<Record<string, string[]>>({})
const successMessage = ref('')

const passwordStrength = computed(() => {
  const password = form.value.password
  let strength = 0
  
  if (password.length >= 8) strength++
  if (/[A-Z]/.test(password)) strength++
  if (/[0-9]/.test(password)) strength++
  if (/[^A-Za-z0-9]/.test(password)) strength++
  
  return strength
})

const passwordStrengthText = computed(() => {
  const texts = ['Weak', 'Fair', 'Good', 'Strong']
  return texts[passwordStrength.value - 1] || 'Too weak'
})

const passwordsMatch = computed(() => {
  return form.value.password === form.value.confirmPassword
})

const handleSignUp = async () => {
  // Clear previous errors
  errorMessage.value = ''
  fieldErrors.value = {}
  successMessage.value = ''
  
  // Basic validation
  if (!form.value.firstName || !form.value.lastName || !form.value.email || !form.value.password) {
    errorMessage.value = 'Please fill in all required fields'
    return
  }
  
  if (!passwordsMatch.value) {
    errorMessage.value = 'Passwords do not match'
    return
  }
  
  if (!form.value.agreeTerms) {
    errorMessage.value = 'Please agree to the Terms of Service and Privacy Policy'
    return
  }
  
  try {
    const result = await authStore.register({
      email: form.value.email,
      username: form.value.email, // Use email as username
      password: form.value.password,
      password_confirm: form.value.confirmPassword,
      first_name: form.value.firstName,
      last_name: form.value.lastName
    })
    
    if (result.success) {
      if (result.message) {
        successMessage.value = result.message
        // If registration successful but not auto-logged in
        setTimeout(() => {
          router.push('/signin')
        }, 2000)
      } else {
        // Auto-logged in, redirect to home
        router.push('/')
      }
    } else {
      errorMessage.value = result.error || 'Registration failed'
      fieldErrors.value = result.errors || {}
    }
  } catch (error) {
    console.error('Sign up error:', error)
    errorMessage.value = 'An unexpected error occurred'
  }
}
</script>