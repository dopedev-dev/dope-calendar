<template>
  <div :dir="config.dir" ref="calendar" class="calendar-wrapper dope-calendar-grid">
    <div @click="deselectItems" @mousedown.stop="deselectItems" class="header-container">
      <div class="header-padding" :style="{ width: sidebarWidth + 'px', minWidth: sidebarWidth + 'px' }"></div>
      
      <div ref="calendarHeader" @scroll="handleHeaderScroll" class="calendar-header hide-scrollbar">
        <div v-for="(day, index) in monthDays" :key="index" :class="{
          'day-cell': true,
          'weekend-day': isWeekend(day.weekDay) || isHoliday(day.date),
          'current-day': isCurrentDay(day.date)
        }">
          <div class="day-number" :style="{
            color: isHoliday(day.date) || isWeekend(day.weekDay)
              ? 'var(--dc-weekend-day-color)'
              : (isCurrentDay(day.date) ? 'var(--dc-current-day-color)' : 'var(--dc-day-number-color)'),
            fontSize: 'var(--dc-day-number-font-size)',
            fontWeight: 'var(--dc-day-number-font-weight)'
          }">
            {{ config.lang === 'fa' ? toPersianNum(day.day) : day.day }}
          </div>
          <div class="day-name" :style="{
            color: isWeekend(day.weekDay) || isHoliday(day.date)
              ? 'var(--dc-weekend-day-color)'
              : (isCurrentDay(day.date) ? 'var(--dc-current-day-color)' : 'var(--dc-day-name-color)'),
            fontSize: 'var(--dc-day-name-font-size)',
            fontWeight: 'var(--dc-day-name-font-weight)'
          }">
            {{ getDayTitle(day.weekDay) }}
          </div>
        </div>
      </div>
    </div>

    <div ref="contentContainer" class="content-container hide-scrollbar">
      <div :class="{ 'hours-column': true, 'hide-scrollbar': true, 'zoomable': config.zoom }"
        :style="{ height: calendarBodyHeight, width: sidebarWidth + 'px', minWidth: sidebarWidth + 'px' }" 
        @mousedown="handleZoomStart" @touchstart="handleZoomStart">
        <div v-for="(hour, index) in dayHoursList" :key="index" class="hour-label">
          {{ hour.display }}
        </div>
      </div>
      
      <div class="calendar-body hide-scrollbar" @scroll="handleContentScroll" @click="handleCalendarClick"
        ref="calendarContent" :style="{ height: calendarBodyHeight }">

        <div class="grid-content" :style="{ minWidth: calendarBodyWidth, width: '100%' }">
          <div class="horizontal-grid">
            <div v-for="(hour, index) in dayHoursList" :key="index">
              <div class="grid-line-h"></div>
            </div>
          </div>
          <div class="vertical-grid">
            <div v-for="day in monthDays.length + 1" :key="day" :style="{ flexGrow: day <= monthDays.length ? 1 : 0 }">
              <div :class="{ 'grid-line-v': day !== 1 }"></div>
            </div>
          </div>
          <div class="content">
            <div v-for="(item, index) in processedItems" :key="item.id" class="calendar-item-wrapper" :class="{
              selected: selectedItemIndex === index,
              dragging: draggingItem?.originalIndex === index,
              'no-transition': silentUpdateIndex === index,
              'transition-to-final': overriddenItemIndex !== index
            }" :style="getItemStyle(item, index)"
              @mousedown="handleDragStart($event, item, index)" @touchstart="handleDragStart($event, item, index)"
              @click="handleItemClick($event, index)">
              <div class="default-item">
                <div v-if="selectedItemIndex === index" class="resize-handle-top" @touchstart.stop="handleResizeStart($event, item, 'top')"
                  @mousedown.stop="handleResizeStart($event, item, 'top')"></div>

                <slot name="item" :item="item">
                </slot>
                
                <div v-if="selectedItemIndex === index" class="resize-handle-left"
                  @touchstart.stop="handleHorizontalResizeStart($event, item, 'left')"
                  @mousedown.stop="handleHorizontalResizeStart($event, item, 'left')"></div>
                <div v-if="config.editable" class="resize-handle-horizontal left"
                  @touchstart.stop="handleHorizontalResizeStart($event, item, 'left')"
                  @mousedown.stop="handleHorizontalResizeStart($event, item, 'left')"></div>
                <div v-if="config.editable" class="resize-handle-horizontal right"
                  @touchstart.stop="handleHorizontalResizeStart($event, item, 'right')"
                  @mousedown.stop="handleHorizontalResizeStart($event, item, 'right')"></div>
                <div v-if="selectedItemIndex === index" class="resize-handle-right"
                  @touchstart.stop="handleHorizontalResizeStart($event, item, 'right')"
                  @mousedown.stop="handleHorizontalResizeStart($event, item, 'right')"></div>
                <div class="resize-handle-bottom" @touchstart.stop="handleResizeStart($event, item, 'bottom')"
                  @mousedown.stop="handleResizeStart($event, item, 'bottom')"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { type PropType, ref, defineComponent, watch, onMounted, computed, nextTick, type StyleValue } from 'vue'
import jalaali from 'jalaali-js'
import { DateTime } from 'luxon'
import { useDragToScroll } from '@/composables/useDragToScroll'

interface CalendarOptions {
  calendar?: 'jalaali' | 'georgian'
  editable?: boolean
  minTime?: number
  zoom?: boolean
  maxZoom?: number
  speed?: number
  mode?: 'month' | 'week' | 'custom'
  dir?: 'rtl' | 'ltr'
  startDate?: Date
  endDate?: Date
  startHour?: number
  endHour?: number
  lang?: 'en' | 'fa'
  format?: 'ampm' | '24h' | 'keys'
  holidays?: Date[]
}

export default defineComponent({
  name: 'CalendarGrid',
  props: {
    options: {
      type: Object as PropType<CalendarOptions | any>,
      default: () => ({})
    },
    modelValue: {
      type: Array as PropType<{ start: Date; end: Date;[key: string]: any }[]>,
      default: () => [],
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const calendar = ref<HTMLElement | null>(null)
    const calendarContent = ref<HTMLElement | null>(null)
    const calendarHeader = ref<HTMLElement | null>(null)
    const contentContainer = ref<HTMLElement | null>(null)
    const isZooming = ref(false)
    const silentUpdateIndex = ref<number | null>(null)
    
    // FIX 2: Define a separate sidebar width
    const sidebarWidth = ref(50) 

    const config = computed(() => {
      const defaults: Required<Omit<CalendarOptions, 'endDate'>> & { endDate: Date | undefined } = {
        calendar: 'georgian',
        editable: false,
        minTime: 1,
        zoom: true,
        maxZoom: 5,
        speed: 20,
        mode: 'month',
        dir: 'ltr',
        startDate: new Date(),
        endDate: undefined,
        startHour: 0,
        endHour: 24,
        lang: 'fa',
        format: '24h',
        holidays: []
      }
      return { ...defaults, ...props.options }
    })

    useDragToScroll(calendarHeader)

    const handleContentScroll = () => {
      if (calendarHeader.value && calendarContent.value) {
        calendarHeader.value.scrollLeft = calendarContent.value.scrollLeft
      }
    }

    const handleHeaderScroll = () => {
      if (calendarHeader.value && calendarContent.value) {
        calendarContent.value.scrollLeft = calendarHeader.value.scrollLeft
      }
    }

    const weekdays = computed(() => {
      if (config.value.lang === 'fa') {
        return ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const
      }
      return ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const
    })

    const toPersianNum = (n: number | string) =>
      String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]!)

    const monthDays = computed(() => {
      type DayObject = {
        day: number | string
        displayDay?: string | number
        weekDay: string
        date: Date
      }
      const days: DayObject[] = []
      const getWeekdayIndex = (dt: DateTime) => {
        if (config.value.lang === 'fa') {
          return (dt.weekday + 1) % 7
        }
        return dt.weekday % 7
      }

      const addDay = (dt: DateTime, jalaaliDay?: number) => {
        let dayNum: number
        let displayDay: string | number

        if (config.value.calendar === 'jalaali') {
          const jDate = jalaali.toJalaali(dt.toJSDate())
          dayNum = jDate.jd
          displayDay = config.value.lang === 'fa' ? toPersianNum(jDate.jd) : jDate.jd
        } else {
          dayNum = dt.day
          displayDay = config.value.lang === 'fa' ? toPersianNum(dt.day) : dt.day
        }

        days.push({
          day: dayNum,
          displayDay: displayDay,
          weekDay: weekdays.value[getWeekdayIndex(dt)]!,
          date: dt.toJSDate()
        })
      }
      const startDt = DateTime.fromJSDate(config.value.startDate)

      if (config.value.mode === 'month') {
        if (config.value.calendar === 'jalaali') {
          const jd = jalaali.toJalaali(startDt.toJSDate())
          const monthInfo = jalaali.jalaaliMonthLength(jd.jy, jd.jm)
          for (let i = 1; i <= monthInfo; i++) {
            const georgianDate = jalaali.toGregorian(jd.jy, jd.jm, i)
            const dt = DateTime.fromObject({
              year: georgianDate.gy,
              month: georgianDate.gm,
              day: georgianDate.gd,
            })
            addDay(dt, i)
          }
        } else {
          const endOfMonth = startDt.endOf('month')
          for (let i = 1; i <= endOfMonth.day; i++) {
            addDay(startDt.set({ day: i }))
          }
        }
      } else if (config.value.mode === 'week') {
        let weekStart: DateTime;

        if (config.value.calendar === 'jalaali') {
            const currentWeekday = startDt.weekday; 
            const daysFromSaturday = (currentWeekday % 7 + 1) % 7;
            weekStart = startDt.minus({ days: daysFromSaturday });
        } else {
             weekStart = config.value.lang === 'fa'
            ? startDt.setLocale('fa-IR').startOf('week')
            : startDt.setLocale('en-US').startOf('week')
        }

        for (let i = 0; i < 7; i++) {
          addDay(weekStart.plus({ days: i }))
        }
      } else if (config.value.mode === 'custom' && config.value.endDate) {
        const endDt = DateTime.fromJSDate(config.value.endDate)
        let currentDt = startDt.startOf('day')
        const finalDt = endDt.startOf('day')

        while (currentDt <= finalDt) {
          addDay(currentDt)
          currentDt = currentDt.plus({ days: 1 })
        }
      }

      return days
    })

    const weekendDay = computed(() => {
      return config.value.calendar === 'georgian' ? 'sunday' : 'friday'
    })

    const isWeekend = (day: string) => {
      return day === weekendDay.value
    }

    const getDayTitle = (day: string | undefined) => {
      let engDays = [
        { key: 'sunday', title: 'Sun' },
        { key: 'monday', title: 'Mon' },
        { key: 'tuesday', title: 'Tue' },
        { key: 'wednesday', title: 'Wed' },
        { key: 'thursday', title: 'Thu' },
        { key: 'friday', title: 'Fri' },
        { key: 'saturday', title: 'Sat' },
      ]
      let faDays = [
        { key: 'sunday', title: 'ی' },
        { key: 'monday', title: 'د' },
        { key: 'tuesday', title: 'س' },
        { key: 'wednesday', title: 'چ' },
        { key: 'thursday', title: 'پ' },
        { key: 'friday', title: 'ج' },
        { key: 'saturday', title: 'ش' },
      ]

      return ((config.value.lang === 'en'
        ? engDays.find((d) => d.key === day)?.title
        : faDays.find((d) => d.key === day)?.title) || '')
    }

    const dayHoursList = computed(() => {
      const hours: Array<{ value: number; display: string }> = []
      for (let i = config.value.startHour; i <= config.value.endHour; i++) {
        let displayValue: string

        if (config.value.format === '24h') {
          const time = `${i}:00`
          displayValue = config.value.lang === 'fa' ? toPersianNum(time) : time
        } else if (config.value.format === 'ampm') {
          const hour = i % 12 === 0 ? 12 : i % 12
          if (config.value.lang === 'fa') {
            const period = i < 12 ? 'ق.ظ' : 'ب.ظ'
            displayValue = `${toPersianNum(hour)} ${period}`
          } else {
            const period = i < 12 ? 'am' : 'pm'
            displayValue = `${hour} ${period}`
          }
        } else if (config.value.format === 'keys') {
          if (config.value.lang === 'fa') {
            let period = ''
            if (i >= 0 && i < 6) period = 'شب'
            else if (i >= 6 && i < 12) period = 'صبح'
            else if (i >= 12 && i < 18) period = 'ظهر'
            else period = 'عصر'
            displayValue = `${toPersianNum(i)} ${period}`
          } else {
            let period = ''
            if (i >= 0 && i < 6) period = 'Night'
            else if (i >= 6 && i < 12) period = 'Morning'
            else if (i >= 12 && i < 18) period = 'Afternoon'
            else period = 'Evening'
            displayValue = `${i}:00 ${period}`
          }
        } else {
          displayValue = `${i}:00`
        }

        hours.push({
          value: i,
          display: displayValue
        })
      }
      return hours
    })

    const dayCellWidth = ref(56) 
    const dayCellHeight = ref(50) 
    const zoomAmount = ref(1)
    const minZoomAmount = ref(1)
    const maxZoomAmount = ref(config.value.maxZoom)

    const calendarBodyWidth = computed(() => {
        const minWidth = monthDays.value.length * dayCellWidth.value
        return `${minWidth}px`
    })

    const calendarBodyHeight = computed(() => {
      return `${dayHoursList.value.length * zoomAmount.value * dayCellHeight.value}px`
    })

    const topPadding = computed(() => {
      return zoomAmount.value * dayCellHeight.value / 2
    })

    let startY = 0
    const dragFromUpperHalf = ref(true)

    let animationFrameId: number | null = null

    const handleZoomStart = (event: MouseEvent | TouchEvent) => {
      if (!config.value.zoom) return
      isZooming.value = true
      startY = 'touches' in event ? (event.touches[0]?.clientY || 0) : event.clientY

      const targetElement = event.currentTarget as HTMLElement
      const rect = targetElement.getBoundingClientRect()
      const clickY = 'touches' in event ? (event.touches[0]?.clientY || 0) : event.clientY
      const middleY = rect.top + rect.height / 2
      dragFromUpperHalf.value = clickY < middleY

      const allItems = document.querySelectorAll('.calendar-item-wrapper')
      allItems.forEach(el => el.classList.add('no-transition'))

      document.addEventListener('mousemove', handleZoomMove)
      document.addEventListener('touchmove', handleZoomMove, { passive: false })
      document.addEventListener('mouseup', handleZoomEnd)
      document.addEventListener('touchend', handleZoomEnd)
      document.addEventListener('mouseleave', handleZoomEnd)
      document.addEventListener('touchcancel', handleZoomEnd)
    }

    const handleZoomMove = (event: MouseEvent | TouchEvent) => {
      if (!isZooming.value) return
      event.preventDefault()

      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }

      animationFrameId = requestAnimationFrame(() => {
        const currentY = 'touches' in event ? (event.touches[0]?.clientY || 0) : event.clientY
        const deltaY = currentY - startY

        const zoomDirection = dragFromUpperHalf.value ? -1 : 1
        const newZoomAmount = zoomAmount.value + (deltaY * zoomDirection) / 50
        zoomAmount.value = Math.max(
          minZoomAmount.value,
          Math.min(newZoomAmount, maxZoomAmount.value)
        )
        startY = currentY
      })
    }

    const handleZoomEnd = () => {
      if (!isZooming.value) return
      isZooming.value = false

      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
        animationFrameId = null
      }

      const allItems = document.querySelectorAll('.calendar-item-wrapper')
      allItems.forEach(el => el.classList.remove('no-transition'))

      document.removeEventListener('mousemove', handleZoomMove)
      document.removeEventListener('touchmove', handleZoomMove)
      document.removeEventListener('mouseup', handleZoomEnd)
      document.removeEventListener('touchend', handleZoomEnd)
      document.removeEventListener('mouseleave', handleZoomEnd)
      document.removeEventListener('touchcancel', handleZoomEnd)
    }

    const windowWidth = ref(window.innerWidth);

    const updateDayCellWidth = () => {
        if (!calendarHeader.value) return;

        const firstDayCell = calendarHeader.value?.querySelector('.day-cell') as HTMLElement;
        if (firstDayCell) {
            dayCellWidth.value = firstDayCell.offsetWidth;
        } else {
             dayCellWidth.value = 56; 
        }
    };

    onMounted(() => {
      const handleResize = () => {
        windowWidth.value = window.innerWidth;
        updateDayCellWidth(); 
      };

      window.addEventListener('resize', handleResize);
      updateDayCellWidth();

      if (calendar.value && contentContainer.value) {
        const style = getComputedStyle(calendar.value)
        const widthStr = style.getPropertyValue('--dc-day-container-width').trim()
        const heightStr = style.getPropertyValue('--dc-day-cell-height').trim()

        if (widthStr && widthStr.includes('px')) {
          const parsed = parseInt(widthStr, 10)
          if (!isNaN(parsed) && parsed > 0) {
            if (config.value.mode !== 'week' && config.value.mode !== 'month') {
                dayCellWidth.value = parsed
            }
          }
        }
        
        if (heightStr) {
          const parsedHeight = parseInt(heightStr, 10)
           if (!isNaN(parsedHeight) && parsedHeight > 0) {
            dayCellHeight.value = parsedHeight
           }
        }
        
        const containerHeight = contentContainer.value.clientHeight
        const naturalGridHeight = dayHoursList.value.length * dayCellHeight.value
        let requiredZoomY = 1
        if (naturalGridHeight > 0 && containerHeight > naturalGridHeight) {
          requiredZoomY = containerHeight / naturalGridHeight
        }

        const initialZoom = Math.max(1, requiredZoomY)

        if (initialZoom > 1) {
          zoomAmount.value = initialZoom
          minZoomAmount.value = initialZoom
          maxZoomAmount.value = initialZoom * config.value.maxZoom
        } else {
          minZoomAmount.value = 1
          maxZoomAmount.value = config.value.maxZoom
        }
      }
    })
    
    watch(monthDays, () => {
        nextTick(updateDayCellWidth);
    });

    const processedItems = computed(() => {
      const dayWidthPercent = 100 / monthDays.value.length 
      const totalHours = config.value.endHour - config.value.startHour
      const contentHeight = dayHoursList.value.length * zoomAmount.value * dayCellHeight.value - 2 * topPadding.value
      
      return props.modelValue
        .map((item, index) => {
          const startDt = DateTime.fromJSDate(item.start)
          const endDt = DateTime.fromJSDate(item.end)

          // FIX 3: Robust Day Matching (Use Time/Date equality, NOT day number)
          // This fixes the issue where Jalaali items were placed based on Gregorian day numbers
          const startDayIndex = monthDays.value.findIndex((day) => {
             // Comparing JS Date objects directly (Day Precision)
             const dayDt = DateTime.fromJSDate(day.date);
             return dayDt.hasSame(startDt, 'day');
          })

          if (startDayIndex === -1) {
            return null
          }

          // CHANGED: Calculate Visual Duration based on Time of Day only
          // This ensures height is based on hours/minutes, not days
          const startMinutes = startDt.hour * 60 + startDt.minute;
          const endMinutes = endDt.hour * 60 + endDt.minute;
          
          let durationMinutes = endMinutes - startMinutes;
          // Handle wrap around if end time is numerically less than start time (next day early morning)
          if (durationMinutes < 0) {
            durationMinutes += 24 * 60;
          }

          const isSameDay = startDt.hasSame(endDt, 'day')
          let daySpan = 1
          if (!isSameDay) {
            const dayDiff = endDt.diff(startDt, 'days').days
            daySpan = Math.floor(dayDiff) + 1
          }

          const startOfDay = startDt.startOf('day').plus({ hours: config.value.startHour })
          const itemStartOffset = startDt.diff(startOfDay, 'minutes').minutes

          const topOffset = (itemStartOffset / (totalHours * 60)) * contentHeight
          const height = (durationMinutes / (totalHours * 60)) * contentHeight
          
          const width = daySpan * dayWidthPercent
          
          const positionStyle = config.value.dir === 'rtl'
            ? { right: `${startDayIndex * dayWidthPercent}%`, left: 'auto' }
            : { left: `${startDayIndex * dayWidthPercent}%`, right: 'auto' }

          const zIndex = Math.max(1, 100000 - Math.floor(durationMinutes))

          const style = {
            top: `calc(${topPadding.value}px + ${topOffset}px)`,
            ...positionStyle,
            height: `${height}px`,
            width: `${width}%`, 
            position: 'absolute',
            zIndex
          }

          return {
            ...item,
            id: `item-${index}`,
            style,
            startDayIndex,
            daySpan,
            itemDuration: durationMinutes,
            originalIndex: index
          }
        })
        .filter((item) => item !== null)
    })

const processedHolidays = computed(() => {
      // Assuming you want to treat strings as Jalaali when in Jalaali mode
      const isJalaali = config.value.calendar === 'jalaali'

      const keys = config.value.holidays.map((d: any) => {
        // 1. HANDLE JALAALI STRINGS (e.g., "1404-10-04" or "1404/10/04")
        if (isJalaali && typeof d === 'string') {
           // Normalize separators to hyphens
           const normalized = d.replace(/\//g, '-')
           
           // Check if it looks like a date string
if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/.test(normalized)) {
    const parts = normalized.split(/[-/]/).map((p: string) => parseInt(p, 10))
    
    // CHANGE THIS LINE:
    const g = jalaali.toGregorian(parts[0]!, parts[1]!, parts[2]!)
    
    return `${g.gy}-${g.gm - 1}-${g.gd}`
}
        }

        // 2. HANDLE STANDARD DATE OBJECTS (e.g. new Date('2025-12-25'))
        // If the input is already a JS Date object, use it directly.
        const date = new Date(d)
        if (isNaN(date.getTime())) return null
        
        return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
      })

return new Set(keys.filter((k: any) => k))
    })

    const isHoliday = (date: Date) => {
      if (!date) return false
      // The grid "date" is ALWAYS a valid Gregorian JS Date object (from monthDays)
      // So we just check if its key exists in our processed set.
      return processedHolidays.value.has(
        `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
      )
    }


    const isCurrentDay = (date: Date) => {
      const today = new Date()
      return (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
      )
    }

    const resizingItem = ref<{ item: any; handle: 'top' | 'bottom'; originalIndex: number } | null>(null)
    const initialY = ref(0)
    const initialStart = ref<Date | null>(null)
    const initialEnd = ref<Date | null>(null)

    const handleResizeStart = (event: MouseEvent | TouchEvent, item: any, handle: 'top' | 'bottom') => {
      if (!config.value.editable) return

      const originalIndex = item.originalIndex

      if (originalIndex === undefined || originalIndex === -1) return

      resizingItem.value = { item, handle, originalIndex }
      initialY.value = 'touches' in event ? (event.touches[0]?.clientY || 0) : event.clientY
      initialStart.value = new Date(item.start)
      initialEnd.value = new Date(item.end)

      const allItems = document.querySelectorAll('.calendar-item-wrapper')
      allItems.forEach(el => el.classList.add('no-transition'))

      document.addEventListener('mousemove', handleResizing)
      document.addEventListener('mouseup', handleResizeEnd)
      document.addEventListener('touchmove', handleResizing, { passive: false })
      document.addEventListener('touchend', handleResizeEnd)
    }

    const handleResizing = (event: MouseEvent | TouchEvent) => {
      if (!resizingItem.value || !calendarContent.value || !config.value.editable) return
      event.preventDefault()

      const clientY = 'touches' in event ? (event.touches[0]?.clientY || 0) : event.clientY
      const deltaY = clientY - initialY.value
      const calendarRect = calendarContent.value.getBoundingClientRect()
      const calendarHeight = calendarRect.height
      const totalMinutes = (config.value.endHour - config.value.startHour) * 60
      const minutesPerPixel = totalMinutes / calendarHeight

      const deltaMinutes = deltaY * minutesPerPixel

      const steppedDeltaMinutes = Math.round(deltaMinutes / config.value.minTime) * config.value.minTime

      const { handle, originalIndex } = resizingItem.value

      if (originalIndex === -1 || !initialStart.value || !initialEnd.value) return

      const newItems = props.modelValue.map((item) => ({
        ...item,
        start: new Date(item.start),
        end: new Date(item.end)
      }))

      const itemToUpdate = newItems[originalIndex]
      if (!itemToUpdate) return

      const minDurationMs = config.value.minTime * 60000

      if (handle === 'top') {
        const newStart = new Date(initialStart.value.getTime() + steppedDeltaMinutes * 60000)
        if (newStart.getTime() < itemToUpdate.end.getTime() - minDurationMs) {
          itemToUpdate.start = newStart
        }
      } else {
        const newEnd = new Date(initialEnd.value.getTime() + steppedDeltaMinutes * 60000)
        if (newEnd.getTime() > itemToUpdate.start.getTime() + minDurationMs) {
          itemToUpdate.end = newEnd
        }
      }

      emit('update:modelValue', newItems)
    }

    const handleResizeEnd = () => {
      resizingItem.value = null
      initialStart.value = null
      initialEnd.value = null

      const allItems = document.querySelectorAll('.calendar-item-wrapper')
      allItems.forEach(el => el.classList.remove('no-transition'))

      document.removeEventListener('mousemove', handleResizing)
      document.removeEventListener('mouseup', handleResizeEnd)
      document.removeEventListener('touchmove', handleResizing)
      document.removeEventListener('touchend', handleResizeEnd)
    }

    const draggingItem = ref<{ 
      item: any; 
      originalIndex: number; 
      initialScrollTop?: number; 
      initialScrollLeft?: number; 
    } | null>(null)
    const selectedItemIndex = ref<number | null>(null)
    const draggedElement = ref<HTMLElement | null>(null)
    const dragStartX = ref(0)
    const dragStartY = ref(0)
    const dragGhost = ref<HTMLElement | null>(null)
    const selectedIndex = ref(-1)

    const isItemActive = (index: number) => {
      return selectedItemIndex.value === index ||
        draggingItem.value?.originalIndex === index ||
        resizingItem.value?.originalIndex === index;
    }

    watch(selectedItemIndex, (newIndex) => {
      if (newIndex !== null) {
        calendarHeader.value?.classList.add('scroll-disabled')
        calendarContent.value?.classList.add('scroll-disabled')
        contentContainer.value?.classList.add('scroll-disabled')
      } else {
        calendarHeader.value?.classList.remove('scroll-disabled')
        calendarContent.value?.classList.remove('scroll-disabled')
        contentContainer.value?.classList.remove('scroll-disabled')
      }
    })

    const overriddenItemIndex = ref<number | null>(null)
    const overriddenItemStyle = ref<{ top: string; left: string } | null>(null)

    const autoScrollInterval = ref<number | null>(null)

    const handleDragMove = (event: MouseEvent | TouchEvent) => {
      if (!draggingItem.value || !dragGhost.value || !calendarContent.value) return
      event.preventDefault()

      const clientX = 'touches' in event ? (event.touches[0]?.clientX || 0) : event.clientX
      const clientY = 'touches' in event ? (event.touches[0]?.clientY || 0) : event.clientY

      const calendarRect = calendar.value?.getBoundingClientRect()
      const contentContainerRect = contentContainer.value?.getBoundingClientRect()

      if (!calendarRect || !contentContainerRect) return

      if (calendarHeader.value && calendarHeader.value.children) {
        const headerChildren = Array.from(calendarHeader.value.children) as HTMLElement[]
        let foundIndex = -1
        for (let i = 0; i < headerChildren.length; i++) {
          const rect = headerChildren[i]?.getBoundingClientRect()
          if (rect && clientX >= rect.left && clientX <= rect.right) {
            foundIndex = i
            break
          }
        }
        if (foundIndex !== -1) {
          selectedIndex.value = foundIndex
        }
      }

      dragGhost.value.style.left = `${clientX - dragGhost.value.offsetWidth / 2}px`
      dragGhost.value.style.top = `${clientY - dragGhost.value.offsetHeight / 2}px`

      const scrollThreshold = 30
      const scrollSpeed = config.value.speed

      if (autoScrollInterval.value !== null) {
        clearInterval(autoScrollInterval.value)
        autoScrollInterval.value = null
      }

      let shouldScroll = false
      let scrollLeft = false
      let scrollRight = false
      let scrollUp = false
      let scrollDown = false

      if (config.value.dir === 'rtl') {
        if (calendarRect.right - clientX < scrollThreshold) {
          scrollLeft = true
          shouldScroll = true
        } else if (clientX - calendarRect.left < scrollThreshold) {
          scrollRight = true
          shouldScroll = true
        }
      } else {
        if (clientX - calendarRect.left < scrollThreshold) {
          scrollLeft = true
          shouldScroll = true
        } else if (calendarRect.right - clientX < scrollThreshold) {
          scrollRight = true
          shouldScroll = true
        }
      }

      if (clientY - contentContainerRect.top < scrollThreshold) {
        scrollUp = true
        shouldScroll = true
      } else if (contentContainerRect.bottom - clientY < scrollThreshold) {
        scrollDown = true
        shouldScroll = true
      }

      if (shouldScroll) {
        autoScrollInterval.value = window.setInterval(() => {
          if (!calendarContent.value || !contentContainer.value) return

          if (scrollLeft) {
            const newScrollLeft = calendarContent.value.scrollLeft - scrollSpeed
            calendarContent.value.scrollLeft = Math.max(0, newScrollLeft)
          }
          if (scrollRight) {
            const maxScrollLeft = calendarContent.value.scrollWidth - calendarContent.value.clientWidth
            const newScrollLeft = calendarContent.value.scrollLeft + scrollSpeed
            calendarContent.value.scrollLeft = Math.min(maxScrollLeft, newScrollLeft)
          }
          if (scrollUp) {
            const newScrollTop = contentContainer.value.scrollTop - scrollSpeed
            contentContainer.value.scrollTop = Math.max(0, newScrollTop)
          }
          if (scrollDown) {
            const maxScrollTop = contentContainer.value.scrollHeight - contentContainer.value.clientHeight
            const newScrollTop = contentContainer.value.scrollTop + scrollSpeed
            contentContainer.value.scrollTop = Math.min(maxScrollTop, newScrollTop)
          }
        }, 16)
      }
    }

const handleDragStart = (event: MouseEvent | TouchEvent, item: any, index: number) => {
      if (!config.value.editable) return
      event.preventDefault()

      if (selectedItemIndex.value !== index) {
        selectedItemIndex.value = index
        return
      }

      const trueIndex = item.originalIndex
      const originalItem = props.modelValue[trueIndex]

      draggedElement.value = event.currentTarget as HTMLElement
      
      const clientX = 'touches' in event ? (event.touches[0]?.clientX || 0) : event.clientX
      const clientY = 'touches' in event ? (event.touches[0]?.clientY || 0) : event.clientY
      
      const initialScrollTop = contentContainer.value?.scrollTop || 0
      const initialScrollLeft = calendarContent.value?.scrollLeft || 0

      draggingItem.value = { 
        item: originalItem, 
        originalIndex: trueIndex,
        initialScrollTop,
        initialScrollLeft
      }
      
      dragStartX.value = clientX
      dragStartY.value = clientY
      draggedElement.value.classList.add('dragging')

      const ghost = draggedElement.value.cloneNode(true) as HTMLElement
      const rect = draggedElement.value.getBoundingClientRect()

      ghost.style.position = 'fixed'
      ghost.style.pointerEvents = 'none'
      ghost.style.opacity = '0.7'
      ghost.style.zIndex = '1000000'
      ghost.style.boxShadow = '0 5px 15px rgba(0,0,0,0.3)' 
      ghost.style.width = `${rect.width}px`
      ghost.style.height = `${rect.height}px`
      ghost.style.left = `${rect.left}px`
      ghost.style.top = `${rect.top}px`
      ghost.style.transition = 'none'

      document.body.appendChild(ghost)
      dragGhost.value = ghost

      handleDragMove(event)
      document.addEventListener('mousemove', handleDragMove)
      document.addEventListener('mouseup', handleDragEnd)
      document.addEventListener('touchmove', handleDragMove, { passive: false })
      document.addEventListener('touchend', handleDragEnd)
    }

const handleDragEnd = (event: MouseEvent | TouchEvent) => {
      if (!draggingItem.value || !calendarContent.value || !contentContainer.value) return
      event.preventDefault()

      if (autoScrollInterval.value !== null) {
        clearInterval(autoScrollInterval.value)
        autoScrollInterval.value = null
      }

      document.removeEventListener('mousemove', handleDragMove)
      document.removeEventListener('mouseup', handleDragEnd)
      document.removeEventListener('touchmove', handleDragMove)
      document.removeEventListener('touchend', handleDragEnd)

      const clientX = 'changedTouches' in event ? (event.changedTouches[0]?.clientX || 0) : event.clientX
      const clientY = 'changedTouches' in event ? (event.changedTouches[0]?.clientY || 0) : event.clientY

      let isInsideContainer = false
      if (contentContainer.value) {
        const rect = contentContainer.value.getBoundingClientRect()
        isInsideContainer =
          clientX >= rect.left &&
          clientX <= rect.right &&
          clientY >= rect.top &&
          clientY <= rect.bottom
      }

      let targetDayIndex = selectedIndex.value
      const isValidDrop = isInsideContainer && targetDayIndex !== -1

      let updatedItems: any[] = []
      let targetRect = { top: 0, left: 0, width: 0, height: 0 }

      if (!isValidDrop) {
        if (draggedElement.value) {
          const rect = draggedElement.value.getBoundingClientRect()
          targetRect = { top: rect.top, left: rect.left, width: rect.width, height: rect.height }
        }
      } else {
        const originalItem = draggingItem.value.item
        const originalDurationMs = originalItem.end.getTime() - originalItem.start.getTime()
        const currentScrollTop = contentContainer.value.scrollTop 
        const currentScrollLeft = calendarContent.value.scrollLeft

        // --- 1. Calculate Horizontal Delta (Day Shift) ---
        const scrollDiffX = currentScrollLeft - (draggingItem.value.initialScrollLeft || 0)
        const deltaX = (clientX - dragStartX.value) + scrollDiffX
        
        const dayWidth = dayCellWidth.value 
        let dayShift = Math.round(deltaX / dayWidth)

        if (config.value.dir === 'rtl') {
           dayShift = dayShift * -1
        }

        // --- 2. Calculate Vertical Delta (Time Shift) ---
        const scrollDiffY = currentScrollTop - (draggingItem.value.initialScrollTop || 0)
        const deltaY = (clientY - dragStartY.value) + scrollDiffY

        const totalHours = config.value.endHour - config.value.startHour
        const contentHeight = dayHoursList.value.length * zoomAmount.value * dayCellHeight.value - 2 * topPadding.value
        const pixelsPerMinute = contentHeight / (totalHours * 60)
        
        const minuteShift = deltaY / pixelsPerMinute
        const snappedMinuteShift = Math.round(minuteShift / config.value.minTime) * config.value.minTime

        // --- 3. Apply Shifts to Create New Dates ---
        const originalStart = DateTime.fromJSDate(originalItem.start)
        
        let newStartDt = originalStart.plus({ days: dayShift })
        newStartDt = newStartDt.plus({ minutes: snappedMinuteShift })

        const adjustedStart = newStartDt.toJSDate()
        const adjustedEnd = new Date(adjustedStart.getTime() + originalDurationMs)

        const originalIndex = draggingItem.value.originalIndex

        updatedItems = props.modelValue.map((item, idx) => {
          if (idx === originalIndex) {
            return {
              ...item,
              start: adjustedStart,
              end: adjustedEnd
            }
          }
          return item
        })

        // --- 4. FIX 1: Calculate Visual Target relative to Container Viewport ---
        if (calendarContent.value && contentContainer.value) {
          const containerRect = calendarContent.value.getBoundingClientRect()
          
          const startDt = DateTime.fromJSDate(adjustedStart)
          
          // Vertical Position
          const dayStartOf = startDt.startOf('day').plus({ hours: config.value.startHour })
          const itemStartOffsetMin = startDt.diff(dayStartOf, 'minutes').minutes
          const topOffsetPx = (itemStartOffsetMin / (totalHours * 60)) * contentHeight

          // CHANGED: Ghost height uses Time of Day diff
          let durationMin = (adjustedEnd.getHours() * 60 + adjustedEnd.getMinutes()) -
                            (adjustedStart.getHours() * 60 + adjustedStart.getMinutes());
          if (durationMin < 0) durationMin += 24 * 60;
          
          const heightPx = (durationMin / (totalHours * 60)) * contentHeight

          // Horizontal Position
          const finalStartDayIndex = monthDays.value.findIndex((d) => {
             const dDate = new Date(d.date);
             return dDate.getDate() === adjustedStart.getDate() && 
                    dDate.getMonth() === adjustedStart.getMonth() &&
                    dDate.getFullYear() === adjustedStart.getFullYear();
          });
          
          const visualStartIndex = finalStartDayIndex !== -1 ? finalStartDayIndex : targetDayIndex;
          
          let leftPos = 0;
        if (config.value.dir === 'rtl') {
     // Use ternary to safely get children or empty array
     const headerChildren = calendarHeader.value ? Array.from(calendarHeader.value.children) as HTMLElement[] : [];
     const targetHeader = headerChildren[visualStartIndex];
     if(targetHeader) {
         leftPos = targetHeader.getBoundingClientRect().left;
     }
} else {
     leftPos = containerRect.left + (visualStartIndex * dayCellWidth.value) - calendarContent.value.scrollLeft;
}

        const headerChildren = calendarHeader.value ? Array.from(calendarHeader.value.children) as HTMLElement[] : [];
const targetHeader = headerChildren[visualStartIndex];

          if(targetHeader) {
              leftPos = targetHeader.getBoundingClientRect().left;
          }

          // Calculate day span for width
          const endDt = DateTime.fromJSDate(adjustedEnd);
          const isSameDay = startDt.hasSame(endDt, 'day');
          let daySpan = 1;
          if (!isSameDay) {
            const dayDiff = endDt.diff(startDt, 'days').days;
            daySpan = Math.floor(dayDiff) + 1;
          }

          targetRect = {
            top: containerRect.top + topPadding.value + topOffsetPx,
            left: leftPos,
            width: dayCellWidth.value * daySpan, 
            height: heightPx
          }
        }
      }

      if (dragGhost.value) {
        void dragGhost.value.offsetHeight; 
        dragGhost.value.style.transition = 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'
        dragGhost.value.style.top = `${targetRect.top}px`
        dragGhost.value.style.left = `${targetRect.left}px`
        dragGhost.value.style.width = `${targetRect.width}px`
        dragGhost.value.style.height = `${targetRect.height}px`
        dragGhost.value.style.zIndex = '1000000'

        setTimeout(async () => {
          if (draggingItem.value) {
            silentUpdateIndex.value = draggingItem.value.originalIndex
          }

          if (isValidDrop) {
            emit('update:modelValue', updatedItems)
          }

          await nextTick()

          if (dragGhost.value) dragGhost.value.remove()
          dragGhost.value = null
          draggingItem.value = null
          if (draggedElement.value) {
            draggedElement.value.classList.remove('dragging')
            draggedElement.value = null
          }
          selectedIndex.value = -1
          selectedItemIndex.value = null

          setTimeout(() => {
            silentUpdateIndex.value = null
          }, 50)
        }, 300)
      } else {
        if (isValidDrop) {
          emit('update:modelValue', updatedItems)
        }
        resetDrag()
      }
    }

    const resetDrag = () => {
      draggingItem.value = null
      draggedElement.value = null
      dragStartX.value = 0
      dragStartY.value = 0
      selectedIndex.value = -1
      selectedItemIndex.value = null

      if (autoScrollInterval.value !== null) {
        clearInterval(autoScrollInterval.value)
        autoScrollInterval.value = null
      }

      document.removeEventListener('mousemove', handleDragMove)
      document.removeEventListener('mouseup', handleDragEnd)
      document.removeEventListener('touchmove', handleDragMove)
      document.removeEventListener('touchend', handleDragEnd)
    }
    const handleItemClick = (event: Event, index: number) => {
      if (!config.value.editable) return
      event.stopPropagation()
      selectedItemIndex.value = index
    }

    const handleCalendarClick = (event: MouseEvent) => {
      if (!config.value.editable) return
      const target = event.target as HTMLElement
      if (!target.closest('.calendar-item-wrapper')) {
        selectedItemIndex.value = null
      }
    }

    const deselectItems = () => {
      selectedItemIndex.value = null
    }

    const horizontalResizingItem = ref<{
      item: any
      handle: 'left' | 'right'
      originalIndex: number
    } | null>(null)
    const initialX = ref(0)

const handleHorizontalResizeStart = (
  event: MouseEvent | TouchEvent,
  item: any,
  handle: 'left' | 'right'
) => {
  if (!config.value.editable) return

  const originalIndex = item.originalIndex

  if (originalIndex === undefined || originalIndex === -1) return

  horizontalResizingItem.value = { item, handle, originalIndex }
  initialX.value = 'touches' in event ? (event.touches[0]?.clientX || 0) : event.clientX
  initialStart.value = new Date(item.start)
  initialEnd.value = new Date(item.end)

  const allItems = document.querySelectorAll('.calendar-item-wrapper')
  allItems.forEach((el) => el.classList.add('no-transition'))

  document.addEventListener('mousemove', handleHorizontalResizing)
  document.addEventListener('mouseup', handleHorizontalResizeEnd)
  document.addEventListener('touchmove', handleHorizontalResizing)
  document.addEventListener('touchend', handleHorizontalResizeEnd)
}

    const handleHorizontalResizing = (event: MouseEvent | TouchEvent) => {
      if (!horizontalResizingItem.value || !calendarContent.value || !config.value.editable) return
      const clientX = 'touches' in event ? (event.touches[0]?.clientX || 0) : event.clientX
      const deltaX = clientX - initialX.value
      const dayWidthPixels = dayCellWidth.value; 

      const directionMultiplier = config.value.dir === 'rtl' ? -1 : 1
      const deltaDays = Math.round(deltaX / dayWidthPixels) * directionMultiplier

      const { handle, originalIndex } = horizontalResizingItem.value

      if (originalIndex === -1 || !initialStart.value || !initialEnd.value) return

      const newItems = props.modelValue.map((item) => ({
        ...item,
        start: new Date(item.start),
        end: new Date(item.end)
      }))

      const itemToUpdate = newItems[originalIndex]
      if (!itemToUpdate) return

      const originalStart = DateTime.fromJSDate(initialStart.value)
      const originalEnd = DateTime.fromJSDate(initialEnd.value)

      if (handle === 'left') {
        const newStart = originalStart.plus({ days: deltaDays }).toJSDate()
        if (newStart.getTime() < itemToUpdate.end.getTime()) {
          itemToUpdate.start = newStart
        }
      } else {
        const newEnd = originalEnd.plus({ days: deltaDays }).toJSDate()
        if (newEnd.getTime() > itemToUpdate.start.getTime()) {
          itemToUpdate.end = newEnd
        }
      }

      emit('update:modelValue', newItems)
    }


    const handleHorizontalResizeEnd = () => {
      horizontalResizingItem.value = null
      initialStart.value = null
      initialEnd.value = null

      const allItems = document.querySelectorAll('.calendar-item-wrapper')
      allItems.forEach((el) => el.classList.remove('no-transition'))

      document.removeEventListener('mousemove', handleHorizontalResizing)
      document.removeEventListener('mouseup', handleHorizontalResizeEnd)
      document.removeEventListener('touchmove', handleHorizontalResizing)
      document.removeEventListener('touchend', handleHorizontalResizeEnd)
    }

    const getItemStyle = (item: any, index: number): StyleValue => {
      const baseStyle = item.style || {};
      return {
        ...baseStyle,
        zIndex: isItemActive(index) ? 1000000 : (Number(baseStyle.zIndex) || 1)
      } as StyleValue;
    }

    return {
      config,
      isCurrentDay,
      isHoliday,
      calendarBodyWidth,
      weekendDay,
      calendarContent,
      calendarHeader,
      contentContainer,
      monthDays,
      getDayTitle,
      handleContentScroll,
      calendar,
      isWeekend,
      dayHoursList,
      calendarBodyHeight,
      handleZoomStart,
      handleHeaderScroll,
      processedItems,
      handleResizeEnd,
      handleResizeStart,
      handleDragStart,
      handleItemClick,
      draggingItem,
      selectedItemIndex,
      handleCalendarClick,
      overriddenItemIndex,
      overriddenItemStyle,
      silentUpdateIndex,
      toPersianNum,
      handleHorizontalResizeStart,
      handleHorizontalResizing,
      handleHorizontalResizeEnd,
      deselectItems,
      isItemActive,
      getItemStyle,
      dayCellWidth,
      windowWidth,
      sidebarWidth 
    }
  },
})
</script>
<style scoped>
@import '@/assets/css/calendar.css';

.content {
  position: relative;
  width: 100%;
  height: 100%;
}

.default-item {
  background-color: rgba(66, 133, 244, 0.8);
  color: white;
  padding: 4px;
  border-radius: 4px;
  height: 100%;
  overflow: hidden;
  font-size: 12px;
  max-height: 100%;
}

.calendar-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: auto;
  position: relative;
}

.calendar-header {
  width: 100%;
  display: flex;
  align-items: center;
  flex-shrink: 0;
  overflow-x: auto;
  user-select: none;
  flex: 1;
  /* Masking for fading effect on edges if desired */
  -webkit-mask-image: linear-gradient(to right,
      transparent 0,
      black 10px,
      black calc(100% - 10px),
      transparent 100%);
  mask-image: linear-gradient(to right,
      transparent 0,
      black 10px,
      black calc(100% - 10px),
      transparent 100%);
}

.day-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
  flex-shrink: 0;
  flex-grow: 1;
  /* CHANGE: Enforce minimum width from variable */
  min-width: var(--dc-day-container-width);
}

.day-number {
  color: var(--dc-day-number-color);
  font-size: var(--dc-day-number-font-size);
  font-weight: var(--dc-day-number-font-weight);
}

.day-name {
  color: var(--dc-day-name-color);
  font-size: var(--dc-day-name-font-size);
  font-weight: var(--dc-day-name-font-weight);
}

.weekend-day .day-number,
.weekend-day .day-name {
  color: var(--dc-weekend-day-color);
}

.current-day {
  color: var(--dc-current-day-color);
}


.calendar-body {
  flex: 1;
  white-space: nowrap;
  display: flex;
  overflow-y: auto;
  background-color: var(--dc-bg);
}

.hours-column {
  flex-shrink: 0;
  height: calc(100% - 50px);
  z-index: 10;
  bottom: 0px;
  background-color: var(--dc-bg);
  display: flex;
  flex-direction: column;
  user-select: none;
  align-items: center;
  justify-content: space-around;
  /* FIX 2: Removed min-width inheritance from day-cell */
}

[dir='ltr'] .hours-column {
  border-right: var(--dc-border-width) solid var(--dc-border-color);
  border-left: none;
}

[dir='rtl'] .hours-column {
  border-left: var(--dc-border-width) solid var(--dc-border-color);
  border-right: none;
}

.resize-handle-horizontal {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 8px;
  z-index: 10;
}


.resize-handle-horizontal.left {
  left: 0;
  cursor: ew-resize;
}

.resize-handle-horizontal.right {
  right: 0;
  cursor: ew-resize;
}

.hour-label {
  color: var(--dc-day-number-color);
  font-size: var(--dc-day-number-font-size);
  min-height: var(--dc-day-cell-height);
  height: 0px;
  overflow: visible;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: var(--dc-day-number-font-weight);
}

.grid-content {
  flex: 1;
  height: 100%;
  background-color: var(--dc-bg);
  overflow: hidden;
  position: relative;
  display: flex; 
  flex-direction: column;
}

.horizontal-grid {
  display: flex;
  flex-direction: column;
  position: absolute;
  z-index: 0;
  align-items: items-stretch;
  justify-content: space-around;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  inset: 0;
}

.vertical-grid {
  display: flex;
  position: absolute;
  z-index: 0;
  align-items: stretch;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  inset: 0;
}

.content-container {
  display: flex;
  flex: 1;
  position: relative;
  width: 100%;
  overflow-y: auto;
}

.grid-line-h {
  width: 100%;
  border: var(--dc-border-width) solid var(--dc-border-color)
}

.header-container {
  display: flex;
}

.header-padding {
  flex-shrink: 0;
  height: 100%;
  /* FIX 2: Removed min-width inheritance from day-cell */
}

.grid-line-v {
  height: 100%;
  border: var(--dc-border-width) solid var(--dc-border-color)
}

.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.hide-scrollbar::-webkit-scrollbar {
  display: none;
}

.zoomable {
  cursor: ns-resize;
}

.cursor-grab {
  cursor: grab;
}

.cursor-grabbing {
  cursor: grabbing;
}

.calendar-item-wrapper {
  position: absolute;
  width: 100%;
  z-index: 1;
  user-select: none;
  box-sizing: border-box;
  transition: box-shadow 0.2s ease, transform 0.2s ease, top 0.3s ease, left 0.3s ease;
  cursor: grab;
}

.calendar-item-wrapper.no-transition {
  transition: none !important;
}

.calendar-item-wrapper.transition-to-final {
  transition: top 0.3s ease-out, left 0.3s ease-out;
}

.calendar-item-wrapper.dragging {
  opacity: 0.5;
  cursor: grabbing;
  width: 100%;
  transition: none;
}

.resize-handle-top,
.resize-handle-bottom {
  position: absolute;
  left: 0;
  right: 0;
  height: 8px;
  cursor: ns-resize;
  z-index: 10;
}

.resize-handle-top {
  top: 0;
}

.resize-handle-bottom {
  bottom: 0;
}

.scroll-disabled {
  overflow: hidden !important;
  pointer-events: none;
}

.scroll-disabled * {
  pointer-events: auto;
}
</style>