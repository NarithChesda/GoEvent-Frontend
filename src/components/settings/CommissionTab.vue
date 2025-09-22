<template>
  <div class="space-y-6">
    <!-- Commission Overview Dashboard -->
    <div class="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold text-slate-900">Commission Dashboard</h2>
        <button
          @click="refreshData"
          :disabled="isLoading || isStatsLoading"
          class="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw :class="['w-4 h-4', { 'animate-spin': isLoading || isStatsLoading }]" />
          <span>Refresh</span>
        </button>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <!-- Total Earnings Card -->
        <div class="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
          <div class="flex items-start justify-between mb-4">
            <div class="p-3 bg-green-100 rounded-xl">
              <DollarSign class="w-6 h-6 text-green-600" />
            </div>
            <TrendingUp class="w-5 h-5 text-green-600" />
          </div>
          <div class="space-y-1">
            <p class="text-sm font-medium text-green-600">Total Earnings</p>
            <p class="text-2xl font-bold text-slate-900">
              {{ isStatsLoading ? '...' : formatCurrency(stats?.total_commission_amount || 0) }}
            </p>
            <p class="text-xs text-slate-500">All time commission</p>
          </div>
        </div>

        <!-- Claimed Amount Card -->
        <div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
          <div class="flex items-start justify-between mb-4">
            <div class="p-3 bg-blue-100 rounded-xl">
              <CheckCircle2 class="w-6 h-6 text-blue-600" />
            </div>
            <span class="text-xs font-semibold px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
              {{ stats?.claimed_commissions || 0 }} claims
            </span>
          </div>
          <div class="space-y-1">
            <p class="text-sm font-medium text-blue-600">Claimed Amount</p>
            <p class="text-2xl font-bold text-slate-900">
              {{ isStatsLoading ? '...' : formatCurrency(stats?.claimed_commission_amount || 0) }}
            </p>
            <p class="text-xs text-slate-500">Successfully claimed</p>
          </div>
        </div>

        <!-- Pending Amount Card -->
        <div class="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200">
          <div class="flex items-start justify-between mb-4">
            <div class="p-3 bg-amber-100 rounded-xl">
              <Clock class="w-6 h-6 text-amber-600" />
            </div>
            <span class="text-xs font-semibold px-2 py-1 bg-amber-100 text-amber-700 rounded-full">
              {{ stats?.pending_commissions || 0 }} pending
            </span>
          </div>
          <div class="space-y-1">
            <p class="text-sm font-medium text-amber-600">Pending Amount</p>
            <p class="text-2xl font-bold text-slate-900">
              {{ isStatsLoading ? '...' : formatCurrency(stats?.pending_commission_amount || 0) }}
            </p>
            <p class="text-xs text-slate-500">Awaiting claim</p>
          </div>
        </div>

        <!-- Requested Amount Card -->
        <div class="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200">
          <div class="flex items-start justify-between mb-4">
            <div class="p-3 bg-purple-100 rounded-xl">
              <FileText class="w-6 h-6 text-purple-600" />
            </div>
            <span class="text-xs font-semibold px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
              {{ stats?.requested_commissions || 0 }} requested
            </span>
          </div>
          <div class="space-y-1">
            <p class="text-sm font-medium text-purple-600">Requested Amount</p>
            <p class="text-2xl font-bold text-slate-900">
              {{ isStatsLoading ? '...' : formatCurrency(stats?.requested_commission_amount || 0) }}
            </p>
            <p class="text-xs text-slate-500">Under review</p>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="bg-slate-50/50 rounded-2xl p-4 border border-slate-100">
        <p class="text-sm font-medium text-slate-700 mb-3">Quick Actions</p>
        <div class="flex flex-wrap gap-3">
          <button class="inline-flex items-center space-x-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium rounded-xl transition-all duration-200">
            <Filter class="w-4 h-4" />
            <span>Filter by Status</span>
          </button>
          <button class="inline-flex items-center space-x-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium rounded-xl transition-all duration-200">
            <Calendar class="w-4 h-4" />
            <span>Date Range</span>
          </button>
          <button class="inline-flex items-center space-x-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium rounded-xl transition-all duration-200">
            <Download class="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button class="inline-flex items-center space-x-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium rounded-xl transition-all duration-200">
            <HelpCircle class="w-4 h-4" />
            <span>Commission Guide</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Filters Section -->
    <div class="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl">
      <div class="flex flex-col lg:flex-row gap-4">
        <!-- Status Filter -->
        <div class="flex-1">
          <label class="block text-sm font-semibold text-slate-700 mb-2">Filter by Status</label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="status in statusFilters"
              :key="status.value"
              @click="selectStatus(status.value)"
              :class="[
                'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                selectedStatus === status.value
                  ? status.activeClass
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              ]"
            >
              <div class="flex items-center space-x-2">
                <div :class="status.dotClass" class="w-2 h-2 rounded-full"></div>
                <span>{{ status.label }}</span>
                <span v-if="status.count" class="ml-1 text-xs opacity-75">({{ status.count }})</span>
              </div>
            </button>
          </div>
        </div>

        <!-- Date Range Filter -->
        <div class="lg:w-auto">
          <label class="block text-sm font-semibold text-slate-700 mb-2">Date Range</label>
          <div class="flex items-center space-x-2">
            <input
              v-model="startDate"
              type="date"
              class="px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="Start date"
            />
            <span class="text-slate-400">to</span>
            <input
              v-model="endDate"
              type="date"
              class="px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="End date"
            />
          </div>
        </div>

        <!-- Search -->
        <div class="lg:w-64">
          <label class="block text-sm font-semibold text-slate-700 mb-2">Search</label>
          <div class="relative">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Event or reference..."
              class="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          </div>
        </div>
      </div>
    </div>

    <!-- Commissions List -->
    <div class="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl overflow-hidden">
      <div class="p-6 border-b border-slate-100">
        <h3 class="text-lg font-semibold text-slate-900">Commission History</h3>
      </div>

      <!-- Table for Desktop -->
      <div class="hidden lg:block overflow-x-auto">
        <table class="w-full">
          <thead class="bg-slate-50 border-b border-slate-200">
            <tr>
              <th class="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Reference</th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Event</th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Date</th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Rate</th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Amount</th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
              <th class="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <!-- Loading State -->
            <tr v-if="isLoading">
              <td colspan="7" class="px-6 py-8 text-center">
                <div class="flex items-center justify-center space-x-2 text-slate-500">
                  <RefreshCw class="w-5 h-5 animate-spin" />
                  <span>Loading commissions...</span>
                </div>
              </td>
            </tr>

            <!-- No Data State -->
            <tr v-else-if="paginatedCommissions.length === 0">
              <td colspan="7" class="px-6 py-8 text-center">
                <div class="text-slate-500">
                  <FileText class="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p class="text-sm font-medium">No commissions found</p>
                  <p class="text-xs mt-1">{{ filteredCommissions.length === 0 ? 'You haven\'t earned any commissions yet.' : 'Try adjusting your filters.' }}</p>
                </div>
              </td>
            </tr>

            <!-- Commission Rows -->
            <tr v-else v-for="commission in paginatedCommissions" :key="commission.id" class="hover:bg-slate-50/50 transition-colors">
              <td class="px-6 py-4">
                <div class="flex items-center space-x-2">
                  <Hash class="w-4 h-4 text-slate-400" />
                  <span class="text-sm font-medium text-slate-900">{{ commission.commission_reference }}</span>
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="space-y-1">
                  <p class="text-sm font-medium text-slate-900">{{ commission.event_info?.title || 'Unknown Event' }}</p>
                  <p class="text-xs text-slate-500">{{ commission.payment_info?.payment_reference || 'N/A' }}</p>
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="space-y-1">
                  <p class="text-sm text-slate-700">{{ formatDate(commission.created_at) }}</p>
                  <p class="text-xs text-slate-500">{{ getRelativeTime(commission.created_at) }}</p>
                </div>
              </td>
              <td class="px-6 py-4">
                <span class="text-sm font-medium text-slate-900">{{ commission.commission_rate }}%</span>
              </td>
              <td class="px-6 py-4">
                <div class="space-y-1">
                  <p class="text-sm font-bold text-slate-900">{{ formatCurrency(commission.commission_amount, commission.currency) }}</p>
                  <p class="text-xs text-slate-500">from {{ formatCurrency(commission.payment_amount, commission.currency) }}</p>
                </div>
              </td>
              <td class="px-6 py-4">
                <span :class="['inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border', getStatusClass(commission.status)]">
                  <component :is="getStatusIcon(commission.status)" class="w-3 h-3 mr-1" />
                  {{ commission.status_display }}
                </span>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center justify-center space-x-2">
                  <!-- Request Claim Button -->
                  <button
                    v-if="commission.can_request_claim"
                    @click="openRequestClaimModal(commission)"
                    class="inline-flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-all duration-200"
                  >
                    <FileText class="w-3.5 h-3.5" />
                    <span>Request Claim</span>
                  </button>

                  <!-- Status Button for Non-claimable Commissions -->
                  <button
                    v-else-if="commission.status === 'requested'"
                    disabled
                    class="inline-flex items-center space-x-1 px-3 py-1.5 bg-slate-100 text-slate-600 text-sm font-medium rounded-lg cursor-not-allowed opacity-50"
                  >
                    <Clock class="w-3.5 h-3.5" />
                    <span>Under Review</span>
                  </button>

                  <button
                    v-else-if="commission.status === 'claimed'"
                    disabled
                    class="inline-flex items-center space-x-1 px-3 py-1.5 bg-green-50 text-green-700 text-sm font-medium rounded-lg cursor-not-allowed"
                  >
                    <CheckCircle2 class="w-3.5 h-3.5" />
                    <span>Paid</span>
                  </button>

                  <button
                    v-else-if="commission.status === 'rejected'"
                    disabled
                    class="inline-flex items-center space-x-1 px-3 py-1.5 bg-red-50 text-red-700 text-sm font-medium rounded-lg cursor-not-allowed"
                  >
                    <X class="w-3.5 h-3.5" />
                    <span>Rejected</span>
                  </button>

                  <!-- View Details Button -->
                  <button
                    @click="viewCommissionDetails(commission)"
                    class="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all duration-200"
                  >
                    <Eye class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Cards for Mobile -->
      <div class="lg:hidden p-4 space-y-4">
        <!-- Loading State -->
        <div v-if="isLoading" class="text-center py-8">
          <div class="flex items-center justify-center space-x-2 text-slate-500">
            <RefreshCw class="w-5 h-5 animate-spin" />
            <span>Loading commissions...</span>
          </div>
        </div>

        <!-- No Data State -->
        <div v-else-if="paginatedCommissions.length === 0" class="text-center py-8">
          <div class="text-slate-500">
            <FileText class="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p class="text-sm font-medium">No commissions found</p>
            <p class="text-xs mt-1">{{ filteredCommissions.length === 0 ? 'You haven\'t earned any commissions yet.' : 'Try adjusting your filters.' }}</p>
          </div>
        </div>

        <!-- Mobile Commission Cards -->
        <div v-else v-for="commission in paginatedCommissions" :key="commission.id" class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div class="flex items-start justify-between mb-3">
            <div class="space-y-1">
              <div class="flex items-center space-x-2">
                <Hash class="w-3.5 h-3.5 text-slate-400" />
                <span class="text-xs font-semibold text-slate-600">{{ commission.commission_reference }}</span>
              </div>
              <h4 class="font-semibold text-slate-900">{{ commission.event_info?.title || 'Unknown Event' }}</h4>
              <p class="text-xs text-slate-500">{{ commission.payment_info?.payment_reference || 'N/A' }} • {{ formatDate(commission.created_at) }}</p>
            </div>
            <span :class="['inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold', getStatusClass(commission.status)]">
              {{ commission.status_display }}
            </span>
          </div>

          <div class="grid grid-cols-3 gap-3 mb-4">
            <div>
              <p class="text-xs text-slate-500">Rate</p>
              <p class="text-sm font-semibold text-slate-900">{{ commission.commission_rate }}%</p>
            </div>
            <div>
              <p class="text-xs text-slate-500">Commission</p>
              <p class="text-sm font-semibold text-slate-900">{{ formatCurrency(commission.commission_amount, commission.currency) }}</p>
            </div>
            <div>
              <p class="text-xs text-slate-500">From</p>
              <p class="text-sm font-semibold text-slate-900">{{ formatCurrency(commission.payment_amount, commission.currency) }}</p>
            </div>
          </div>

          <!-- Request Info for Requested Status -->
          <div v-if="commission.status === 'requested' && commission.requested_at" class="bg-purple-50 rounded-lg px-3 py-2 mb-3">
            <p class="text-xs text-purple-700">
              <span class="font-semibold">Requested:</span> {{ formatDate(commission.requested_at) }}
            </p>
            <p class="text-xs text-purple-600 mt-1">Your claim is under review</p>
          </div>

          <!-- Claim Info for Claimed Status -->
          <div v-else-if="commission.status === 'claimed' && commission.claimed_at" class="bg-green-50 rounded-lg px-3 py-2 mb-3">
            <p class="text-xs text-green-700">
              <span class="font-semibold">Claimed:</span> {{ formatDate(commission.claimed_at) }}
            </p>
            <p class="text-xs text-green-600 mt-1">Commission has been paid</p>
          </div>

          <!-- Rejection Info for Rejected Status -->
          <div v-else-if="commission.status === 'rejected' && commission.rejected_at" class="bg-red-50 rounded-lg px-3 py-2 mb-3">
            <p class="text-xs text-red-700">
              <span class="font-semibold">Rejected:</span> {{ formatDate(commission.rejected_at) }}
            </p>
            <p class="text-xs text-red-600 mt-1">Claim was rejected</p>
          </div>

          <div class="flex space-x-2">
            <!-- Request Claim Button -->
            <button
              v-if="commission.can_request_claim"
              @click="openRequestClaimModal(commission)"
              class="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-all duration-200"
            >
              Request Claim
            </button>

            <!-- View Details Button -->
            <button
              @click="viewCommissionDetails(commission)"
              :class="[
                'px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-medium rounded-xl transition-all duration-200',
                !commission.can_request_claim ? 'flex-1' : ''
              ]"
            >
              View {{ commission.can_request_claim ? '' : 'Details' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div class="px-6 py-4 border-t border-slate-100">
        <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p class="text-sm text-slate-600">
            Showing <span class="font-semibold">{{ paginationInfo.start }}-{{ paginationInfo.end }}</span> of <span class="font-semibold">{{ paginationInfo.total }}</span> commissions
          </p>
          <div class="flex items-center space-x-2">
            <button
              @click="goToPreviousPage"
              :disabled="currentPage <= 1"
              class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft class="w-5 h-5" />
            </button>
            <div class="flex space-x-1">
              <button
                v-for="page in Math.min(totalPages, 5)"
                :key="page"
                @click="goToPage(page)"
                :class="[
                  'px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200',
                  currentPage === page
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                ]"
              >
                {{ page }}
              </button>
              <span v-if="totalPages > 5 && currentPage < totalPages - 2" class="px-2 py-1 text-slate-400">...</span>
              <button
                v-if="totalPages > 5 && currentPage < totalPages - 2"
                @click="goToPage(totalPages)"
                :class="[
                  'px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200',
                  currentPage === totalPages
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                ]"
              >
                {{ totalPages }}
              </button>
            </div>
            <button
              @click="goToNextPage"
              :disabled="currentPage >= totalPages"
              class="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight class="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Request Claim Modal (Hidden by default, shown when requesting claim) -->
    <div v-if="showRequestClaimModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div class="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div class="p-6 border-b border-slate-200">
          <div class="flex items-center justify-between">
            <h3 class="text-xl font-bold text-slate-900">Request Commission Claim</h3>
            <button
              @click="closeRequestClaimModal"
              class="p-2 hover:bg-slate-100 rounded-xl transition-all duration-200"
            >
              <X class="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        <div class="p-6 space-y-4">
          <!-- Commission Details -->
          <div class="bg-slate-50 rounded-2xl p-4 space-y-3">
            <h4 class="font-semibold text-slate-900 text-sm">Commission Details</h4>
            <div class="space-y-2">
              <div class="flex justify-between text-sm">
                <span class="text-slate-600">Reference:</span>
                <span class="font-medium text-slate-900">{{ selectedCommissionForClaim?.commission_reference }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-slate-600">Event:</span>
                <span class="font-medium text-slate-900">{{ selectedCommissionForClaim?.event_info?.title || 'Unknown Event' }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-slate-600">Commission Amount:</span>
                <span class="font-bold text-green-600 text-base">{{ selectedCommissionForClaim ? formatCurrency(selectedCommissionForClaim.commission_amount, selectedCommissionForClaim.currency) : '$0.00' }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-slate-600">Created Date:</span>
                <span class="font-medium text-slate-900">{{ selectedCommissionForClaim ? formatDate(selectedCommissionForClaim.created_at) : 'N/A' }}</span>
              </div>
            </div>
          </div>

          <!-- Payment Information -->
          <div>
            <h4 class="font-semibold text-slate-900 text-sm mb-3">Payment Method</h4>
            <div class="space-y-2">
              <label class="flex items-start space-x-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-all">
                <input type="radio" name="payment_method" class="mt-1" checked />
                <div class="flex-1">
                  <p class="font-medium text-slate-900 text-sm">Bank Transfer</p>
                  <p class="text-xs text-slate-500 mt-1">Transfer to your registered bank account</p>
                  <div class="mt-2 text-xs text-slate-600 bg-blue-50 rounded-lg p-2">
                    Account: ****1234 (Chase Bank)
                  </div>
                </div>
              </label>
              <label class="flex items-start space-x-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-all">
                <input type="radio" name="payment_method" class="mt-1" />
                <div class="flex-1">
                  <p class="font-medium text-slate-900 text-sm">PayPal</p>
                  <p class="text-xs text-slate-500 mt-1">Transfer to your PayPal account</p>
                </div>
              </label>
            </div>
          </div>

          <!-- Request Notes -->
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-2">
              Additional Notes (Optional)
            </label>
            <textarea
              v-model="requestClaimNotes"
              rows="3"
              placeholder="Add any special instructions or notes for processing..."
              class="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
            ></textarea>
          </div>

          <!-- Important Notice -->
          <div class="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div class="flex items-start space-x-2">
              <AlertTriangle class="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div class="text-xs text-amber-800 space-y-1">
                <p class="font-semibold">Important Information:</p>
                <ul class="list-disc list-inside space-y-0.5 ml-1">
                  <li>Commission claims are typically processed within 3-5 business days</li>
                  <li>Ensure your payment information is up to date</li>
                  <li>You will receive an email notification once processed</li>
                  <li>Minimum payout amount is $25.00</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div class="p-6 border-t border-slate-200 flex justify-end space-x-3">
          <button
            @click="closeRequestClaimModal"
            :disabled="isRequestingClaim"
            class="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-medium rounded-xl transition-all duration-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            @click="requestClaim"
            :disabled="isRequestingClaim"
            class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="isRequestingClaim" class="flex items-center space-x-2">
              <RefreshCw class="w-4 h-4 animate-spin" />
              <span>Submitting...</span>
            </span>
            <span v-else>Submit Claim Request</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Commission Details Modal (Hidden by default) -->
    <div v-if="showDetailsModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div class="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div class="p-6 border-b border-slate-200">
          <div class="flex items-center justify-between">
            <h3 class="text-xl font-bold text-slate-900">Commission Details</h3>
            <button
              @click="closeDetailsModal"
              class="p-2 hover:bg-slate-100 rounded-xl transition-all duration-200"
            >
              <X class="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        <div class="p-6 space-y-6">
          <!-- Commission Info -->
          <div>
            <h4 class="font-semibold text-slate-900 mb-3">Commission Information</h4>
            <div class="bg-slate-50 rounded-xl p-4 space-y-3">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <p class="text-xs text-slate-500 mb-1">Reference Number</p>
                  <p class="font-medium text-slate-900">{{ selectedCommission?.commission_reference }}</p>
                </div>
                <div>
                  <p class="text-xs text-slate-500 mb-1">Status</p>
                  <span v-if="selectedCommission" :class="['inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold', getStatusClass(selectedCommission.status)]">
                    <component :is="getStatusIcon(selectedCommission.status)" class="w-3 h-3 mr-1" />
                    {{ selectedCommission.status_display }}
                  </span>
                </div>
                <div>
                  <p class="text-xs text-slate-500 mb-1">Commission Rate</p>
                  <p class="font-medium text-slate-900">{{ selectedCommission?.commission_rate }}%</p>
                </div>
                <div>
                  <p class="text-xs text-slate-500 mb-1">Commission Amount</p>
                  <p class="font-bold text-green-600 text-lg">
                    {{ selectedCommission ? formatCurrency(selectedCommission.commission_amount, selectedCommission.currency) : '$0.00' }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Event Information -->
          <div>
            <h4 class="font-semibold text-slate-900 mb-3">Event Information</h4>
            <div class="bg-slate-50 rounded-xl p-4 space-y-3">
              <div class="flex items-start space-x-4">
                <div class="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                  {{ selectedCommission?.event_detail?.title?.substring(0, 2).toUpperCase() || 'EV' }}
                </div>
                <div class="flex-1">
                  <h5 class="font-semibold text-slate-900">{{ selectedCommission?.event_detail?.title || 'Unknown Event' }}</h5>
                  <p class="text-sm text-slate-600 mt-1">{{ selectedCommission?.payment_detail?.pricing_plan_name || 'Standard Plan' }} Package</p>
                  <div class="flex items-center space-x-4 mt-2 text-xs text-slate-500">
                    <span class="flex items-center space-x-1">
                      <Calendar class="w-3 h-3" />
                      <span>{{ selectedCommission?.event_detail ? formatDate(selectedCommission.event_detail.start_date) : 'N/A' }}</span>
                    </span>
                    <span class="flex items-center space-x-1" v-if="selectedCommission?.event_detail?.organizer_email">
                      <span>{{ selectedCommission.event_detail.organizer_email }}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Payment Information -->
          <div>
            <h4 class="font-semibold text-slate-900 mb-3">Payment Information</h4>
            <div class="bg-slate-50 rounded-xl p-4 space-y-3">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <p class="text-xs text-slate-500 mb-1">Payment Reference</p>
                  <p class="font-medium text-slate-900">{{ selectedCommission?.payment_detail?.payment_reference || 'N/A' }}</p>
                </div>
                <div>
                  <p class="text-xs text-slate-500 mb-1">Payment Date</p>
                  <p class="font-medium text-slate-900">
                    {{ selectedCommission?.payment_detail?.confirmed_at ? formatDate(selectedCommission.payment_detail.confirmed_at) : 'N/A' }}
                  </p>
                </div>
                <div>
                  <p class="text-xs text-slate-500 mb-1">Customer Email</p>
                  <p class="font-medium text-slate-900">{{ selectedCommission?.payment_detail?.user_email || 'N/A' }}</p>
                </div>
                <div>
                  <p class="text-xs text-slate-500 mb-1">Payment Amount</p>
                  <p class="font-medium text-slate-900">
                    {{ selectedCommission ? formatCurrency(selectedCommission.payment_amount, selectedCommission.currency) : '$0.00' }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Processing Timeline -->
          <div v-if="selectedCommission">
            <h4 class="font-semibold text-slate-900 mb-3">Processing Timeline</h4>
            <div class="relative">
              <div class="absolute left-4 top-8 bottom-0 w-0.5 bg-slate-200"></div>
              <div class="space-y-4">
                <!-- Created -->
                <div class="flex items-start space-x-4">
                  <div class="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm z-10">
                    <Plus class="w-4 h-4 text-slate-600" />
                  </div>
                  <div class="flex-1">
                    <p class="font-medium text-slate-900 text-sm">Commission Created</p>
                    <p class="text-xs text-slate-500 mt-0.5">{{ formatDate(selectedCommission.created_at) }}</p>
                  </div>
                </div>

                <!-- Requested -->
                <div v-if="selectedCommission.requested_at" class="flex items-start space-x-4">
                  <div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm z-10">
                    <FileText class="w-4 h-4 text-purple-600" />
                  </div>
                  <div class="flex-1">
                    <p class="font-medium text-slate-900 text-sm">Claim Requested</p>
                    <p class="text-xs text-slate-500 mt-0.5">{{ formatDate(selectedCommission.requested_at) }}</p>
                    <div v-if="selectedCommission.requested_notes" class="bg-white rounded-lg border border-slate-200 p-3 mt-2">
                      <p class="text-xs text-slate-600 italic">"{{ selectedCommission.requested_notes }}"</p>
                    </div>
                  </div>
                </div>

                <!-- Claimed -->
                <div v-if="selectedCommission.claimed_at" class="flex items-start space-x-4">
                  <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm z-10">
                    <CheckCircle class="w-4 h-4 text-green-600" />
                  </div>
                  <div class="flex-1">
                    <p class="font-medium text-slate-900 text-sm">Claim Approved & Paid</p>
                    <p class="text-xs text-slate-500 mt-0.5">{{ formatDate(selectedCommission.claimed_at) }}</p>
                    <div class="bg-white rounded-lg border border-slate-200 p-3 mt-2">
                      <p v-if="selectedCommission.processed_by_detail" class="text-xs text-slate-600">
                        Processed by: {{ selectedCommission.processed_by_detail.email }}
                      </p>
                      <p v-if="selectedCommission.claim_notes" class="text-xs text-slate-600 italic mt-1">
                        "{{ selectedCommission.claim_notes }}"
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Rejected -->
                <div v-if="selectedCommission.rejected_at" class="flex items-start space-x-4">
                  <div class="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm z-10">
                    <X class="w-4 h-4 text-red-600" />
                  </div>
                  <div class="flex-1">
                    <p class="font-medium text-slate-900 text-sm">Claim Rejected</p>
                    <p class="text-xs text-slate-500 mt-0.5">{{ formatDate(selectedCommission.rejected_at) }}</p>
                    <div v-if="selectedCommission.rejection_reason" class="bg-white rounded-lg border border-slate-200 p-3 mt-2">
                      <p class="text-xs text-slate-600 italic">"{{ selectedCommission.rejection_reason }}"</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="p-6 border-t border-slate-200 flex justify-end">
          <button
            @click="closeDetailsModal"
            class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-all duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>

    <!-- Help Section -->
    <div class="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-8 border border-blue-200">
      <div class="flex items-start space-x-4">
        <div class="p-3 bg-blue-100 rounded-xl">
          <HelpCircle class="w-6 h-6 text-blue-600" />
        </div>
        <div class="flex-1">
          <h3 class="text-lg font-semibold text-slate-900 mb-2">Need Help with Commissions?</h3>
          <p class="text-sm text-slate-600 mb-4">
            Learn how our commission system works and how to maximize your earnings through our referral program.
          </p>
          <div class="flex flex-wrap gap-3">
            <button class="inline-flex items-center space-x-2 px-4 py-2 bg-white hover:bg-blue-50 text-blue-600 font-medium rounded-xl transition-all duration-200 border border-blue-200">
              <BookOpen class="w-4 h-4" />
              <span>Commission Guide</span>
            </button>
            <button class="inline-flex items-center space-x-2 px-4 py-2 bg-white hover:bg-blue-50 text-blue-600 font-medium rounded-xl transition-all duration-200 border border-blue-200">
              <MessageCircle class="w-4 h-4" />
              <span>Contact Support</span>
            </button>
            <button class="inline-flex items-center space-x-2 px-4 py-2 bg-white hover:bg-blue-50 text-blue-600 font-medium rounded-xl transition-all duration-200 border border-blue-200">
              <FileQuestion class="w-4 h-4" />
              <span>FAQs</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import {
  Wallet,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  Clock,
  FileText,
  RefreshCw,
  Filter,
  Calendar,
  Download,
  HelpCircle,
  Search,
  Hash,
  Eye,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  X,
  AlertTriangle,
  Plus,
  MapPin,
  BookOpen,
  MessageCircle,
  FileQuestion
} from 'lucide-vue-next'

import {
  commissionService,
  type Commission,
  type CommissionDetail,
  type CommissionStats,
  type CommissionFilters
} from '../../services/commission'
import { useNotifications } from '../../composables/useNotifications'

// Composables
const { success, error } = useNotifications()

// Reactive data
const isLoading = ref(false)
const isStatsLoading = ref(false)
const isRequestingClaim = ref(false)
const showRequestClaimModal = ref(false)
const showDetailsModal = ref(false)

// Commission data
const commissions = ref<Commission[]>([])
const stats = ref<CommissionStats | null>(null)
const selectedCommission = ref<CommissionDetail | null>(null)
const selectedCommissionForClaim = ref<Commission | null>(null)

// Pagination
const currentPage = ref(1)
const pageSize = ref(10)
const totalCommissions = ref(0)
const hasNextPage = ref(false)
const hasPreviousPage = ref(false)

// Filters
const selectedStatus = ref<'all' | 'pending' | 'requested' | 'claimed' | 'rejected' | 'cancelled'>('all')
const startDate = ref('')
const endDate = ref('')
const searchQuery = ref('')
const requestClaimNotes = ref('')

// Status filter configuration
const statusFilters = computed(() => [
  {
    value: 'all' as const,
    label: 'All',
    count: stats.value?.total_commissions || 0,
    activeClass: 'bg-slate-900 text-white',
    dotClass: 'bg-slate-400'
  },
  {
    value: 'pending' as const,
    label: 'Pending',
    count: stats.value?.pending_commissions || 0,
    activeClass: 'bg-amber-600 text-white',
    dotClass: 'bg-amber-600'
  },
  {
    value: 'requested' as const,
    label: 'Requested',
    count: stats.value?.requested_commissions || 0,
    activeClass: 'bg-purple-600 text-white',
    dotClass: 'bg-purple-600'
  },
  {
    value: 'claimed' as const,
    label: 'Claimed',
    count: stats.value?.claimed_commissions || 0,
    activeClass: 'bg-green-600 text-white',
    dotClass: 'bg-green-600'
  },
  {
    value: 'rejected' as const,
    label: 'Rejected',
    count: stats.value?.rejected_commissions || 0,
    activeClass: 'bg-red-600 text-white',
    dotClass: 'bg-red-600'
  }
])

// Computed properties
const filteredCommissions = computed(() => {
  let filtered = [...commissions.value]

  // Apply status filter
  if (selectedStatus.value !== 'all') {
    filtered = filtered.filter(commission => commission.status === selectedStatus.value)
  }

  // Apply search filter
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    filtered = filtered.filter(commission =>
      commission.commission_reference.toLowerCase().includes(query) ||
      commission.event_info?.title.toLowerCase().includes(query) ||
      commission.payment_info?.payment_reference.toLowerCase().includes(query)
    )
  }

  return filtered
})

const paginatedCommissions = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredCommissions.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(filteredCommissions.value.length / pageSize.value)
})

const paginationInfo = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value + 1
  const end = Math.min(currentPage.value * pageSize.value, filteredCommissions.value.length)
  return {
    start,
    end,
    total: filteredCommissions.value.length
  }
})

// API methods
async function fetchStats() {
  isStatsLoading.value = true
  try {
    const response = await commissionService.getCommissionStats()
    if (response.success && response.data) {
      stats.value = response.data
    } else {
      error('Failed to load commission statistics', response.message)
    }
  } catch (err) {
    error('Failed to load commission statistics', 'Network error occurred')
  } finally {
    isStatsLoading.value = false
  }
}

async function fetchCommissions() {
  isLoading.value = true
  try {
    const filters: CommissionFilters = {
      page: 1,
      page_size: 100 // Load all for client-side filtering
    }

    if (startDate.value) filters.start_date = startDate.value
    if (endDate.value) filters.end_date = endDate.value

    const response = await commissionService.getCommissions(filters)
    if (response.success && response.data) {
      commissions.value = response.data.results
      totalCommissions.value = response.data.count
    } else {
      error('Failed to load commissions', response.message)
    }
  } catch (err) {
    error('Failed to load commissions', 'Network error occurred')
  } finally {
    isLoading.value = false
  }
}

async function refreshData() {
  await Promise.all([fetchStats(), fetchCommissions()])
  success('Data refreshed successfully')
}

async function openRequestClaimModal(commission: Commission) {
  if (!commission.can_request_claim) {
    error('Cannot request claim', 'This commission is not eligible for claim request')
    return
  }

  selectedCommissionForClaim.value = commission
  requestClaimNotes.value = ''
  showRequestClaimModal.value = true
}

async function requestClaim() {
  if (!selectedCommissionForClaim.value) return

  isRequestingClaim.value = true
  try {
    const response = await commissionService.requestClaim(
      selectedCommissionForClaim.value.id,
      { requested_notes: requestClaimNotes.value.trim() || undefined }
    )

    if (response.success) {
      success('Claim request submitted successfully', 'Your request is now under review')
      closeRequestClaimModal()
      await refreshData() // Refresh to get updated status
    } else {
      error('Failed to submit claim request', response.message)
    }
  } catch (err) {
    error('Failed to submit claim request', 'Network error occurred')
  } finally {
    isRequestingClaim.value = false
  }
}

async function viewCommissionDetails(commission: Commission) {
  isLoading.value = true
  try {
    const response = await commissionService.getCommission(commission.id)
    if (response.success && response.data) {
      selectedCommission.value = response.data
      showDetailsModal.value = true
    } else {
      error('Failed to load commission details', response.message)
    }
  } catch (err) {
    error('Failed to load commission details', 'Network error occurred')
  } finally {
    isLoading.value = false
  }
}

function closeRequestClaimModal() {
  showRequestClaimModal.value = false
  selectedCommissionForClaim.value = null
  requestClaimNotes.value = ''
}

function closeDetailsModal() {
  showDetailsModal.value = false
  selectedCommission.value = null
}

function selectStatus(status: typeof selectedStatus.value) {
  selectedStatus.value = status
  currentPage.value = 1 // Reset to first page when filtering
}

function goToPage(page: number) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

function goToPreviousPage() {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

function goToNextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount)
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

function getRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

  if (diffInDays === 0) return 'Today'
  if (diffInDays === 1) return '1 day ago'
  if (diffInDays < 7) return `${diffInDays} days ago`
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`

  return formatDate(dateString)
}

function getStatusClass(status: string): string {
  switch (status) {
    case 'pending':
      return 'bg-amber-100 text-amber-800 border-amber-200'
    case 'requested':
      return 'bg-purple-100 text-purple-800 border-purple-200'
    case 'claimed':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'rejected':
      return 'bg-red-100 text-red-800 border-red-200'
    case 'cancelled':
      return 'bg-gray-100 text-gray-800 border-gray-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'pending':
      return Clock
    case 'requested':
      return FileText
    case 'claimed':
      return CheckCircle
    case 'rejected':
      return X
    case 'cancelled':
      return X
    default:
      return Clock
  }
}

// Watch for filter changes
watch([selectedStatus, searchQuery, startDate, endDate], () => {
  currentPage.value = 1 // Reset to first page when filters change
})

// Initialize data on mount
onMounted(() => {
  refreshData()
})
</script>