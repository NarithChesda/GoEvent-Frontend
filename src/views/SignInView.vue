<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4 relative overflow-hidden">
    <!-- Background Elements -->
    <div class="absolute inset-0">
      <div class="absolute top-0 left-0 w-96 h-96 bg-blue-300/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
      <div class="absolute bottom-0 right-0 w-80 h-80 bg-purple-300/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
    </div>
    
    <div class="relative z-10 w-full max-w-md">
      <!-- Logo and Header -->
      <div class="text-center mb-8">
        <RouterLink to="/" class="inline-flex items-center space-x-3 mb-8">
          <div class="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <CalendarDays class="w-7 h-7 text-white" />
          </div>
          <span class="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">GoEvent</span>
        </RouterLink>
        <h2 class="text-4xl font-bold text-slate-900 mb-2">
          Welcome back
        </h2>
        <p class="text-slate-600">
          Sign in to continue to your account
        </p>
      </div>

      <!-- Main Form Card -->
      <div class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-2xl p-8">
        <form class="space-y-6" @submit.prevent="handleSignIn">
          <!-- Email Field -->
          <div class="space-y-2">
            <label for="email" class="block text-sm font-semibold text-slate-700">
              Email address
            </label>
            <div class="relative">
              <input
                id="email"
                name="email"
                type="email"
                autocomplete="email"
                required
                v-model="form.email"
                class="w-full px-4 py-3 border border-slate-200 rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm text-slate-900 font-medium"
                placeholder="Enter your email address"
              />
            </div>
          </div>

          <!-- Password Field -->
          <div class="space-y-2">
            <label for="password" class="block text-sm font-semibold text-slate-700">
              Password
            </label>
            <div class="relative">
              <input
                id="password"
                name="password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                required
                v-model="form.password"
                class="w-full px-4 py-3 border border-slate-200 rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm text-slate-900 font-medium pr-12"
                placeholder="Enter your password"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                <Eye v-if="!showPassword" class="h-5 w-5" />
                <EyeOff v-else class="h-5 w-5" />
              </button>
            </div>
          </div>

          <!-- Remember Me & Forgot Password -->
          <div class="flex items-center justify-between">
            <label class="flex items-center space-x-3 cursor-pointer">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                v-model="form.rememberMe"
                class="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <span class="text-sm font-medium text-slate-700">Remember me</span>
            </label>

            <a href="#" class="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">
              Forgot password?
            </a>
          </div>

          <!-- Error Message -->
          <div v-if="errorMessage" class="p-4 bg-red-50 border border-red-200 rounded-xl">
            <div class="flex items-center">
              <AlertCircle class="h-5 w-5 text-red-600 mr-2" />
              <span class="text-red-700 text-sm">{{ errorMessage }}</span>
            </div>
          </div>

          <!-- Sign In Button -->
          <button
            type="submit"
            :disabled="authStore.isLoading"
            class="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
          >
            <div class="flex items-center justify-center">
              <Loader2 v-if="authStore.isLoading" class="animate-spin -ml-1 mr-3 h-5 w-5" />
              {{ authStore.isLoading ? 'Signing in...' : 'Sign in to your account' }}
            </div>
          </button>

          <!-- Divider -->
          <div class="relative my-8">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-slate-200" />
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-4 bg-white/80 text-slate-500 font-medium">Or continue with</span>
            </div>
          </div>

          <!-- Social Login Buttons -->
          <div class="grid grid-cols-2 gap-4">
            <button
              type="button"
              class="flex items-center justify-center px-4 py-3 border border-slate-200 rounded-xl bg-white/50 backdrop-blur-sm hover:bg-white/80 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 group"
            >
              <svg class="h-5 w-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span class="text-sm font-medium text-slate-700 group-hover:text-slate-900">Google</span>
            </button>

            <button
              type="button"
              class="flex items-center justify-center px-4 py-3 border border-slate-200 rounded-xl bg-white/50 backdrop-blur-sm hover:bg-white/80 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 group"
            >
              <Github class="h-5 w-5 mr-2 text-slate-600 group-hover:text-slate-900" />
              <span class="text-sm font-medium text-slate-700 group-hover:text-slate-900">GitHub</span>
            </button>
          </div>
        </form>
        
        <!-- Footer Link -->
        <div class="mt-8 text-center">
          <p class="text-sm text-slate-600">
            Don't have an account? 
            <RouterLink to="/signup" class="font-semibold text-blue-600 hover:text-blue-700 transition-colors">
              Create one now
            </RouterLink>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { CalendarDays, Eye, EyeOff, Loader2, Github, AlertCircle } from 'lucide-vue-next'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const form = ref({
  email: '',
  password: '',
  rememberMe: false
})

const showPassword = ref(false)
const errorMessage = ref('')
const fieldErrors = ref<Record<string, string[]>>({})

const handleSignIn = async () => {
  // Clear previous errors
  errorMessage.value = ''
  fieldErrors.value = {}
  
  // Basic validation
  if (!form.value.email || !form.value.password) {
    errorMessage.value = 'Please fill in all required fields'
    return
  }
  
  try {
    const result = await authStore.login({
      email: form.value.email,
      password: form.value.password
    })
    
    if (result.success) {
      // Redirect to home page after successful sign in
      router.push('/')
    } else {
      errorMessage.value = result.error || 'Login failed'
    }
  } catch (error) {
    console.error('Sign in error:', error)
    errorMessage.value = 'An unexpected error occurred'
  }
}
</script>