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
          {{ options.locale && options.locale === 'fa' ? toPersianNum(displayYear) : displayYear }}
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
              'is-selected': m.value === currentMonthValue,
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
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    // --- Constants ---
    const JALAALI_MONTHS = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
    const GREGORIAN_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    // --- Options & Defaults ---
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

    const opts = computed(() => ({ ...defaultOptions, ...props.options }))

    // Resolve Mode
    const resolvedMode = computed(() => {
      if (opts.value.dateMode) return opts.value.dateMode
      if (opts.value.calendar === 'persian') return 'jalaali'
      if (opts.value.calendar === 'islamic') return 'islamic'
      return 'georgian'
    })

    const dir = computed(() => opts.value.dir || (resolvedMode.value === 'jalaali' || resolvedMode.value === 'islamic' ? 'rtl' : 'ltr'))

    // --- State ---
    // Note: displayDate is ALWAYS a standard JS Date object. 
    // The "Jalaali" logic is purely a projection view of this date.
    const displayDate = ref<Date>(new Date())
    const selectedDt = ref<Date | null>(null)
    const viewMode = ref<'day' | 'month' | 'year'>('day')
    const timeInputs = ref({ hour: '12', minute: '00' })
    const yearGridRef = ref<HTMLElement | null>(null)
    const isAnimating = ref(false)
    const isSilent = ref(false)
    const slideOffset = ref(0)

    // --- Internal Helpers ---

    const toPersianNum = (n: number | string): string => {
      return String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]!)
    }

    // Clone date to avoid reference issues
    const cloneDate = (d: Date) => new Date(d.getTime())

    // Check if two dates are same day
    const isSameDay = (d1: Date, d2: Date) => {
      return d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate()
    }

    const isStartOfDay = (d: Date) => {
      const start = new Date(d); start.setHours(0, 0, 0, 0); return d.getTime() === start.getTime()
    }

    // --- Arithmetic Helpers (Mode Aware) ---

    // Add Months
    const addMonths = (date: Date, count: number): Date => {
      const mode = resolvedMode.value
      const d = cloneDate(date)

      if (mode === 'jalaali') {
        const j = jalaali.toJalaali(d)
        let totalMonths = (j.jy * 12) + (j.jm - 1) + count
        const newYear = Math.floor(totalMonths / 12)
        const newMonth = (totalMonths % 12) + 1
        
        // Handle Jalaali month lengths (prevent overflow, e.g. 31st of Esfand)
        const daysInNewMonth = jalaali.jalaaliMonthLength(newYear, newMonth)
        const newDay = Math.min(j.jd, daysInNewMonth)
        
        const g = jalaali.toGregorian(newYear, newMonth, newDay)
        const newDate = new Date(g.gy, g.gm - 1, g.gd)
        // preserve time
        newDate.setHours(d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds())
        return newDate
      } else {
        // Gregorian Standard
        const targetMonth = d.getMonth() + count
        d.setMonth(targetMonth)
        // JS Date auto-handles month overflow, but we must check day clamping
        // e.g. Jan 31 + 1 month -> Feb 28/29 (Standard JS might jump to Mar 2/3)
        // We actually want the standard behavior for most calendars, 
        // but let's check if the day skipped a month
        if (d.getDate() !== date.getDate()) {
            d.setDate(0) // Go to last day of previous month
        }
        return d
      }
    }

    // Add Years
    const addYears = (date: Date, count: number): Date => {
        const mode = resolvedMode.value
        const d = cloneDate(date)

        if(mode === 'jalaali') {
            const j = jalaali.toJalaali(d)
            const newYear = j.jy + count
            const daysInNewMonth = jalaali.jalaaliMonthLength(newYear, j.jm)
            const newDay = Math.min(j.jd, daysInNewMonth)
            const g = jalaali.toGregorian(newYear, j.jm, newDay)
            const newDate = new Date(g.gy, g.gm - 1, g.gd)
            newDate.setHours(d.getHours(), d.getMinutes())
            return newDate
        } else {
            d.setFullYear(d.getFullYear() + count)
            return d
        }
    }

    // --- Computed Views ---

    const currentMonthName = computed(() => {
      const mode = resolvedMode.value
      if (mode === 'jalaali') {
        const jd = jalaali.toJalaali(displayDate.value)
        return JALAALI_MONTHS[jd.jm - 1]
      } else {
        return displayDate.value.toLocaleString(opts.value.locale || 'en-US', { month: 'long' })
      }
    })

    // Helper for value matching in Month picker
    const currentMonthValue = computed(() => {
       const mode = resolvedMode.value
       if (mode === 'jalaali') {
         return jalaali.toJalaali(displayDate.value).jm
       }
       return displayDate.value.getMonth() + 1
    })

    const displayYear = computed(() => {
      const mode = resolvedMode.value
      if (mode === 'jalaali') {
        return jalaali.toJalaali(displayDate.value).jy
      }
      return displayDate.value.getFullYear()
    })

    const currentYear = computed(() => displayDate.value.getFullYear())

    // --- Weekday Logic ---
    const dynamicWeekDays = computed(() => {
      const mode = resolvedMode.value
      
      // Jalaali / Islamic: Start Sat (Shanbe)
      if (mode === 'jalaali' || mode === 'islamic') {
        const days = [
          { label: 'ش', full: 'شنبه', isRed: false },
          { label: 'ی', full: 'یکشنبه', isRed: false },
          { label: 'د', full: 'دوشنبه', isRed: false },
          { label: 'س', full: 'سه شنبه', isRed: false },
          { label: 'چ', full: 'چهارشنبه', isRed: false },
          { label: 'پ', full: 'پنج شنبه', isRed: false },
          { label: 'ج', full: 'جمعه', isRed: true }, // Friday
        ]
        return days
      }
      
      // Georgian: Start Sun or Mon based on assumption. Code used Sunday before.
      const enDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      return enDays.map((d, i) => ({
        label: d,
        isRed: i === 0 // Sunday red
      }))
    })

    const customVars = computed(() => {
      return opts.value.color ? { '--dp-primary': opts.value.color } : {}
    })

    const isFixed = computed(() => !!opts.value.fixedTime)
    const canSwitchView = computed(() => !isFixed.value)

    // --- Initialization Logic ---
    
    // Initial load adjustment
    onMounted(() => {
      if (opts.value.monthOffset !== 0) {
        displayDate.value = addMonths(new Date(), opts.value.monthOffset)
      }
    })

    watch(() => opts.value.mode, (newMode) => {
      if (newMode === 'year') viewMode.value = 'year'
      else if (newMode === 'month') viewMode.value = 'month'
      else viewMode.value = 'day'
    }, { immediate: true })

    watch(() => opts.value.fixedTime, (val) => {
      if (!val || val === true) return
      try {
        const dt = new Date(val as string | Date)
        if (!isNaN(dt.getTime())) {
           displayDate.value = dt
        }
      } catch (e) { /* silent */ }
    }, { immediate: true })

    // --- Boundary Logic ---
    
    const minAllowedDate = computed(() => {
        let d = opts.value.minDate ? new Date(opts.value.minDate) : null
        if(d) d.setHours(0,0,0,0)

        if (opts.value.selectionMode === 'future') {
            const today = new Date(); today.setHours(0,0,0,0)
            if (!d || today > d) d = today
        }
        return d
    })

    const maxAllowedDate = computed(() => {
        let d = opts.value.maxDate ? new Date(opts.value.maxDate) : null
        if(d) d.setHours(23,59,59,999)

        if (opts.value.selectionMode === 'past') {
             const today = new Date(); today.setHours(23,59,59,999)
             if (!d || today < d) d = today
        }
        return d
    })

    // Navigation Guards
    const canGoPrev = computed(() => {
      if (isFixed.value) return false
      // Simple heuristic: check if start of prev month/year is valid
      // Accurate enough for UI toggling
      if (!minAllowedDate.value) return true
      
      const prev = viewMode.value === 'month' 
        ? addYears(displayDate.value, -1)
        : addMonths(displayDate.value, -1)
        
      // If the END of that period is less than min, block it? 
      // Simplified: Just allow if we aren't wildly out of bounds.
      return true 
    })

    const canGoNext = computed(() => {
      if (isFixed.value) return false
      if (!maxAllowedDate.value) return true
      return true
    })

    // --- Grid Generation ---

    const isHolidayCheck = (dt: Date) => {
      return (opts.value.holidays || []).some(h => {
        const hDt = new Date(h)
        return isSameDay(hDt, dt)
      })
    }

    const generateGrid = (basisDate: Date) => {
      const mode = resolvedMode.value
      const today = new Date()
      const days = []

      // 1. Determine Start Date of the Grid
      let startGridDate: Date

      if (mode === 'jalaali') {
        const j = jalaali.toJalaali(basisDate)
        // First day of Jalaali Month
        const firstDayG = jalaali.toGregorian(j.jy, j.jm, 1)
        const firstDayDate = new Date(firstDayG.gy, firstDayG.gm - 1, firstDayG.gd)
        
        // Jalaali Week: Sat=0, Sun=1 ... Fri=6
        // JS Date: Sun=0, Mon=1 ... Sat=6
        const jsWeekday = firstDayDate.getDay() 
        // Convert JS weekday to Jalaali index (Sat=0)
        // Sat(6)->0, Sun(0)->1, Mon(1)->2 ... Fri(5)->6
        const jalaaliWeekdayIndex = jsWeekday === 6 ? 0 : jsWeekday + 1
        
        // Subtract days to get to start of grid (Saturday)
        const offset = jalaaliWeekdayIndex
        startGridDate = new Date(firstDayDate)
        startGridDate.setDate(firstDayDate.getDate() - offset)
        
        const targetMonth = j.jm

        // 2. Iterate 42 cells
        let curr = new Date(startGridDate)
        for (let i = 0; i < 42; i++) {
             const cJ = jalaali.toJalaali(curr)
             const isCurrentMonth = cJ.jm === targetMonth
             
             fillDay(days, curr, isCurrentMonth, today)
             // Next day
             curr.setDate(curr.getDate() + 1)
        }

      } else {
        // Gregorian / Islamic (Fallback)
        // Start of month
        const firstDayDate = new Date(basisDate.getFullYear(), basisDate.getMonth(), 1)
        const jsWeekday = firstDayDate.getDay() // Sun=0
        
        // If mode is Georgian, usually start on Sun=0. 
        startGridDate = new Date(firstDayDate)
        startGridDate.setDate(firstDayDate.getDate() - jsWeekday)
        
        const targetMonth = basisDate.getMonth()
        
        let curr = new Date(startGridDate)
        for (let i = 0; i < 42; i++) {
             const isCurrentMonth = curr.getMonth() === targetMonth
             fillDay(days, curr, isCurrentMonth, today)
             curr.setDate(curr.getDate() + 1)
        }
      }
      return days
    }

    const fillDay = (daysArr: any[], curr: Date, isCurrentMonth: boolean, today: Date) => {
         const mode = resolvedMode.value
         const copy = cloneDate(curr)
         
         const isSelected = selectedDt.value ? isSameDay(copy, selectedDt.value) : false
         const isToday = isSameDay(copy, today)
         
         let isDisabled = false
         if (minAllowedDate.value && copy < minAllowedDate.value && !isSameDay(copy, minAllowedDate.value)) isDisabled = true
         if (maxAllowedDate.value && copy > maxAllowedDate.value && !isSameDay(copy, maxAllowedDate.value)) isDisabled = true
         if (!isCurrentMonth) isDisabled = true // Visual preference usually

         const isHoliday = isHolidayCheck(copy)

         // Event matching
         const eventMatch = (opts.value.events || []).find(e => {
            return isSameDay(new Date(e.date), copy)
         })

         // Label
         let label = copy.getDate().toString()
         if (mode === 'jalaali') {
            label = jalaali.toJalaali(copy).jd.toString()
            if (opts.value.locale === 'fa') { // Force persian nums for Jalaali mode
                label = toPersianNum(label)
            }
         } else if (opts.value.locale === 'fa') {
             label = toPersianNum(label)
         }

         daysArr.push({
            date: copy,
            label,
            isCurrentMonth,
            isToday,
            isSelected,
            isDisabled,
            isHoliday,
            eventCount: eventMatch ? (eventMatch.count || 1) : 0
         })
    }

    // Reactivity for Grids
    // We calculate these on the fly based on displayDate
    const currentGrid = computed(() => generateGrid(displayDate.value))
    const prevGrid = computed(() => generateGrid(addMonths(displayDate.value, -1)))
    const nextGrid = computed(() => generateGrid(addMonths(displayDate.value, 1)))

    // --- Slider Logic ---
    const sliderStyle = computed(() => {
      const isRTL = dir.value === 'rtl'
      let base = isRTL ? 33.333333 : -33.333333
      let move = 0
      if (isAnimating.value) {
        if (slideOffset.value === 1) move = isRTL ? -33.333333 : 33.333333
        if (slideOffset.value === -1) move = isRTL ? 33.333333 : -33.333333
      }
      return { transform: `translateX(${base + move}%)` }
    })

    const triggerSlide = (direction: 'next' | 'prev') => {
      if (isAnimating.value) return
      if (direction === 'next' && !canGoNext.value) return
      if (direction === 'prev' && !canGoPrev.value) return
      
      isAnimating.value = true
      slideOffset.value = direction === 'next' ? -1 : 1
    }

    const onTransitionEnd = async (e: Event) => {
      if (e.target !== e.currentTarget) return
      if (!isAnimating.value) return
      
      isSilent.value = true
      // Commit change
      if (slideOffset.value === -1) displayDate.value = addMonths(displayDate.value, 1)
      else if (slideOffset.value === 1) displayDate.value = addMonths(displayDate.value, -1)
      
      isAnimating.value = false
      slideOffset.value = 0
      await nextTick()
      requestAnimationFrame(() => { requestAnimationFrame(() => { isSilent.value = false }) })
    }

    const handleNavigation = (direction: 'prev' | 'next') => {
      if (viewMode.value === 'year') return
      
      if (viewMode.value === 'month') {
        const amount = direction === 'next' ? 1 : -1
        displayDate.value = addYears(displayDate.value, amount)
      } else {
        triggerSlide(direction)
      }
    }

    // --- Selections ---

    const selectDate = (dt: Date) => {
      const d = cloneDate(dt)
      // Apply Time
      const h = parseInt(timeInputs.value.hour.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())) || 0
      const m = parseInt(timeInputs.value.minute.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())) || 0
      d.setHours(h, m)
      
      emitUpdate(d)
    }

    const selectMonth = (monthVal: number) => {
       // monthVal is 1-indexed
       const mode = resolvedMode.value
       if (mode === 'jalaali') {
          const j = jalaali.toJalaali(displayDate.value)
          // Keep Year, Change Month, Keep Day (clamped)
          const daysInNew = jalaali.jalaaliMonthLength(j.jy, monthVal)
          const newDay = Math.min(j.jd, daysInNew)
          const g = jalaali.toGregorian(j.jy, monthVal, newDay)
          displayDate.value = new Date(g.gy, g.gm - 1, g.gd)
       } else {
          const d = cloneDate(displayDate.value)
          d.setMonth(monthVal - 1) 
          displayDate.value = d
       }
       
       if (opts.value.mode === 'month') emitUpdate(displayDate.value)
       else viewMode.value = 'day'
    }

    const selectYear = (yearVal: number) => {
       const mode = resolvedMode.value
       if (mode === 'jalaali') {
          const j = jalaali.toJalaali(displayDate.value)
          const daysInNew = jalaali.jalaaliMonthLength(yearVal, j.jm)
          const newDay = Math.min(j.jd, daysInNew)
          const g = jalaali.toGregorian(yearVal, j.jm, newDay)
          displayDate.value = new Date(g.gy, g.gm - 1, g.gd)
       } else {
          const d = cloneDate(displayDate.value)
          d.setFullYear(yearVal)
          displayDate.value = d
       }

       if (opts.value.mode === 'year') emitUpdate(displayDate.value)
       else viewMode.value = 'month'
    }

    const emitUpdate = (dt: Date) => {
      selectedDt.value = dt
      emit('update:modelValue', dt)
    }

    // --- Time Handling ---
    
    const updateTime = (amt: number, unit: 'hour' | 'minute') => {
      const currentValStr = timeInputs.value[unit].replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())
      let val = parseInt(currentValStr) || 0
      val += amt
      const max = unit === 'hour' ? 23 : 59
      if (val > max) val = 0
      if (val < 0) val = max

      const padded = val.toString().padStart(2, '0')
      timeInputs.value[unit] = (opts.value.locale === 'fa' || resolvedMode.value === 'jalaali') ? toPersianNum(padded) : padded
      
      if (selectedDt.value) selectDate(selectedDt.value)
    }

    const validateTime = (unit: 'hour' | 'minute') => {
      const currentValStr = timeInputs.value[unit].replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())
      let val = parseInt(currentValStr) || 0
      const max = unit === 'hour' ? 23 : 59
      val = Math.max(0, Math.min(max, val))
      
      const padded = val.toString().padStart(2, '0')
      timeInputs.value[unit] = (opts.value.locale === 'fa' || resolvedMode.value === 'jalaali') ? toPersianNum(padded) : padded

      if (selectedDt.value) selectDate(selectedDt.value)
    }

    // --- List Generators ---

    const monthsList = computed(() => {
        const mode = resolvedMode.value
        const today = new Date()
        const jToday = jalaali.toJalaali(today)
        const currentJ = jalaali.toJalaali(displayDate.value)

        if (mode === 'jalaali') {
            return JALAALI_MONTHS.map((m, i) => ({
                label: m,
                value: i + 1,
                isCurrent: (i + 1) === jToday.jm && currentJ.jy === jToday.jy
            }))
        } else {
            return GREGORIAN_MONTHS.map((m, i) => ({
                label: m, // Could use locale here if desired
                value: i + 1,
                isCurrent: i === today.getMonth() && displayDate.value.getFullYear() === today.getFullYear()
            }))
        }
    })

    const yearsList = computed(() => {
        const mode = resolvedMode.value
        const list = []
        
        if (mode === 'jalaali') {
            const j = jalaali.toJalaali(displayDate.value)
            const currentYear = j.jy
            for (let y = currentYear - 10; y <= currentYear + 10; y++) {
                list.push({
                    value: y,
                    label: opts.value.locale === 'fa' ? toPersianNum(y) : String(y),
                    isCurrent: y === currentYear
                })
            }
        } else {
            const currentYear = displayDate.value.getFullYear()
             for (let y = currentYear - 10; y <= currentYear + 10; y++) {
                list.push({
                    value: y,
                    label: opts.value.locale === 'fa' ? toPersianNum(y) : String(y),
                    isCurrent: y === currentYear
                })
            }
        }
        return list
    })

    const selectedYear = computed(() => {
        if (!selectedDt.value) return null
        if (resolvedMode.value === 'jalaali') return jalaali.toJalaali(selectedDt.value).jy
        return selectedDt.value.getFullYear()
    })

    // --- Watchers ---
    watch(() => props.modelValue, (val) => {
        if (!val) {
            selectedDt.value = null
            return
        }
        const d = new Date(val)
        if (isNaN(d.getTime())) return

        selectedDt.value = d
        
        const h = d.getHours().toString().padStart(2, '0')
        const m = d.getMinutes().toString().padStart(2, '0')
        
        const usePersian = opts.value.locale === 'fa' || resolvedMode.value === 'jalaali'
        timeInputs.value.hour = usePersian ? toPersianNum(h) : h
        timeInputs.value.minute = usePersian ? toPersianNum(m) : m

        if (!opts.value.fixedTime && !opts.value.monthOffset) {
             // Logic to jump to the selected date if it's not in view
             // Simple check: are we in same month?
             const mode = resolvedMode.value
             if (mode === 'jalaali') {
                 const dJ = jalaali.toJalaali(d)
                 const viewJ = jalaali.toJalaali(displayDate.value)
                 if (dJ.jy !== viewJ.jy || dJ.jm !== viewJ.jm) {
                     displayDate.value = d
                 }
             } else {
                 if (d.getFullYear() !== displayDate.value.getFullYear() || d.getMonth() !== displayDate.value.getMonth()) {
                     displayDate.value = d
                 }
             }
        }

    }, { immediate: true })

    const onViewSwitch = () => {
       // Logic to scroll year grid to center
       if (viewMode.value === 'year') {
           const target = selectedYear.value || (resolvedMode.value === 'jalaali' ? jalaali.toJalaali(new Date()).jy : new Date().getFullYear())
           const el = yearGridRef.value?.querySelector(`[data-year="${target}"]`)
           el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
       }
    }

    const getDayClasses = (dayObj: any) => ({
      'is-today': dayObj.isToday,
      'is-selected': dayObj.isSelected,
      'is-other-month': !dayObj.isCurrentMonth,
      'is-disabled': dayObj.isDisabled,
      'is-holiday': dayObj.isHoliday
    })

    return {
      displayYear, selectedYear, toPersianNum, currentMonthValue,
      viewMode, displayDate, selectedDt, currentYear, currentMonthName,
      dynamicWeekDays, prevGrid, currentGrid, nextGrid, monthsList, yearsList, timeInputs, customVars,
      canSwitchView, yearGridRef, handleNavigation, selectDate, selectMonth, selectYear,
      updateTime, validateTime, getDayClasses,
      sliderStyle, isAnimating, onTransitionEnd, triggerSlide, isSilent, onViewSwitch,
      isFixed, opts, canGoPrev, canGoNext, dir
    }
  }
})
</script>
<style scoped>
@import '@/assets/css/calendar.css';

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