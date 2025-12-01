<template>
  <div :dir="dir" ref="calendar" class="calendar-wrapper  dope-calendar-grid">
    <div class="header-container">
      <div class="header-padding"></div>
      <div ref="calendarHeader" @scroll="handleHeaderScroll" class="calendar-header hide-scrollbar">
         <div v-for="(day, index) in monthDays" :key="index" 
           :class="{
          'day-cell': true,
          'weekend-day': isWeekend(day.weekDay) || isHoliday(day.date),
          'current-day': isCurrentDay(day.date)
        }"
        :style="{width: `${100/ monthDays.length}%`}">
          <div class="day-number" :style="{
            color: isHoliday(day.date)|| isWeekend(day.weekDay)
              ? 'var(--dc-weekend-day-color)'
              : (isCurrentDay(day.date) ?'var(--dc-current-day-color)' :'var(--dc-day-number-color)'),
            fontSize: 'var(--dc-day-number-font-size)',
            fontWeight: 'var(--dc-day-number-font-weight)'
          }">
            {{ day.day }}
          </div>
          <div class="day-name" :style="{
            color: isWeekend(day.weekDay) || isHoliday(day.date)
              ? 'var(--dc-weekend-day-color)'
              : (isCurrentDay(day.date)?'var(--dc-current-day-color)' :'var(--dc-day-name-color)'),
            fontSize: 'var(--dc-day-name-font-size)',
            fontWeight: 'var(--dc-day-name-font-weight)'
          }">
            {{ getDayTitle(day.weekDay) }}
          </div>
        </div>
      </div>
    </div>
    <div ref="contentContainer" class="content-container hide-scrollbar">
      <div :class="{ 'hours-column': true, 'zoomable': zoom }" :style="{ height: calendarBodyHeight }"
        @mousedown="handleZoomStart" @touchstart="handleZoomStart">
        <div v-for="(hour, index) in dayHoursList" :key="index" class="hour-label">
          {{ hour.display }}
        </div>
      </div>
      <div class="calendar-body hide-scrollbar" @scroll="handleContentScroll" ref="calendarContent"
        :style="{ height: calendarBodyHeight }">
      
        <div class="grid-content" :style="{ minWidth: calendarBodyWidth, width:'100%'}">
          <div class="horizontal-grid">
            <div v-for="(hour, index) in dayHoursList" :key="index">
              <div class="grid-line-h"></div>
            </div>
          </div>
          <div class="vertical-grid">
            <div v-for="day in monthDays.length + 1" :key="day">
              <div :class="{ 'grid-line-v': day !== 1 }"></div>
            </div>
          </div>
          <div class="content">
           <div v-for="item in processedItems" :key="item.id" :style="item.style" class="calendar-item-wrapper">
              <div
                class="resize-handle top"
                @mousedown.stop="(event) => handleResizeStart(event, item, 'top')"
              ></div>
              <!-- content goes here : -->
              <slot name="item" :item="item">
              </slot>
              <div
                class="resize-handle bottom"
                @mousedown.stop="(event) => handleResizeStart(event, item, 'bottom')"
              ></div>
            </div>
          </div>        
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { type PropType, ref, defineComponent, onMounted ,computed } from 'vue'
import jalaali from 'jalaali-js'
interface CalendarItem {
  start: Date
  end: Date
  [key: string]: any
}

import { DateTime } from 'luxon'

import { useDragToScroll } from '@/composables/useDragToScroll'
export default defineComponent({
  name: 'CalendarGrid',
  props: {
    georgian: {
      type: Boolean,
      default: false,
      validator: (value: boolean, props) => {
        if (value === props.jalaali) {
          console.error('Exactly one of "georgian" or "jalaali" props must be true.')
          return false
        }
        return true
      },
    },
    zoom: {
      type: Boolean,
      default: true,
    },
    maxZoom: {
      type: Number,
      default: 5,
    },
    jalaali: {
      type: Boolean,
      default: false,
    },
    mode: {
      type: String as PropType<'month' | 'week' | 'custom'>,
      required: true,
      validator: (value: string) => {
        return ['month', 'week', 'custom'].includes(value)
      },
    },
     dir: {
      default:'ltr',
      type: String as PropType<'rtl' | 'ltr'>,
      required: true,
      validator: (value: string) => {
        return ['rtl', 'ltr'].includes(value)
      },
    },
    startDate: {
      type: Date,
      required: false,
      default: () => new Date(),
    },
    modelValue: {
      type: Array as PropType<{ start: Date; end: Date; [key: string]: any }[]>,
      default: () => [],
    },
    endDate: {
      type: Date,
      required: false,
      validator: (value: Date, props) => {
        if (props.mode === 'custom' && !value) {
          console.error('The `endDate` prop is required when `mode` is set to "custom".')
          return false
        }
        if ((props.mode === 'month' || props.mode === 'week') && value) {
          console.warn('`endDate` prop is ignored when `mode` is "month" or "week".')
        }
        return true
      },
    },
    startHour: {
      type: Number,
      default: 0,
      validator: (value: number) => value >= 0 && value <= 24,
    },
    endHour: {
      type: Number,
      default: 24,
      validator: (value: number, props) => {
        if (value < props.startHour) {
          console.error('`endHour` cannot be smaller than `startHour`.')
          return false
        }
        return value >= 0 && value <= 24
      },
    },
    lang: {
      type: String as PropType<'en' | 'fa'>,
      default: 'fa',
      validator: (value: string) => {
        return ['en', 'fa'].includes(value)
      },
    },
    format: {
      type: String as PropType<'ampm' | '24h' | 'keys'>,
      default: '24h',
      validator: (value: string) => {
        return ['ampm', '24h', 'keys'].includes(value)
      },
    },
    holidays:{
      type : Array as PropType<Date[]>,
      default : ()=> [],
    }
  }, 
  emits:['update:modelValue'],
  setup(props,{emit}) {
    const calendar = ref<HTMLElement | null>(null)
    const calendarContent = ref<HTMLElement | null>(null)
    const calendarHeader = ref<HTMLElement | null>(null)
    const contentContainer = ref<HTMLElement | null>(null)
    const isZooming = ref(false)



    useDragToScroll(calendarHeader)
    useDragToScroll(calendarContent, isZooming.value)



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
      if (props.lang === 'fa') {
        return [
          'saturday',
          'sunday',
          'monday',
          'tuesday',
          'wednesday',
          'thursday',
          'friday',
        ] as const
      }
      return [
        'sunday',
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
      ] as const
    })


    const toPersianNum = (n: number | string) =>
      String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]!)


          const monthDays = computed(() => {
      type DayObject = {
        day: number | string
        weekDay: string
        date: Date
      }
      const days: DayObject[] = []

      // Luxon's weekday: 1=Mon, 7=Sun. We need to map it to our weekdays array index.
      // For 'en' (Sun=0): Sunday is 7 -> 7 % 7 = 0. Monday is 1 -> 1 % 7 = 1.
      // For 'fa' (Sat=0): Saturday is 6 -> (6 + 1) % 7 = 0. Sunday is 7 -> (7 + 1) % 7 = 1.
   const getWeekdayIndex = (dt: DateTime) => {
        if (props.lang === 'fa') {
          // Luxon weekday: Sat=6, Sun=7, Mon=1.
          // Our 'fa' weekdays array starts with Saturday (index 0).
          // (6 % 7) = 6 -> not right.
          // (6 + 1) % 7 = 0 -> Saturday, correct.
          // (7 + 1) % 7 = 1 -> Sunday, correct.
          // (1 + 1) % 7 = 2 -> Monday, correct.
          return (dt.weekday + 1) % 7
        }
        // 'en' weekdays array starts with Sunday (index 0).
        // Luxon weekday: Sun=7, Mon=1.
        // 7 % 7 = 0 -> Sunday, correct.
        // 1 % 7 = 1 -> Monday, correct.
        return dt.weekday % 7
      }


    const addDay = (dt: DateTime, jalaaliDay?: number) => {
        let dayNum: number
        let displayDay: string | number

        if (props.jalaali && jalaaliDay) {
          dayNum = jalaaliDay
          displayDay = props.lang === 'fa' ? toPersianNum(jalaaliDay) : jalaaliDay
        } else if (props.jalaali) {
          const dtJalali = dt.reconfigure({ outputCalendar: 'persian' })
          dayNum = dtJalali.day
          displayDay = props.lang === 'fa' ? toPersianNum(dtJalali.day) : dtJalali.day
        } else {
          dayNum = dt.day
          displayDay = props.lang === 'fa' ? toPersianNum(dt.day) : dt.day
        }

        days.push({
          day: dayNum,
          displayDay: displayDay,
          weekDay: weekdays.value[getWeekdayIndex(dt)]!,
          date: dt.toJSDate()
        })
      }


      const startDt = DateTime.fromJSDate(props.startDate)

      if (props.mode === 'month') {
        if (props.jalaali) {
          const jd = jalaali.toJalaali(startDt.toJSDate())
          const monthInfo = jalaali.jalaaliMonthLength(jd.jy, jd.jm)
          for (let i = 1; i <= monthInfo; i++) {
            const georgianDate = jalaali.toGregorian(jd.jy, jd.jm, i)
            const dt = DateTime.fromObject({
              year: georgianDate.gy,
              month: georgianDate.gm,
              day: georgianDate.gd,
            })
            addDay(dt, i) // Pass the jalaali day `i` to addDay
          }
        } else {
          const endOfMonth = startDt.endOf('month')
          for (let i = 1; i <= endOfMonth.day; i++) {
            addDay(startDt.set({ day: i }))
          }
        }
      } else if (props.mode === 'week') {
        const weekStart =
          props.lang === 'fa'
            ? startDt.setLocale('fa-IR').startOf('week')
            : startDt.setLocale('en-US').startOf('week')

        for (let i = 0; i < 7; i++) {
          addDay(weekStart.plus({ days: i }))
        }
      } else if (props.mode === 'custom' && props.endDate) {
        const endDt = DateTime.fromJSDate(props.endDate)
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
      return props.georgian ? 'sunday' : 'friday'
    })

    const isWeekend = (day: string) => {
      return day === weekendDay.value
    }

    const getDayTitle = (day: string | undefined) => {
      let engDays = [
        {
          key: 'sunday',
          title: 'Sun',
        },
        {
          key: 'monday',
          title: 'Mon',
        },
        {
          key: 'tuesday',
          title: 'Tue',
        },
        {
          key: 'wednesday',
          title: 'Wed',
        },
        {
          key: 'thursday',
          title: 'Thu',
        },
        {
          key: 'friday',
          title: 'Fri',
        },
        {
          key: 'saturday',
          title: 'Sat',
        },
      ]
      let faDays = [
        {
          key: 'sunday',
          title: 'ی',
        },
        {
          key: 'monday',
          title: 'د',
        },
        {
          key: 'tuesday',
          title: 'س',
        },
        {
          key: 'wednesday',
          title: 'چ',
        },
        {
          key: 'thursday',
          title: 'پ',
        },
        {
          key: 'friday',
          title: 'ج',
        },
        {
          key: 'saturday',
          title: 'ش',
        },
      ]

      return (
        (props.lang === 'en'
          ? engDays.find((d) => d.key === day)?.title
          : faDays.find((d) => d.key === day)?.title) || ''
      )
    }

     const dayHoursList = computed(() => {
      const hours: Array<{ value: number; display: string }> = []
      for (let i = props.startHour; i <= props.endHour; i++) {
        let displayValue: string

        if (props.format === '24h') {
          const time = `${i}:00`
          displayValue = props.lang === 'fa' ? toPersianNum(time) : time
        } else if (props.format === 'ampm') {
          const hour = i % 12 === 0 ? 12 : i % 12
          if (props.lang === 'fa') {
            const period = i < 12 ? 'ق.ظ' : 'ب.ظ'
            displayValue = `${toPersianNum(hour)} ${period}`
          } else {
            const period = i < 12 ? 'am' : 'pm'
            displayValue = `${hour} ${period}`
          }
        } else if (props.format === 'keys') {
          if (props.lang === 'fa') {
            let period = ''
            if (i >= 0 && i < 6) period = 'شب' // Night
            else if (i >= 6 && i < 12) period = 'صبح' // Morning
            else if (i >= 12 && i < 18) period = 'ظهر' // Afternoon
            else period = 'عصر' // Evening
            displayValue = `${toPersianNum(i)} ${period}`
          } else {
            // English ('en')
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

    const dayCellWidth = ref(0)
    const dayCellHeight = ref(0)
    const zoomAmount = ref(1)
    const initialZoomOnDrag = ref(1)
    const minZoomAmount = ref(1)
    const maxZoomAmount = ref(props.maxZoom)

    const calendarBodyWidth = computed(() => {
      if (calendar.value) {
        const style = getComputedStyle(calendar.value)
        const dayContainerWidth = parseInt(
          style.getPropertyValue('--dc-day-container-width').trim(),
          10
        )
        return `${monthDays.value.length * dayContainerWidth}px`
      }
      return '0px'
    })

    const calendarBodyHeight = computed(() => {
      return `${dayHoursList.value.length * zoomAmount.value * dayCellHeight.value}px`
    })

    const topPadding = computed(()=>{
      return zoomAmount.value * dayCellHeight.value /2
    })

    // const zoomAmount = ref(1) // 1 = 100% zoom
    let startY = 0
    const dragFromUpperHalf = ref(true)

    let animationFrameId: number | null = null

    const handleZoomStart = (event: MouseEvent | TouchEvent) => {
      if (!props.zoom) return
      isZooming.value = true
      startY = 'touches' in event ? event.touches[0].clientY : event.clientY

      const targetElement = event.currentTarget as HTMLElement
      const rect = targetElement.getBoundingClientRect()
      const clickY = 'touches' in event ? event.touches[0].clientY : event.clientY
      const middleY = rect.top + rect.height / 2
      dragFromUpperHalf.value = clickY < middleY

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
        const currentY = 'touches' in event ? event.touches[0].clientY : event.clientY
        const deltaY = currentY - startY

        const zoomDirection = dragFromUpperHalf.value ? -1 : 1
        const newZoomAmount = zoomAmount.value + (deltaY * zoomDirection) / 50 // Adjust sensitivity
        zoomAmount.value = Math.max(
          minZoomAmount.value,
          Math.min(newZoomAmount, maxZoomAmount.value)
        ) // Clamp zoom level
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

      document.removeEventListener('mousemove', handleZoomMove)
      document.removeEventListener('touchmove', handleZoomMove)
      document.removeEventListener('mouseup', handleZoomEnd)
      document.removeEventListener('touchend', handleZoomEnd)
      document.removeEventListener('mouseleave', handleZoomEnd)
      document.removeEventListener('touchcancel', handleZoomEnd)
    }





  onMounted(() => {
      if (calendar.value && contentContainer.value) {
        const style = getComputedStyle(calendar.value)
        const widthStr = style.getPropertyValue('--dc-day-cell-width').trim()
        const heightStr = style.getPropertyValue('--dc-day-cell-height').trim()

        if (widthStr) {
          dayCellWidth.value = parseInt(widthStr, 10)
        }
        if (heightStr) { 
          dayCellHeight.value = parseInt(heightStr, 10)
        }

        // Calculate initial zoom to fit content width
        const containerWidth = contentContainer.value.clientWidth
        const naturalGridWidth = monthDays.value.length * dayCellWidth.value
        let requiredZoomX = 1
        if (naturalGridWidth > 0 && containerWidth > naturalGridWidth) {
          requiredZoomX = containerWidth / naturalGridWidth
        }

        // Calculate initial zoom to fit content height
        const containerHeight = contentContainer.value.clientHeight
        const naturalGridHeight = dayHoursList.value.length * dayCellHeight.value
        let requiredZoomY = 1
        if (naturalGridHeight > 0 && containerHeight > naturalGridHeight) {
          requiredZoomY = containerHeight / naturalGridHeight
        }

        // Use the larger of the two to fill the space
        const initialZoom = Math.max(requiredZoomX, requiredZoomY)

        if (initialZoom > 1) {
          zoomAmount.value = initialZoom
          minZoomAmount.value = initialZoom
          maxZoomAmount.value = initialZoom * props.maxZoom
        } else {
          minZoomAmount.value = 1
          maxZoomAmount.value = props.maxZoom
        }
      }
    })

 const processedItems = computed(() => {
      const dayWidth = 100 / monthDays.value.length
      const totalHours = props.endHour - props.startHour

      // The total height of the scrollable content area for items.
      const contentHeight =
        dayHoursList.value.length * zoomAmount.value * dayCellHeight.value - 2 * topPadding.value

      return props.modelValue
        .map((item, index) => {
          const startDt = DateTime.fromJSDate(item.start)
          const endDt = DateTime.fromJSDate(item.end)

          const dayIndex = monthDays.value.findIndex((day) => {
            const dayDt = props.jalaali
              ? DateTime.fromObject(
                  { day: day.day, month: startDt.month, year: startDt.year },
                  { zone: 'local', numberingSystem: 'latn', outputCalendar: 'persian' }
                )
              : DateTime.fromObject({
                  day: day.day,
                  month: startDt.month,
                  year: startDt.year
                })

            return dayDt.hasSame(startDt, 'day')
          })

          if (dayIndex === -1) {
            return null // Item is not in the visible range
          }

          const startOfDay = startDt.startOf('day').plus({ hours: props.startHour })
          const itemStartOffset = startDt.diff(startOfDay, 'minutes').minutes
          const itemDuration = endDt.diff(startDt, 'minutes').minutes

          const topOffset = (itemStartOffset / (totalHours * 60)) * contentHeight
          const height = (itemDuration / (totalHours * 60)) * contentHeight
          const left = dayIndex * dayWidth
          const width = dayWidth

          return {
            ...item,
            id: `item-${index}`,
            style: {
              top: `calc(${topPadding.value}px + ${topOffset}px)`,
              left: `${left}%`,
              height: `${height}px`,
              width: `${width}%`,
              position: 'absolute'
            }
          }
        })
        .filter((item) => item !== null)
    })

   const processedHolidays = computed(() => {
  return new Set(
    props.holidays.map(d => {
      const date = new Date(d)
      return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
    })
  )
})

const isHoliday = (date: Date) => {
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

  const resizingItem = ref<{ item: any; handle: 'top' | 'bottom' } | null>(null)
    const initialY = ref(0)
    const initialStart = ref<Date | null>(null)
    const initialEnd = ref<Date | null>(null)

    const handleResizeStart = (event: MouseEvent, item: any, handle: 'top' | 'bottom') => {
      resizingItem.value = { item, handle }
      initialY.value = event.clientY
      initialStart.value = new Date(item.start)
      initialEnd.value = new Date(item.end)

      document.addEventListener('mousemove', handleResizing)
      document.addEventListener('mouseup', handleResizeEnd)
    }




   const handleResizing = (event: MouseEvent) => {
      if (!resizingItem.value || !calendarContent.value) return

      const deltaY = event.clientY - initialY.value
      const calendarHeight = calendarContent.value.scrollHeight
      const totalMinutes = (props.endHour - props.startHour) * 60
      const minutesPerPixel = totalMinutes / calendarHeight

      const deltaMinutes = deltaY * minutesPerPixel

      const { item, handle } = resizingItem.value
      const newItems = props.modelValue.map((i) => (i === item.originalItem ? { ...i } : i))
      const itemToUpdate = newItems.find((i) => i === item.originalItem)

      if (!itemToUpdate || !initialStart.value || !initialEnd.value) return

      if (handle === 'top') {
        const newStart = new Date(initialStart.value.getTime() + deltaMinutes * 60000)
        // Ensure start time does not go past end time (with a 5-minute buffer)
        if (newStart.getTime() < initialEnd.value.getTime() - 5 * 60000) {
          itemToUpdate.start = newStart
        }
      } else {
        // handle === 'bottom'
        const newEnd = new Date(initialEnd.value.getTime() + deltaMinutes * 60000)
        // Ensure end time does not go before start time (with a 5-minute buffer)
        if (newEnd.getTime() > initialStart.value.getTime() + 5 * 60000) {
          itemToUpdate.end = newEnd
        }
      }
      emit('update:modelValue', newItems)
    }

    const handleResizeEnd = () => {
      resizingItem.value = null
      document.removeEventListener('mousemove', handleResizing)
      document.removeEventListener('mouseup', handleResizeEnd)
    }

    return {
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
      // resizing : 
      handleResizeEnd,
      handleResizeStart,
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
  user-select:none;
  flex: 1;
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
  padding: 0.5rem;
  min-width: var(--dc-day-container-width);
  flex-shrink: 0;
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

.current-day{
  color:var(-dc-current-day-color)
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
  min-width: var(--dc-day-container-width);
  z-index: 10;
  bottom: 0px;
  background-color: var(--dc-bg);
  display: flex;
  flex-direction: column;
  user-select: none;
  align-items: center;
  justify-content: space-around;
  width: var(--dc-day-container-width);
}

[dir='ltr'] .hours-column {
  border-right: var(--dc-border-width) solid var(--dc-border-color);
  border-left: none;
}

[dir='rtl'] .hours-column {
  border-left: var(--dc-border-width) solid var(--dc-border-color);
  border-right: none;
}

.hour-label {
  color: var(--dc-day-number-color);
  font-size: var(--dc-day-number-font-size);
  min-height: var(--dc-day-cell-height);
  height:0px;
  overflow: visible;
  display:flex;
  align-items:center;
  justify-content:center;
  font-weight: var(--dc-day-number-font-weight);
}

.grid-content {
  flex: 1;
  height: 100%;
  background-color: var(--dc-bg);
  overflow: hidden;
  position: relative;
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
  justify-content: space-between;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  inset: 0;
  gap: ();
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
  width: var(--dc-day-container-width);
  flex-shrink: 0;
  height: 100%;
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
}

.resize-handle {
  position: absolute;
  left: 0;
  right: 0;
  height: 8px; 
  cursor: ns-resize;
  z-index: 2;
}

.resize-handle.top {
  top: -4px; 
}

.resize-handle.bottom {
  bottom: -4px; 
}
</style>