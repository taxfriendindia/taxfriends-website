# Dark Mode Implementation Plan

## Overview
Add a dark mode toggle button to the TaxFriend India website with smooth transitions and persistent theme storage.

## Implementation Steps

### 1. Create Dark Mode Context (ThemeContext.jsx)
**Location:** `src/contexts/ThemeContext.jsx`

**Features:**
- State management for dark/light mode
- LocalStorage persistence
- System preference detection
- Smooth transitions

**Key Functions:**
- `toggleTheme()` - Switch between modes
- `setTheme(mode)` - Set specific mode
- Auto-detect system preference on first load

### 2. Create Theme Toggle Component
**Location:** `src/components/Shared/ThemeToggle.jsx`

**Design:**
- Premium animated toggle button
- Sun icon for light mode
- Moon icon for dark mode
- Smooth rotation animation
- Indigo/emerald color scheme
- Floating position on mobile
- Integrated in navbar on desktop

**Visual States:**
- Light Mode: Yellow sun icon with warm glow
- Dark Mode: Purple moon icon with cool glow
- Transition: 300ms smooth rotation

### 3. Update Root App Component
**Location:** `src/App.jsx`

**Changes:**
- Wrap app with ThemeProvider
- Apply dark class to html element
- Initialize theme on mount

### 4. Update Tailwind Configuration
**Location:** `tailwind.config.js`

**Changes:**
- Ensure darkMode: 'class' is set
- Add custom dark mode colors if needed

### 5. Add Toggle to Navbar
**Location:** `src/components/Shared/Navbar.jsx`

**Placement:**
- Desktop: Between navigation links and user profile
- Mobile: In mobile menu header

### 6. Enhance Dark Mode Styles

**Key Areas to Update:**
- **Backgrounds:** 
  - Light: white, indigo-50, emerald-50
  - Dark: gray-900, gray-950, indigo-950
  
- **Text:**
  - Light: gray-900, gray-600
  - Dark: white, gray-300
  
- **Borders:**
  - Light: indigo-100, gray-200
  - Dark: gray-800, indigo-900
  
- **Gradients:**
  - Light: from-indigo-50 to-emerald-50
  - Dark: from-indigo-950 to-gray-950
  
- **Shadows:**
  - Light: shadow-indigo-200, shadow-xl
  - Dark: shadow-none or very subtle

### 7. Test All Pages
- Home page
- About page
- Contact page
- Services page
- Client Dashboard
- Admin Dashboard
- Login page

## Technical Details

### LocalStorage Key
```javascript
const THEME_KEY = 'taxfriend-theme'
```

### Theme Values
```javascript
const THEMES = {
  LIGHT: 'light',
  DARK: 'dark'
}
```

### CSS Transitions
```css
* {
  transition: background-color 300ms ease, color 300ms ease, border-color 300ms ease;
}
```

## Color Palette

### Light Mode
- Primary: indigo-700
- Secondary: emerald-600
- Background: white, indigo-50/20
- Text: gray-900, gray-600
- Borders: indigo-100/50

### Dark Mode
- Primary: indigo-400
- Secondary: emerald-500
- Background: gray-900, indigo-950/20
- Text: white, gray-300
- Borders: gray-800, indigo-900/40

## User Experience

1. **First Visit:** Detect system preference
2. **Toggle:** Instant theme switch with smooth animation
3. **Persistence:** Remember user choice across sessions
4. **Accessibility:** Proper ARIA labels and keyboard support
5. **Performance:** No flash of unstyled content (FOUC)

## Success Criteria

✅ Theme persists across page refreshes
✅ Smooth transitions (no jarring changes)
✅ All text remains readable in both modes
✅ Gradients look premium in both modes
✅ Icons and images adapt appropriately
✅ No layout shifts during theme change
✅ Works on all pages and dashboards
