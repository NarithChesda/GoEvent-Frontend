<template>
  <div
    class="footer-card-container showcase-footer relative w-full px-6 py-6 text-center"
    :class="`showcase-footer--${design}`"
    :style="rootStyle"
  >
    <!-- The invitation's footer: the partner's mark, ours, the social links
         and the address, in one of four designs (footerDesign.ts). The page it
         sits on, its height and its snap, belong to MainContentStage; this is
         only what is printed on it.

         This comment is inside the root on purpose. Above it, a dev build
         keeps the comment as a second root node, and a fragment root does not
         take the parent's scope attribute, which is what the next point needs.

         `footer-card-container` is kept as the root's class because the
         stage's ink edge exempts it by that name (MainContentStage's
         `.stage-scroll--ink-edge .footer-card-container`): the footer is set in
         its own inks and never takes the text edge. -->

    <!-- The band's top highlight, the one piece of the glass band that is not
         a colour. -->
    <div
      v-if="design === 'glass'"
      class="absolute top-0 left-0 right-0 h-px"
      :style="{
        background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.12), transparent)',
      }"
    ></div>

    <!-- The paper, for `card`. Every other design leaves it as a plain box, so
         the lockup is the same element under all four and the reveal never has
         to know which design it is revealing. -->
    <div class="footer-surface">
      <!-- One centred group: the marks, the social row and the address read as
           a single object rather than three stacked bands. Every gap is
           vh-clamped so a short phone tightens the whole lockup together
           instead of one band collapsing before the others. -->
      <div
        :ref="lockupRef"
        class="footer-lockup flex flex-col items-center justify-center gap-[clamp(14px,2.6vh,22px)]"
      >
        <!-- The marks: partner above the collaboration sign above ours. Every
             row is --fm-w wide (the social row's own width) so the lockup has
             one measure and one centre line top to bottom. Gaps here are
             tighter than the group's, so the rows bind into one lockup instead
             of reading as three. -->
        <div class="flex flex-col items-center gap-[clamp(5px,1vh,10px)]">
          <!-- Partner mark: the box is ours, the ratio is theirs -->
          <div v-if="partnerLogoUrl" class="footer-mark partner-mark">
            <img :src="partnerLogoUrl" :alt="partnerName || 'Partner'" />
          </div>

          <!-- ...or the slot that mark will fill. A shop reading a preview is
               being sold this exact spot, so it has to be on screen before they
               have uploaded anything; but a guest opening a real invitation
               must never meet a placeholder, so the parent turns this on for
               the public catalogue only. -->
          <div v-else-if="showPartnerSlot" class="partner-mark">
            <svg class="partner-slot-mark" viewBox="0 0 200 44">
              <text
                x="100"
                y="33"
                text-anchor="middle"
                font-size="42"
                lengthAdjust="spacing"
                :textLength="appLocale === 'kh' ? undefined : 200"
                :style="{ fontFamily: font }"
              >
                {{ tApp('management.showcasePreview.editors.partnerLogoSlot') }}
              </text>
            </svg>
          </div>

          <!-- The mark that joins the two. Drawn, not typed: the font here is
               template-driven, and a display or Khmer face renders a glyph at an
               unpredictable size and baseline offset, so it would sit off-centre
               in its row under some templates and not others. Geometry centres
               on itself. -->
          <div v-if="partnerLogoUrl || showPartnerSlot" class="collab-ornament" aria-hidden="true">
            <span class="collab-rule collab-rule--left"></span>
            <span class="collab-gem"></span>
            <span class="collab-rule collab-rule--right"></span>
          </div>

          <!-- GoEvent mark -->
          <a href="/" class="footer-mark inline-flex max-w-full items-center justify-center">
            <svg viewBox="0 0 222.09 69.13" class="goevent-mark">
              <g>
                <g>
                  <path
                    d="m22.12,44.61l-1.97,5.42c.1.01,8.13.02,16.93.03v.02c-2.32,5.37-8.06,8.94-14.44,7.93-6.32-1-11.27-6.28-11.78-12.66-.68-8.24,5.84-15.16,13.94-15.16h22.63c3.37,0,6.39-2.08,7.58-5.23l2.1-5.56H24.8C10.68,19.4-.73,31.26.04,45.55c.63,11.63,9.48,21.38,20.99,23.14,13.09,2,24.65-6.62,27.31-18.55h0s.02-.07.02-.07c2.2,0,4.23,0,5.95,0,3.36,0,6.38-2.09,7.57-5.24l2.11-5.56H29.73c-3.41,0-6.45,2.14-7.61,5.34Z"
                  />
                  <path
                    d="m54.3,10.8c3.37,0,6.39-2.08,7.58-5.24l2.11-5.57H29.74c-3.41,0-6.45,2.13-7.62,5.34l-1.97,5.43c.19.03.39.04.58.04h33.58Z"
                  />
                </g>
                <path
                  d="m126.05,42.59c-1.44-1.1-3.4-1.8-5.87-2.13-1.06-.15-2.22-.21-3.47-.21-4.17,0-7.29.77-9.35,2.34-2.06,1.55-3.1,3.74-3.1,6.53v1.02c0,1.66,1.34,3,3,3h5.33s0,0,0,0h1.56c.85,0,1.61-.53,1.9-1.33h0s.4-1.11.4-1.11l.84-2.33h-4.67c.1-.76.43-1.36.97-1.83.68-.57,1.72-.86,3.1-.86.56,0,1.07.05,1.52.14.65.14,1.18.38,1.58.72.67.57,1.01,1.37,1.01,2.4v1.19c0,1.66,1.34,3,3,3h5.33v-4.03c0-2.79-1.04-4.98-3.11-6.53Zm-13.45,6.95h0s0-.59,0-.59c0-.01,0-.02,0-.03v.62Z"
                />
                <path
                  d="m125.46,56.22h-4.65v4.2c0,1.02-.33,1.82-1.01,2.39-.67.58-1.71.86-3.09.86s-2.42-.28-3.1-.86c-.68-.57-1.01-1.37-1.01-2.39v-.51c0-2.05-1.66-3.7-3.7-3.7h-4.64v4.03c0,2.8,1.04,4.98,3.1,6.54,2.06,1.55,5.18,2.34,9.35,2.34s7.28-.78,9.35-2.34c2.06-1.56,3.1-3.74,3.1-6.54v-.33c0-2.05-1.66-3.7-3.7-3.7Z"
                />
                <path
                  d="m154.22,60.63v8.49h4.7c2.43,0,4.41-1.97,4.41-4.41v-8.49h-4.7c-2.43,0-4.41,1.97-4.41,4.41Z"
                />
                <path
                  d="m159.37,5.6h-2.79v5.09h-.25c-.7-.94-1.6-1.8-2.7-2.58-1.1-.76-2.38-1.38-3.82-1.83-1.44-.45-3.06-.68-4.84-.68-3.03,0-5.36.71-7.02,2.1-1.65,1.4-2.48,3.2-2.48,5.41,0,2.05.72,3.58,2.17,4.59,1.45,1.01,3.58,1.51,6.39,1.51h20v-8.95c0-2.58-2.09-4.66-4.66-4.66Zm-12.73,9.65c-.83,0-1.44-.15-1.83-.44-.39-.3-.6-.7-.6-1.22,0-.56.22-.98.65-1.3.43-.32,1.18-.48,2.21-.48s2.05.17,3.16.5c1.13.34,2.17.77,3.17,1.27,1,.52,1.76,1.06,2.3,1.66h-9.07Z"
                />
                <path
                  d="m187.1,19.21v-1.84c0-1.85-.57-3.67-1.67-5.16,0,0-.02-.02-.02-.03-.78-1.07-1.76-2.10-2.93-3.11-1.18-1.01-2.5-1.84-3.96-2.48-1.47-.65-3.07-.98-4.80-.98-2.55,0-4.45.73-5.69,2.19-1.24,1.46-1.87,3.25-1.87,5.39,0,2.01.53,3.52,1.59,4.53,1.05,1.01,2.63,1.51,4.69,1.51h14.66Zm-13.51-7.07c.32-.34.76-.5,1.3-.5.51,0,1.06.1,1.66.29.6.2,1.18.47,1.76.81.58.33,1.12.72,1.63,1.15.51.43.93.87,1.27,1.30h-6.48c-.52,0-.91-.15-1.2-.48-.29-.31-.43-.72-.43-1.24,0-.55.16-.99.48-1.33Z"
                />
                <path
                  d="m196.47,39.93c1.63,1,3.61,1.84,5.91,2.51,2.31.67,4.9,1.22,7.78,1.65v2.13c0,.94-.34,1.68-1.01,2.21-.63.51-1.43.76-2.4.8h-5.18c0-.29-.04-.58-.1-.85-.1-.54-.31-1.04-.58-1.5h0c-.22-.39-.48-.72-.78-1.02-.16-.17-.35-.33-.54-.48-.19-.15-.39-.27-.61-.39-.14-.07-.3-.14-.44-.21-.15-.06-.31-.12-.47-.17-.47-.14-.97-.23-1.49-.23h-4.45v7.42c0,2.11,1.71,3.83,3.83,3.83h5.64s4.21,0,4.21,0c0,0,0,0,0,0h8.49c1.2-.37,2.23-.93,3.09-1.66,1.39-1.18,2.25-2.75,2.54-4.70.09-.53.13-1.10.13-1.68v-8.58c-3.71-.39-6.96-.86-9.76-1.39-2.8-.53-4.99-1.32-6.56-2.37-1.58-1.05-2.37-2.49-2.37-4.35,0-1.5.46-2.66,1.38-3.49.93-.83,2.16-1.25,3.7-1.25,1.3,0,2.31.24,3.04.72.27.18.51.38.68.6.28.35.42.77.42,1.22s-.16.86-.48,1.16c-.07.06-.14.12-.21.17-.65.43-1.07,1.13-1.34,1.87l-1.11,3.06v.02s.02,0,.02,0c.43.15,1.05.29,1.84.41.81.11,1.63.18,2.45.18,1.55,0,2.89-.2,4.05-.59.87-.29,1.63-.68,2.28-1.19,1.55-1.18,2.31-2.98,2.31-5.38,0-3-1.23-5.29-3.7-6.86-1.08-.69-2.34-1.23-3.8-1.62-1.88-.5-4.07-.75-6.59-.75-4.45,0-8.05.93-10.79,2.78-2.74,1.85-4.11,4.75-4.11,8.70,0,2.13.43,3.95,1.30,5.47.87,1.52,2.12,2.78,3.76,3.79Z"
                />
                <path
                  d="m113.67,29.22c3.05,0,5.1,1.55,5.1,3.86,0,2,1.38,3.79,3.34,4.18,2.42.48,4.41,1.33,6.04,2.56.23.17.45.35.66.54v-7.28c0-7.92-6.51-13.9-15.14-13.9h-8.3c-7.68,0-13.9,6.23-13.9,13.9v19.07c0,1.57-1.28,2.85-2.85,2.85h-5.49c-1.57,0-2.85-1.28-2.85-2.85v-27.83c0-2.77-2.25-5.02-5.02-5.02h-5.02v32.85c0,7.12,5.77,12.89,12.89,12.89h5.49c5.63,0,10.43-3.63,12.18-8.67.46-1.32.71-2.74.71-4.22v-19.08c0-2.13,1.73-3.86,3.86-3.86h8.3Z"
                />
                <path
                  d="m145.57,27.42c0-2.77-2.25-5.02-5.02-5.02h-5.03v42.39c.78.18,1.64.27,2.6.27,2.8,0,4.74-.36,5.82-1.09,1.09-.73,1.63-1.7,1.63-2.93v-15.29h2.96c1.33,0,2.51-.83,2.96-2.08l2.47-6.81h-8.4s0-5.26,0-9.44Z"
                />
                <path
                  d="m159.01,22.4h-5.04v14.45h0v6.15h0v9.88c.78.18,1.64.27,2.6.27,2.92,0,4.89-.38,5.92-1.15,1.02-.77,1.54-1.72,1.54-2.87v-19.92s0-.76,0-1.78c0-2.77-2.25-5.02-5.02-5.02Z"
                />
                <path
                  d="m185.09,41.1c0-1.38-.45-2.51-1.36-3.4-.91-.89-2.31-1.57-4.20-2.04v-1.69c0-.71.32-1.06.95-1.06h.36l2.49.59h.53c1.02,0,1.82-.27,2.4-.8.57-.53.86-1.33.86-2.4v-2.88c0-2.77-2.25-5.02-5.02-5.02h-3.5v3.11h-3.85c-2.25,0-3.37,1.32-3.37,3.96v7.9c.75.16,1.4.38,1.95.68.55.3.98.67,1.27,1.13.30.45.45,1.01.45,1.69v5.24c-2.86,0-5.17,2.36-5.09,5.25.08,2.79,2.51,4.93,5.30,4.93h3.42c4.28-.14,6.42-1.47,6.42-4.02v-11.16Z"
                />
                <path
                  d="m173.05,63.68h1.92c.5,0,.94-.31,1.12-.77l.28-.74h-3.39c-2.11,0-3.79,1.89-3.43,4.07.23,1.4,1.33,2.54,2.72,2.83,2.18.44,4.1-1.22,4.1-3.32v-.78h-2.79c-.5,0-.94.31-1.12.77l-.27.71s.01.02.02.04h2.49c-.29.67-.95,1.14-1.73,1.14-1.13,0-2.04-.95-1.96-2.10.07-1.04.98-1.83,2.03-1.83Z"
                />
                <path
                  d="m184.78,65.76c.07.36.41.61.77.61h2.81c.47,0,.9-.3,1.06-.74l.28-.78h-4.18c-.47,0-.84.42-.74.91Z"
                />
                <path
                  d="m190.4,62.94l.28-.78h-5.15c-.47,0-.84.42-.74.91.07.36.41.61.77.61h3.78c.47,0,.9-.3,1.06-.74Z"
                />
                <path
                  d="m185.53,67.61c-.47,0-.84.43-.74.91.07.36.41.61.77.61h4.27c.47,0,.89-.29,1.06-.73l.28-.76s-.01-.02-.02-.03h-5.62Z"
                />
                <path
                  d="m180.57,62.16c-.06,0-.14,0-.20,0-1.10.06-2.08.64-2.67,1.51-.39.56-.61,1.23-.61,1.96,0,1.92,1.56,3.48,3.48,3.48s3.49-1.56,3.49-3.48-1.56-3.49-3.49-3.49Zm0,5.45c-1.08,0-1.96-.89-1.96-1.96s.88-1.96,1.96-1.96,1.97.88,1.97,1.96-.89,1.96-1.97,1.96Z"
                />
                <path
                  d="m200.53,65.76c.07.36.41.61.77.61h2.81c.47,0,.9-.3,1.06-.74l.28-.78h-4.18c-.47,0-.84.42-.74.91Z"
                />
                <path
                  d="m206.14,62.94l.28-.78h-5.15c-.47,0-.84.42-.74.91.07.36.41.61.77.61h3.78c.47,0,.9-.3,1.06-.74Z"
                />
                <path
                  d="m201.27,67.61c-.47,0-.84.43-.74.91.07.36.41.61.77.61h4.27c.47,0,.89-.29,1.06-.73l.28-.76s-.01-.02-.02-.03h-5.62Z"
                />
                <path
                  d="m198.58,62.15c-.45,0-.85.25-1.05.65l-1.3,2.6-.64,1.27-1.93-3.87c-.2-.4-.61-.65-1.05-.65h-.97v.02s.56,1.10.56,1.10l2.72,5.43c.13.26.39.42.68.42,0,0,0,0,0,0,.03,0,.06,0,.08,0,.26-.03.48-.19.6-.42l3.22-6.44s-.03-.05-.06-.09h-.86Z"
                />
                <path
                  d="m222.06,62.16h-5.03c-.49,0-.93.31-1.10.77l-.27.75s0,0,0,0h2.47v4.66c0,.37.25.70.61.77.48.09.91-.28.91-.74v-4.69h.95c.57,0,1.08-.36,1.28-.90l.21-.57s-.02-.03-.04-.05Z"
                />
                <path
                  d="m213.45,63.43c0,1.29,0,3.11,0,3.11l-1.99-1.99h0s-2.15-2.15-2.15-2.15c-.15-.15-.34-.23-.54-.23-.11,0-.22.02-.33.07-.28.13-.44.43-.44.74v6.14s0,0,0,0h.24c.71,0,1.28-.57,1.28-1.28v-3.10l2.13,2.13,2.02,2.02c.15.14.34.22.53.22.14,0,.27-.04.40-.11.24-.14.37-.41.37-.69v-6.17h-.24c-.71,0-1.28.57-1.28,1.28Z"
                />
              </g>
            </svg>
          </a>
        </div>

        <!-- Social links. The icons draw in `currentColor`, so each design only
             has to set `--ft-ink`. -->
        <div class="social-row flex flex-wrap items-center justify-center">
          <a
            v-for="link in SOCIAL_LINKS"
            :key="link.label"
            :href="link.href"
            target="_blank"
            rel="noopener noreferrer"
            class="social-btn flex items-center justify-center rounded-full"
            :aria-label="link.label"
          >
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path :d="link.path" />
            </svg>
          </a>
        </div>

        <!-- Address -->
        <div
          class="footer-address inline-flex items-center justify-center px-2 leading-none"
          :style="{ fontFamily: font }"
        >
          www.goevent.online
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, type VNodeRef } from 'vue'
import type { FooterDesignType } from '@/services/api/types/template.types'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { inkOnPaper, type StationeryPaper } from '../stationery'

const props = defineProps<{
  design: FooterDesignType
  /** The template's ink (its primary colour). */
  ink: string
  /** The glass band's colour: the template's background, else its ink. */
  band: string
  /** The invitation's one paper (stationery.ts), for `card`. */
  paper: StationeryPaper
  /** The face the address and the logo slot are set in. */
  font?: string
  /** The partner's mark, or null when there is none to draw. */
  partnerLogoUrl?: string | null
  partnerName?: string | null
  /** Draw the slot a partner's mark would fill (the public catalogue only). */
  showPartnerSlot?: boolean
  /**
   * The lockup's element, handed back to MainContentStage, whose reveal
   * observer watches every section and adds `is-visible` to this one too. A
   * function ref, so it is set while this component is patched, before the
   * stage's own `mounted` runs its first observation pass.
   */
  lockupRef?: VNodeRef
}>()

const { t: tApp, locale: appLocale } = useAppLanguage()

const SOCIAL_LINKS = [
  {
    label: 'Telegram',
    href: 'https://t.me/goeventkh',
    path: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z',
  },
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/profile.php?id=61581851850221',
    path: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/goevent.online/',
    path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z',
  },
  {
    label: 'TikTok',
    href: 'https://www.tiktok.com/@goevent.online',
    path: 'M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z',
  },
] as const

/**
 * Everything a design changes, as variables on the root, so the markup is one
 * lockup for all four and each design is a set of values plus a little CSS.
 *
 * `plain` and `glass` reproduce the two looks the Liquid Glass switch used to
 * pick, value for value: a template that falls back to one of them renders
 * exactly as it did. Two details of the old glass look are kept on purpose
 * because they are what it rendered, not what it said:
 *
 * - Its band carried a `backdrop-blur-16` class that no stylesheet defines
 *   (Tailwind's scale has no `16`), so the band never blurred. It is a tint.
 * - Its partner mark had `brightness-110` beside an inline `filter`; the
 *   inline value replaced the whole `filter` property, so only the shadow drew.
 *
 * The `${ink}20`-style colours are an 8-digit hex built from a 6-digit one, as
 * they were before; the two new designs use `color-mix` instead.
 */
const rootStyle = computed((): Record<string, string> => {
  const { design, ink, band, paper } = props
  switch (design) {
    case 'glass':
      return {
        background: `${band}90`,
        boxShadow: `0 12px 36px -6px ${band}25, 0 6px 24px -3px ${band}20, 0 3px 12px -1px ${band}15, inset 0 1px 2px rgba(255, 255, 255, 0.2)`,
        '--ft-ink': '#ffffff',
        '--ft-btn-bg': 'rgba(255, 255, 255, 0.2)',
        '--ft-btn-bg-hover': 'rgba(255, 255, 255, 0.3)',
        '--ft-mark-filter': 'drop-shadow(0 2px 8px rgba(255, 255, 255, 0.25))',
        '--ft-logo-filter': 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.15))',
      }
    case 'card':
      return {
        '--ft-ink': inkOnPaper(ink, paper.paper),
        '--ft-paper': paper.paper,
        '--ft-radius': `${paper.radius}px`,
        '--ft-shadow': paper.shadow,
        '--ft-btn-bg': 'color-mix(in srgb, var(--ft-ink) 9%, transparent)',
        '--ft-btn-bg-hover': 'color-mix(in srgb, var(--ft-ink) 16%, transparent)',
        '--ft-mark-filter': 'none',
        '--ft-logo-filter': 'none',
      }
    case 'minimal':
      return {
        '--ft-ink': ink,
        '--ft-btn-bg': 'transparent',
        '--ft-btn-bg-hover': 'color-mix(in srgb, var(--ft-ink) 10%, transparent)',
        '--ft-mark-filter': 'none',
        '--ft-logo-filter': 'none',
      }
    default:
      return {
        background: 'none',
        '--ft-ink': ink,
        '--ft-btn-bg': `${ink}20`,
        '--ft-btn-bg-hover': `${ink}20`,
        '--ft-mark-filter': `drop-shadow(0 2px 8px ${ink}40)`,
        '--ft-logo-filter': `drop-shadow(0 2px 8px ${ink}40)`,
      }
  }
})
</script>

<style scoped>
/* The footer lockup has one width, and the social row is what sets it: four
   buttons and three gaps. Our mark is then set to exactly that width rather
   than to a height of its own, so the two can never drift apart; every value
   below falls out of the same two tokens. The vh clamps only bite on short
   screens, so the lockup is one size on every desktop. On the root rather than
   the lockup because the paper card sizes itself off the same measure. */
.showcase-footer {
  --fm-btn: clamp(28px, 4.2vh, 34px);
  --fm-gap: clamp(8px, 1.2vh, 10px);
  --fm-w: calc(4 * var(--fm-btn) + 3 * var(--fm-gap));
  /* Our wordmark's height falls out of its own aspect at that width. */
  --fm-mark-h: calc(var(--fm-w) / 3.2127);
  /* A partner's mark can be stacked or square where ours is a wide wordmark,
     so it gets half again the height to work with; otherwise a square logo
     reads as a third the size of ours at the same height. */
  --fm-partner-h: calc(var(--fm-mark-h) * 1.5);
  color: var(--ft-ink);
  /* Switching designs in the studio crossfades the band rather than cutting. */
  transition:
    background-color 300ms ease,
    box-shadow 300ms ease;
}

/* The two looks the footer always had keep the clip they always had; the
   paper card's lift must be allowed out of it. */
.showcase-footer--plain,
.showcase-footer--glass {
  overflow: hidden;
}

/* The lockup fades in as one object while its rows rise in a wave.

   Why the lockup carries this and not the page it sits on. The footer page is
   a full scrollport tall with its content centred, so an observer watching the
   PAGE fires the moment the page's top edge crosses in, roughly half a screen
   before the mark is on screen at all. The reveal was finishing while the
   reader still had empty space in front of them, and by the time they reached
   the mark it had simply always been there. Watching the lockup puts this where
   every other section's reveal is: 60px of the thing being revealed is
   showing, and then it arrives.

   Curve and durations are `.animate-reveal`'s, to the millisecond. This is the
   last section of the same document and it should land the way the eleven
   before it did.

   Opacity belongs to the lockup, transform to the rows. That split is what
   keeps the reveal from fighting the lockup's existing model: the ornament
   rests at 0.55 and the address at 0.9, so a per-row opacity would have to know
   each row's resting value, and both `.footer-mark` rows already own
   `transform` for their hover lift. Moving only the inner elements (the image,
   the svg, the rows that carry no hover of their own) leaves both alone. */
.footer-lockup {
  --rv-y: 18px;
  opacity: 0;
  transition: opacity 0.42s cubic-bezier(0.16, 1, 0.3, 1);
}

.footer-lockup.is-visible {
  opacity: 1;
}

.footer-lockup .partner-mark > *,
.footer-lockup .collab-ornament,
.footer-lockup .goevent-mark,
.footer-lockup .social-row,
.footer-lockup .footer-address {
  transform: translateY(var(--rv-y));
  transition: transform 0.48s cubic-bezier(0.16, 1, 0.3, 1);
}

.footer-lockup.is-visible .partner-mark > *,
.footer-lockup.is-visible .collab-ornament,
.footer-lockup.is-visible .goevent-mark,
.footer-lockup.is-visible .social-row,
.footer-lockup.is-visible .footer-address {
  transform: translateY(0);
}

/* The wave, in reading order. 70ms apart: close enough that five rows read as
   one gesture rather than five events, which is what the lockup's own
   construction is for. */
.footer-lockup .collab-ornament {
  transition-delay: 70ms;
}

/* Our mark travels further than anything around it, so it settles where the
   others slide: the one place in this reveal where the brand gets more
   presence than the furniture. A beat of its own would have been too much. */
.footer-lockup .goevent-mark {
  --rv-y: 26px;
  transition-delay: 140ms;
}

.footer-lockup .social-row {
  transition-delay: 210ms;
}

.footer-lockup .footer-address {
  transition-delay: 260ms;
}

@media (max-width: 640px) {
  .footer-lockup {
    --rv-y: 12px;
  }

  .footer-lockup .goevent-mark {
    --rv-y: 18px;
  }
}

.footer-lockup .goevent-mark {
  width: var(--fm-w);
  height: auto;
  /* Belt and braces for the intrinsic height Safari derives from the viewBox. */
  aspect-ratio: 222.09 / 69.13;
  fill: var(--ft-ink);
  filter: var(--ft-mark-filter);
}

/* The partner's mark is theirs (a stacked badge, a square, a wide wordmark) so
   only the box is ours. Both axes are auto so it keeps its own ratio, and it
   shrinks to fit whichever cap it meets first. The wrapper is the full measure
   and centres it, so a mark narrower than the box still sits on the lockup's
   axis rather than wherever its own width happens to leave it. */
.footer-lockup .partner-mark {
  display: flex;
  justify-content: center;
  width: var(--fm-w);
}

.footer-lockup .partner-mark img {
  width: auto;
  height: auto;
  max-width: 100%;
  max-height: var(--fm-partner-h);
  filter: var(--ft-logo-filter);
}

/* The slot the partner's mark will fill, drawn only inside a preview: our own
   mark's colour, our own mark's width, and nothing else. No box: nothing else
   in this lockup has one, and a dashed rectangle is admin-panel vocabulary in
   the middle of a gold-leaf invitation.

   It is SVG rather than styled text because the width has to be OUR mark's
   width exactly, and the font here is template-driven: any font-size that fills
   the measure in one face overshoots or falls short in the next. `textLength`
   over a viewBox scaled to --fm-w pins the span at the measure whatever the
   face, the same reason the ornament below is drawn geometry and not a glyph.
   42 units in a 200-unit box sits close to the natural width of a normal serif,
   so the adjustment is usually a few units of tracking; at a smaller size the
   stretch needed to reach the measure scatters the letters and "Your Logo"
   stops reading as two words. */
.footer-lockup .partner-slot-mark {
  display: block;
  width: var(--fm-w);
  height: auto;
  fill: var(--ft-ink);
}

/* The mark that joins the two logos. It was a drawn "x", the fashion-
   collaboration sign, which is a register this footer does not sit in: it
   prints on funeral and memorial invitations too, and at this size two crossed
   strokes are also the web's most common "dismiss" glyph.

   This is instead the ornament the invitation already uses for a soft break
   (the rule under the comment section's heading) so the footer says the same
   thing in the same voice, on every event type. Its hairlines fade outward
   rather than ending, because these rows are meant to bind into one object and
   a rule that terminates cuts them into two; and it is narrower than --fm-w for
   the same reason, so it joins the marks rather than underlining one of them. */
.footer-lockup .collab-ornament {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: calc(var(--fm-btn) * 0.26);
  width: calc(var(--fm-w) * 0.62);
  opacity: 0.55;
}

.footer-lockup .collab-rule {
  flex: 1;
  height: 1px;
  background: currentColor;
}

.footer-lockup .collab-rule--left {
  -webkit-mask-image: linear-gradient(90deg, transparent, #000);
  mask-image: linear-gradient(90deg, transparent, #000);
}

.footer-lockup .collab-rule--right {
  -webkit-mask-image: linear-gradient(90deg, #000, transparent);
  mask-image: linear-gradient(90deg, #000, transparent);
}

/* A square on its corner, sized off the button so it holds its proportion to
   the lockup at every viewport height. */
.footer-lockup .collab-gem {
  width: calc(var(--fm-btn) * 0.16);
  height: calc(var(--fm-btn) * 0.16);
  flex-shrink: 0;
  background: currentColor;
  transform: rotate(45deg);
}

.footer-lockup .social-row {
  gap: var(--fm-gap);
}

.footer-lockup .social-btn {
  width: var(--fm-btn);
  height: var(--fm-btn);
  color: var(--ft-ink);
  background-color: var(--ft-btn-bg);
  transition:
    transform 200ms cubic-bezier(0.23, 1, 0.32, 1),
    background-color 200ms cubic-bezier(0.23, 1, 0.32, 1);
}

.footer-lockup .social-btn svg {
  width: calc(var(--fm-btn) * 0.5);
  height: calc(var(--fm-btn) * 0.5);
}

.footer-lockup .footer-address {
  font-size: clamp(12px, 1.9vh, 16px);
  opacity: 0.9;
}

/* The footer marks lift under a real pointer only. On touch, :hover fires on
   tap and stays stuck after the finger lifts, which leaves the logo sitting
   5% large for the rest of the visit. */
.footer-mark {
  transition: transform 200ms cubic-bezier(0.23, 1, 0.32, 1);
}

@media (hover: hover) and (pointer: fine) {
  .footer-mark:hover {
    transform: scale(1.05);
  }

  .footer-lockup .social-btn:hover {
    transform: scale(1.1);
    background-color: var(--ft-btn-bg-hover);
  }
}

/* After the hover block on purpose: a press fires :hover and :active together
   on a mouse, and these two rules tie on specificity, so the press has to come
   last to win. */
.footer-lockup .social-btn:active {
  transform: scale(0.95);
}

/* The anchor only: the partner's mark is not a link, and a press response on
   something that does not respond to a press is a false affordance. */
a.footer-mark:active {
  transform: scale(0.97);
}

/* ─── card: the lockup printed on the invitation's paper ─────────────────────
   The same stock, corner and lift as the calendar card, the reply card and the
   polaroid (stationery.ts), so the footer reads as the last card in the set
   rather than a fourth white. `currentColor` in the paper's shadow is the ink,
   which the root sets. Inside the edge, one printed rule at the set's 18%
   hairline: the frame a letterpress card has, and what keeps a pale card from
   reading as a plain box on a pale page. */
.showcase-footer--card .footer-surface {
  position: relative;
  width: fit-content;
  max-width: 100%;
  margin-inline: auto;
  padding: clamp(20px, 3.2vh, 30px) clamp(22px, 8vw, 36px);
  background: var(--ft-paper);
  border-radius: var(--ft-radius);
  box-shadow: var(--ft-shadow);
}

.showcase-footer--card .footer-surface::before {
  content: '';
  position: absolute;
  inset: 6px;
  border: 1px solid color-mix(in srgb, currentColor 18%, transparent);
  border-radius: max(0px, calc(var(--ft-radius) - 3px));
  pointer-events: none;
}

/* ─── minimal: the colophon at the back of a printed card ────────────────────
   Everything a size down and nothing on a fill: the icons stand bare, our
   mark carries no glow, a single fading hairline heads the lockup, and the
   address is set in small spaced capitals. The quiet one, for the invitations
   (a memorial, a formal dinner) where a row of pill buttons is too loud. The
   address is always Latin, so the capitals never meet a Khmer run. */
.showcase-footer--minimal {
  --fm-btn: clamp(24px, 3.4vh, 28px);
  --fm-gap: clamp(10px, 1.6vh, 14px);
}

.showcase-footer--minimal .footer-lockup::before {
  content: '';
  width: calc(var(--fm-w) * 0.5);
  height: 1px;
  background: currentColor;
  opacity: 0.35;
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 30%, #000 70%, transparent);
  mask-image: linear-gradient(90deg, transparent, #000 30%, #000 70%, transparent);
}

.showcase-footer--minimal .goevent-mark {
  opacity: 0.9;
}

.showcase-footer--minimal .social-btn svg {
  width: calc(var(--fm-btn) * 0.62);
  height: calc(var(--fm-btn) * 0.62);
  opacity: 0.8;
}

.showcase-footer--minimal .footer-address {
  font-size: clamp(10px, 1.45vh, 12px);
  letter-spacing: 0.24em;
  text-transform: uppercase;
  opacity: 0.7;
}

/* Reduced motion: the lockup keeps its fade (it still says "this arrived")
   but nothing travels and nothing waits its turn. */
@media (prefers-reduced-motion: reduce) {
  .footer-lockup {
    transition: opacity 0.25s ease;
  }

  .footer-lockup .partner-mark > *,
  .footer-lockup .collab-ornament,
  .footer-lockup .goevent-mark,
  .footer-lockup .social-row,
  .footer-lockup .footer-address {
    transform: none !important;
    transition: none;
    transition-delay: 0ms !important;
  }
}
</style>
