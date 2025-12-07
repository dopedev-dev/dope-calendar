<template>
  <div class="dope-date-picker" :class="{ 'dp-allow-transitions': !isAnimating && !isSilent }" :dir="dir" :style="customVars">
    <!-- Header -->
    <div class="dp-header">
      <slot name="prev" :trigger="() => canGoPrev && handleNavigation('prev')" :disabled="!canGoPrev" v-if="!isFixed">
        <button 
          class="dp-nav-btn" 
          :class="{ 'dp-nav-hide': viewMode === 'year' }"
          @click="handleNavigation('prev')" 
          :disabled="!canGoPrev"
          type="button"
        >
          <svg v-if="dir === 'rtl'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 256"><path fill="currentColor" d="m90.34 202.34l80-80a8 8 0 0 0 0-11.32l-80-80a8 8 0 0 0-11.32 11.32L159.03 128l-80 80a8 8 0 0 0 11.31 11.34Z"/></svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 256"><path fill="currentColor" d="M165.66 202.34a8 8 0 0 1-11.32 11.32l-80-80a8 8 0 0 1 0-11.32l80-80a8 8 0 0 1 11.32 11.32L96.97 128Z"/></svg>
        </button>
      </slot>
      
      <div class="dp-title-group">
        <button 
          v-if="viewMode === 'day'" 
          class="dp-title-btn" 
          @click="canSwitchView && (viewMode = 'month')"
          :disabled="isFixed || !opts.enableMonthPicker"
          type="button"
        >
          {{ currentMonthName }}
        </button>
        
        <button 
          class="dp-title-btn" 
          @click="canSwitchView && (viewMode = 'year')"
          :disabled="isFixed || !opts.enableYearPicker"
          type="button"
        >
          {{ currentYear }}
        </button>
      </div>

      <slot name="next" :trigger="() => canGoNext && handleNavigation('next')" :disabled="!canGoNext" v-if="!isFixed">
        <button 
          class="dp-nav-btn" 
          :class="{ 'dp-nav-hide': viewMode === 'year' }"
          @click="handleNavigation('next')" 
          :disabled="!canGoNext"
          type="button"
        >
          <svg v-if="dir === 'rtl'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 256"><path fill="currentColor" d="M165.66 202.34a8 8 0 0 1-11.32 11.32l-80-80a8 8 0 0 1 0-11.32l80-80a8 8 0 0 1 11.32 11.32L96.97 128Z"/></svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 256"><path fill="currentColor" d="m90.34 202.34l80-80a8 8 0 0 0 0-11.32l-80-80a8 8 0 0 0-11.32 11.32L159.03 128l-80 80a8 8 0 0 0 11.31 11.34Z"/></svg>
        </button>
      </slot>
    </div>

    <!-- Body Viewport -->
    <div class="dp-body">
      <Transition name="dp-fade" mode="out-in" @after-enter="onViewSwitch">
        
        <!-- Day View (Sliding Carousel) -->
        <div v-if="viewMode === 'day'" class="dp-viewport" key="day">
          
          <!-- Static Header -->
          <div class="dp-weekdays">
            <div 
              v-for="(day, index) in dynamicWeekDays" 
              :key="index" 
              class="dp-weekday"
              :class="{ 'is-holiday-header': day.isRed }"
            >
              {{ day.label }}
            </div>
          </div>

          <!-- Slider (300% width) -->
          <div 
            class="dp-slider" 
            :class="{ 'is-animating': isAnimating }"
            :style="sliderStyle"
            @transitionend="onTransitionEnd"
          >
            <!-- Previous Month -->
            <div class="dp-slide-pane">
              <div class="dp-grid">
                <div v-for="(dayObj, i) in prevGrid" :key="'p'+i" class="dp-cell-wrapper">
                  <div 
                    class="dp-cell" 
                    :class="getDayClasses(dayObj)"
                    @click="!dayObj.isDisabled && selectDate(dayObj.date)"
                  >
                      <span class="dp-cell-text">{{ dayObj.label }}</span>
                      <div v-if="dayObj.eventCount > 0" class="dp-event-dot"></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Current Month -->
            <div class="dp-slide-pane">
              <div class="dp-grid">
                <div v-for="(dayObj, i) in currentGrid" :key="'c'+i" class="dp-cell-wrapper">
                  <div 
                    class="dp-cell" 
                    :class="getDayClasses(dayObj)"
                    @click="!dayObj.isDisabled && selectDate(dayObj.date)"
                  >
                    <span class="dp-cell-text">{{ dayObj.label }}</span>
                    <div v-if="dayObj.eventCount > 0" class="dp-event-dot"></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Next Month -->
            <div class="dp-slide-pane">
              <div class="dp-grid">
                <div v-for="(dayObj, i) in nextGrid" :key="'n'+i" class="dp-cell-wrapper">
                  <div 
                    class="dp-cell" 
                    :class="getDayClasses(dayObj)"
                    @click="!dayObj.isDisabled && selectDate(dayObj.date)"
                  >
                      <span class="dp-cell-text">{{ dayObj.label }}</span>
                      <div v-if="dayObj.eventCount > 0" class="dp-event-dot"></div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        <!-- Month View -->
        <div v-else-if="viewMode === 'month'" class="dp-view-month" key="month">
          <div class="dp-month-grid">
            <div 
              v-for="(m, index) in monthsList" 
              :key="index"
              class="dp-option-cell"
              :class="{
                'is-selected': m.value === displayDate.month,
                'is-current': m.isCurrent
              }"
              @click="selectMonth(m.value)"
            >
              {{ m.label }}
            </div>
          </div>
        </div>

        <!-- Year View -->
        <div v-else-if="viewMode === 'year'" class="dp-view-year" key="year">
          <div class="dp-year-grid" ref="yearGridRef">
            <div 
              v-for="year in yearsList" 
              :key="year"
              class="dp-option-cell"
              :data-year="year"
              :class="{
                'is-selected': year === displayDate.year,
                'is-current': year === now.year
              }"
              @click="selectYear(year)"
            >
              {{ year }}
            </div>
          </div>
        </div>

      </Transition>
    </div>

    <!-- Time Picker -->
    <div v-if="opts.enableTimePicker" class="dp-footer">
      <div class="dp-time-wrapper">
        <div class="dp-time-col">
          <button class="dp-icon-btn" @click="updateTime(1, 'hour')" type="button">▲</button>
          <input 
            class="dp-time-input" 
            type="text" 
            v-model="timeInputs.hour" 
            @blur="validateTime('hour')"
            @keydown.enter="validateTime('hour')"
          />
          <button class="dp-icon-btn" @click="updateTime(-1, 'hour')" type="button">▼</button>
        </div>
        <span class="dp-time-sep">:</span>
        <div class="dp-time-col">
          <button class="dp-icon-btn" @click="updateTime(1, 'minute')" type="button">▲</button>
          <input 
            class="dp-time-input" 
            type="text" 
            v-model="timeInputs.minute" 
            @blur="validateTime('minute')"
            @keydown.enter="validateTime('minute')"
          />
          <button class="dp-icon-btn" @click="updateTime(-1, 'minute')" type="button">▼</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, nextTick, type PropType } from 'vue'
import { DateTime, Info } from 'luxon'

export interface CalendarEvent {
  date: Date | string
  count?: number
}

// Updated Interface with dateMode
export interface DatePickerOptions {
  dateMode?: 'georgian' | 'jalaali' | 'islamic'
  mode?: 'date' | 'month' | 'year' 
  locale?: string // Optional override
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
    // Restored the single options object prop to match your App.vue usage
    options: {
      type: Object as PropType<DatePickerOptions>,
      default: () => ({})
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    // Default Options
    const defaultOptions: DatePickerOptions = {
      dateMode: 'georgian',
      mode: 'date',
      // Locale will be derived from dateMode if not provided
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

    // Merge Props
    const opts = computed(() => ({ ...defaultOptions, ...props.options }))

    // Resolve Luxon Configuration based on dateMode
    const luxonConfig = computed(() => {
      const mode = opts.value.dateMode || 'georgian'
      let outputCalendar = 'gregory'
      let locale = opts.value.locale || 'en' // Default fallback

      if (mode === 'jalaali') {
        outputCalendar = 'persian'
        // Default to Farsi if locale not explicitly set
        if (!props.options.locale) locale = 'fa' 
      } else if (mode === 'islamic') {
        outputCalendar = 'islamic'
        // Default to Arabic if locale not explicitly set
        if (!props.options.locale) locale = 'ar'
      }

      return { outputCalendar, locale }
    })

    const dir = computed(() => opts.value.dir || (opts.value.dateMode === 'jalaali' || opts.value.dateMode === 'islamic' ? 'rtl' : 'ltr'))

    // Reactive State
    const now = computed(() => DateTime.now().reconfigure(luxonConfig.value as any))
    
    // We need displayDate to be a Ref that we can mutate, but initialized with config
    const displayDate = ref<DateTime>(DateTime.now().reconfigure(luxonConfig.value as any).plus({ months: opts.value.monthOffset }))
    const selectedDt = ref<DateTime | null>(null)
    const viewMode = ref<'day' | 'month' | 'year'>('day')
    const timeInputs = ref({ hour: '12', minute: '00' })
    const yearGridRef = ref<HTMLElement | null>(null)
    
    // Animation State
    const isAnimating = ref(false)
    const isSilent = ref(false)
    const slideOffset = ref(0) 

    const customVars = computed(() => {
      return opts.value.color ? { '--dp-primary': opts.value.color } : {}
    })

    const isFixed = computed(() => !!opts.value.fixedTime)
    const canSwitchView = computed(() => !isFixed.value)
    const currentMonthName = computed(() => displayDate.value.toFormat('MMMM'))
    const currentYear = computed(() => displayDate.value.toFormat('yyyy'))

    // Initialize View Mode based on Mode Prop
    watch(() => opts.value.mode, (newMode) => {
      if (newMode === 'year') viewMode.value = 'year'
      else if (newMode === 'month') viewMode.value = 'month'
      else viewMode.value = 'day'
    }, { immediate: true })

    // Reconfigure displayDate when config changes (e.g. switching dateMode)
    watch(luxonConfig, (newConf) => {
        // Keep the same point in time, just change calendar system
        displayDate.value = displayDate.value.reconfigure(newConf as any)
        if (selectedDt.value) {
            selectedDt.value = selectedDt.value.reconfigure(newConf as any)
        }
    })

    // Fixed Time Logic 
    watch(() => opts.value.fixedTime, (val) => {
      if (!val || val === true) return
      try {
        let dt = val instanceof Date ? DateTime.fromJSDate(val) : DateTime.fromISO(val as string)
        if (dt.isValid) {
          dt = dt.reconfigure(luxonConfig.value as any)
          displayDate.value = dt
        }
      } catch (e) { /* silent */ }
    }, { immediate: true })

    // --- Boundary Logic ---
    const minAllowedDate = computed(() => {
      // Base 'now' for comparison
      const n = DateTime.now().reconfigure(luxonConfig.value as any)
      
      let d = opts.value.minDate ? DateTime.fromJSDate(opts.value.minDate).reconfigure(luxonConfig.value as any) : null
      
      if (opts.value.selectionMode === 'future') {
        const startOfToday = n.startOf('day')
        // if explicit minDate is set, use the later of the two
        if (!d || startOfToday > d) d = startOfToday
      }
      return d
    })

    const maxAllowedDate = computed(() => {
      const n = DateTime.now().reconfigure(luxonConfig.value as any)
      
      let d = opts.value.maxDate ? DateTime.fromJSDate(opts.value.maxDate).reconfigure(luxonConfig.value as any) : null
      
      if (opts.value.selectionMode === 'past') {
        const endOfToday = n.endOf('day')
        // if explicit maxDate is set, use the earlier of the two
        if (!d || endOfToday < d) d = endOfToday
      }
      return d
    })

    // --- Navigation Guard Logic ---
    const canGoPrev = computed(() => {
      if (isFixed.value) return false
      
      let targetEnd: DateTime
      
      if (viewMode.value === 'day') {
        targetEnd = displayDate.value.minus({ months: 1 }).endOf('month')
      } else if (viewMode.value === 'month') {
        targetEnd = displayDate.value.minus({ years: 1 }).endOf('year')
      } else {
        return true
      }

      if (minAllowedDate.value && targetEnd < minAllowedDate.value) return false
      return true
    })

    const canGoNext = computed(() => {
      if (isFixed.value) return false

      let targetStart: DateTime

      if (viewMode.value === 'day') {
        targetStart = displayDate.value.plus({ months: 1 }).startOf('month')
      } else if (viewMode.value === 'month') {
        targetStart = displayDate.value.plus({ years: 1 }).startOf('year')
      } else {
        return true
      }

      if (maxAllowedDate.value && targetStart > maxAllowedDate.value) return false
      return true
    })

    // --- Week Start Calculation Helper ---
    // Returns the explicit start of the week relative to the basis date
    // Georgian: Monday Start (ISO 1)
    // Jalaali/Islamic: Saturday Start (ISO 6)
    const getStartOfWeek = (basis: DateTime) => {
      const mode = opts.value.dateMode || 'georgian'
      
      if (mode === 'georgian') {
         // Goal: Monday Start.
         // Luxon (ISO): 1=Mon, 7=Sun.
         // To get to Monday (1), we subtract (weekday - 1) days.
         // e.g. Mon(1) -> -0 days. Tue(2) -> -1 day.
         return basis.minus({ days: basis.weekday - 1 })
      } else {
         // Goal: Saturday Start (Jalaali/Islamic)
         // Luxon (ISO): 1=Mon, ... 5=Fri, 6=Sat, 7=Sun.
         // We want Sat(6) to be index 0.
         // Sat(6) -> offset 0.
         // Sun(7) -> offset 1.
         // Mon(1) -> offset 2.
         // ...
         // Fri(5) -> offset 6.
         // Formula: (weekday + 1) % 7
         const offset = (basis.weekday + 1) % 7
         return basis.minus({ days: offset })
      }
    }

    // --- Dynamic Header ---
    const dynamicWeekDays = computed(() => {
      const startOfMonth = displayDate.value.startOf('month')
      // Use helper instead of generic startOf('week')
      const startGrid = getStartOfWeek(startOfMonth)
      
      const headers = []
      for (let i = 0; i < 7; i++) {
        const d = startGrid.plus({ days: i })
        
        // Determine "Red" day: Friday for Jalaali/Islamic, Sunday for Georgian
        let isRed = false
        if (opts.value.dateMode === 'georgian') {
           // Gregorian: Sunday is holiday (Red)
           // Luxon Gregorian: 7 is Sunday.
           isRed = d.weekday === 7
        } else {
           // Jalaali/Islamic: Friday is holiday (Red)
           // Luxon Persian/Islamic: 5 is Friday.
           isRed = d.weekday === 5
        }
        
        headers.push({
          label: d.toFormat('ccc'), 
          isRed
        })
      }
      return headers
    })

    const isHolidayCheck = (dt: DateTime) => {
      return (opts.value.holidays || []).some(h => {
        const hDt = h instanceof Date ? DateTime.fromJSDate(h) : DateTime.fromISO(h)
        return hDt.hasSame(dt, 'day')
      })
    }

    const generateGrid = (basisDate: DateTime) => {
      const startOfMonth = basisDate.startOf('month')
      // Use helper to ensure grid aligns with headers
      const startGrid = getStartOfWeek(startOfMonth)
      const days = []
      let curr = startGrid
      
      const n = DateTime.now().reconfigure(luxonConfig.value as any)
      const currentStartOfDay = n.startOf('day')
      const currentEndOfDay = n.endOf('day')

      for (let i = 0; i < 42; i++) {
        const eventMatch = (opts.value.events || []).find(e => {
          const eDate = e.date instanceof Date ? DateTime.fromJSDate(e.date) : DateTime.fromISO(e.date as string)
          return eDate.hasSame(curr, 'day')
        })

        const isCurrentMonth = curr.hasSame(basisDate, 'month')
        
        const isSelected = selectedDt.value 
          ? (curr.hasSame(selectedDt.value, 'day') && isCurrentMonth) 
          : false
          
        const isToday = curr.hasSame(n, 'day')
        
        let isDisabled = false
        
        // 1. Min/Max Logic
        if (opts.value.minDate && curr < DateTime.fromJSDate(opts.value.minDate).startOf('day')) isDisabled = true
        if (opts.value.maxDate && curr > DateTime.fromJSDate(opts.value.maxDate).endOf('day')) isDisabled = true

        // 2. Selection Mode Logic
        if (opts.value.selectionMode === 'future' && curr < currentStartOfDay) isDisabled = true
        if (opts.value.selectionMode === 'past' && curr > currentEndOfDay) isDisabled = true

        // 3. Other Month Restriction
        if (!isCurrentMonth) isDisabled = true

        const isHoliday = isHolidayCheck(curr)

        days.push({
          date: curr,
          label: curr.toFormat('d'),
          isCurrentMonth,
          isToday,
          isSelected,
          isDisabled,
          isHoliday,
          eventCount: eventMatch ? (eventMatch.count || 1) : 0
        })
        curr = curr.plus({ days: 1 })
      }
      return days
    }

    const currentGrid = computed(() => generateGrid(displayDate.value))
    const prevGrid = computed(() => generateGrid(displayDate.value.minus({ months: 1 })))
    const nextGrid = computed(() => generateGrid(displayDate.value.plus({ months: 1 })))

    // --- Slider Style Logic (RTL Fixed) ---
    const sliderStyle = computed(() => {
      const isRTL = dir.value === 'rtl'
      
      // LTR: Base -33% (Middle). Next (-1) -> -66% (Left). Prev (1) -> 0% (Right).
      // RTL: Base +33% (Middle). Next (-1) -> +66% (Left?). Prev (1) -> 0% (Right).
      
      let base = isRTL ? 33.333333 : -33.333333
      let move = 0
      
      if (isAnimating.value) {
        if (slideOffset.value === 1) {
           // Prev
           move = isRTL ? -33.333333 : 33.333333
        }
        if (slideOffset.value === -1) {
           // Next
           move = isRTL ? 33.333333 : -33.333333
        }
      }
      return { transform: `translateX(${base + move}%)` }
    })

    const triggerSlide = (dir: 'next' | 'prev') => {
      if (isAnimating.value) return
      if (dir === 'next' && !canGoNext.value) return
      if (dir === 'prev' && !canGoPrev.value) return
      isAnimating.value = true
      slideOffset.value = dir === 'next' ? -1 : 1
    }

    const onTransitionEnd = async (e: Event) => {
      if (e.target !== e.currentTarget) return
      if (!isAnimating.value) return
      isSilent.value = true
      if (slideOffset.value === -1) displayDate.value = displayDate.value.plus({ months: 1 })
      else if (slideOffset.value === 1) displayDate.value = displayDate.value.minus({ months: 1 })
      isAnimating.value = false
      slideOffset.value = 0
      await nextTick()
      requestAnimationFrame(() => { requestAnimationFrame(() => { isSilent.value = false }) })
    }

    const handleNavigation = (dir: 'prev' | 'next') => {
      if (viewMode.value === 'year') return 
      if (dir === 'prev' && !canGoPrev.value) return
      if (dir === 'next' && !canGoNext.value) return

      if (viewMode.value === 'month') {
        const amount = dir === 'next' ? 1 : -1
        displayDate.value = displayDate.value.plus({ years: amount })
      } else {
        triggerSlide(dir)
      }
    }

    // --- Time & Selection Logic ---
    const selectDate = (dt: DateTime) => {
      const hour = parseInt(timeInputs.value.hour) || 0
      const minute = parseInt(timeInputs.value.minute) || 0
      const newDt = dt.set({ hour, minute })
      emitUpdate(newDt)
    }

    const selectMonth = (month: number) => { 
      displayDate.value = displayDate.value.set({ month })
      if (opts.value.mode === 'month') {
        emitUpdate(displayDate.value)
      } else {
        viewMode.value = 'day'
      }
    }

    const selectYear = (year: number) => { 
      displayDate.value = displayDate.value.set({ year })
      if (opts.value.mode === 'year') {
        emitUpdate(displayDate.value)
      } else {
        viewMode.value = 'month'
      }
    }
    
    const updateTime = (amt: number, unit: 'hour'|'minute') => {
       let val = parseInt(timeInputs.value[unit]) || 0; val += amt;
       const max = unit === 'hour' ? 23 : 59;
       if (val > max) val = 0; if (val < 0) val = max;
       timeInputs.value[unit] = val.toString().padStart(2, '0');
       if(selectedDt.value) selectDate(selectedDt.value)
    }
    const validateTime = (unit: 'hour'|'minute') => {
       let val = parseInt(timeInputs.value[unit]) || 0;
       const max = unit === 'hour' ? 23 : 59;
       val = Math.max(0, Math.min(max, val));
       timeInputs.value[unit] = val.toString().padStart(2, '0');
       if(selectedDt.value) selectDate(selectedDt.value)
    }

    const parseModelValue = (val: Date|string|null) => {
       if(!val) return null
       try {
         let dt = val instanceof Date ? DateTime.fromJSDate(val) : DateTime.fromISO(val)
         return dt.isValid ? dt.reconfigure(luxonConfig.value as any) : null
       } catch {
         return null
       }
    }

    const emitUpdate = (dt: DateTime) => {
      selectedDt.value = dt
      emit('update:modelValue', dt.toJSDate())
    }

    // --- Computed Lists ---
    const monthsList = computed(() => {
      const months = Info.months('long', { locale: luxonConfig.value.locale, outputCalendar: luxonConfig.value.outputCalendar as any })
      return months.map((m, i) => ({
        label: m, value: i + 1, isCurrent: (i + 1) === now.value.month && displayDate.value.year === now.value.year
      }))
    })

    const yearsList = computed(() => {
      const currentRealYear = now.value.year
      const start = currentRealYear - 100
      const end = currentRealYear + 20
      const years = []
      for (let y = start; y <= end; y++) { years.push(y) }
      return years
    })

    // Watchers
    watch(() => props.modelValue, (val) => {
      const parsed = parseModelValue(val)
      if (parsed) {
        selectedDt.value = parsed
        timeInputs.value.hour = parsed.hour.toString().padStart(2, '0')
        timeInputs.value.minute = parsed.minute.toString().padStart(2, '0')
        if (!opts.value.fixedTime && !opts.value.monthOffset) {
           if (!parsed.hasSame(displayDate.value, 'month')) displayDate.value = parsed
        }
      } else {
        selectedDt.value = null 
      }
    }, { immediate: true })

    const onViewSwitch = () => {
      if (viewMode.value === 'year') {
         const targetYear = selectedDt.value ? selectedDt.value.year : now.value.year
         let el = yearGridRef.value?.querySelector(`[data-year="${targetYear}"]`)
         if (!el) el = yearGridRef.value?.querySelector(`[data-year="${now.value.year}"]`)
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
      now, viewMode, displayDate, selectedDt, currentYear, currentMonthName,
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

.dope-date-picker[dir="rtl"] { direction: rtl; }

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
.dp-nav-btn:hover:not(:disabled) { background: var(--dp-hover-bg); color: var(--dp-text); }
.dp-nav-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
  pointer-events: none;
}

.dp-title-group { display: flex; gap: 4px; }
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
.dp-title-btn:hover:not(:disabled) { background: var(--dp-hover-bg); color: var(--dp-primary); }

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
.dp-view-month, .dp-view-year { height: 100%; }
.dp-month-grid, .dp-year-grid {
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
.dp-option-cell:hover { background: var(--dp-hover-bg); color: var(--dp-primary); }
.dp-option-cell.is-selected { background: var(--dp-primary); color: var(--dp-primary-text); border-color: var(--dp-primary); }
.dp-option-cell.is-current { border-color: var(--dp-primary); color: var(--dp-primary); }
.dp-option-cell.is-selected.is-current { color: var(--dp-primary-text); }

/* Time Picker */
.dp-footer { border-top: 1px solid var(--dp-border); padding: var(--dp-padding); background: var(--dp-bg); }
.dp-time-wrapper { display: flex; justify-content: center; gap: 24px; }
.dp-time-col { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.dp-icon-btn { background: none; border: none; cursor: pointer; color: var(--dp-text); padding: 4px; display: flex; align-items: center; justify-content: center; opacity: 0.6; }
.dp-icon-btn:hover { opacity: 1; color: var(--dp-primary); }
.dp-time-input { width: 56px; height: 48px; text-align: center; border: none; border-radius: 12px; background: var(--dp-hover-bg); color: var(--dp-text); font-size: 1.25rem; font-weight: var(--dp-weight-bold); outline: none; transition: var(--dp-transition); }
.dp-time-input:focus { box-shadow: 0 0 0 2px var(--dp-primary); background: var(--dp-bg); }
.dp-time-sep { font-size: 2rem; font-weight: 700; color: var(--dp-text); padding-bottom: 8px; }

/* Transitions */
.dp-fade-enter-active, .dp-fade-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.dp-fade-enter-from { opacity: 0; transform: scale(0.95); }
.dp-fade-leave-to { opacity: 0; transform: scale(1.05); display: none; }

/* Nav Hide Animation */
.dp-nav-hide {
  transform: scale(0);
  opacity: 0;
  pointer-events: none;
}
</style>