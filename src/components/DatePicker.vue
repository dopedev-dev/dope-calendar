<template>
  <div class="dope-date-picker" :class="{ 'dp-allow-transitions': !isAnimating && !isSilent }" :dir="dir"
    :style="customVars">
    <div class="dp-header">
      <slot name="prev" :trigger="() => canGoPrev && handleNavigation('prev')" :disabled="!canGoPrev" v-if="!isFixed">
        <button class="dp-nav-btn" :class="{ 'dp-nav-hide': viewMode === 'year' }" @click="handleNavigation('prev')"
          :disabled="!canGoPrev" type="button">
          <svg v-if="dir === 'rtl'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 256">
            <path fill="currentColor"
              d="m90.34 202.34l80-80a8 8 0 0 0 0-11.32l-80-80a8 8 0 0 0-11.32 11.32L159.03 128l-80 80a8 8 0 0 0 11.31 11.34Z" />
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 256">
            <path fill="currentColor"
              d="M165.66 202.34a8 8 0 0 1-11.32 11.32l-80-80a8 8 0 0 1 0-11.32l80-80a8 8 0 0 1 11.32 11.32L96.97 128Z" />
          </svg>
        </button>
      </slot>

      <div class="dp-title-group">
        <button v-if="viewMode === 'day'" class="dp-title-btn" @click="canSwitchView && (viewMode = 'month')"
          :disabled="isFixed || !opts.enableMonthPicker" type="button">
          {{ currentMonthName }}
        </button>

        <button class="dp-title-btn" @click="canSwitchView && (viewMode = 'year')"
          :disabled="isFixed || !opts.enableYearPicker" type="button">
          {{ opts.locale === 'fa' ? toPersianNum(displayYear) : displayYear }}
        </button>
      </div>

      <slot name="next" :trigger="() => canGoNext && handleNavigation('next')" :disabled="!canGoNext" v-if="!isFixed">
        <button class="dp-nav-btn" :class="{ 'dp-nav-hide': viewMode === 'year' }" @click="handleNavigation('next')"
          :disabled="!canGoNext" type="button">
          <svg v-if="dir === 'rtl'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 256">
            <path fill="currentColor"
              d="M165.66 202.34a8 8 0 0 1-11.32 11.32l-80-80a8 8 0 0 1 0-11.32l80-80a8 8 0 0 1 11.32 11.32L96.97 128Z" />
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 256">
            <path fill="currentColor"
              d="m90.34 202.34l80-80a8 8 0 0 0 0-11.32l-80-80a8 8 0 0 0-11.32 11.32L159.03 128l-80 80a8 8 0 0 0 11.31 11.34Z" />
          </svg>
        </button>
      </slot>
    </div>

    <div class="dp-body">
      <Transition name="dp-fade" mode="out-in" @after-enter="onViewSwitch">

        <div v-if="viewMode === 'day'" class="dp-viewport" key="day">

          <div class="dp-weekdays">
            <div v-for="(day, index) in dynamicWeekDays" :key="index" class="dp-weekday"
              :class="{ 'is-holiday-header': day.isRed }">
              {{ day.label }}
            </div>
          </div>

          <div class="dp-slider" :class="{ 'is-animating': isAnimating }" :style="sliderStyle"
            @transitionend="onTransitionEnd">
            <div class="dp-slide-pane">
              <div class="dp-grid">
                <div v-for="(dayObj, i) in prevGrid" :key="'p' + i" class="dp-cell-wrapper">
                  <div class="dp-cell" :class="getDayClasses(dayObj)"
                    @click="!dayObj.isDisabled && selectDate(dayObj.date)">
                    <span class="dp-cell-text">{{ dayObj.label }}</span>
                    <div v-if="dayObj.eventCount > 0" class="dp-event-dot"></div>
                  </div>
                </div>
              </div>
            </div>

            <div class="dp-slide-pane">
              <div class="dp-grid">
                <div v-for="(dayObj, i) in currentGrid" :key="'c' + i" class="dp-cell-wrapper">
                  <div class="dp-cell" :class="getDayClasses(dayObj)"
                    @click="!dayObj.isDisabled && selectDate(dayObj.date)">
                    <span class="dp-cell-text">{{ dayObj.label }}</span>
                    <div v-if="dayObj.eventCount > 0" class="dp-event-dot"></div>
                  </div>
                </div>
              </div>
            </div>

            <div class="dp-slide-pane">
              <div class="dp-grid">
                <div v-for="(dayObj, i) in nextGrid" :key="'n' + i" class="dp-cell-wrapper">
                  <div class="dp-cell" :class="getDayClasses(dayObj)"
                    @click="!dayObj.isDisabled && selectDate(dayObj.date)">
                    <span class="dp-cell-text">{{ dayObj.label }}</span>
                    <div v-if="dayObj.eventCount > 0" class="dp-event-dot"></div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        <div v-else-if="viewMode === 'month'" class="dp-view-month" key="month">
          <div class="dp-month-grid">
            <div v-for="(m, index) in monthsList" :key="index" class="dp-option-cell" :class="{
              'is-selected': isMonthSelected(m.value),
              'is-current': m.isCurrent
            }" @click="selectMonth(m.value)">
              {{ m.label }}
            </div>
          </div>
        </div>

        <div v-else-if="viewMode === 'year'" class="dp-view-year" key="year">
          <div class="dp-year-grid" ref="yearGridRef">
            <div v-for="year in yearsList" :key="year.value" :data-year="year.value" class="dp-option-cell" :class="{
              'is-selected': year.value === selectedYear,
              'is-current': year.isCurrent
            }" @click="selectYear(year.value)">
              {{ year.label }}
            </div>
          </div>
        </div>

      </Transition>
    </div>

    <div v-if="opts.enableTimePicker" class="dp-footer">
      <div class="dp-time-wrapper">
        <div class="dp-time-col">
          <button class="dp-icon-btn" @click="updateTime(1, 'hour')" type="button">▲</button>
          <input class="dp-time-input" type="text" v-model="timeInputs.hour" @blur="validateTime('hour')"
            @keydown.enter="validateTime('hour')" />
          <button class="dp-icon-btn" @click="updateTime(-1, 'hour')" type="button">▼</button>
        </div>
        <span class="dp-time-sep">:</span>
        <div class="dp-time-col">
          <button class="dp-icon-btn" @click="updateTime(1, 'minute')" type="button">▲</button>
          <input class="dp-time-input" type="text" v-model="timeInputs.minute" @blur="validateTime('minute')"
            @keydown.enter="validateTime('minute')" />
          <button class="dp-icon-btn" @click="updateTime(-1, 'minute')" type="button">▼</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, nextTick, type PropType, onMounted } from 'vue'
import * as jalaali from 'jalaali-js'

export interface CalendarEvent {
  date: Date | string
  count?: number
}

export interface DatePickerOptions {
  dateMode?: 'georgian' | 'jalaali' | 'islamic'
  calendar?: 'gregory' | 'persian' | 'islamic'
  mode?: 'date' | 'month' | 'year'
  locale?: string
  dir?: 'ltr' | 'rtl'
  minDate?: Date
  maxDate?: Date
  events?: CalendarEvent[]
  holidays?: (Date | string)[]
  enableTimePicker?: boolean
  enableYearPicker?: boolean
  enableMonthPicker?: boolean
  fixedTime?: boolean | Date | string
  monthOffset?: number
  color?: string
  selectionMode?: 'all' | 'future' | 'past'
}

export default defineComponent({
  name: 'DatePicker',
  props: {
    modelValue: { type: [Date, String], default: null },
    options: {
      type: Object as PropType<DatePickerOptions>,
      default: () => ({})
    },
    option: {
      type: Object as PropType<DatePickerOptions>,
      default: undefined
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {

    // --- Utilities ---
    const toPersianNum = (n: number | string): string => {
      return String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]!)
    }

    const parseToDate = (val: Date | string): Date | null => {
      if (!val) return null
      const d = new Date(val)
      return isNaN(d.getTime()) ? null : d
    }

    const isSameDay = (d1: Date, d2: Date) => {
      return d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate()
    }

    const cloneDate = (d: Date) => new Date(d.getTime())

    // --- Configuration ---
    const defaultOptions: DatePickerOptions = {
      mode: 'date',
      dir: 'ltr',
      events: [],
      holidays: [],
      enableTimePicker: false,
      enableYearPicker: true,
      enableMonthPicker: true,
      fixedTime: false,
      monthOffset: 0,
      color: '',
      selectionMode: 'all',
      minDate: undefined,
      maxDate: undefined
    }

    const opts = computed(() => {
      const userOpts = props.option || props.options || {}
      return { ...defaultOptions, ...userOpts }
    })

    const resolvedMode = computed(() => {
      if (opts.value.dateMode === 'jalaali' || opts.value.calendar === 'persian') return 'jalaali'
      if (opts.value.dateMode === 'islamic' || opts.value.calendar === 'islamic') return 'islamic'
      return 'georgian'
    })

    const dir = computed(() => opts.value.dir || (resolvedMode.value === 'jalaali' || resolvedMode.value === 'islamic' ? 'rtl' : 'ltr'))

    const customVars = computed(() => {
      return opts.value.color ? { '--dp-primary': opts.value.color } : {}
    })

    // --- State ---
    const now = new Date()
    const displayDate = ref<Date>(cloneDate(now))
    const selectedDt = ref<Date | null>(null)
    const viewMode = ref<'day' | 'month' | 'year'>('day')
    const timeInputs = ref({ hour: '12', minute: '00' })
    const yearGridRef = ref<HTMLElement | null>(null)

    // Animation
    const isAnimating = ref(false)
    const isSilent = ref(false)
    const slideOffset = ref(0)
    const isFixed = computed(() => !!opts.value.fixedTime)
    const canSwitchView = computed(() => !isFixed.value)

    // --- Calendar Math Logic ---

    const getViewYear = (d: Date) => {
      if (resolvedMode.value === 'jalaali') return jalaali.toJalaali(d).jy
      return d.getFullYear()
    }
    const getViewMonth = (d: Date) => {
      if (resolvedMode.value === 'jalaali') return jalaali.toJalaali(d).jm
      return d.getMonth() + 1
    }

    // Robust Month Addition that handles Jalaali month lengths
    const addViewMonths = (d: Date, amount: number) => {
      if (resolvedMode.value === 'jalaali') {
        const j = jalaali.toJalaali(d)
        // Convert to absolute months to handle wrapping
        let totalMonths = (j.jy * 12) + (j.jm - 1) + amount

        const newJy = Math.floor(totalMonths / 12)
        const newJm = (totalMonths % 12) + 1

        // Clamp Day: If we move from Esfand 30 to a month with 29 days, or 31 to 30
        const monthLen = jalaali.jalaaliMonthLength(newJy, newJm)
        const newJd = Math.min(j.jd, monthLen)

        const g = jalaali.toGregorian(newJy, newJm, newJd)
        return new Date(g.gy, g.gm - 1, g.gd, d.getHours(), d.getMinutes())
      } else {
        const copy = cloneDate(d)
        // Native setMonth handles day clamping mostly automatically (wrapping to next month), 
        // but for a strict calendar view we usually want clamping (Jan 31 -> Feb 28).
        // Let's implement clamping for consistency.
        const targetMonth = copy.getMonth() + amount
        const targetYear = copy.getFullYear() + Math.floor(targetMonth / 12)
        const normMonth = (targetMonth % 12 + 12) % 12

        const daysInMonth = new Date(targetYear, normMonth + 1, 0).getDate()
        const newDay = Math.min(copy.getDate(), daysInMonth)

        copy.setFullYear(targetYear)
        copy.setMonth(normMonth)
        copy.setDate(newDay)

        return copy
      }
    }

    const addViewYears = (d: Date, amount: number) => {
      if (resolvedMode.value === 'jalaali') {
        const j = jalaali.toJalaali(d)
        const newJy = j.jy + amount
        const monthLen = jalaali.jalaaliMonthLength(newJy, j.jm)
        const newJd = Math.min(j.jd, monthLen)
        const g = jalaali.toGregorian(newJy, j.jm, newJd)
        return new Date(g.gy, g.gm - 1, g.gd, d.getHours(), d.getMinutes())
      } else {
        const copy = cloneDate(d)
        copy.setFullYear(copy.getFullYear() + amount)
        return copy
      }
    }

    // --- Computed Display Data ---

    const displayYear = computed(() => getViewYear(displayDate.value))

    const currentMonthName = computed(() => {
      if (resolvedMode.value === 'jalaali') {
        const jalaaliMonths = [
          'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
          'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
        ]
        const j = jalaali.toJalaali(displayDate.value)
        return jalaaliMonths[j.jm - 1] || ''
      } else {
        return displayDate.value.toLocaleString(opts.value.locale || 'default', { month: 'long' })
      }
    })

    const dynamicWeekDays = computed(() => {
      if (resolvedMode.value === 'jalaali') {
        return [
          { label: 'ش', isRed: false },
          { label: 'ی', isRed: false },
          { label: 'د', isRed: false },
          { label: 'س', isRed: false },
          { label: 'چ', isRed: false },
          { label: 'پ', isRed: false },
          { label: 'ج', isRed: true }
        ]
      } else {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        return days.map((l, i) => ({ label: l, isRed: i === 0 || i === 6 }))
      }
    })

    // --- Grid Generation ---
    const generateGrid = (basis: Date) => {
      const days = []
      const isJalaali = resolvedMode.value === 'jalaali'

      let startGridDate: Date
      let targetYear: number
      let targetMonthIndex: number

      if (isJalaali) {
        const jBasis = jalaali.toJalaali(basis)
        targetYear = jBasis.jy
        targetMonthIndex = jBasis.jm

        // Find 1st of Jalaali Month
        const gFirst = jalaali.toGregorian(jBasis.jy, jBasis.jm, 1)
        const firstOfMonth = new Date(gFirst.gy, gFirst.gm - 1, gFirst.gd)

        // Find Week Start Offset (Sat=6)
        const dayOfWeek = firstOfMonth.getDay()
        const offset = dayOfWeek === 6 ? 0 : (dayOfWeek + 1)

        startGridDate = cloneDate(firstOfMonth)
        startGridDate.setDate(startGridDate.getDate() - offset)
      } else {
        targetYear = basis.getFullYear()
        targetMonthIndex = basis.getMonth() + 1

        const firstOfMonth = new Date(basis.getFullYear(), basis.getMonth(), 1)
        const dayOfWeek = firstOfMonth.getDay()
        startGridDate = cloneDate(firstOfMonth)
        startGridDate.setDate(startGridDate.getDate() - dayOfWeek)
      }

      const iterator = cloneDate(startGridDate)

      for (let i = 0; i < 42; i++) {
        const d = cloneDate(iterator)

        let label = ''
        let isCurrentMonth = false

        if (isJalaali) {
          const j = jalaali.toJalaali(d)
          label = opts.value.locale === 'fa' ? toPersianNum(j.jd) : String(j.jd)
          isCurrentMonth = (j.jy === targetYear && j.jm === targetMonthIndex)
        } else {
          label = String(d.getDate())
          if (opts.value.locale === 'fa') label = toPersianNum(label)
          isCurrentMonth = (d.getMonth() + 1 === targetMonthIndex)
        }

        const isToday = isSameDay(d, now)
        const isSelected = selectedDt.value ? isSameDay(d, selectedDt.value) && isCurrentMonth : false

        let isDisabled = false
        if (opts.value.minDate && d < new Date(new Date(opts.value.minDate).setHours(0, 0, 0, 0))) isDisabled = true
        if (opts.value.maxDate && d > new Date(new Date(opts.value.maxDate).setHours(23, 59, 59, 999))) isDisabled = true
        if (!isCurrentMonth) isDisabled = true

        const eventMatch = (opts.value.events || []).find(e => {
          const ed = parseToDate(e.date)
          return ed && isSameDay(ed, d)
        })

        const isHoliday = (opts.value.holidays || []).some(h => {
          const hd = parseToDate(h as any)
          return hd && isSameDay(hd, d)
        })

        days.push({
          date: d,
          label,
          isCurrentMonth,
          isToday,
          isSelected,
          isDisabled,
          isHoliday,
          eventCount: eventMatch ? (eventMatch.count || 1) : 0
        })

        iterator.setDate(iterator.getDate() + 1)
      }

      return days
    }

    const currentGrid = computed(() => generateGrid(displayDate.value))
    const prevGrid = computed(() => generateGrid(addViewMonths(displayDate.value, -1)))
    const nextGrid = computed(() => generateGrid(addViewMonths(displayDate.value, 1)))

    // --- Transition / Navigation ---
    const sliderStyle = computed(() => {
      const isRTL = dir.value === 'rtl'
      let base = isRTL ? 33.333333 : -33.333333
      let move = 0
      if (isAnimating.value) {
        if (slideOffset.value === 1) move = isRTL ? -33.333333 : 33.333333 // Prev
        if (slideOffset.value === -1) move = isRTL ? 33.333333 : -33.333333 // Next
      }
      return { transform: `translateX(${base + move}%)` }
    })

    const handleNavigation = (direction: 'prev' | 'next') => {
      if (viewMode.value === 'year') return

      if (viewMode.value === 'month') {
        const amt = direction === 'next' ? 1 : -1
        displayDate.value = addViewYears(displayDate.value, amt)
      } else {
        if (isAnimating.value) return
        isAnimating.value = true
        slideOffset.value = direction === 'next' ? -1 : 1
      }
    }

    const onTransitionEnd = async (e: Event) => {
      // Ensure the event came from the slider and we are currently animating
      if (e.target !== e.currentTarget || !isAnimating.value) return

      // 1. Enable "silent" mode to disable CSS transitions globally
      isSilent.value = true

      // 2. Update the display date (swapping the grids)
      if (slideOffset.value === -1) {
        displayDate.value = addViewMonths(displayDate.value, 1)
      } else if (slideOffset.value === 1) {
        displayDate.value = addViewMonths(displayDate.value, -1)
      }

      // 3. Stop the animation flag and snap the slider back to 0 (center)
      isAnimating.value = false
      slideOffset.value = 0

      // 4. Wait for Vue to update the DOM with the new grid data
      await nextTick()

      // 5. Use a small timeout instead of requestAnimationFrame.
      // This ensures the browser has enough time to paint the new colors/styles
      // (selected, today, disabled) while transitions are still DISABLED.
      // This prevents the visual "jump" or "flash" of styles.
      setTimeout(() => {
        isSilent.value = false
      }, 50)
    }
    const canGoPrev = computed(() => {
      if (isFixed.value) return false
      if (!opts.value.minDate) return true
      const prev = viewMode.value === 'month' ? addViewYears(displayDate.value, -1) : addViewMonths(displayDate.value, -1)
      // Loose check
      const min = new Date(opts.value.minDate)
      return prev.getTime() >= min.getTime() - (60 * 24 * 3600 * 1000)
    })

    const canGoNext = computed(() => {
      if (isFixed.value) return false
      if (!opts.value.maxDate) return true
      const next = viewMode.value === 'month' ? addViewYears(displayDate.value, 1) : addViewMonths(displayDate.value, 1)
      return next.getTime() <= new Date(opts.value.maxDate).getTime() + (60 * 24 * 3600 * 1000)
    })

    const onViewSwitch = () => {
      if (viewMode.value === 'year') {
        const target = selectedYear.value || getViewYear(now)
        const el = yearGridRef.value?.querySelector(`[data-year="${target}"]`)
        el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
      }
    }

    // --- Selection Logic ---
    const selectDate = (d: Date) => {
      const newD = cloneDate(d)
      const hStr = timeInputs.value.hour.replace(/[۰-۹]/g, c => '۰۱۲۳۴۵۶۷۸۹'.indexOf(c).toString())
      const mStr = timeInputs.value.minute.replace(/[۰-۹]/g, c => '۰۱۲۳۴۵۶۷۸۹'.indexOf(c).toString())
      newD.setHours(parseInt(hStr) || 0, parseInt(mStr) || 0)
      selectedDt.value = newD
      emit('update:modelValue', newD)
    }

    const selectMonth = (val: number) => {
      // val is 1-based index
      if (resolvedMode.value === 'jalaali') {
        const j = jalaali.toJalaali(displayDate.value)
        const g = jalaali.toGregorian(j.jy, val, 1)
        displayDate.value = new Date(g.gy, g.gm - 1, g.gd, displayDate.value.getHours())
      } else {
        const d = cloneDate(displayDate.value)
        d.setMonth(val - 1)
        displayDate.value = d
      }
      viewMode.value = 'day'
    }

    const isMonthSelected = (val: number) => val === getViewMonth(displayDate.value)

    const selectYear = (val: number) => {
      if (resolvedMode.value === 'jalaali') {
        const j = jalaali.toJalaali(displayDate.value)
        const g = jalaali.toGregorian(val, j.jm, 1)
        displayDate.value = new Date(g.gy, g.gm - 1, g.gd, displayDate.value.getHours())
      } else {
        const d = cloneDate(displayDate.value)
        d.setFullYear(val)
        displayDate.value = d
      }
      viewMode.value = 'month'
    }

    const selectedYear = computed(() => selectedDt.value ? getViewYear(selectedDt.value) : null)

    // --- Time ---
    const updateTime = (amt: number, unit: 'hour' | 'minute') => {
      const str = timeInputs.value[unit].replace(/[۰-۹]/g, c => '۰۱۲۳۴۵۶۷۸۹'.indexOf(c).toString())
      let val = parseInt(str) || 0
      val += amt
      const max = unit === 'hour' ? 23 : 59
      if (val > max) val = 0
      if (val < 0) val = max
      const res = val.toString().padStart(2, '0')
      timeInputs.value[unit] = opts.value.locale === 'fa' ? toPersianNum(res) : res
      if (selectedDt.value) selectDate(selectedDt.value)
    }

    const validateTime = (unit: 'hour' | 'minute') => {
      const str = timeInputs.value[unit].replace(/[۰-۹]/g, c => '۰۱۲۳۴۵۶۷۸۹'.indexOf(c).toString())
      let val = parseInt(str) || 0
      const max = unit === 'hour' ? 23 : 59
      val = Math.max(0, Math.min(max, val))
      const res = val.toString().padStart(2, '0')
      timeInputs.value[unit] = opts.value.locale === 'fa' ? toPersianNum(res) : res
      if (selectedDt.value) selectDate(selectedDt.value)
    }

    // --- Init ---
    watch(() => props.modelValue, (val) => {
      const d = parseToDate(val as any)
      if (d) {
        selectedDt.value = d
        timeInputs.value.hour = d.getHours().toString().padStart(2, '0')
        timeInputs.value.minute = d.getMinutes().toString().padStart(2, '0')
        // Sync display view if allowed
        if (!isFixed.value && !opts.value.monthOffset) {
          const y = getViewYear(d), m = getViewMonth(d)
          const dy = getViewYear(displayDate.value), dm = getViewMonth(displayDate.value)
          if (y !== dy || m !== dm) displayDate.value = cloneDate(d)
        }
      }
    }, { immediate: true })

    // --- Lists ---
    const monthsList = computed(() => {
      if (resolvedMode.value === 'jalaali') {
        const names = [
          'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
          'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
        ]
        const cJ = jalaali.toJalaali(now)
        return names.map((l, i) => ({
          label: l,
          value: i + 1,
          isCurrent: cJ.jy === getViewYear(displayDate.value) && cJ.jm === (i + 1)
        }))
      } else {
        const d = new Date(2000, 0, 1)
        const arr = []
        for (let i = 0; i < 12; i++) {
          d.setMonth(i)
          arr.push({
            label: d.toLocaleString(opts.value.locale || 'default', { month: 'long' }),
            value: i + 1,
            isCurrent: now.getFullYear() === displayDate.value.getFullYear() && now.getMonth() === i
          })
        }
        return arr
      }
    })

    const yearsList = computed(() => {
      // 1. Get the current year in the active calendar mode (Jalaali, etc.)
      const currentYear = getViewYear(now)

      // 2. Define the range: -60 years to +20 years from now
      const startYear = currentYear - 60
      const endYear = currentYear + 20

      const arr = []
      for (let i = startYear; i <= endYear; i++) {
        arr.push({
          value: i,
          // Use Persian numbers if locale is 'fa', otherwise standard
          label: opts.value.locale === 'fa' ? toPersianNum(i) : String(i),
          // Mark the actual current year
          isCurrent: i === currentYear
        })
      }
      return arr
    })

    const getDayClasses = (dayObj: any) => ({
      'is-today': dayObj.isToday,
      'is-selected': dayObj.isSelected,
      'is-other-month': !dayObj.isCurrentMonth,
      'is-disabled': dayObj.isDisabled,
      'is-holiday': dayObj.isHoliday
    })

    return {
      opts, dir, customVars,
      viewMode, canSwitchView, isFixed, canGoPrev, canGoNext,
      currentMonthName, displayYear, toPersianNum,
      dynamicWeekDays, sliderStyle, isAnimating, onTransitionEnd, isSilent, onViewSwitch,
      prevGrid, currentGrid, nextGrid,
      monthsList, yearsList, selectedYear, isMonthSelected,
      timeInputs,
      handleNavigation, selectDate, selectMonth, selectYear, updateTime, validateTime, getDayClasses,
      yearGridRef
    }
  }
})
</script>

<style scoped>
@import '@/assets/css/calendar.css';

/* Main Container */
.dope-date-picker {
  display: flex;
  flex-direction: column;
  width: var(--dp-width) !important;
  min-width: var(--dp-width) !important;
  max-width: var(--dp-width) !important;

  background: var(--dp-bg);
  box-shadow: var(--dp-shadow);
  color: var(--dp-text);
  font-family: var(--dp-font-family);
  user-select: none;
  overflow: hidden;
  box-sizing: border-box;
}

.dope-date-picker[dir="rtl"] {
  direction: rtl;
}

/* Header */
.dp-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  height: var(--dp-header-height);
  background: var(--dp-bg);
  z-index: 10;
  position: relative;
  box-sizing: border-box;
}

.dp-nav-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--dp-text-muted);
  border-radius: 4px;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--dp-transition);
}

.dp-nav-btn:hover:not(:disabled) {
  background: var(--dp-hover-bg);
  color: var(--dp-text);
}

.dp-nav-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
  pointer-events: none;
}

.dp-title-group {
  display: flex;
  gap: 4px;
}

.dp-title-btn {
  background: transparent;
  border: none;
  font-size: 1rem;
  font-weight: var(--dp-weight-bold);
  color: var(--dp-text);
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: var(--dp-transition);
}

.dp-title-btn:hover:not(:disabled) {
  background: var(--dp-hover-bg);
  color: var(--dp-primary);
}

/* Body */
.dp-body {
  padding: 0 var(--dp-padding) var(--dp-padding) var(--dp-padding);
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
  height: 310px;
}

/* Viewport for Slider */
.dp-viewport {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Static Weekdays */
.dp-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 8px;
  justify-items: center;
  flex-shrink: 0;
}

.dp-weekday {
  text-align: center;
  font-size: 0.75rem;
  font-weight: var(--dp-weight-medium);
  color: var(--dp-text-muted);
  padding: 8px 0;
  width: var(--dp-cell-size);
  transition: none;
}

.dp-weekday.is-holiday-header {
  color: var(--dp-holiday-text);
}

/* Slider Container */
.dp-slider {
  display: flex;
  width: 300%;
  height: 100%;
  will-change: transform;
  transform: translateX(-33.333333%);
}

.dp-slider.is-animating {
  transition: transform 0.3s cubic-bezier(0.25, 1, 0.5, 1);
}

/* Slide Pane */
.dp-slide-pane {
  width: 33.333333%;
  flex-shrink: 0;
}

/* Grid */
.dp-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  justify-items: center;
  row-gap: 4px;
}

.dp-cell-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}

/* Day Cell */
.dp-cell {
  width: var(--dp-cell-size) !important;
  height: var(--dp-cell-size) !important;
  min-width: var(--dp-cell-size) !important;
  min-height: var(--dp-cell-size) !important;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  cursor: pointer;
  font-size: var(--dp-font-size);
  font-weight: var(--dp-weight-medium);
  position: relative;
  transition: none;
  border: 1px solid transparent;
  box-sizing: border-box;
}

.dp-allow-transitions .dp-cell,
.dp-allow-transitions .dp-weekday,
.dp-allow-transitions .dp-option-cell {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.dp-cell:hover:not(.is-disabled):not(.is-selected) {
  background: var(--dp-hover-bg);
  color: var(--dp-primary);
}

.dp-cell.is-selected {
  background: var(--dp-primary);
  color: var(--dp-primary-text);
  border-color: var(--dp-primary);
  box-shadow: none;
}

.dp-cell.is-today:not(.is-selected) {
  border-color: var(--dp-primary);
  color: var(--dp-primary);
  background: transparent;
  font-weight: var(--dp-weight-bold);
}

.dp-cell.is-selected.is-holiday {
  color: var(--dp-primary-text);
}

.dp-cell.is-other-month {
  color: var(--dp-text-muted);
  opacity: 0.4;
}

.dp-cell.is-disabled {
  color: var(--dp-disabled-text);
  cursor: not-allowed;
  opacity: 0.5;
}

/* Dots */
.dp-event-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background-color: var(--dp-holiday-text);
  margin-top: 2px;
}

.dp-cell.is-selected .dp-event-dot {
  background-color: var(--dp-primary-text);
}

/* Month/Year Views */
.dp-view-month,
.dp-view-year {
  height: 100%;
}

.dp-month-grid,
.dp-year-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  height: 290px;
  overflow-y: auto;
  align-content: start;
  padding-top: 8px;
}

.dp-option-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px 8px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: var(--dp-weight-medium);
  transition: none;
  border: 1px solid transparent;
}

.dp-option-cell:hover {
  background: var(--dp-hover-bg);
  color: var(--dp-primary);
}

.dp-option-cell.is-selected {
  background: var(--dp-primary);
  color: var(--dp-primary-text);
  border-color: var(--dp-primary);
}

.dp-option-cell.is-current {
  border-color: var(--dp-primary);
  color: var(--dp-primary);
}

.dp-option-cell.is-selected.is-current {
  color: var(--dp-primary-text);
}

/* Time Picker */
.dp-footer {
  border-top: 1px solid var(--dp-border);
  padding: var(--dp-padding);
  background: var(--dp-bg);
}

.dp-time-wrapper {
  display: flex;
  justify-content: center;
  gap: 24px;
}

.dp-time-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.dp-icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--dp-text);
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.6;
}

.dp-icon-btn:hover {
  opacity: 1;
  color: var(--dp-primary);
}

.dp-time-input {
  width: 56px;
  height: 48px;
  text-align: center;
  border: none;
  border-radius: 12px;
  background: var(--dp-hover-bg);
  color: var(--dp-text);
  font-size: 1.25rem;
  font-weight: var(--dp-weight-bold);
  outline: none;
  transition: var(--dp-transition);
}

.dp-time-input:focus {
  box-shadow: 0 0 0 2px var(--dp-primary);
  background: var(--dp-bg);
}

.dp-time-sep {
  font-size: 2rem;
  font-weight: 700;
  color: var(--dp-text);
  padding-bottom: 8px;
}

/* Transitions */
.dp-fade-enter-active,
.dp-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.dp-fade-enter-from {
  opacity: 0;
  transform: scale(0.95);
}

.dp-fade-leave-to {
  opacity: 0;
  transform: scale(1.05);
  display: none;
}

/* Nav Hide Animation */
.dp-nav-hide {
  transform: scale(0);
  opacity: 0;
  pointer-events: none;
}
</style>