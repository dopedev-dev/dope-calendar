<template>
 <!-- <div class="h-dvh w-dvw">
    <CalendarGrid
      :georgian="false"
      :jalaali="true"
      mode="month"
      dir="ltr"
      lang="en"
      editable
      :holidays="holidays"
      v-model="calendarItems"
    >
      <template #item="{ item }">
        <div class="custom-calendar-item cursor-pointer" :style="{ backgroundColor: item.color }">
          <div class="item-title">{{ item.title }}</div>
          <div class="item-time">
             {{ item.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }} -
            {{ item.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
          </div>
        </div>
      </template>
    </CalendarGrid>
  </div>  -->
  <DatePicker v-model="today"/>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import DatePicker from './components/DatePicker.vue'
import CalendarGrid from './components/CalendarGrid.vue'
const today = new Date()
const calendarItems = ref(
[
  {
    title: 'Team Sync',
    start: new Date(new Date(today).setHours(10, 0, 0, 0)),
    end: new Date(new Date(today).setHours(11, 30, 0, 0)),
    color: 'rgba(54, 162, 235, 0.7)', // Blue
    description: 'Weekly team synchronization meeting.'
  },
  {
    title: 'Lunch Break',
    start: new Date(new Date(today).setHours(13, 0, 0, 0)),
    end: new Date(new Date(today).setHours(14, 0, 0, 0)),
    color: 'rgba(75, 192, 192, 0.7)', // Green
    description: 'Quick lunch at the cafeteria.'
  },
  // Overlapping item for today
  {
    title: 'Dev Standup',
    start: new Date(new Date(today).setHours(10, 30, 0, 0)),
    end: new Date(new Date(today).setHours(11, 0, 0, 0)),
    color: 'rgba(153, 102, 255, 0.7)', // Purple
    description: 'Daily developer standup.'
  },
  // Item for yesterday
  {
    title: 'Code Review',
    start: new Date(new Date(new Date().setDate(today.getDate() - 1)).setHours(15, 0, 0, 0)),
    end: new Date(new Date(new Date().setDate(today.getDate() - 1)).setHours(16, 30, 0, 0)),
    color: 'rgba(255, 159, 64, 0.7)', // Orange
    description: 'Review pull requests.'
  },
  // Item for tomorrow
  {
    title: 'Project Planning',
    start: new Date(new Date(new Date().setDate(today.getDate() + 1)).setHours(9, 0, 0, 0)),
    end: new Date(new Date(new Date().setDate(today.getDate() + 1)).setHours(12, 0, 0, 0)),
    color: 'rgba(255, 206, 86, 0.7)', // Yellow
    description: 'Planning session for the next sprint.'
  },
  // Another item for tomorrow
  {
    title: 'Follow-up Calls',
    start: new Date(new Date(new Date().setDate(today.getDate() + 1)).setHours(14, 0, 0, 0)),
    end: new Date(new Date(new Date().setDate(today.getDate() + 1)).setHours(15, 0, 0, 0)),
    color: 'rgba(54, 162, 235, 0.7)', // Blue
    description: 'Client follow-up calls.'
  },
  // Item for two days from now
  {
    title: 'Client Demo',
    start: new Date(new Date(new Date().setDate(today.getDate() + 2)).setHours(16, 5, 0, 0)),
    end: new Date(new Date(new Date().setDate(today.getDate() + 2)).setHours(17, 0, 0, 0)),
    color: 'rgba(255, 99, 132, 0.7)', // Red
    description: 'Present the new features to the client.'
  },
  // Item for three days from now
  {
    title: 'Marketing Meeting',
    start: new Date(new Date(new Date().setDate(today.getDate() + 3)).setHours(11, 0, 0, 0)),
    end: new Date(new Date(new Date().setDate(today.getDate() + 3)).setHours(12, 30, 0, 0)),
    color: 'rgba(75, 192, 192, 0.7)', // Green
    description: 'Discuss marketing strategies.'
  },

  // Item for four days from now
  {
    title: 'Design Review',
    start: new Date(new Date(new Date().setDate(today.getDate() + 4)).setHours(10, 0, 0, 0)),
    end: new Date(new Date(new Date().setDate(today.getDate() + 4)).setHours(11, 0, 0, 0)),
    color: 'rgba(153, 102, 255, 0.7)', // Purple
    description: 'Review new UI/UX designs.'
  }  
]
)
const holidays = ref([
  new Date(new Date().setDate(today.getDate() + 5)) // Example holiday 5 days from now
])
</script>
<style scoped>

.custom-calendar-item{
  width: 100%;
  height: 100%;
}

</style>