<template>
  <div class="dope-date-picker" :dir="dir" :style="customVars">
    <!-- Header -->
    <div class="dp-header">
      <button v-if="!fixedTime" class="dp-nav-btn" @click="triggerSlide('prev')" type="button">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 256"><path fill="currentColor" d="M165.66 202.34a8 8 0 0 1-11.32 11.32l-80-80a8 8 0 0 1 0-11.32l80-80a8 8 0 0 1 11.32 11.32L96.97 128Z"/></svg>
      </button>
      
      <div class="dp-title-group">
        <button 
          v-if="viewMode === 'day'" 
          class="dp-title-btn" 
          @click="canSwitchView && (viewMode = 'month')"
          :disabled="!enableMonthPicker"
          type="button"
        >
          {{ currentMonthName }}
        </button>
        
        <button 
          class="dp-title-btn" 
          @click="canSwitchView && (viewMode = 'year')"
          :disabled="!enableYearPicker"
          type="button"
        >
          {{ currentYear }}
        </button>
      </div>

      <button v-if="!fixedTime" class="dp-nav-btn" @click="triggerSlide('next')" type="button">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 256"><path fill="currentColor" d="m90.34 202.34l80-80a8 8 0 0 0 0-11.32l-80-80a8 8 0 0 0-11.32 11.32L159.03 128l-80 80a8 8 0 0 0 11.31 11.34Z"/></svg>
      </button>
    </div>

    <!-- Body Viewport -->
    <div class="dp-body">
      <Transition name="dp-fade" mode="out-in">
        
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
            :class="{ 'is-animating': isAnimating, 'is-silent': isSilent }"
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
    <div v-if="enableTimePicker" class="dp-footer">
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

export default defineComponent({
  name: 'DatePicker',
  props: {
    modelValue: { type: [Date, String], default: null },
    locale: { type: String, default: 'en' },
    calendar: { type: String as PropType<'gregory' | 'persian' | 'islamic'>, default: 'gregory' },
    dir: { type: String as PropType<'ltr' | 'rtl'>, default: 'ltr' },
    minDate: Date,
    maxDate: Date,
    events: { type: Array as PropType<CalendarEvent[]>, default: () => [] },
    holidays: { type: Array as PropType<(Date | string)[]>, default: () => [] },
    enableTimePicker: { type: Boolean, default: false },
    enableYearPicker: { type: Boolean, default: true },
    enableMonthPicker: { type: Boolean, default: true },
    fixedTime: { type: Boolean, default: false },
    monthOffset: { type: Number, default: 0 },
    color: { type: String, default: '' }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const now = DateTime.now().reconfigure({ outputCalendar: props.calendar, locale: props.locale })
    const displayDate = ref<DateTime>(now.plus({ months: props.monthOffset }))
    const selectedDt = ref<DateTime | null>(null)
    const viewMode = ref<'day' | 'month' | 'year'>('day')
    const timeInputs = ref({ hour: '12', minute: '00' })
    const yearGridRef = ref<HTMLElement | null>(null)
    
    // Animation State
    const isAnimating = ref(false)
    const isSilent = ref(false)
    const slideOffset = ref(0) // -1 (Next), 0 (Current), 1 (Prev)

    const customVars = computed(() => {
      return props.color ? { '--dp-primary': props.color } : {}
    })

    const canSwitchView = computed(() => !props.fixedTime)
    const currentMonthName = computed(() => displayDate.value.toFormat('MMMM'))
    const currentYear = computed(() => displayDate.value.toFormat('yyyy'))
    
    // --- Dynamic Header ---
    const dynamicWeekDays = computed(() => {
      const startOfMonth = displayDate.value.startOf('month')
      const startGrid = startOfMonth.startOf('week')
      
      const headers = []
      for (let i = 0; i < 7; i++) {
        const d = startGrid.plus({ days: i })
        // Check for Friday (7 in Luxon Persian) ONLY if calendar is Persian
        const isPersianFri = props.calendar === 'persian' && d.weekday === 7
        
        headers.push({
          label: d.toFormat('ccc'), 
          isRed: isPersianFri
        })
      }
      return headers
    })

    const isHolidayCheck = (dt: DateTime) => {
      return props.holidays.some(h => {
        const hDt = h instanceof Date ? DateTime.fromJSDate(h) : DateTime.fromISO(h)
        return hDt.hasSame(dt, 'day')
      })
    }

    const generateGrid = (basisDate: DateTime) => {
      const startOfMonth = basisDate.startOf('month')
      const startGrid = startOfMonth.startOf('week')
      const days = []
      let curr = startGrid
      
      for (let i = 0; i < 42; i++) {
        const eventMatch = props.events.find(e => {
          const eDate = e.date instanceof Date ? DateTime.fromJSDate(e.date) : DateTime.fromISO(e.date as string)
          return eDate.hasSame(curr, 'day')
        })

        const isSelected = selectedDt.value ? curr.hasSame(selectedDt.value, 'day') : false
        const isToday = curr.hasSame(now, 'day')
        const isCurrentMonth = curr.hasSame(basisDate, 'month')
        
        let isDisabled = false
        if (props.minDate && curr < DateTime.fromJSDate(props.minDate).startOf('day')) isDisabled = true
        if (props.maxDate && curr > DateTime.fromJSDate(props.maxDate).endOf('day')) isDisabled = true

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

    // Grid Generation for Sliding
    const currentGrid = computed(() => generateGrid(displayDate.value))
    const prevGrid = computed(() => generateGrid(displayDate.value.minus({ months: 1 })))
    const nextGrid = computed(() => generateGrid(displayDate.value.plus({ months: 1 })))

    // --- Slider Style Logic ---
    const sliderStyle = computed(() => {
      let base = -33.333333
      let move = 0
      
      if (isAnimating.value) {
        if (slideOffset.value === 1) move = 33.333333  // Show Prev
        if (slideOffset.value === -1) move = -33.333333 // Show Next
      }

      return {
        transform: `translateX(${base + move}%)`
      }
    })

    const triggerSlide = (dir: 'next' | 'prev') => {
      if (isAnimating.value) return
      isAnimating.value = true
      
      // Logic for LTR
      if (dir === 'next') slideOffset.value = -1 
      else slideOffset.value = 1
    }

    const onTransitionEnd = async () => {
      if (!isAnimating.value) return
      
      // 1. Disable internal transitions (backgrounds, etc.)
      isSilent.value = true

      // 2. Update data
      if (slideOffset.value === -1) {
        displayDate.value = displayDate.value.plus({ months: 1 })
      } else if (slideOffset.value === 1) {
        displayDate.value = displayDate.value.minus({ months: 1 })
      }
      
      // 3. Reset Slider Position (Instant because isAnimating=false)
      isAnimating.value = false
      slideOffset.value = 0
      
      // 4. Wait for DOM update
      await nextTick()

      // 5. Re-enable transitions (Next Frame)
      requestAnimationFrame(() => {
         isSilent.value = false
      })
    }

    const handlePrev = () => {
      if (viewMode.value === 'day') triggerSlide('prev')
      else if (viewMode.value === 'year') displayDate.value = displayDate.value.minus({ years: 12 })
      else displayDate.value = displayDate.value.minus({ years: 1 })
    }

    const handleNext = () => {
      if (viewMode.value === 'day') triggerSlide('next')
      else if (viewMode.value === 'year') displayDate.value = displayDate.value.plus({ years: 12 })
      else displayDate.value = displayDate.value.plus({ years: 1 })
    }

    // --- Time & Selection Logic ---
    const selectDate = (dt: DateTime) => {
      const hour = parseInt(timeInputs.value.hour) || 0
      const minute = parseInt(timeInputs.value.minute) || 0
      const newDt = dt.set({ hour, minute })
      emitUpdate(newDt)
    }
    const selectMonth = (month: number) => { displayDate.value = displayDate.value.set({ month }); viewMode.value = 'day' }
    const selectYear = (year: number) => { displayDate.value = displayDate.value.set({ year }); viewMode.value = 'month' }
    
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
       let dt = val instanceof Date ? DateTime.fromJSDate(val) : DateTime.fromISO(val)
       return dt.isValid ? dt.reconfigure({ outputCalendar: props.calendar, locale: props.locale }) : null
    }

    const emitUpdate = (dt: DateTime) => {
      selectedDt.value = dt
      emit('update:modelValue', dt.toJSDate())
    }

    // --- Computed Lists ---
    const monthsList = computed(() => {
      const months = Info.months('long', { locale: props.locale, outputCalendar: props.calendar })
      return months.map((m, i) => ({
        label: m, value: i + 1, isCurrent: (i + 1) === now.month && displayDate.value.year === now.year
      }))
    })

    const yearsList = computed(() => {
      const currentY = displayDate.value.year
      const start = currentY - 100
      const end = currentY + 100
      const years = []
      for (let y = start; y <= end; y++) { years.push(y) }
      return years
    })

    watch(() => props.modelValue, (val) => {
      const parsed = parseModelValue(val)
      if (parsed) {
        selectedDt.value = parsed
        timeInputs.value.hour = parsed.hour.toString().padStart(2, '0')
        timeInputs.value.minute = parsed.minute.toString().padStart(2, '0')
        if (!props.fixedTime && !props.monthOffset) {
           if (!parsed.hasSame(displayDate.value, 'month')) displayDate.value = parsed
        }
      }
    }, { immediate: true })

    watch([() => props.locale, () => props.calendar], ([newLoc, newCal]) => {
      if (selectedDt.value) selectedDt.value = selectedDt.value.reconfigure({ locale: newLoc, outputCalendar: newCal })
      displayDate.value = displayDate.value.reconfigure({ locale: newLoc, outputCalendar: newCal })
    })

    watch(viewMode, async (mode) => {
      if (mode === 'year') {
        await nextTick()
        const el = yearGridRef.value?.querySelector('.is-selected') || yearGridRef.value?.querySelector('.is-current')
        el?.scrollIntoView({ block: 'center', behavior: 'auto' })
      }
    })

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
      canSwitchView, yearGridRef, handlePrev, handleNext, selectDate, selectMonth, selectYear,
      updateTime, validateTime, getDayClasses, 
      sliderStyle, isAnimating, onTransitionEnd, triggerSlide, isSilent
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
  /* No radius, no shadow */
  border-radius: var(--dp-radius);
  box-shadow: var(--dp-shadow);
  border: 1px solid var(--dp-border);
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
.dp-nav-btn:hover { background: var(--dp-hover-bg); color: var(--dp-text); }

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
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid transparent; 
  box-sizing: border-box;
}

/* SILENT UPDATE: Disable transition when swapping data to prevent flicker */
.dp-slider.is-silent .dp-cell {
  transition: none !important;
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

/* Holiday text color REMOVED for cells, only dots used */
.dp-cell.is-holiday:not(.is-selected) {
  /* color: var(--dp-holiday-text); */
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
  transition: var(--dp-transition);
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
</style>
