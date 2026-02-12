<script setup lang="ts">
import { ref, watch } from 'vue'

import '@/assets/css/calendar.css'
import CalendarGrid from './components/CalendarGrid.vue'
import DatePicker from './components/DatePicker.vue'
const selectedDate = ref(new Date())

const datePickerOptions = {
  // FIX: Add 'as const' to string literals that act as configuration types
  dateMode: 'jalaali' as const,
  calendar: 'persian' as const,
  enableTimePicker: true,
  color: '#3b82f6',
  locale: 'fa',
}
const today = new Date()
const gridItems = ref([
  {
    title: 'Meeting with Team',
    start: new Date(new Date().setHours(10, 0, 0, 0)),
    end: new Date(new Date().setHours(11, 30, 0, 0)),
    style: { backgroundColor: 'rgba(59, 130, 246, 0.8)' }
  },
  {
    title: 'Lunch Break',
    start: new Date(new Date().setHours(13, 0, 0, 0)),
    end: new Date(new Date().setHours(14, 0, 0, 0)),
    style: { backgroundColor: 'rgba(16, 185, 129, 0.8)' }
  },
  {
    title: 'Project Review',
    start: new Date(new Date().setHours(15, 0, 0, 0)),
    end: new Date(new Date().setHours(16, 30, 0, 0)),
    style: { backgroundColor: 'rgba(249, 115, 22, 0.8)' }
  }
])

const calendarGridOptions = {
  calendar: 'jalaali',
  mode: 'month',
  editable: true,
  zoom: true,
  lang: 'fa',
  dir: 'ltr',
  minTime: 30,
  startHour: 5,
  endHour: 20,
  startDate: new Date(),
  // endDate: new Date(),
  holidays: [
    new Date('2025-12-17'),
    new Date('2025-12-10'),
    new Date('2026-01-01'),
    new Date('2026-01-02'),
  ],
  autoCreateEvent: true,
  headerFormat: 'dual',
  canCreate:true,
}
watch(() => gridItems.value, () => {
  console.log('items updated')
}, { deep: true, immediate: true })

const logNewEvent = (newItem:any)=>{
  console.log(newItem)
}
</script>

<template>
  <div class="container">
    <h1>Dope Calendar Test</h1>
    
    <div class="showcase">
      <div class="card">
        <h2>Date Picker</h2>
        <div class="picker-wrapper">
          <DatePicker v-model="selectedDate" :option="datePickerOptions" />
        </div>
        <p class="output">Selected: {{ selectedDate }}</p>
      </div>

      <div class="card grid-card">
        <h2>Calendar Grid</h2>
        <div class="grid-wrapper">
          <CalendarGrid @event-create="logNewEvent" v-model="gridItems" :options="calendarGridOptions">
            <template #item="{ item }">
              <div class="item">
                <strong>{{ item.title }}</strong>
                <span>
                  {{ item.start.getHours() }}:{{ item.start.getMinutes().toString().padStart(2, '0') }} -
                  {{ item.end.getHours() }}:{{ item.end.getMinutes().toString().padStart(2, '0') }}
                </span>
              </div>
            </template>
          </CalendarGrid>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  background-color: #f3f4f6;
  color: #1f2937;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

h1 {
  text-align: center;
  margin-bottom: 2rem;
}

h2 {
  margin-top: 0;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 0.5rem;
  margin-bottom: 1rem;
}

.showcase {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.picker-wrapper {
  display: flex;
  justify-content: center;
}

.grid-wrapper {
  height: 600px;
  /* Important: Grid needs explicit height */
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.output {
  margin-top: 1rem;
  padding: 0.5rem;
  background: #f9fafb;
  border-radius: 4px;
  font-family: monospace;
  text-align: center;
}

/* Custom styles for grid items inside the slot */


.item {
  background-color: rgba(66, 133, 244, 0.8);
  color: white;
  border-radius: 4px;
  height: 100%;
  overflow: hidden;
  font-size: 12px;
  position: relative;
}

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


</style>