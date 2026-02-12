<template>
  <div :dir="config.dir" ref="calendar" class="calendar-wrapper dope-calendar-grid">
    <div @click="deselectItems" @mousedown.stop="deselectItems" class="header-container">
      <div class="header-padding" :style="{ width: sidebarWidth + 'px', minWidth: sidebarWidth + 'px' }"></div>

      <div ref="calendarHeader" @scroll="handleHeaderScroll" class="calendar-header hide-scrollbar">
        <div v-for="(day, index) in monthDays" :key="index" :class="{
          'day-cell': true,
          'calendar-header-cell': true,
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

          <div v-if="config.headerFormat === 'dual'" class="day-name"
            style="font-size: 10px; margin-top: 1px; opacity: 0.7;">
            {{ getGeorgianDateString(day.date) }}
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
        <div v-if="shouldShowCurrentTime" class="current-time-line" :style="{ top: currentTimeTop }">
          <slot name="current-time">
            <div class="current-time-dot"></div>
            <div class="current-time-bar"></div>
          </slot>
        </div>
        <div class="grid-content" :style="{ minWidth: calendarBodyWidth, width: '100%' }"
          @mousemove="handleGridMouseMove" @mouseleave="handleGridMouseLeave">

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
            <transition name="fade">
              <div
                v-if="ghostEvent && selectedItemIndex === null && !isDragging && options.autoCreateEvent && config.editable"
                class="ghost-event" :style="ghostEventStyle" @click.stop="triggerAddEvent">
                <slot name="add-event-button" :hover-data="ghostEvent">
                  <div class="ghost-plus-icon">
                    <div style="height:32px">+</div>
                  </div>
                </slot>
              </div>
            </transition>

            <div v-for="(item, index) in processedItems" :key="item.id" class="calendar-item-wrapper" :class="{
              selected: selectedItemIndex === index,
              dragging: draggingItem?.originalIndex === index,
              'no-transition': silentUpdateIndex === index,
              'transition-to-final': overriddenItemIndex !== index
            }" :style="getItemStyle(item, index)" @mousedown="handleDragStart($event, item, index)"
              @touchstart="handleDragStart($event, item, index)" @click="handleItemClick($event, index)">
              <div class="default-item">
                <div v-if="selectedItemIndex === index" class="resize-handle-top"
                  @touchstart.stop="handleResizeStart($event, item, 'top')"
                  @mousedown.stop="handleResizeStart($event, item, 'top')"></div>

                <div class="item-content">
                  <slot name="item" :item="item"></slot>
                </div>

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
import { type PropType, ref, defineComponent, watch, onMounted, onUnmounted, computed, nextTick, type StyleValue } from 'vue'
import * as jalaali from 'jalaali-js'
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
  autoCreateEvent?: boolean // New option
  ghostClass?: string;          // NEW: Custom class for ghost element
  ghostStyle?: Record<string, any>; // NEW: Custom style object
  newEventDefaults?: Record<string, any>; // NEW: Default props for new items
  headerFormat?: 'default' | 'dual'
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
  emits: ['update:modelValue', 'event-create'],
  setup(props, { emit }) {
    const calendar = ref<HTMLElement | null>(null)
    const calendarContent = ref<HTMLElement | null>(null)
    const calendarHeader = ref<HTMLElement | null>(null)
    const contentContainer = ref<HTMLElement | null>(null)
    const isZooming = ref(false)
    const silentUpdateIndex = ref<number | null>(null)
    const isDragging = computed(() => draggingItem.value !== null);

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
        holidays: [],
        autoCreateEvent: true,
        headerFormat: 'default' // Default behavior
      }
      return { ...defaults, ...props.options }
    })


    const getGeorgianDateString = (date: Date) => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      return `${date.getDate()}${months[date.getMonth()]}`
    }

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

    // --- Helpers for Native Date ---
    const cloneDate = (d: Date) => new Date(d.getTime())

    const addDays = (d: Date, days: number) => {
      const n = cloneDate(d)
      n.setDate(n.getDate() + days)
      return n
    }

    const startOfDay = (d: Date) => {
      const n = cloneDate(d)
      n.setHours(0, 0, 0, 0)
      return n
    }

    const diffDays = (d1: Date, d2: Date) => {
      // returns d1 - d2 in days
      const t1 = startOfDay(d1).getTime()
      const t2 = startOfDay(d2).getTime()
      return (t1 - t2) / (1000 * 3600 * 24)
    }

    const isSameDay = (d1: Date, d2: Date) => {
      return d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate()
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

      const getWeekdayIndex = (dt: Date) => {
        const day = dt.getDay() // 0=Sun, 6=Sat
        if (config.value.lang === 'fa') {
          // Map: Sat(6)->0, Sun(0)->1 ... Fri(5)->6
          if (day === 6) return 0
          return day + 1
        }
        // Map: Sun(0)->0, Mon(1)->1
        return day
      }

      const addDay = (dt: Date, jalaaliDay?: number) => {
        let dayNum: number
        let displayDay: string | number

        if (config.value.calendar === 'jalaali') {
          const jDate = jalaali.toJalaali(dt)
          dayNum = jDate.jd
          displayDay = config.value.lang === 'fa' ? toPersianNum(jDate.jd) : jDate.jd
        } else {
          dayNum = dt.getDate()
          displayDay = config.value.lang === 'fa' ? toPersianNum(dayNum) : dayNum
        }

        days.push({
          day: dayNum,
          displayDay: displayDay,
          weekDay: weekdays.value[getWeekdayIndex(dt)]!,
          date: new Date(dt) // Store copy
        })
      }

      const startDt = new Date(config.value.startDate)

      if (config.value.mode === 'month') {
        if (config.value.calendar === 'jalaali') {
          const jd = jalaali.toJalaali(startDt)
          const monthInfo = jalaali.jalaaliMonthLength(jd.jy, jd.jm)
          for (let i = 1; i <= monthInfo; i++) {
            const g = jalaali.toGregorian(jd.jy, jd.jm, i)
            const dt = new Date(g.gy, g.gm - 1, g.gd)
            addDay(dt, i)
          }
        } else {
          // Georgian Month Mode
          // Start from day 1 of current month
          const currentMonth = startDt.getMonth()
          const iter = new Date(startDt.getFullYear(), currentMonth, 1)
          while (iter.getMonth() === currentMonth) {
            addDay(iter)
            iter.setDate(iter.getDate() + 1)
          }
        }
      } else if (config.value.mode === 'week') {
        let weekStart: Date;
        const currentDay = startDt.getDay(); // 0 (Sun) - 6 (Sat)

        if (config.value.calendar === 'jalaali') {
          // Jalaali: Start Saturday (6)
          // Sat(6) -> offset 0
          // Sun(0) -> offset 1
          // Fri(5) -> offset 6
          const offset = currentDay === 6 ? 0 : (currentDay + 1);
          weekStart = addDays(startDt, -offset);
        } else {
          // Georgian: Start Monday (1)
          // Mon(1) -> offset 0
          // Tue(2) -> offset 1
          // Sun(0) -> offset 6
          const offset = currentDay === 0 ? 6 : (currentDay - 1);
          weekStart = addDays(startDt, -offset);
        }

        for (let i = 0; i < 7; i++) {
          addDay(addDays(weekStart, i));
        }
      } else if (config.value.mode === 'custom' && config.value.endDate) {
        const endDt = startOfDay(new Date(config.value.endDate))
        let currentDt = startOfDay(startDt)

        // Safety break
        let safety = 0
        while (currentDt <= endDt && safety < 3650) {
          addDay(currentDt)
          currentDt = addDays(currentDt, 1)
          safety++
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

    // --- PROCESSED ITEMS (Merged Google Style + Date Logic) ---
    const processedItems = computed(() => {
      const dayWidthPercent = 100 / monthDays.value.length
      const totalHours = config.value.endHour - config.value.startHour
      const contentHeight = dayHoursList.value.length * zoomAmount.value * dayCellHeight.value - 2 * topPadding.value

      // GET DRAGGING INDEX
      const draggingIndex = draggingItem.value ? draggingItem.value.originalIndex : -1

      // 1. Map items
      const rawItems = props.modelValue
        .map((item, index) => {
          const startDt = new Date(item.start)
          const endDt = new Date(item.end)

          const startDayIndex = monthDays.value.findIndex((day) => isSameDay(day.date, startDt))
          if (startDayIndex === -1) return null

          const startMinutes = startDt.getHours() * 60 + startDt.getMinutes();
          let endMinutes = endDt.getHours() * 60 + endDt.getMinutes();

          let durationMinutes = endMinutes - startMinutes;
          if (durationMinutes < 0) durationMinutes += 24 * 60;
          if (durationMinutes < 15) durationMinutes = 15;

          const isSameDayVal = isSameDay(startDt, endDt)
          let daySpan = 1
          if (!isSameDayVal) {
            daySpan = Math.floor(Math.abs(diffDays(endDt, startDt))) + 1
          }

          const dayStartMin = config.value.startHour * 60
          const itemStartOffset = startMinutes - dayStartMin

          const topOffset = (itemStartOffset / (totalHours * 60)) * contentHeight
          const height = (durationMinutes / (totalHours * 60)) * contentHeight

          return {
            ...item,
            id: `item-${index}`,
            originalIndex: index,
            _startDayIndex: startDayIndex,
            _startMinutes: startMinutes,
            _endMinutes: startMinutes + durationMinutes,
            _topOffset: topOffset,
            _height: height,
            daySpan
          }
        })
        .filter((item) => item !== null) as any[];

      // 2. Group by Day
      const itemsByDay: Record<number, any[]> = {};
      rawItems.forEach(item => {
        if (config.value.editable && item.originalIndex === draggingIndex) return;
        if (!itemsByDay[item._startDayIndex]) itemsByDay[item._startDayIndex] = [];
        itemsByDay[item._startDayIndex].push(item);
      });

      const finalItems: any[] = [];

      // 3. Add Dragged Item Separately (Hidden)
      if (draggingIndex !== -1) {
        const dragged = rawItems.find(i => i.originalIndex === draggingIndex);
        if (dragged) {
          dragged.style = { display: 'none' };
          finalItems.push(dragged);
        }
      }

      // 4. Apply Clustering & Packing
      Object.keys(itemsByDay).forEach(key => {
        const dayIndex = parseInt(key);
        const dayItems = itemsByDay[dayIndex];

        // Sort by start time
        dayItems.sort((a, b) => {
          if (a._startMinutes === b._startMinutes) return b._endMinutes - a._endMinutes;
          return a._startMinutes - b._startMinutes;
        });

        // 4a. Create Clusters (Groups of intersecting events)
        const clusters: any[][] = [];
        let currentCluster: any[] = [];
        let clusterEnd = -1;

        dayItems.forEach(item => {
          if (currentCluster.length === 0) {
            currentCluster.push(item);
            clusterEnd = item._endMinutes;
          } else {
            // If item starts AFTER the current cluster finishes, it's a new cluster
            if (item._startMinutes >= clusterEnd) {
              clusters.push(currentCluster);
              currentCluster = [item];
              clusterEnd = item._endMinutes;
            } else {
              currentCluster.push(item);
              if (item._endMinutes > clusterEnd) clusterEnd = item._endMinutes;
            }
          }
        });
        if (currentCluster.length > 0) clusters.push(currentCluster);

        // 4b. Process each cluster independently
        clusters.forEach(clusterItems => {
          const columns: any[][] = [];

          clusterItems.forEach(item => {
            let placed = false;
            for (let i = 0; i < columns.length; i++) {
              const col = columns[i];
              const last = col[col.length - 1];
              if (item._startMinutes >= last._endMinutes) {
                col.push(item);
                item._colIndex = i;
                placed = true;
                break;
              }
            }
            if (!placed) {
              columns.push([item]);
              item._colIndex = columns.length - 1;
            }
          });

          const numCols = columns.length;

          clusterItems.forEach(item => {
            const colWidthPercent = dayWidthPercent / numCols;
            const offsetInDay = item._colIndex * colWidthPercent;

            let positionStyle = {};
            if (config.value.dir === 'rtl') {
              positionStyle = { right: `${(dayIndex * dayWidthPercent) + offsetInDay}%`, left: 'auto' };
            } else {
              positionStyle = { left: `${(dayIndex * dayWidthPercent) + offsetInDay}%`, right: 'auto' };
            }

            const zIndex = Math.max(100000, 100000 - Math.floor(item.itemDuration || 0)) + item._colIndex;

            item.style = {
              top: `calc(${topPadding.value}px + ${item._topOffset}px)`,
              ...positionStyle,
              height: `${item._height}px`,
              width: `${item.daySpan > 1 ? item.daySpan * dayWidthPercent : colWidthPercent}%`,
              position: 'absolute',
              zIndex: zIndex,
              boxSizing: 'border-box',
              border: '1px solid white'
            };
          });

          finalItems.push(...clusterItems);
        });
      });

      return finalItems;
    })

    const processedHolidays = computed(() => {
      const isJalaali = config.value.calendar === 'jalaali'

      const keys = config.value.holidays.map((d: any) => {
        if (isJalaali && typeof d === 'string') {
          const normalized = d.replace(/\//g, '-')
          if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/.test(normalized)) {
            const parts = normalized.split(/[-/]/).map((p: string) => parseInt(p, 10))
            const g = jalaali.toGregorian(parts[0]!, parts[1]!, parts[2]!)
            return `${g.gy}-${g.gm - 1}-${g.gd}`
          }
        }
        const date = new Date(d)
        if (isNaN(date.getTime())) return null
        return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
      })

      return new Set(keys.filter((k: any) => k))
    })

    const isHoliday = (date: Date) => {
      if (!date) return false
      return processedHolidays.value.has(
        `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
      )
    }

    const isCurrentDay = (date: Date) => {
      const today = new Date()
      return isSameDay(date, today)
    }

    // --- NEW: Current Time Logic ---
    const now = ref(new Date());
    let timeInterval: any;

    const shouldShowCurrentTime = computed(() => {
      const h = now.value.getHours();
      return h >= config.value.startHour && h <= config.value.endHour;
    });

    const currentTimeTop = computed(() => {
      const totalHours = config.value.endHour - config.value.startHour
      const contentHeight = dayHoursList.value.length * zoomAmount.value * dayCellHeight.value - 2 * topPadding.value

      const currentMin = now.value.getHours() * 60 + now.value.getMinutes()
      const startMin = config.value.startHour * 60
      const offset = currentMin - startMin

      const px = (offset / (totalHours * 60)) * contentHeight
      return `calc(${topPadding.value}px + ${px}px)`
    });

    const scrollToFirstEvent = () => {
      if (!contentContainer.value) return;
      let targetY = 0;

      // Find earliest time
      let minH = 24;
      let hasEvent = false;

      if (props.modelValue.length > 0) {
        props.modelValue.forEach(i => {
          const h = new Date(i.start).getHours();
          if (h < minH) minH = h;
        });
        hasEvent = true;
      }

      const startH = config.value.startHour;
      const totalH = config.value.endHour - startH;
      const scrollH = dayHoursList.value.length * zoomAmount.value * dayCellHeight.value;

      let targetHour = hasEvent ? Math.max(startH, minH - 1) : 8; // Default 8am if empty
      if (targetHour < startH) targetHour = startH;

      targetY = ((targetHour - startH) / totalH) * scrollH;

      contentContainer.value.scrollTo({ top: targetY, behavior: 'smooth' });
    };

    // --- NEW: Ghost Event Logic ---
    const ghostEvent = ref<any>(null);

    const handleGridMouseMove = (e: MouseEvent) => {
      if (!config.value.editable) return;

      // CONFLICT FIX: If hovering over an existing item, DO NOT show ghost event
      const target = e.target as HTMLElement;
      if (target.closest('.calendar-item-wrapper')) {
        ghostEvent.value = null;
        return;
      }

      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Day Index
      const dayW = rect.width / monthDays.value.length;
      let dayIdx = Math.floor(x / dayW);
      if (config.value.dir === 'rtl') {
        dayIdx = (monthDays.value.length - 1) - dayIdx;
      }

      if (dayIdx < 0 || dayIdx >= monthDays.value.length) {
        ghostEvent.value = null;
        return;
      }

      // Time
      // Account for topPadding in grid visual calculation
      const effectiveY = y - topPadding.value;
      const contentHeight = dayHoursList.value.length * zoomAmount.value * dayCellHeight.value - 2 * topPadding.value;

      const percent = Math.max(0, Math.min(1, effectiveY / contentHeight));
      const totalMin = (config.value.endHour - config.value.startHour) * 60;
      const rawMin = percent * totalMin;

      const snap = 30; // 30 min snap
      const snappedMin = Math.floor(rawMin / snap) * snap;

      const startTotalMin = config.value.startHour * 60 + snappedMin;

      // Date calc
      const dateBase = monthDays.value[dayIdx].date;
      const startDt = new Date(dateBase);
      startDt.setHours(Math.floor(startTotalMin / 60), startTotalMin % 60);

      const endDt = new Date(startDt);
      endDt.setMinutes(endDt.getMinutes() + 60); // Default 1 hour

      // Visual
      const topPx = (snappedMin / totalMin) * contentHeight + topPadding.value;
      const heightPx = (60 / totalMin) * contentHeight;

      ghostEvent.value = {
        dayIdx,
        startDt,
        endDt,
        top: topPx,
        height: heightPx
      };
    };

    const handleGridMouseLeave = () => { ghostEvent.value = null; };

    const ghostEventStyle = computed(() => {
      if (!ghostEvent.value) return {};
      const dayW = 100 / monthDays.value.length;

      // Base positioning styles
      const base = {
        top: `${ghostEvent.value.top}px`,
        height: `${ghostEvent.value.height}px`,
        width: `${dayW}%`,
        position: 'absolute',
        zIndex: 30
      } as any;

      // RTL/LTR Logic
      if (config.value.dir === 'rtl') {
        base.right = `${ghostEvent.value.dayIdx * dayW}%`;
        base.left = 'auto';
      } else {
        base.left = `${ghostEvent.value.dayIdx * dayW}%`;
        base.right = 'auto';
      }

      // Merge with user config styles
      return { ...base, ...(config.value.ghostStyle || {}) };
    });

    const triggerAddEvent = () => {
      if (!ghostEvent.value) return;

      // Create a clean object with valid Date instances
      const newItem = {
        title: 'New Event',
        start: new Date(ghostEvent.value.startDt),
        end: new Date(ghostEvent.value.endDt),
        style: { backgroundColor: 'var(--dc-current-day-color)' },
        // Allow spreading custom properties if needed
        ...config.value.newEventDefaults
      };

      // Emit event for parent to handle (custom logic)
      emit('event-create', newItem);

      // Auto-add logic
      if (config.value.autoCreateEvent) {
        // Clone the array to ensure reactivity triggers in parent
        const newList = [...props.modelValue, newItem];
        emit('update:modelValue', newList);
      }

      // Clear ghost event
      ghostEvent.value = null;
    };

    // --- EXISTING LOGIC (Drag, Resize) ---
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

      // Only update horizontal position if NOT in vertical-only mode
      if (!isVerticalDragOnly.value) {
        dragGhost.value.style.left = `${clientX - dragGhost.value.offsetWidth / 2}px`
      }

      dragGhost.value.style.top = `${clientY - dragGhost.value.offsetHeight / 2}px`

      const scrollThreshold = 30
      const scrollSpeed = config.value.speed

      if (autoScrollInterval.value !== null) {
        clearInterval(autoScrollInterval.value)
        autoScrollInterval.value = null
      }

      let shouldScroll = false
      let scrollLeft = false, scrollRight = false, scrollUp = false, scrollDown = false

      if (config.value.dir === 'rtl') {
        if (calendarRect.right - clientX < scrollThreshold) { scrollLeft = true; shouldScroll = true }
        else if (clientX - calendarRect.left < scrollThreshold) { scrollRight = true; shouldScroll = true }
      } else {
        if (clientX - calendarRect.left < scrollThreshold) { scrollLeft = true; shouldScroll = true }
        else if (calendarRect.right - clientX < scrollThreshold) { scrollRight = true; shouldScroll = true }
      }

      if (clientY - contentContainerRect.top < scrollThreshold) { scrollUp = true; shouldScroll = true }
      else if (contentContainerRect.bottom - clientY < scrollThreshold) { scrollDown = true; shouldScroll = true }

      if (shouldScroll) {
        autoScrollInterval.value = window.setInterval(() => {
          if (!calendarContent.value || !contentContainer.value) return
          if (scrollLeft) calendarContent.value.scrollLeft = Math.max(0, calendarContent.value.scrollLeft - scrollSpeed)
          if (scrollRight) calendarContent.value.scrollLeft = Math.min(calendarContent.value.scrollWidth - calendarContent.value.clientWidth, calendarContent.value.scrollLeft + scrollSpeed)
          if (scrollUp) contentContainer.value.scrollTop = Math.max(0, contentContainer.value.scrollTop - scrollSpeed)
          if (scrollDown) contentContainer.value.scrollTop = Math.min(contentContainer.value.scrollHeight - contentContainer.value.clientHeight, contentContainer.value.scrollTop + scrollSpeed)
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
        isInsideContainer = clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom
      }

      let targetDayIndex = isVerticalDragOnly.value ? 0 : selectedIndex.value
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
        const originalDurationMs = new Date(originalItem.end).getTime() - new Date(originalItem.start).getTime()
        const currentScrollTop = contentContainer.value.scrollTop
        const currentScrollLeft = calendarContent.value.scrollLeft

        const scrollDiffX = currentScrollLeft - (draggingItem.value.initialScrollLeft || 0)
        const deltaX = (clientX - dragStartX.value) + scrollDiffX

        const dayWidth = dayCellWidth.value
        let dayShift = isVerticalDragOnly.value ? 0 : Math.round(deltaX / dayWidth)
        if (config.value.dir === 'rtl') dayShift *= -1

        const scrollDiffY = currentScrollTop - (draggingItem.value.initialScrollTop || 0)
        const deltaY = (clientY - dragStartY.value) + scrollDiffY

        const totalHours = config.value.endHour - config.value.startHour
        const contentHeight = dayHoursList.value.length * zoomAmount.value * dayCellHeight.value - 2 * topPadding.value
        const pixelsPerMinute = contentHeight / (totalHours * 60)

        const minuteShift = deltaY / pixelsPerMinute
        const snappedMinuteShift = Math.round(minuteShift / config.value.minTime) * config.value.minTime

        const originalStart = new Date(originalItem.start)
        let newStartDt = addDays(originalStart, dayShift)
        newStartDt = new Date(newStartDt.getTime() + snappedMinuteShift * 60000)

        const adjustedStart = newStartDt
        const adjustedEnd = new Date(adjustedStart.getTime() + originalDurationMs)

        updatedItems = props.modelValue.map((item, idx) => idx === draggingItem.value?.originalIndex ? { ...item, start: adjustedStart, end: adjustedEnd } : item)

        if (calendarContent.value && calendarHeader.value) {
          const containerRect = calendarContent.value.getBoundingClientRect()
          const headerChildren = Array.from(calendarHeader.value.children) as HTMLElement[]

          // IMPORTANT FIX: Get current scroll top to subtract from calculation
          // Since calendarContent (calendar-body) is the scrollable element
          const currentContainerScroll = calendarContent.value.scrollTop;

          const dayStartOf = startOfDay(adjustedStart)
          dayStartOf.setHours(config.value.startHour, 0, 0, 0)

          const itemStartOffsetMin = (adjustedStart.getTime() - dayStartOf.getTime()) / 60000
          const topOffsetPx = (itemStartOffsetMin / (totalHours * 60)) * contentHeight

          let durationMin = (adjustedEnd.getHours() * 60 + adjustedEnd.getMinutes()) - (adjustedStart.getHours() * 60 + adjustedStart.getMinutes());
          if (durationMin < 0) durationMin += 24 * 60;
          const heightPx = (durationMin / (totalHours * 60)) * contentHeight

          const finalStartDayIndex = monthDays.value.findIndex((d) => isSameDay(d.date, adjustedStart))
          const visualStartIndex = finalStartDayIndex !== -1 ? finalStartDayIndex : targetDayIndex;

          let leftPos = 0;
          let targetWidth = 0;
          let daySpan = isSameDay(adjustedStart, adjustedEnd) ? 1 : Math.floor(Math.abs(diffDays(adjustedEnd, adjustedStart))) + 1;

          if (headerChildren[visualStartIndex]) {
            leftPos = headerChildren[visualStartIndex].getBoundingClientRect().left;
            for (let i = 0; i < daySpan; i++) {
              const currentHeader = headerChildren[visualStartIndex + i];
              targetWidth += currentHeader ? currentHeader.getBoundingClientRect().width : headerChildren[visualStartIndex].getBoundingClientRect().width;
            }
          } else {
            leftPos = clientX - (dragGhost.value?.offsetWidth || 0) / 2;
            targetWidth = dayCellWidth.value * daySpan;
          }

          // FIX: Subtract currentContainerScroll
          targetRect = {
            top: containerRect.top + topPadding.value + topOffsetPx - currentContainerScroll,
            left: leftPos,
            width: targetWidth,
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
          if (draggingItem.value) silentUpdateIndex.value = draggingItem.value.originalIndex
          if (isValidDrop) emit('update:modelValue', updatedItems)
          await nextTick()
          if (dragGhost.value) dragGhost.value.remove()
          dragGhost.value = null; draggingItem.value = null
          if (draggedElement.value) { draggedElement.value.classList.remove('dragging'); draggedElement.value = null }
          selectedIndex.value = -1; selectedItemIndex.value = null
          setTimeout(() => { silentUpdateIndex.value = null }, 50)
        }, 300)
      } else {
        if (isValidDrop) emit('update:modelValue', updatedItems)
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

      const originalStart = initialStart.value
      const originalEnd = initialEnd.value

      if (handle === 'left') {
        const newStart = addDays(originalStart, deltaDays)
        if (newStart.getTime() < itemToUpdate.end.getTime()) {
          itemToUpdate.start = newStart
        }
      } else {
        const newEnd = addDays(originalEnd, deltaDays)
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

    const isVerticalDragOnly = computed(() => {
      return config.value.mode === 'custom' &&
        config.value.endDate &&
        isSameDay(new Date(config.value.startDate), new Date(config.value.endDate))
    })

    // --- Lifecycle (Mount, Auto Scroll, Clock) ---
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

      // Auto-Scroll Feature
      setTimeout(() => scrollToFirstEvent(), 100);

      // Clock Feature
      timeInterval = setInterval(() => { now.value = new Date() }, 60000);
    })

    onUnmounted(() => {
      clearInterval(timeInterval);
    });

    watch(monthDays, () => {
      nextTick(updateDayCellWidth);
    });

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
      getGeorgianDateString,
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
      sidebarWidth,

      // NEW RETURNS
      shouldShowCurrentTime,
      currentTimeTop,
      ghostEvent,
      ghostEventStyle,
      handleGridMouseMove,
      handleGridMouseLeave,
      triggerAddEvent,
      isDragging,
    }
  },
})
</script>

<style scoped>
@import '@/assets/css/calendar.css';

/* --- NEW FEATURES STYLES --- */

/* Ghost Event */
.ghost-event {
  pointer-events: auto;
  cursor: pointer;
  background-color: var(--dc-ghost-bg, rgba(59, 130, 246, 0.2));
  border: var(--dc-ghost-border, 2px dashed #3b82f6);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.ghost-plus-icon {
  font-size: 20px;
  font-weight: bold;
  color: var(--dc-ghost-text, #2563eb);
  background: rgba(255, 255, 255, 0.6);
  width: 24px;
  height: 24px;
  overflow: visible;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

/* Current Time Indicator */
.current-time-line {
  position: absolute;
  width: 100%;
  pointer-events: none;
  z-index: 20;
  display: flex;
  align-items: center;
}

.current-time-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: var(--dc-now-indicator-color, #ef4444);
  position: sticky;
  /* Changed from absolute to sticky */
  z-index: 21;
  transform: translateY(0%);
  flex-shrink: 0;
  /* Removed top/transform since flex align-items:center handles vertical centering in the line */
}

[dir="ltr"] .current-time-dot {
  left: 0;
}

/* RTL: Stick to right edge */
[dir="rtl"] .current-time-dot {
  right: 0;
}

.current-time-bar {
  width: 100%;
  height: var(--dc-now-indicator-line-width, 2px);
  background-color: var(--dc-now-indicator-color, #ef4444);
}

/* --- EXISTING CSS BELOW --- */

.content {
  position: relative;
  width: 100%;
  height: 100%;
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
  transition: box-shadow 0.2s ease, transform 0.2s ease, top 0.3s ease, left 0.3s ease, width 0.3s ease, height 0.3s ease;
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

.item-container {
  margin: 0px !important;
  padding: 0px !important
}

.default-item {
  padding: 0px !important;
  height: 100%;
  margin: 0px !important;
  overflow: hidden;
  font-size: 12px;
  position: relative;
}

.item-content {
  width: 100%;
  height: 100%;
  padding: 0px;
  margin: 0px;
  overflow: hidden;
}

.grid-item-content {
  height: 100% !important;
  max-height: 100% !important;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 0.75rem;
  color: white;
  overflow: hidden;
}

.item-content :deep(> *) {
  margin: 0 !important;
  padding: 0px !important;
  box-sizing: border-box !important;
  height: 100%;
  width: 100%;
}
</style>