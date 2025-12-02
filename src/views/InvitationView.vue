<template>
  <div class="relative min-h-screen">
    <!-- Clean Minimal Gradient Background (matching MainLayout) -->
    <div class="fixed inset-0 -z-10 premium-bg"></div>

    <!-- Main Content -->
    <main class="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div class="w-full max-w-md">
        <!-- Logo and Header -->
        <div class="text-center mb-8">
          <RouterLink to="/" class="inline-block mb-6" aria-label="Go to homepage">
            <img
              :src="LogoSvg"
              alt="GoEvent Logo"
              class="h-24 w-auto max-w-full object-contain sm:h-32 mx-auto"
            />
          </RouterLink>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="glass-card rounded-2xl p-8 text-center" role="status" aria-live="polite">
          <Loader2 class="h-12 w-12 animate-spin text-[#2ecc71] mx-auto mb-4" aria-hidden="true" />
          <p class="text-slate-600">Loading invitation details...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="errorState" class="glass-card rounded-2xl p-8" role="alert">
          <div class="text-center">
            <div class="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <AlertCircle class="h-8 w-8 text-red-500" aria-hidden="true" />
            </div>
            <h2 class="text-xl font-semibold text-slate-800 mb-2">{{ sanitizedErrorTitle }}</h2>
            <p class="text-slate-600 mb-6">{{ sanitizedErrorMessage }}</p>
            <RouterLink
              to="/"
              class="inline-flex items-center justify-center px-6 py-3 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 transition-all duration-200 text-slate-700 font-medium"
            >
              <Home class="h-5 w-5 mr-2" aria-hidden="true" />
              Go to Homepage
            </RouterLink>
          </div>
        </div>

        <!-- Accepting State -->
        <div v-else-if="isAccepting" class="glass-card rounded-2xl p-8 text-center" role="status" aria-live="polite">
          <Loader2 class="h-12 w-12 animate-spin text-[#2ecc71] mx-auto mb-4" aria-hidden="true" />
          <p class="text-slate-600">Accepting invitation...</p>
        </div>

        <!-- Valid Invitation -->
        <div v-else-if="invitation?.valid" class="glass-card rounded-2xl overflow-hidden">
          <!-- Event Banner -->
          <div v-if="invitation.event?.banner_image" class="aspect-video bg-slate-100 relative">
            <img
              :src="getBannerUrl(invitation.event.banner_image)"
              :alt="sanitizedEventTitle"
              class="w-full h-full object-cover"
            />
          </div>

          <!-- Invitation Content -->
          <div class="p-6 sm:p-8">
            <div class="text-center mb-6">
              <h1 class="text-xl sm:text-2xl font-bold text-slate-800 mb-2">
                You're Invited to Collaborate!
              </h1>
              <p class="text-slate-600">
                <span class="font-medium text-slate-700">{{ sanitizedInviterName }}</span>
                has invited you to collaborate on:
              </p>
            </div>

            <!-- Event Details Card -->
            <div class="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-100">
              <h2 class="text-lg font-semibold text-slate-800 mb-2">
                {{ sanitizedEventTitle }}
              </h2>
              <div class="space-y-2 text-sm text-slate-600">
                <div v-if="invitation.event?.start_date" class="flex items-center">
                  <Calendar class="h-4 w-4 mr-2 text-slate-400" aria-hidden="true" />
                  <span>{{ formatDate(invitation.event.start_date) }}</span>
                </div>
                <div v-if="invitation.event?.location" class="flex items-center">
                  <MapPin class="h-4 w-4 mr-2 text-slate-400" aria-hidden="true" />
                  <span>{{ sanitizedLocation }}</span>
                </div>
                <div class="flex items-center">
                  <Shield class="h-4 w-4 mr-2 text-slate-400" aria-hidden="true" />
                  <span>Your Role: <span class="font-medium text-slate-700 ml-1">{{ sanitizedRole }}</span></span>
                </div>
              </div>
            </div>

            <!-- Role Description -->
            <div class="text-sm text-slate-500 mb-6 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <p>{{ getRoleDescription(invitation.role) }}</p>
            </div>

            <!-- Expiration Notice -->
            <div v-if="invitation.expires_at" class="flex items-center justify-center text-sm text-amber-600 mb-6">
              <Clock class="h-4 w-4 mr-2" aria-hidden="true" />
              <span>Expires: {{ formatDate(invitation.expires_at) }}</span>
            </div>

            <!-- Action Buttons -->
            <div v-if="!authStore.isAuthenticated" class="space-y-3">
              <!-- Google Login Button -->
              <button
                v-if="shouldShowGoogleLogin"
                type="button"
                @click="handleGoogleSignUp"
                :disabled="isGoogleLoading"
                aria-label="Sign up with Google"
                class="w-full flex items-center justify-center px-4 py-3 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 transition-all duration-200 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2ecc71]/20 focus:border-[#2ecc71] disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <Loader2 v-if="isGoogleLoading" class="animate-spin h-5 w-5 mr-3 text-slate-400" aria-hidden="true" />
                <svg v-else class="h-5 w-5 mr-3" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span class="text-sm font-semibold text-slate-700 group-hover:text-slate-900">
                  {{ isGoogleLoading ? 'Signing up...' : 'Sign up with Google' }}
                </span>
              </button>

              <!-- Divider -->
              <div class="relative my-4">
                <div class="absolute inset-0 flex items-center">
                  <div class="w-full border-t border-slate-200" />
                </div>
                <div class="relative flex justify-center text-sm">
                  <span class="px-4 bg-white text-slate-400 font-medium">or</span>
                </div>
              </div>

              <!-- Login Link -->
              <div class="text-center">
                <p class="text-sm text-slate-600">
                  Already have an account?
                  <RouterLink
                    :to="{ path: '/signin', query: { redirect: $route.fullPath } }"
                    class="text-[#2ecc71] hover:text-[#27ae60] font-medium"
                    @click="savePendingInvitationToken"
                  >
                    Log in
                  </RouterLink>
                </p>
              </div>
            </div>

            <!-- Authenticated User Actions -->
            <div v-else class="space-y-4">
              <!-- Email Mismatch Warning -->
              <div v-if="emailMismatch" class="p-4 bg-amber-50 border border-amber-100 rounded-xl" role="alert">
                <div class="flex items-start">
                  <AlertTriangle class="h-5 w-5 text-amber-500 mr-2 mt-0.5 flex-shrink-0" aria-hidden="true" />
                  <div>
                    <p class="text-sm text-amber-700">
                      This invitation was sent to <span class="font-medium">{{ sanitizedInvitationEmail }}</span>.
                      Please sign in with that email to accept this invitation.
                    </p>
                  </div>
                </div>
              </div>

              <!-- Accept Button -->
              <button
                v-if="!emailMismatch"
                @click="acceptInvitation"
                :disabled="isAccepting"
                aria-label="Accept invitation to collaborate"
                class="w-full bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-[#2ecc71]/25 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-[#2ecc71]/50 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
              >
                <div class="flex items-center justify-center">
                  <Loader2 v-if="isAccepting" class="animate-spin -ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                  <UserPlus v-else class="h-5 w-5 mr-2" aria-hidden="true" />
                  {{ isAccepting ? 'Accepting...' : 'Accept Invitation' }}
                </div>
              </button>

              <!-- Sign Out to Use Different Account -->
              <button
                v-if="emailMismatch"
                @click="handleSignOut"
                aria-label="Sign out and use different account"
                class="w-full flex items-center justify-center px-4 py-3 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 transition-all duration-200 text-slate-700 font-medium"
              >
                <LogOut class="h-5 w-5 mr-2" aria-hidden="true" />
                Sign out and use different account
              </button>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <p class="text-center text-sm text-slate-500 mt-6">
          By accepting, you agree to our
          <a href="/terms" class="text-[#2ecc71] hover:text-[#27ae60] font-medium">Terms of Service</a>
          and
          <a href="/privacy" class="text-[#2ecc71] hover:text-[#27ae60] font-medium">Privacy Policy</a>
        </p>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink, useRouter, useRoute } from 'vue-router'
import {
  Loader2,
  AlertCircle,
  AlertTriangle,
  Home,
  Calendar,
  MapPin,
  Shield,
  Clock,
  UserPlus,
  LogOut,
} from 'lucide-vue-next'
import LogoSvg from '@/assets/logo.png'
import { useAuthStore } from '@/stores/auth'
import { invitationsService, apiClient, type CollaboratorInvitationData } from '@/services/api'
import { googleTokenLogin } from 'vue3-google-login'
import { isNormalBrowser } from '@/utils/browserDetection'
import { sanitizePlainText } from '@/utils/sanitize'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// State
const invitation = ref<CollaboratorInvitationData | null>(null)
const isLoading = ref(true)
const isAccepting = ref(false)
const isGoogleLoading = ref(false)
const errorState = ref(false)
const errorTitle = ref('')
const errorMessage = ref('')

// Token validation regex - alphanumeric with hyphens and underscores
const TOKEN_PATTERN = /^[a-zA-Z0-9_-]+$/

// Get and validate token from route params
const token = computed(() => {
  const rawToken = route.params.token as string
  if (!rawToken) return ''

  // Validate token format to prevent injection
  if (!TOKEN_PATTERN.test(rawToken) || rawToken.length > 200) {
    return ''
  }

  return rawToken
})

// Browser detection
const shouldShowGoogleLogin = computed(() => isNormalBrowser())

// Check for email mismatch
const emailMismatch = computed(() => {
  if (!authStore.isAuthenticated || !authStore.user || !invitation.value?.email) {
    return false
  }
  return authStore.user.email?.toLowerCase() !== invitation.value.email.toLowerCase()
})

// Sanitized computed properties for display (XSS protection)
const sanitizedInviterName = computed(() =>
  sanitizePlainText(invitation.value?.invited_by?.name || '', 100)
)

const sanitizedEventTitle = computed(() =>
  sanitizePlainText(invitation.value?.event?.title || '', 200)
)

const sanitizedLocation = computed(() =>
  sanitizePlainText(invitation.value?.event?.location || '', 200)
)

const sanitizedRole = computed(() =>
  sanitizePlainText(invitation.value?.role || '', 50)
)

const sanitizedInvitationEmail = computed(() =>
  sanitizePlainText(invitation.value?.email || '', 100)
)

const sanitizedErrorTitle = computed(() =>
  sanitizePlainText(errorTitle.value, 100)
)

const sanitizedErrorMessage = computed(() =>
  sanitizePlainText(errorMessage.value, 500)
)

// Get banner URL using apiClient
function getBannerUrl(bannerPath: string | null): string {
  return apiClient.getProfilePictureUrl(bannerPath) || ''
}

// Format date
function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}

// Get role description
function getRoleDescription(role?: string): string {
  const descriptions: Record<string, string> = {
    Admin: 'Full access: edit event, manage collaborators, view finances',
    Editor: 'Can edit event details, manage agenda and registrations',
    Viewer: 'Read-only access to event details and registrations',
  }
  return descriptions[role || ''] || 'Collaborator access to this event'
}

// Get error message from reason
function getErrorFromReason(reason?: string): { title: string; message: string } {
  const errors: Record<string, { title: string; message: string }> = {
    expired: {
      title: 'Invitation Expired',
      message: 'This invitation has expired. Please ask the organizer to send a new one.',
    },
    used: {
      title: 'Invitation Already Used',
      message: 'This invitation has already been used.',
    },
    not_found: {
      title: 'Invitation Not Found',
      message: 'Invitation not found. The link may be invalid or has been removed.',
    },
  }
  return (
    errors[reason || ''] || {
      title: 'Invalid Invitation',
      message: 'This invitation link is not valid.',
    }
  )
}

// Helper to set error state consistently
function setError(title: string, message: string) {
  errorState.value = true
  errorTitle.value = title
  errorMessage.value = message
}

// Save pending invitation token for redirect after login
function savePendingInvitationToken() {
  if (token.value) {
    sessionStorage.setItem('pending_invitation_token', token.value)
  }
}

// Validate invitation token
async function validateInvitation() {
  if (!token.value) {
    setError('Invalid Link', 'No invitation token provided or token format is invalid.')
    isLoading.value = false
    return
  }

  try {
    const response = await invitationsService.validateInvitation(token.value)

    if (response.success && response.data) {
      invitation.value = response.data

      if (!response.data.valid) {
        const error = getErrorFromReason(response.data.reason)
        setError(error.title, error.message)
      }
    } else {
      setError('Error', response.message || 'Failed to load invitation details.')
    }
  } catch {
    setError('Error', 'Failed to load invitation details. Please try again later.')
  } finally {
    isLoading.value = false
  }
}

// Accept invitation
async function acceptInvitation() {
  if (!token.value || isAccepting.value) return

  isAccepting.value = true

  try {
    const response = await invitationsService.acceptInvitation(token.value)

    if (response.success && response.data) {
      // Clear pending invitation token
      sessionStorage.removeItem('pending_invitation_token')

      // Redirect to event page
      router.push(`/events/${response.data.event_id}`)
    } else {
      setError('Error', response.message || 'Failed to accept invitation.')
    }
  } catch {
    setError('Error', 'Failed to accept invitation. Please try again later.')
  } finally {
    isAccepting.value = false
  }
}

// Handle Google sign up
async function handleGoogleSignUp() {
  isGoogleLoading.value = true

  try {
    const response = await googleTokenLogin()

    if (response.access_token) {
      const result = await authStore.googleLogin(response.access_token)

      if (result.success) {
        // Clear any pending token
        sessionStorage.removeItem('pending_invitation_token')
        // Backend auto-accepts invitation when user logs in with matching email
        // Just redirect to the event page
        if (invitation.value?.event?.id) {
          router.push(`/events/${invitation.value.event.id}`)
        } else {
          router.push('/events')
        }
      } else {
        setError('Login Failed', result.error || 'Google login failed. Please try again.')
      }
    }
  } catch (error: any) {
    if (error.message && error.message.includes('popup_closed_by_user')) {
      // User cancelled - do nothing
    } else {
      setError('Login Failed', 'Google sign-in failed. Please try again.')
    }
  } finally {
    isGoogleLoading.value = false
  }
}

// Handle sign out
async function handleSignOut() {
  await authStore.logout()
}

onMounted(async () => {
  await validateInvitation()

  // If already authenticated with matching email, redirect to event page
  // Backend auto-accepts invitation when user with matching email is authenticated
  if (authStore.isAuthenticated && invitation.value?.valid && !emailMismatch.value) {
    if (invitation.value?.event?.id) {
      router.push(`/events/${invitation.value.event.id}`)
    } else {
      router.push('/events')
    }
  }
})
</script>

<style scoped>
/* Premium minimal gradient background (matching MainLayout) */
.premium-bg {
  background: linear-gradient(
    135deg,
    #f8fffe 0%,
    #f0fdf9 25%,
    #f5fbff 50%,
    #f0f9ff 75%,
    #f8fffe 100%
  );
}

/* Glass card effect */
.glass-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow:
    0 8px 32px rgba(46, 204, 113, 0.08),
    0 4px 12px rgba(30, 144, 255, 0.05);
}
</style>
