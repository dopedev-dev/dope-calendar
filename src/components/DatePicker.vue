<template>
  <div class=" w-full max-w-[330px]">
    <div :class="[fixedTime ? ' justify-center' : 'justify-between', 'w-full flex mb-8 items-center']">
      <PhCaretRight v-if="!fixedTime" @click="previousMonth" :size="20" class="cursor-pointer" />
      <div class="select-none text-sub-lg text-black dark:text-white">{{ currentYear }} {{ currentMonth }}</div>
      <PhCaretLeft v-if="!fixedTime" :size="20" @click="nextMonth" class="cursor-pointer" />
    </div>
    <div class="w-full grid gap-4 grid-cols-7">
      <div v-for="(day, index) in daysOfWeek" :key="index"
        class="select-none text-black dark:text-white/50 text-body-sm">
        <div class="text-center">{{ day }}</div>
      </div>
      <div class="w-20 h-20 bg-transparent" v-for="n in dayOfWeek" :key="n"></div>
      <DateDay :events="currentMonthEvents[n] || 0" :isSelected="selectedDay === n" @click="selectDate(n)"
        v-for="n in dayNumbers" :key="n" :dateDay="n" :isCurrentDay="n === currentDayOfMonth"
        :isFuture="presentOnly && isFutureOrPresent(n)" />
    </div>
  </div>
</template>

<script lang="ts">
import { computed, nextTick, defineComponent, onMounted, type PropType, watch, ref } from 'vue'
import DateDay from './date-picker/DateDay.vue'

import jalaali from 'jalaali-js'
export interface Event {
  date: Date | string
  events: number
}
export default defineComponent({
  name: 'DatePicker',
  components: {
    DateDay
  },
  props: {
    modelValue: {
      type: [Date, String] as PropType<Date | string>,
      required: true,
      default: new Date()
    },
    presentOnly: {
      type: Boolean,
      default: true
    },
    events: {
      type: Array as PropType<Event[]>,
      default: () => []
    },
    fixedTime: {
      type: Boolean,
      default: false
    },
    timeOffset: {
      type: Number,
      default: 0
    },
    eventSelection: {
      type: Boolean,
      default: false
    },
    jalaali:{
        type: Boolean,
        default: false
    }
  },
  emits: ['update:modelValue', 'selected'],
  setup(props, { emit }) {
    const isJalali = computed(() => props.jalaali)

    // For Gregorian calendar
    const getValidDate = (value: Date | string): Date => {
      if (!value || value === '' || (typeof value === 'string' && value.trim() === '')) {
        return new Date()
      }
      if (typeof value === 'string') {
        const parsed = new Date(value)
        return isNaN(parsed.getTime()) ? new Date() : parsed
      }
      return isNaN(value.getTime()) ? new Date() : value
    }

    const validDate = getValidDate(props.modelValue)

    // For Gregorian calendar
    const currentGregorianDate = ref({
      year: validDate.getFullYear(),
      month: validDate.getMonth(),
      day: validDate.getDate()
    })

    // For Jalali calendar
    const currentJalaliDate = ref(
      jalaali.toJalaali(
        validDate.getFullYear(),
        validDate.getMonth() + 1,
        validDate.getDate()
      )
    )

    onMounted(() => {
      // console.log('hello date picker')
      nextTick(() => {
        if (props.fixedTime) {
          for (let a = 0; a < Math.abs(props.timeOffset); a++) {
            if (props.timeOffset > 0) {
              nextMonth()
            } else {
              previousMonth()
            }
          }
        }
      })
    })

    // Days of week based on locale
    const daysOfWeek = computed(() => {
      return isJalali.value
        ? ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج']
        : ['S', 'M', 'T', 'W', 'T', 'F', 'S']
    })

    const currentMonth = computed(() => {
      if (isJalali.value) {
        const persianMonths = [
          'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
          'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
        ]
        return persianMonths[currentJalaliDate.value.jm - 1]
      } else {
        const gregorianMonths = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ]
        return gregorianMonths[currentGregorianDate.value.month]
      }
    })

    const currentYear = computed(() => {
      return isJalali.value ? currentJalaliDate.value.jy : currentGregorianDate.value.year
    })

    const dayOfWeek = computed(() => {
      if (isJalali.value) {
        const firstDayOfMonth = jalaali.toGregorian(currentJalaliDate.value.jy, currentJalaliDate.value.jm, 1)
        const startOfMonth = new Date(firstDayOfMonth.gy, firstDayOfMonth.gm - 1, firstDayOfMonth.gd)
        return (startOfMonth.getDay() + 1) % 7
      } else {
        const startOfMonth = new Date(currentGregorianDate.value.year, currentGregorianDate.value.month, 1)
        return startOfMonth.getDay()
      }
    })

    const currentDayOfMonth = computed(() => {
      const today = new Date()

      if (isJalali.value) {
        const jToday = jalaali.toJalaali(today.getFullYear(), today.getMonth() + 1, today.getDate())
        if (jToday.jy === currentJalaliDate.value.jy && jToday.jm === currentJalaliDate.value.jm) {
          return jToday.jd
        }
      } else {
        if (today.getFullYear() === currentGregorianDate.value.year &&
          today.getMonth() === currentGregorianDate.value.month) {
          return today.getDate()
        }
      }
      return null
    })

    const previousMonth = () => {
      if (isJalali.value) {
        let prevYear = currentJalaliDate.value.jy
        let prevMonth = currentJalaliDate.value.jm - 1

        if (prevMonth === 0) {
          prevMonth = 12
          prevYear--
        }

        currentJalaliDate.value = {
          jy: prevYear,
          jm: prevMonth,
          jd: 1
        }
      } else {
        let prevYear = currentGregorianDate.value.year
        let prevMonth = currentGregorianDate.value.month - 1

        if (prevMonth < 0) {
          prevMonth = 11
          prevYear--
        }

        currentGregorianDate.value = {
          year: prevYear,
          month: prevMonth,
          day: 1
        }
      }
    }

    const nextMonth = () => {
      if (isJalali.value) {
        let nextYear = currentJalaliDate.value.jy
        let nextMonth = currentJalaliDate.value.jm + 1

        if (nextMonth > 12) {
          nextMonth = 1
          nextYear++
        }

        currentJalaliDate.value = {
          jy: nextYear,
          jm: nextMonth,
          jd: 1
        }
      } else {
        let nextYear = currentGregorianDate.value.year
        let nextMonth = currentGregorianDate.value.month + 1

        if (nextMonth > 11) {
          nextMonth = 0
          nextYear++
        }

        currentGregorianDate.value = {
          year: nextYear,
          month: nextMonth,
          day: 1
        }
      }

      if (props.presentOnly) {
        selectedDay.value = -1
        emit('update:modelValue', null)
      }
    }

    const dayNumbers = computed(() => {
      if (isJalali.value) {
        const daysInMonth = jalaali.jalaaliMonthLength(currentJalaliDate.value.jy, currentJalaliDate.value.jm)
        return Array.from({ length: daysInMonth }, (_, i) => i + 1)
      } else {
        const daysInMonth = new Date(
          currentGregorianDate.value.year,
          currentGregorianDate.value.month + 1,
          0
        ).getDate()
        return Array.from({ length: daysInMonth }, (_, i) => i + 1)
      }
    })

    const currentMonthEvents = computed(() => {
      return props.events.reduce(
        (acc, event) => {
          let eventDay: number

          if (isJalali.value) {
            let eventDate: jalaali.JalaaliDate

            if (event.date instanceof Date) {
              eventDate = jalaali.toJalaali(
                event.date.getFullYear(),
                event.date.getMonth() + 1,
                event.date.getDate()
              )
            } else if (typeof event.date === 'string') {
              const dateObj = new Date(event.date)
              eventDate = jalaali.toJalaali(
                dateObj.getFullYear(),
                dateObj.getMonth() + 1,
                dateObj.getDate()
              )
            } else {
              console.error('Invalid date format in event:', event)
              return acc
            }

            if (eventDate.jy === currentJalaliDate.value.jy && eventDate.jm === currentJalaliDate.value.jm) {
              eventDay = eventDate.jd
              acc[eventDay] = (acc[eventDay] || 0) + event.events
            }
          } else {
            let eventDate: Date

            if (event.date instanceof Date) {
              eventDate = event.date
            } else if (typeof event.date === 'string') {
              eventDate = new Date(event.date)
            } else {
              console.error('Invalid date format in event:', event)
              return acc
            }

            if (eventDate.getFullYear() === currentGregorianDate.value.year &&
              eventDate.getMonth() === currentGregorianDate.value.month) {
              eventDay = eventDate.getDate()
              acc[eventDay] = (acc[eventDay] || 0) + event.events
            }
          }

          return acc
        },
        {} as Record<number, number>
      )
    })

    const selectedDay = ref(-1)

    const selectDate = (day: number) => {
      if (props.presentOnly) {
        if (!isFutureOrPresent(day)) {
          if (props.eventSelection) {
            if (currentMonthEvents.value[day] && currentMonthEvents.value[day] > 0) {
              changeDay(day)
              emit('selected', props.modelValue)
            }
          } else {
            changeDay(day)
            emit('selected', props.modelValue)
          }
        }
      } else {
        changeDay(day)
        emit('selected', props.modelValue)
      }
    }

    const initializeSelectedDay = () => {
      if (props.modelValue && props.modelValue !== '' && typeof props.modelValue !== 'string') {
        const date = getValidDate(props.modelValue)

        // Get the current displayed month/year (which includes timeOffset effects)
        const displayedYear = isJalali.value ? currentJalaliDate.value.jy : currentGregorianDate.value.year
        const displayedMonth = isJalali.value ? currentJalaliDate.value.jm : currentGregorianDate.value.month + 1

        if (isJalali.value) {
          const jDate = jalaali.toJalaali(date.getFullYear(), date.getMonth() + 1, date.getDate())
          // Check if the modelValue date matches the currently displayed month/year
          if (jDate.jy === displayedYear && jDate.jm === displayedMonth) {
            selectedDay.value = jDate.jd
          } else {
            selectedDay.value = -1 // Clear selection if not in current displayed month
          }
        } else {
          // For Gregorian, displayedMonth is 0-based, so we need to compare with month + 1
          if (date.getFullYear() === displayedYear && date.getMonth() + 1 === displayedMonth) {
            selectedDay.value = date.getDate()
          } else {
            selectedDay.value = -1 // Clear selection if not in current displayed month
          }
        }
      } else {
        selectedDay.value = -1 // Clear selection if no valid modelValue
      }
    }

    initializeSelectedDay()



    const changeDay = (day: number) => {
      selectedDay.value = day

      let selectedDate: Date

      if (isJalali.value) {
        const gregorianDate = jalaali.toGregorian(currentJalaliDate.value.jy, currentJalaliDate.value.jm, day)
        // Use UTC to avoid timezone issues
        selectedDate = new Date(Date.UTC(gregorianDate.gy, gregorianDate.gm - 1, gregorianDate.gd, 12, 0, 0))
      } else {
        selectedDate = new Date(currentGregorianDate.value.year, currentGregorianDate.value.month, day, 12, 0, 0)
      }

      emit('update:modelValue', selectedDate)
    }

    const isFutureOrPresent = (day: number) => {
      const today = new Date()

      if (isJalali.value) {
        // Persian calendar logic
        const currentJalaali = jalaali.toJalaali(
          today.getFullYear(),
          today.getMonth() + 1,
          today.getDate()
        )
        if (currentJalaliDate.value.jy > currentJalaali.jy) {
          return true
        }
        if (currentJalaliDate.value.jy === currentJalaali.jy && currentJalaliDate.value.jm > currentJalaali.jm) {
          return true
        }
        if (
          currentJalaliDate.value.jy === currentJalaali.jy &&
          currentJalaliDate.value.jm === currentJalaali.jm &&
          day > currentJalaali.jd
        ) {
          return true
        }
      } else {
        // Gregorian calendar logic
        if (currentGregorianDate.value.year > today.getFullYear()) {
          return true
        }

        if (currentGregorianDate.value.year === today.getFullYear() &&
          currentGregorianDate.value.month > today.getMonth()) {
          return true
        }

        // For the same month, compare days
        if (currentGregorianDate.value.year === today.getFullYear() &&
          currentGregorianDate.value.month === today.getMonth() &&
          day > today.getDate()) {
          return true
        }
      }

      return false
    }


    // Watch for modelValue changes
    watch(() => props.modelValue, (newValue) => {
      // console.log('new val:', newValue)
      if (newValue && newValue !== '') {
        const validDate = getValidDate(newValue)

        if (isJalali.value) {
          const jDate = jalaali.toJalaali(validDate.getFullYear(), validDate.getMonth() + 1, validDate.getDate())

          // Only update currentJalaliDate if fixedTime is false
          if (!props.fixedTime) {
            currentJalaliDate.value = { jy: jDate.jy, jm: jDate.jm, jd: jDate.jd }
          }

          // Only set selectedDay if the date is in the currently displayed month/year
          if (jDate.jy === currentJalaliDate.value.jy && jDate.jm === currentJalaliDate.value.jm) {
            selectedDay.value = jDate.jd
          } else {
            selectedDay.value = -1 // Clear selection if date is not in current displayed month
          }
        } else {
          // Only update currentGregorianDate if fixedTime is false
          if (!props.fixedTime) {
            currentGregorianDate.value = {
              year: validDate.getFullYear(),
              month: validDate.getMonth(),
              day: validDate.getDate()
            }
          }


          // Only set selectedDay if the date is in the currently displayed month/year
          if (validDate.getFullYear() === currentGregorianDate.value.year &&
            validDate.getMonth() === currentGregorianDate.value.month) {
            selectedDay.value = validDate.getDate()
          } else {
            selectedDay.value = -1 // Clear selection if date is not in current displayed month
          }
        }
      } else {
        // console.log('fuck')
        selectedDay.value = -1
      }
    })

    watch([currentJalaliDate, currentGregorianDate], () => {
      initializeSelectedDay()
    }, { deep: true })





    
    return {
      currentMonthEvents,
      currentMonth,
      currentYear,
      nextMonth,
      previousMonth,
      daysOfWeek,
      dayNumbers,
      dayOfWeek,
      isFutureOrPresent,
      currentDayOfMonth,
      getValidDate,
      selectDate,
      selectedDay
    }
  }
})
</script>