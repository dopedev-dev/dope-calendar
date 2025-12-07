<template>
  <div class="app-container">
    <h1 class="app-title">Dope Date Picker - Component Showcase</h1>
    
    <div class="grid-container">
      
      <!-- 1. Default Configuration -->
      <div class="card">
        <h3>1. Default (Gregory / English)</h3>
        <p class="desc">Standard date picker with no restrictions.</p>
        <DatePicker v-model="date1" />
        <div class="output">Selected: {{ formatDate(date1) }}</div>
      </div>

      <!-- 2. Persian Calendar -->
      <div class="card">
        <h3>2. Persian (Jalaali / Farsi)</h3>
        <p class="desc">RTL direction, Persian calendar system.</p>
        <DatePicker 
          v-model="date2" 
          :options="{ 
            dateMode: 'jalaali', 
            locale: 'fa', 
            dir: 'ltr',
          }" 
        />
        <div class="output">Selected: {{ formatDate(date2) }}</div>
      </div>

      <!-- 3. Selection Mode: Future Only -->
      <div class="card">
        <h3>3. Future Dates Only (Day View)</h3>
        <p class="desc">Try clicking "Prev Month" until it disables.</p>
        <DatePicker 
          v-model="date3" 
          :options="{ 
            selectionMode: 'future',
            color: '#3b82f6'
          }" 
        />
        <div class="output">Selected: {{ formatDate(date3) }}</div>
      </div>

      <!-- 4. Selection Mode: Past Only -->
      <div class="card">
        <h3>4. Past Dates Only (Day View)</h3>
        <p class="desc">Try clicking "Next Month" until it disables.</p>
        <DatePicker 
          v-model="date4" 
          :options="{ 
            selectionMode: 'past',
            color: '#ef4444'
          }" 
        />
        <div class="output">Selected: {{ formatDate(date4) }}</div>
      </div>

      <!-- 5. Time Picker Enabled -->
      <div class="card">
        <h3>5. With Time Picker</h3>
        <p class="desc">Select hour and minute.</p>
        <DatePicker 
          v-model="date5" 
          :options="{ 
            enableTimePicker: true,
            color: '#8b5cf6'
          }" 
        />
        <div class="output">Selected: {{ formatDate(date5, true) }}</div>
      </div>

      <!-- 6. Mode: Year Picker -->
      <div class="card">
        <h3>6. Year Picker Mode</h3>
        <p class="desc">Only select years. (Nav buttons hidden in Year mode)</p>
        <DatePicker 
          v-model="date6" 
          :options="{ 
            mode: 'year',
            color: '#f59e0b'
          }" 
        />
        <div class="output">Selected: {{ formatDate(date6) }}</div>
      </div>

      <!-- 7. Mode: Month Picker -->
      <div class="card">
        <h3>7. Month Picker Mode</h3>
        <p class="desc">Only select months.</p>
        <DatePicker 
          v-model="date7" 
          :options="{ 
            mode: 'month',
            color: '#ec4899'
          }" 
        />
        <div class="output">Selected: {{ formatDate(date7) }}</div>
      </div>

      <!-- 8. Fixed Time (Boolean) -->
      <div class="card">
        <h3>8. Fixed View (Boolean)</h3>
        <p class="desc">Navigation disabled. User locked to current view.</p>
        <DatePicker 
          v-model="date8" 
          :options="{ 
            fixedTime: true,
            color: '#64748b'
          }" 
        />
        <div class="output">Selected: {{ formatDate(date8) }}</div>
      </div>

      <!-- 9. Fixed Time (Specific Date) -->
      <div class="card">
        <h3>9. Fixed to Dec 2025</h3>
        <p class="desc">Locked to a specific month/year provided in options.</p>
        <DatePicker 
          v-model="date9" 
          :options="{ 
            fixedTime: new Date('2025-12-01'),
            color: '#0ea5e9'
          }" 
        />
        <div class="output">Selected: {{ formatDate(date9) }}</div>
      </div>

      <!-- 10. Custom Navigation Slots -->
      <div class="card">
        <h3>10. Custom Nav Buttons</h3>
        <p class="desc">Using named slots for Prev/Next.</p>
        <DatePicker v-model="date10">
           <template #prev="{ trigger, disabled }">
             <button 
               @click="trigger" 
               :disabled="disabled"
               :style="{ opacity: disabled ? 0.5 : 1 }"
               style="background:white; border:1px solid #ccc; cursor:pointer; padding:5px 10px; border-radius:4px; font-size: 12px;"
             >
               Prev
             </button>
           </template>
           <template #next="{ trigger, disabled }">
             <button 
               @click="trigger" 
               :disabled="disabled"
               :style="{ opacity: disabled ? 0.5 : 1 }"
               style="background:white; border:1px solid #ccc; cursor:pointer; padding:5px 10px; border-radius:4px; font-size: 12px;"
             >
               Next
             </button>
           </template>
        </DatePicker>
        <div class="output">Selected: {{ formatDate(date10) }}</div>
      </div>

      <!-- 11. Month Picker + Future Only -->
      <div class="card">
        <h3>11. Month Picker (Future)</h3>
        <p class="desc">Navigates Years. Prev Year button should disable.</p>
        <DatePicker 
          v-model="date11" 
          :options="{ 
            mode: 'month',
            selectionMode: 'future',
            color: '#14b8a6'
          }" 
        />
        <div class="output">Selected: {{ formatDate(date11) }}</div>
      </div>

      <!-- 12. Month Picker + Past Only -->
      <div class="card">
        <h3>12. Month Picker (Past)</h3>
        <p class="desc">Navigates Years. Next Year button should disable.</p>
        <DatePicker 
          v-model="date12" 
          :options="{ 
            mode: 'month',
            selectionMode: 'past',
            color: '#f43f5e'
          }" 
        />
        <div class="output">Selected: {{ formatDate(date12) }}</div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import DatePicker from './components/DatePicker.vue'

// Refs for models
const date1 = ref(new Date())
const date2 = ref(new Date())
const date3 = ref(null) // Future
const date4 = ref(null) // Past
const date5 = ref(new Date())
const date6 = ref(new Date())
const date7 = ref(new Date())
const date8 = ref(new Date())
const date9 = ref(new Date())
const date10 = ref(new Date())
const date11 = ref(new Date())
const date12 = ref(new Date())

// Helper to format date for display
const formatDate = (val: any, time = false) => {
  if (!val) return 'None'
  const d = new Date(val)
  if (isNaN(d.getTime())) return 'Invalid'
  
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  }
  if (time) {
    options.hour = '2-digit'
    options.minute = '2-digit'
  }
  return d.toLocaleDateString(undefined, options) + (time ? ' ' + d.toLocaleTimeString(undefined, {hour: '2-digit', minute:'2-digit'}) : '')
}
</script>

<style scoped>
.app-container {
  font-family: sans-serif;
  padding: 40px;
  background-color: #f3f4f6;
  min-height: 100vh;
}
.app-title {
  text-align: center;
  margin-bottom: 40px;
  color: #1f2937;
}
.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
  justify-items: center;
}
.card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 360px;
  box-sizing: border-box;
}
.card h3 {
  margin: 0 0 8px 0;
  font-size: 1.1rem;
  color: #374151;
}
.desc {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 16px;
  text-align: center;
  min-height: 40px;
}
.output {
  margin-top: 16px;
  font-family: monospace;
  background: #f9fafb;
  padding: 8px 12px;
  border-radius: 6px;
  width: 100%;
  text-align: center;
  border: 1px solid #e5e7eb;
  color: #4b5563;
}
</style>