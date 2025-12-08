# dope-calendar 📅

A modern, highly customizable, dual-calendar (Gregorian & Jalaali/Persian) solution for Vue 3. Built with TypeScript and Vite.

This library provides two powerful components:
1. **DopeCalendar**: A drag-and-drop schedule grid (Outlook/Google Calendar style).
2. **DopeDatePicker**: A sleek, responsive date picker with dual calendar support.

## Features

- 🌍 **Dual Calendar Support**: Seamlessly switch between Gregorian, Jalaali (Persian), and Islamic calendars.
- 🌙 **Dark Mode Ready**: Fully supports dark mode via CSS variables.
- 🔧 **TypeScript Support**: Full type definitions included.
- 🎨 **Highly Customizable**: Control colors, grid layout, and zooming via props and CSS variables.
- 🖱️ **Interactive**: Drag-to-scroll, zoom controls, and event resizing.

## Installation

```bash
npm install dope-calendar

SetupTo ensure the styles render correctly, you must import the CSS file in your main entry file (e.g., main.ts) or your root component.TypeScript// src/main.ts
import 'dope-calendar/calendar.css'
Usage1. DopeCalendar (Scheduler Grid)The DopeCalendar is perfect for scheduling timelines and weekly/monthly views. It supports drag-and-drop, resizing, and custom item rendering.Code snippet<template>
  <div style="height: 800px; width: 100%;">
    <DopeCalendar 
      v-model="events" 
      :option="calendarOptions"
    >
      <template #item="{ item }">
        <div 
          class="calendar-item-content" 
          :style="{ backgroundColor: item.color }"
        >
          <div class="title">{{ item.title }}</div>
          <div class="time">
            {{ item.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }} - 
            {{ item.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
          </div>
        </div>
      </template>
    </DopeCalendar>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { DopeCalendar } from 'dope-calendar'

// 1. Define your events
const events = ref([
  {
    title: 'Team Sync',
    start: new Date(new Date().setHours(10, 0, 0, 0)),
    end: new Date(new Date().setHours(11, 30, 0, 0)),
    color: 'rgba(54, 162, 235, 0.7)',
    description: 'Weekly team synchronization.'
  },
  {
    title: 'Code Review',
    start: new Date(new Date().setHours(14, 0, 0, 0)),
    end: new Date(new Date().setHours(15, 0, 0, 0)),
    color: 'rgba(75, 192, 192, 0.7)',
  }
])

// 2. Configure the calendar
const calendarOptions = {
  calendar: 'georgian', // 'georgian' | 'jalaali'
  mode: 'week',         // 'month' | 'week' | 'custom'
  editable: true,       // Allow dragging & resizing
  zoom: true,           // Allow scroll zooming
  lang: 'en',           // 'en' | 'fa'
  startHour: 0,
  endHour: 24,
  dir: 'ltr'            // 'ltr' | 'rtl'
}
</script>

<style scoped>
.calendar-item-content {
  width: 100%;
  height: 100%;
  padding: 4px;
  border-radius: 4px;
  color: white;
  font-size: 0.75rem;
  overflow: hidden;
}
.title {
  font-weight: bold;
}
</style>
2. DopeDatePickerA comprehensive date picker that supports time selection, Persian numerals, and multiple views.Code snippet<template>
  <div class="picker-container">
    <DopeDatePicker 
      v-model="selectedDate" 
      :options="pickerOptions" 
    />
    <p>Selected Date: {{ selectedDate }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { DopeDatePicker } from 'dope-calendar'

const selectedDate = ref(new Date())

const pickerOptions = {
  dateMode: 'georgian',   // 'georgian' | 'jalaali' | 'islamic'
  mode: 'date',           // 'date' | 'month' | 'year'
  enableTimePicker: true, // Enable hour/minute selection
  color: '#3b82f6',       // Custom primary color (Hex/RGB)
  locale: 'en'            // 'en' | 'fa'
}
</script>
Configuration PropsDopeCalendar Options (:option)PropertyTypeDefaultDescriptioncalendar'georgian' | 'jalaali''georgian'The calendar system to render.mode'month' | 'week' | 'custom''month'The visual mode of the grid.editablebooleanfalseEnables drag-and-drop and resizing of events.zoombooleantrueEnables vertical zooming (Ctrl+Scroll or drag scale).maxZoomnumber5Maximum zoom level.speednumber20Drag scroll speed.lang'en' | 'fa''fa'Language for numbers and text.format'ampm' | '24h' | 'keys''24h'Format for hour labels.dir'ltr' | 'rtl''ltr'Layout direction.startHournumber0The starting hour of the grid (0-23).endHournumber24The ending hour of the grid.startDateDatenew Date()The starting date for the view.endDateDateundefinedThe ending date (for custom mode).holidaysDate[][]Array of dates to mark as holidays/weekends.DopeDatePicker Options (:options)PropertyTypeDefaultDescriptiondateMode'georgian' | 'jalaali' | 'islamic''georgian'The calendar system.mode'date' | 'month' | 'year''date'The initial view of the picker.enableTimePickerbooleanfalseShow time selection controls.enableYearPickerbooleantrueAllow switching to year view.enableMonthPickerbooleantrueAllow switching to month view.colorstringundefinedOverride the primary theme color.minDateDateundefinedDisable dates before this date.maxDateDateundefinedDisable dates after this date.monthOffsetnumber0Offset the starting month view.selectionMode'all' | 'future' | 'past''all'Restrict selectable dates.eventsCalendarEvent[][]Array of events to display dots on dates.localestringundefinedOverride the locale (e.g., 'en', 'fa', 'ar').Styling & CustomizationYou can override CSS variables in your project to match your branding. Define these in your global CSS or inside a scoped style block affecting the component.DopeCalendar VariablesCSS:root {
  /* Backgrounds & Borders */
  --dc-bg: #f3f3f7;
  --dc-border-color: #d1d6db;
  
  /* Text Colors */
  --dc-day-number-color: black;
  --dc-day-name-color: rgba(0, 0, 0, 0.5);
  --dc-hour-text-color: rgba(0, 0, 0, 0.5);
  
  /* Special Days */
  --dc-current-day-color: rgba(0, 36, 199, 1);
  --dc-weekend-day-color: rgba(248, 113, 113, 0.5);
  
  /* Dimensions */
  --dc-day-container-width: 56px;
  --dc-day-cell-height: 36px;
}
DopeDatePicker VariablesCSS:root {
  /* Dimensions */
  --dp-width: 328px;
  --dp-cell-size: 40px;
  --dp-radius: 0px; 
  
  /* Colors */
  --dp-bg: #ffffff;
  --dp-text: #1f2937;
  --dp-primary: #3b82f6; /* Main brand color */
  --dp-primary-text: #ffffff;
  --dp-hover-bg: #f3f4f6;
  
  /* Status Colors */
  --dp-holiday-text: #ef4444;
  --dp-disabled-text: #d1d5db;
}

/* Example: Dark Mode Override */
[data-theme='dark'] .dope-date-picker {
  --dp-bg: #1f2937;
  --dp-text: #f9fafb;
  --dp-primary: #60a5fa;
}
❤️ SponsorsHuge thanks to our amazing sponsors! Your support helps keep this project alive and actively maintained.<div align="center" style="display: flex; gap: 20px; justify-content: center; flex-wrap: wrap;"><a href="https://github.com/wenex-org" style="text-decoration: none;"><div style="display: flex; flex-direction: column; align-items: center; padding: 20px; border: 1px solid #eee; border-radius: 12px; background: #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.1); width: 200px;"><img src="https://avatars.githubusercontent.com/u/124876522?s=200&v=4" width="80" alt="Wenex" style="border-radius: 50%; margin-bottom: 10px;"><strong style="color: #333; font-size: 1.1rem;">Wenex</strong></div></a><a href="#" style="text-decoration: none;"><div style="display: flex; flex-direction: column; align-items: center; padding: 20px; border: 1px solid #eee; border-radius: 12px; background: #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.1); width: 200px;"><img src="https://www.google.com/search?q=https://via.placeholder.com/80x80%3Ftext%3D+" width="80" alt="Sponsor" style="border-radius: 50%; margin-bottom: 10px;"><strong style="color: #333; font-size: 1.1rem;">Become a Sponsor</strong></div></a></div>LicenseThis project is licensed under the Apache-2.0 License - SEE the LICENSE file for details.