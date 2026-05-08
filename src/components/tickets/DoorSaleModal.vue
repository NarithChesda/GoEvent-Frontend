<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="show"
        class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[998]"
        @click="handleBackdrop"
      />
    </Transition>

    <Transition name="slide-up">
      <div
        v-if="show"
        class="fixed inset-x-0 bottom-0 md:inset-0 md:flex md:items-center md:justify-center w-full md:w-auto z-[999] door-sale-shell"
        @click.self="handleBackdrop"
      >
        <div
          class="relative w-full md:max-w-2xl bg-white md:rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] md:max-h-[calc(100vh-100px)] flex flex-col rounded-t-3xl md:rounded-b-3xl"
          @click.stop
        >
          <!-- Header -->
          <div class="flex-shrink-0 sticky top-0 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] z-10 print:hidden">
            <div class="flex items-center justify-between px-4 py-3">
              <div class="flex items-center gap-3 min-w-0">
                <div
                  class="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center flex-shrink-0"
                >
                  <CheckCircle2 v-if="stage === 'receipt'" class="w-5 h-5" />
                  <Receipt v-else class="w-5 h-5" />
                </div>
                <div class="min-w-0">
                  <h2 class="text-lg font-semibold text-white leading-tight truncate">
                    {{ stage === 'receipt'
                        ? t('management.tickets.doorSale.receipt.title')
                        : t('management.tickets.doorSale.modal.title') }}
                  </h2>
                  <p class="text-[11px] text-white/80 mt-0.5 truncate">
                    {{ stage === 'receipt' ? receiptSubtitle : t('management.tickets.doorSale.modal.subtitle') }}
                  </p>
                </div>
              </div>
              <button
                type="button"
                class="w-8 h-8 rounded-full hover:bg-white/20 text-white flex items-center justify-center transition-colors flex-shrink-0"
                :aria-label="t('management.tickets.doorSale.modal.close')"
                @click="handleBackdrop"
              >
                <X class="w-5 h-5" />
              </button>
            </div>
          </div>

          <!-- Body -->
          <div class="flex-1 overflow-y-auto overscroll-contain bg-slate-50/50">
            <!-- Loading tiers -->
            <div v-if="stage === 'form' && loadingTiers" class="flex flex-col items-center justify-center py-16 gap-3">
              <div class="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p class="text-sm text-slate-500">
                {{ t('management.tickets.doorSale.modal.loadingTiers') }}
              </p>
            </div>

            <!-- No active tiers -->
            <div
              v-else-if="stage === 'form' && !loadingTiers && activeTiers.length === 0"
              class="p-6 sm:p-8"
            >
              <div class="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center">
                <div class="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Ticket class="w-7 h-7 text-slate-400" />
                </div>
                <h3 class="font-semibold text-slate-900 mb-1.5">
                  {{ t('management.tickets.doorSale.modal.noActiveTiers') }}
                </h3>
                <p class="text-sm text-slate-500 max-w-sm mx-auto">
                  {{ t('management.tickets.doorSale.modal.noActiveTiersHint') }}
                </p>
              </div>
            </div>

            <!-- Form stage -->
            <form
              v-else-if="stage === 'form'"
              class="p-4 sm:p-5 space-y-5"
              @submit.prevent="handleSubmit"
            >
              <!-- Tier picker -->
              <section>
                <header class="mb-2">
                  <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    {{ t('management.tickets.doorSale.modal.tiersHeader') }}
                  </h3>
                  <p class="text-xs text-slate-500 mt-0.5">
                    {{ t('management.tickets.doorSale.modal.tiersHint') }}
                  </p>
                </header>
                <ul class="space-y-2">
                  <li
                    v-for="tier in activeTiers"
                    :key="tier.id"
                    class="bg-white border rounded-2xl px-3 sm:px-4 py-3 flex items-center gap-3 transition-colors"
                    :class="
                      currencyConflict(tier)
                        ? 'border-amber-200 bg-amber-50/40'
                        : (quantities[tier.id] ?? 0) > 0
                          ? 'border-emerald-300'
                          : 'border-slate-200'
                    "
                  >
                    <div class="min-w-0 flex-1">
                      <p class="text-sm font-semibold text-slate-900 truncate">
                        {{ tier.name }}
                      </p>
                      <div class="flex items-center gap-1.5 flex-wrap mt-0.5">
                        <span class="text-sm text-slate-700 tabular-nums">
                          {{ formatCurrency(tier.price, tier.currency) }}
                        </span>
                        <span class="text-xs text-slate-300">·</span>
                        <span
                          class="text-[11px] font-medium tabular-nums px-1.5 py-0.5 rounded"
                          :class="
                            tier.quantity_remaining > 0
                              ? 'bg-slate-100 text-slate-600'
                              : 'bg-rose-50 text-rose-700'
                          "
                        >
                          {{ tier.quantity_remaining > 0
                              ? t('management.tickets.doorSale.modal.remaining', { count: tier.quantity_remaining })
                              : t('management.tickets.doorSale.modal.remainingZero') }}
                        </span>
                        <span
                          v-if="currencyConflict(tier)"
                          class="text-[11px] font-medium px-1.5 py-0.5 rounded bg-amber-100 text-amber-800"
                        >
                          {{ tier.currency }}
                        </span>
                      </div>
                    </div>

                    <!-- Stepper -->
                    <div class="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                      <button
                        type="button"
                        class="w-9 h-9 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                        :disabled="(quantities[tier.id] ?? 0) === 0"
                        :aria-label="t('management.tickets.doorSale.modal.decrementAria')"
                        @click="decrement(tier)"
                      >
                        <Minus class="w-4 h-4" />
                      </button>
                      <span
                        class="w-9 text-center text-sm font-semibold text-slate-900 tabular-nums"
                      >
                        {{ quantities[tier.id] ?? 0 }}
                      </span>
                      <button
                        type="button"
                        class="w-9 h-9 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                        :disabled="!canIncrement(tier)"
                        :aria-label="t('management.tickets.doorSale.modal.incrementAria')"
                        @click="increment(tier)"
                      >
                        <Plus class="w-4 h-4" />
                      </button>
                    </div>
                  </li>
                </ul>
                <p
                  v-if="fieldErrors.items"
                  class="mt-2 text-xs text-red-600"
                >
                  {{ fieldErrors.items }}
                </p>
              </section>

              <!-- Buyer info -->
              <section>
                <header class="mb-2">
                  <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    {{ t('management.tickets.doorSale.modal.buyerHeader') }}
                  </h3>
                  <p class="text-xs text-slate-500 mt-0.5">
                    {{ t('management.tickets.doorSale.modal.buyerHint') }}
                  </p>
                </header>
                <div class="space-y-2">
                  <input
                    v-model="form.buyer_name"
                    type="text"
                    maxlength="120"
                    autocomplete="off"
                    :placeholder="t('management.tickets.doorSale.modal.namePlaceholder')"
                    :aria-label="t('management.tickets.doorSale.modal.nameLabel')"
                    class="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white"
                  />
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <input
                        v-model="form.buyer_email"
                        type="email"
                        maxlength="254"
                        autocomplete="off"
                        :placeholder="t('management.tickets.doorSale.modal.emailPlaceholder')"
                        :aria-label="t('management.tickets.doorSale.modal.emailLabel')"
                        class="w-full px-3.5 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white"
                        :class="fieldErrors.email ? 'border-red-300' : 'border-slate-200'"
                      />
                      <p v-if="fieldErrors.email" class="mt-1 text-xs text-red-600">
                        {{ fieldErrors.email }}
                      </p>
                    </div>
                    <input
                      v-model="form.buyer_phone"
                      type="tel"
                      maxlength="32"
                      autocomplete="off"
                      :placeholder="t('management.tickets.doorSale.modal.phonePlaceholder')"
                      :aria-label="t('management.tickets.doorSale.modal.phoneLabel')"
                      class="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white"
                    />
                  </div>
                </div>
              </section>

              <!-- Payment -->
              <section>
                <header class="mb-2">
                  <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    {{ t('management.tickets.doorSale.modal.paymentHeader') }}
                  </h3>
                </header>
                <div>
                  <p class="text-xs text-slate-600 mb-2">
                    {{ t('management.tickets.doorSale.modal.paymentTypeLabel') }}
                  </p>
                  <div class="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      class="flex flex-col items-center justify-center gap-1 px-2 py-2.5 border rounded-xl text-xs font-medium transition-all"
                      :class="
                        form.door_payment_type === 'cash'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      "
                      @click="form.door_payment_type = 'cash'"
                    >
                      <Banknote class="w-4 h-4" />
                      <span>{{ t('management.tickets.orders.review.doorPaymentTypes.cash') }}</span>
                    </button>
                    <button
                      type="button"
                      class="flex flex-col items-center justify-center gap-1 px-2 py-2.5 border rounded-xl text-xs font-medium transition-all"
                      :class="
                        form.door_payment_type === 'card_offline'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      "
                      @click="form.door_payment_type = 'card_offline'"
                    >
                      <CreditCard class="w-4 h-4" />
                      <span>{{ t('management.tickets.orders.review.doorPaymentTypes.card_offline') }}</span>
                    </button>
                    <button
                      type="button"
                      class="flex flex-col items-center justify-center gap-1 px-2 py-2.5 border rounded-xl text-xs font-medium transition-all"
                      :class="
                        form.door_payment_type === 'other'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      "
                      @click="form.door_payment_type = 'other'"
                    >
                      <Wallet class="w-4 h-4" />
                      <span>{{ t('management.tickets.orders.review.doorPaymentTypes.other') }}</span>
                    </button>
                  </div>
                </div>

                <div class="mt-3 space-y-2">
                  <input
                    v-model="form.transaction_reference"
                    type="text"
                    maxlength="100"
                    autocomplete="off"
                    :placeholder="t('management.tickets.doorSale.modal.transactionRefPlaceholder')"
                    :aria-label="t('management.tickets.doorSale.modal.transactionRefLabel')"
                    class="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white"
                  />
                  <textarea
                    v-model="form.admin_notes"
                    rows="2"
                    maxlength="500"
                    :placeholder="t('management.tickets.doorSale.modal.adminNotesPlaceholder')"
                    :aria-label="t('management.tickets.doorSale.modal.adminNotesLabel')"
                    class="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white resize-y"
                  />
                </div>
              </section>

              <!-- Auto check-in -->
              <section>
                <label
                  class="flex items-start gap-3 px-3 py-3 rounded-2xl border bg-white cursor-pointer select-none transition-colors"
                  :class="form.auto_check_in ? 'border-emerald-300' : 'border-slate-200 hover:border-slate-300'"
                >
                  <input
                    v-model="form.auto_check_in"
                    type="checkbox"
                    class="w-4 h-4 mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-2 focus:ring-emerald-500/20 focus:ring-offset-0"
                  />
                  <div class="min-w-0">
                    <p class="text-sm font-medium text-slate-800">
                      {{ t('management.tickets.doorSale.modal.autoCheckInLabel') }}
                    </p>
                    <p class="text-xs text-slate-500 mt-0.5">
                      {{ t('management.tickets.doorSale.modal.autoCheckInHint') }}
                    </p>
                  </div>
                </label>
              </section>

              <!-- Generic error -->
              <div v-if="errorMessage" class="rounded-xl bg-red-50 border border-red-200 p-3">
                <p class="text-sm text-red-800">{{ errorMessage }}</p>
              </div>
            </form>

            <!-- Receipt stage -->
            <div v-else-if="stage === 'receipt' && receiptOrder" class="p-4 sm:p-5 space-y-4 print-receipt">
              <!-- Order summary card -->
              <section
                class="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3 receipt-summary"
              >
                <div class="flex items-start gap-3">
                  <div
                    class="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0"
                  >
                    <CheckCircle2 class="w-5 h-5" />
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="text-[11px] uppercase tracking-wide text-slate-500">
                      {{ t('management.tickets.doorSale.receipt.orderCode') }}
                    </p>
                    <p class="font-mono font-semibold text-slate-900 break-all leading-tight">
                      {{ receiptOrder.confirmation_code }}
                    </p>
                  </div>
                  <span
                    class="text-[11px] font-medium px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700"
                  >
                    {{ t('management.tickets.doorSale.receipt.paid') }}
                  </span>
                </div>

                <div class="grid grid-cols-2 gap-3 text-sm border-t border-slate-100 pt-3">
                  <div>
                    <p class="text-[11px] uppercase tracking-wide text-slate-500">
                      {{ t('management.tickets.doorSale.receipt.paymentType') }}
                    </p>
                    <p class="text-slate-900">{{ receiptPaymentLabel }}</p>
                  </div>
                  <div>
                    <p class="text-[11px] uppercase tracking-wide text-slate-500">
                      {{ t('management.tickets.orders.review.total') }}
                    </p>
                    <p class="text-slate-900 font-semibold tabular-nums">
                      {{ formatCurrency(receiptOrder.total, receiptOrder.currency) }}
                    </p>
                  </div>
                  <div class="col-span-2">
                    <p class="text-[11px] uppercase tracking-wide text-slate-500">
                      {{ t('management.tickets.doorSale.receipt.buyer') }}
                    </p>
                    <p class="text-slate-900 truncate">
                      {{ receiptOrder.buyer_name || receiptOrder.buyer_email || t('management.tickets.doorSale.receipt.anonymousBuyer') }}
                    </p>
                  </div>
                </div>
              </section>

              <!-- Tickets -->
              <section>
                <header class="flex items-center justify-between mb-2">
                  <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    {{ t('management.tickets.doorSale.receipt.ticketsHeader') }}
                  </h3>
                  <span class="text-xs text-slate-500 tabular-nums">
                    {{ t('management.tickets.doorSale.receipt.ticketsCount',
                        { count: receiptOrder.tickets.length },
                        receiptOrder.tickets.length) }}
                  </span>
                </header>
                <p class="text-xs text-slate-500 mb-3 print:hidden">
                  {{ t('management.tickets.doorSale.receipt.qrCaption') }}
                </p>

                <ul class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <li
                    v-for="(ticket, idx) in receiptOrder.tickets"
                    :key="ticket.id"
                    class="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col receipt-ticket"
                  >
                    <div class="px-3 py-2 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white flex items-center justify-between gap-2">
                      <div class="min-w-0">
                        <p class="text-[10px] uppercase tracking-wide text-white/80 leading-tight">
                          #{{ idx + 1 }}
                        </p>
                        <p class="text-sm font-semibold leading-tight truncate">
                          {{ ticket.ticket_type.name }}
                        </p>
                      </div>
                      <span
                        class="text-[10px] font-medium px-2 py-0.5 rounded-lg flex-shrink-0"
                        :class="ticket.status === 'used'
                          ? 'bg-white/25 text-white'
                          : 'bg-white text-emerald-700'"
                      >
                        {{ ticket.status === 'used'
                            ? t('management.tickets.doorSale.receipt.checkedInBadge')
                            : t('management.tickets.doorSale.receipt.validBadge') }}
                      </span>
                    </div>
                    <div class="p-3 flex flex-col items-center text-center gap-2.5">
                      <div class="w-36 h-36 bg-slate-50 rounded-xl flex items-center justify-center p-2">
                        <img
                          v-if="qrDataUrls[ticket.id]"
                          :src="qrDataUrls[ticket.id]"
                          alt=""
                          class="w-full h-full object-contain"
                        />
                        <div
                          v-else-if="qrErrors[ticket.id]"
                          class="text-[11px] text-slate-400 px-2"
                        >
                          {{ t('management.tickets.doorSale.receipt.qrUnavailable') }}
                        </div>
                        <div
                          v-else
                          class="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"
                        />
                      </div>
                      <div>
                        <p class="text-[10px] uppercase tracking-wide text-slate-500">
                          {{ t('management.tickets.doorSale.receipt.checkInCodeLabel') }}
                        </p>
                        <p class="font-mono text-sm font-bold text-slate-900 tracking-widest">
                          {{ ticket.check_in_code }}
                        </p>
                      </div>
                    </div>
                  </li>
                </ul>
              </section>
            </div>
          </div>

          <!-- Footer -->
          <div
            v-if="stage === 'form' && (!loadingTiers && activeTiers.length > 0)"
            class="flex-shrink-0 border-t border-slate-200 bg-white print:hidden"
          >
            <!-- Summary row -->
            <div class="px-4 pt-3 pb-2 flex items-center justify-between gap-3">
              <div class="min-w-0">
                <p class="text-[10px] uppercase tracking-wide text-slate-500">
                  {{ t('management.tickets.doorSale.modal.summaryHeader') }}
                </p>
                <p class="text-xs text-slate-600 tabular-nums">
                  {{ t('management.tickets.doorSale.modal.summaryItems',
                      { count: totalTickets },
                      totalTickets) }}
                </p>
              </div>
              <div class="text-right">
                <p class="text-[10px] uppercase tracking-wide text-slate-500">
                  {{ t('management.tickets.doorSale.modal.summaryTotal') }}
                </p>
                <p class="text-base font-bold text-slate-900 tabular-nums">
                  {{ formatCurrency(grandTotal, currentCurrency || 'USD') }}
                </p>
              </div>
            </div>
            <div class="flex items-center justify-end gap-2 px-4 pb-3">
              <button
                type="button"
                class="px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                :disabled="submitting"
                @click="handleBackdrop"
              >
                {{ t('management.tickets.doorSale.modal.cancel') }}
              </button>
              <button
                type="button"
                class="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="submitting || totalTickets === 0"
                @click="handleSubmit"
              >
                <span
                  v-if="submitting"
                  class="w-4 h-4 animate-spin border-2 border-white border-t-transparent rounded-full"
                />
                <CheckCircle2 v-else class="w-4 h-4" />
                <span>{{ submitting
                    ? t('management.tickets.doorSale.modal.submitting')
                    : t('management.tickets.doorSale.modal.submit') }}</span>
              </button>
            </div>
          </div>

          <!-- Receipt footer actions -->
          <div
            v-else-if="stage === 'receipt' && receiptOrder"
            class="flex-shrink-0 border-t border-slate-200 bg-white print:hidden"
          >
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3">
              <button
                type="button"
                class="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-medium border border-slate-200 hover:border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
                @click="printReceipt"
              >
                <Printer class="w-4 h-4" />
                <span class="hidden sm:inline">{{ t('management.tickets.doorSale.receipt.actions.print') }}</span>
              </button>
              <button
                type="button"
                class="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-medium border border-slate-200 hover:border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
                @click="viewOrder"
              >
                <ExternalLink class="w-4 h-4" />
                <span class="hidden sm:inline">{{ t('management.tickets.doorSale.receipt.actions.viewOrder') }}</span>
              </button>
              <button
                type="button"
                class="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-medium border border-emerald-200 text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                @click="startNewSale"
              >
                <Plus class="w-4 h-4" />
                <span>{{ t('management.tickets.doorSale.receipt.actions.newSale') }}</span>
              </button>
              <button
                type="button"
                class="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-semibold bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white rounded-lg hover:opacity-90 transition-opacity shadow-md"
                @click="closeFromReceipt"
              >
                <Check class="w-4 h-4" />
                <span>{{ t('management.tickets.doorSale.receipt.actions.done') }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  X,
  Receipt,
  CheckCircle2,
  Plus,
  Minus,
  Ticket,
  Banknote,
  CreditCard,
  Wallet,
  Printer,
  ExternalLink,
  Check,
} from 'lucide-vue-next'
import { useAppLanguage } from '@/composables/useAppLanguage'
import {
  ticketTypesService,
  ticketOrdersService,
  type TicketType,
  type TicketOrderDetail,
  type DoorSaleRequest,
  type DoorPaymentType,
  type CreateTicketOrderItem,
} from '@/services/api'
import { formatCurrency, type CurrencyCode } from '@/utils/currency'
import { renderTicketQrDataUrl } from '@/utils/qrcode'

interface Props {
  show: boolean
  eventId: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  saleCompleted: [order: TicketOrderDetail]
  message: [type: 'success' | 'error', text: string]
}>()

const { t } = useAppLanguage()
const router = useRouter()

// ---------------------------------------------------------------- state
type Stage = 'form' | 'receipt'

const stage = ref<Stage>('form')

// Form
const tiers = ref<TicketType[]>([])
const loadingTiers = ref(false)
const quantities = reactive<Record<number, number>>({})
const form = reactive<{
  buyer_name: string
  buyer_email: string
  buyer_phone: string
  door_payment_type: DoorPaymentType
  transaction_reference: string
  admin_notes: string
  auto_check_in: boolean
}>({
  buyer_name: '',
  buyer_email: '',
  buyer_phone: '',
  door_payment_type: 'cash',
  transaction_reference: '',
  admin_notes: '',
  auto_check_in: true,
})

const fieldErrors = ref<{
  items?: string
  email?: string
}>({})
const errorMessage = ref('')
const submitting = ref(false)

// Receipt
const receiptOrder = ref<TicketOrderDetail | null>(null)
const qrDataUrls = ref<Record<string, string>>({})
const qrErrors = ref<Record<string, boolean>>({})

// ---------------------------------------------------------------- derived
const activeTiers = computed(() =>
  tiers.value
    .filter((tier) => tier.is_active)
    .sort(
      (a, b) =>
        (a.display_order ?? 0) - (b.display_order ?? 0) ||
        (a.name ?? '').localeCompare(b.name ?? ''),
    ),
)

const selectedItems = computed(() =>
  activeTiers.value
    .map((tier) => ({ tier, qty: quantities[tier.id] ?? 0 }))
    .filter(({ qty }) => qty > 0),
)

const totalTickets = computed(() =>
  selectedItems.value.reduce((sum, { qty }) => sum + qty, 0),
)

const currentCurrency = computed<CurrencyCode | null>(() => {
  const first = selectedItems.value[0]
  return first ? first.tier.currency : null
})

const grandTotal = computed(() => {
  return selectedItems.value.reduce((sum, { tier, qty }) => {
    const unit = parseFloat(tier.price)
    return Number.isFinite(unit) ? sum + unit * qty : sum
  }, 0)
})

/**
 * A tier is in conflict when the user has already added something in a
 * different currency. We disable its `+` button and show an amber chip so
 * the staff can see why before tapping.
 */
const currencyConflict = (tier: TicketType): boolean => {
  return (
    currentCurrency.value !== null && tier.currency !== currentCurrency.value
  )
}

const canIncrement = (tier: TicketType): boolean => {
  if (currencyConflict(tier)) return false
  if (tier.quantity_remaining <= 0) return false
  const qty = quantities[tier.id] ?? 0
  if (qty >= tier.quantity_remaining) return false
  if (tier.max_per_order && qty >= tier.max_per_order) return false
  return true
}

const receiptPaymentLabel = computed(() => {
  const code = receiptOrder.value?.door_payment_type
  if (!code) return t('management.tickets.orders.review.doorPaymentTypes.cash')
  return t(`management.tickets.orders.review.doorPaymentTypes.${code}`)
})

const receiptSubtitle = computed(() => {
  if (!receiptOrder.value) return ''
  const checkedIn = receiptOrder.value.tickets.some(
    (ticket) => ticket.status === 'used',
  )
  return checkedIn
    ? t('management.tickets.doorSale.receipt.subtitleCheckedIn')
    : t('management.tickets.doorSale.receipt.subtitleIssued')
})

// ---------------------------------------------------------------- helpers
const increment = (tier: TicketType) => {
  if (!canIncrement(tier)) return
  // Reset state if user is staring at a stale error
  fieldErrors.value = {}
  errorMessage.value = ''
  quantities[tier.id] = (quantities[tier.id] ?? 0) + 1
}

const decrement = (tier: TicketType) => {
  const qty = quantities[tier.id] ?? 0
  if (qty <= 0) return
  fieldErrors.value = {}
  errorMessage.value = ''
  quantities[tier.id] = qty - 1
  if (quantities[tier.id] === 0) {
    delete quantities[tier.id]
  }
}

const isValidEmail = (value: string): boolean => {
  // Light client-side check; backend does the real validation.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

const resetForm = () => {
  for (const key of Object.keys(quantities)) {
    delete quantities[Number(key)]
  }
  Object.assign(form, {
    buyer_name: '',
    buyer_email: '',
    buyer_phone: '',
    door_payment_type: 'cash' as DoorPaymentType,
    transaction_reference: '',
    admin_notes: '',
    auto_check_in: true,
  })
  fieldErrors.value = {}
  errorMessage.value = ''
}

const resetReceipt = () => {
  receiptOrder.value = null
  qrDataUrls.value = {}
  qrErrors.value = {}
}

// ---------------------------------------------------------------- load
const loadTiers = async () => {
  loadingTiers.value = true
  try {
    const response = await ticketTypesService.list(props.eventId)
    if (response.success && response.data) {
      tiers.value = response.data
    } else {
      tiers.value = []
      errorMessage.value =
        response.message || t('management.tickets.doorSale.modal.loadFailed')
    }
  } catch {
    tiers.value = []
    errorMessage.value = t('management.tickets.doorSale.modal.loadFailed')
  } finally {
    loadingTiers.value = false
  }
}

// ---------------------------------------------------------------- submit
const handleSubmit = async () => {
  if (submitting.value) return
  fieldErrors.value = {}
  errorMessage.value = ''

  if (totalTickets.value === 0) {
    fieldErrors.value.items = t(
      'management.tickets.doorSale.modal.validation.noItems',
    )
    return
  }

  // Mixed-currency guard (UI prevents incrementing, but check anyway).
  const currencies = new Set(selectedItems.value.map(({ tier }) => tier.currency))
  if (currencies.size > 1) {
    fieldErrors.value.items = t(
      'management.tickets.doorSale.modal.validation.mixedCurrency',
    )
    return
  }

  // Per-tier remaining + max_per_order guards.
  for (const { tier, qty } of selectedItems.value) {
    if (qty > tier.quantity_remaining) {
      fieldErrors.value.items = t(
        'management.tickets.doorSale.modal.validation.exceedsRemaining',
        { count: tier.quantity_remaining, tier: tier.name },
      )
      return
    }
    if (tier.max_per_order && qty > tier.max_per_order) {
      fieldErrors.value.items = t(
        'management.tickets.doorSale.modal.validation.exceedsMaxPerOrder',
        { count: tier.max_per_order, tier: tier.name },
      )
      return
    }
  }

  // Email is optional, but reject obviously broken values so the receipt /
  // backend doesn't carry junk.
  const email = form.buyer_email.trim()
  if (email && !isValidEmail(email)) {
    fieldErrors.value.email = t(
      'management.tickets.doorSale.modal.validation.emailInvalid',
    )
    return
  }

  const items: CreateTicketOrderItem[] = selectedItems.value.map(
    ({ tier, qty }) => ({ ticket_type_id: tier.id, quantity: qty }),
  )

  // Only include optional fields when populated — keeps the request body tidy
  // and lets the backend serializer apply its own defaults.
  const payload: DoorSaleRequest = {
    items,
    door_payment_type: form.door_payment_type,
    auto_check_in: form.auto_check_in,
  }
  const name = form.buyer_name.trim()
  if (name) payload.buyer_name = name
  if (email) payload.buyer_email = email
  const phone = form.buyer_phone.trim()
  if (phone) payload.buyer_phone = phone
  const ref = form.transaction_reference.trim()
  if (ref) payload.transaction_reference = ref
  const notes = form.admin_notes.trim()
  if (notes) payload.admin_notes = notes

  submitting.value = true
  try {
    const response = await ticketOrdersService.createDoorSale(
      props.eventId,
      payload,
    )
    if (response.success && response.data) {
      receiptOrder.value = response.data
      stage.value = 'receipt'
      void renderQrCodes(response.data)
      emit('saleCompleted', response.data)
    } else {
      // Surface server-side field errors when the API returns them.
      const fieldFromServer = (response.errors ?? {}) as Record<string, string[]>
      const firstFieldMessage = Object.values(fieldFromServer)[0]?.[0]
      errorMessage.value =
        firstFieldMessage ||
        response.message ||
        t('management.tickets.doorSale.modal.submitFailed')
    }
  } catch {
    errorMessage.value = t('management.tickets.doorSale.modal.submitFailed')
  } finally {
    submitting.value = false
  }
}

// ---------------------------------------------------------------- QR codes
const renderQrCodes = async (order: TicketOrderDetail) => {
  // Fan out: render each QR independently so a single failure doesn't block
  // the rest. Errors are recorded per-ticket and the UI falls back to the
  // short check-in code.
  await Promise.all(
    order.tickets.map(async (ticket) => {
      if (!ticket.qr_code) {
        qrErrors.value[ticket.id] = true
        return
      }
      try {
        qrDataUrls.value[ticket.id] = await renderTicketQrDataUrl(
          ticket.qr_code,
          { width: 220 },
        )
      } catch {
        qrErrors.value[ticket.id] = true
      }
    }),
  )
}

// ---------------------------------------------------------------- actions
const startNewSale = () => {
  stage.value = 'form'
  resetReceipt()
  resetForm()
}

const closeFromReceipt = () => {
  emit('close')
}

const printReceipt = () => {
  if (typeof window !== 'undefined') {
    window.print()
  }
}

const viewOrder = () => {
  if (!receiptOrder.value) return
  emit('close')
  router.push({
    path: router.currentRoute.value.path,
    query: {
      ...router.currentRoute.value.query,
      tab: 'tickets',
      sub: 'orders',
      order: receiptOrder.value.confirmation_code,
    },
  })
}

const handleBackdrop = () => {
  if (submitting.value) return
  emit('close')
}

// ---------------------------------------------------------------- lifecycle
// Open transition: when the parent flips `show` from false to true, reset
// state and kick off the tier fetch. Wrap loadTiers in catch to prevent any
// unhandled rejection from bubbling out of the watch.
watch(
  () => props.show,
  (show, prev) => {
    if (!show || prev) return
    stage.value = 'form'
    resetForm()
    resetReceipt()
    loadTiers().catch(() => {
      errorMessage.value = t(
        'management.tickets.doorSale.modal.loadFailed',
      )
    })
  },
)
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.35s ease-out;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active {
  transition: transform 0.4s cubic-bezier(0.32, 0.72, 0, 1);
}
.slide-up-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.6, 1);
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}

@media (min-width: 768px) {
  .slide-up-enter-active,
  .slide-up-leave-active {
    transition: all 0.3s ease;
  }
  .slide-up-enter-from,
  .slide-up-leave-to {
    opacity: 0;
    transform: scale(0.95) translateY(0);
  }
}

</style>

<!--
  Print stylesheet kept un-scoped so it can match the Teleport'd siblings of
  body (anything that isn't the receipt panel). Scoped CSS rewrites class
  selectors with a hash that won't match the user's existing page chrome.
-->
<style>
@media print {
  body > *:not(.door-sale-shell) {
    display: none !important;
  }
  .door-sale-shell {
    position: static !important;
    background: #fff !important;
  }
  .door-sale-shell .print\:hidden {
    display: none !important;
  }
  .receipt-summary,
  .receipt-ticket {
    page-break-inside: avoid;
  }
}
</style>
