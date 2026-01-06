# 📅 Dope Calendar

**Dope Calendar** is a high-performance, lightweight, and highly customizable Vue 3 component library for modern web applications. It provides a powerful **Calendar Grid** for scheduling and a flexible **Date Picker**, both featuring full support for **Gregorian**, **Jalaali (Persian)**, and **Islamic** calendars.
Built with **Vue 3** and **Vite**, it offers smooth animations, drag-to-scroll interactions, and deep CSS-variable-based theming.

## ✨ Features

- 🌍 **Multi-Calendar Support**: Switch between Gregorian, Jalaali, and Islamic modes seamlessly.
    
- 🖱️ **Interactive Grid**: Drag-to-scroll, vertical zoom, and editable event support for the Calendar Grid.
    
- 🎨 **Deep Theming**: 40+ CSS variables for granular control over every UI element.
    
- 🕒 **Time Integration**: Built-in time picker for precise date-time selection.
    
- 📱 **Responsive & Accessible**: Optimized for both desktop mouse and mobile touch interactions.
    
- ⚡ **Lightweight**: Zero-bloat, leveraging `jalaali-js` for accurate date conversions.

---
## 🚀 Installation

Install the package via your favorite package manager:
Bash
```
# npm
npm install dope-calendar

# pnpm
pnpm add dope-calendar

# yarn
yarn add dope-calendar
```

## 📦 Quick Start

Import the components and the required CSS file into your Vue project:

Code snippet

```
<script setup>
import { DopeCalendar, DopeDatePicker } from 'dope-calendar';
import 'dope-calendar/calendar.css';
import { ref } from 'vue';

const selectedDate = ref(new Date());
const events = ref([
  {
    start: new Date(2023, 9, 25, 10, 0),
    end: new Date(2023, 9, 25, 12, 0),
    title: 'Dope Meeting'
  }
]);
</script>

<template>
  <DopeDatePicker v-model="selectedDate" :options="{ calendar: 'persian', locale: 'fa' }" />

  <DopeCalendar v-model="events" :options="{ editable: true, mode: 'week' }" />
</template>
```

---
## 🛠️ API Reference

### 1. DopeDatePicker Props & Options

The DopeDatePicker supports single-date selection across multiple calendar systems with integrated time picking.

|**Property / Option**|**Type**|**Default**|**Description**|
|---|---|---|---|
|**modelValue**|`Date \| String`|`null`|The selected date value (supports `v-model`).|
|**options / option**|`Object`|`{}`|The configuration object containing the settings below.|
|`calendar`|`'gregory' \| 'persian' \| 'islamic'`|`'gregory'`|The calendar system displayed to the user.|
|`dateMode`|`'georgian' \| 'jalaali' \| 'islamic'`|`'georgian'`|Alias for the calendar logic mode.|
|`mode`|`'date' \| 'month' \| 'custom'`|`'date'`|The initial view level of the picker.|
|`locale`|`string`|`'default'`|Language for labels (e.g., `'fa'` for Persian).|
|`dir`|`'ltr' \| 'rtl'`|_(auto)_|Layout direction; auto-detects based on calendar mode.|
|`enableTimePicker`|`boolean`|`false`|When true, shows an interactive time selection footer.|
|`minDate / maxDate`|`Date`|`undefined`|Restricts the range of selectable dates.|
|`events`|`Array<CalendarEvent>`|`[]`|Highlights specific dates with dots `{ date: Date, count: number }`.|
|`holidays`|`Array<Date \| String>`|`[]`|Dates to be highlighted with holiday styling.|
|`enableYearPicker`|`boolean`|`true`|Enables clicking the year title to switch to the year-selection view.|
|`enableMonthPicker`|`boolean`|`true`|Enables clicking the month title to switch to the month-selection view.|
|`fixedTime`|`boolean \| Date \| String`|`false`|If set, disables navigation and view switching.|
|`color`|`string`|`''`|Custom hex or CSS color to override the primary brand color.|
|`selectionMode`|`'all' \| 'future' \| 'past'`|`'all'`|Restricts date selection relative to the current date.


---

### 2. DopeCalendar (Grid) Props & Options

The DopeCalendar provides a high-performance scheduling grid for managing event arrays.

|Property / Option|Type|Default|Description|
|---|---|---|---|
|**modelValue**|`Array<Event>`|`[]`|Array of event objects: `[{ start: Date, end: Date, ... }]`.|
|**options**|`Object`|`{}`|The configuration object containing the settings below.|
|`mode`|`'month' \| 'week' \| 'custom'`|`'month'`|Sets the visual scope of the calendar grid.|
|`calendar`|`'georgian' \| 'jalaali'`|`'georgian'`|The date logic system used for the grid headers.|
|`startDate`|`Date`|`new Date()`|The starting date for the current calendar view.|
|`endDate`|`Date`|`undefined`|The end date for the grid; required only if `mode` is `'custom'`.|
|`editable`|`boolean`|`false`|Enables drag-to-move and drag-to-resize interactions for events.|
|`zoom`|`boolean`|`true`|Allows vertical height scaling by dragging the hour sidebar.|
|`maxZoom`|`number`|`5`|The maximum multiplier allowed for vertical zooming.|
|`minTime`|`number`|`1`|The minute increment for snapping when dragging or resizing items.|
|`startHour / endHour`|`number`|`0 / 24`|Defines the visible time range on the vertical axis.|
|`lang`|`'en' \| 'fa'`|`'fa'`|UI language for headers, months, and numbers.|
|`format`|`'24h' \| 'ampm' \| 'keys'`|`'24h'`|Display format for time labels in the sidebar.|
|`speed`|`number`|`20`|Scroll speed when dragging items near the edges of the container.|
|`holidays`|`Array<Date>`|`[]`|Specific dates to highlight as holidays in the grid.|
|`dir`|`'ltr' \| 'rtl'`|`'ltr'`|Sets the layout direction of the calendar grid.|

---

## 🎨 Custom Styling (CSS Variables)

You can customize the look and feel by overriding these variables in your CSS.

### Calendar Grid Variables (`--dc-`)

|**Variable**|**Default Value**|**Description**|
|---|---|---|
|`--dc-bg`|`#f3f3f7`|Background color of the grid.|
|`--dc-border-color`|`#d1d6db`|Color of grid lines.|
|`--dc-day-container-width`|`56px`|Width of each day column.|
|`--dc-current-day-color`|`rgba(0, 36, 199, 1)`|Color for the current active day.|
|`--dc-weekend-day-color`|`rgba(248, 113, 113, 0.5)`|Color for weekend headers.|

### Date Picker Variables (`--dp-`)

| **Variable**     | **Default Value** | **Description**                         |
| ---------------- | ----------------- | --------------------------------------- |
| `--dp-primary`   | `#3b82f6`         | Primary action color.                   |
| `--dp-bg`        | `#ffffff`         | Background of the picker modal.         |
| `--dp-text`      | `#1f2937`         | Main text color.                        |
| `--dp-cell-size` | `40px`            | Size of the individual day circles.     |
| `--dp-shadow`    | `none`            | Shadow applied to the picker container. |

---

## 🤝 Contributing

Contributions are welcome! If you find a bug or have a feature request, please open an issue or submit a pull request on GitHub.

---

# ❤️ Sponsors

Huge thanks to our amazing sponsors! Your support helps keep this project alive and actively maintained.

<table align="center">
  <tr>
    <td align="center">
      <a href="https://github.com/wenex-org">
        <img src="https://avatars.githubusercontent.com/u/124876522?s=200&v=4" width="200" alt="Wenex" style="padding: 20px; border: 1px solid #eee; border-radius: 12px; background: #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        <br>
        <strong>Wenex</strong>
      </a>
    </td>
    <td align="center">
      <a href="https://nobeen.ir">
         <img src="https://personal-portfolio.storage.c2.liara.space/nobeen/Nobeen.png" height="200" width="200" alt="Nobeen" style="padding: 20px; border: 1px solid #eee; border-radius: 12px; background: #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.1);    min-height: 200px;
    object-fit: contain; max-height:200px; height:200px; width:200px; max-width:200px; min-width:200px">
        <br>
        <strong>Nobeen</strong>
      </a>
    </td>
  </tr>
</table>

# License

This project is licensed under the MIT License - SEE the [LICENSE](LICENSE) file for details
