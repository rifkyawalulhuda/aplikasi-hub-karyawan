# Requirements Document

## Introduction

This feature is a visual redesign (restyle) of the existing employee mobile login page of the Sankyu Employee Portal (PWA), located at `app-karyawan/src/pages/employeeMobile/login/index.jsx`. The goal is to deliver a more minimalist and modern look while preserving every piece of existing content, all current functionality, and the established blue brand identity.

This is strictly a presentation-layer change. No business logic, authentication behavior, PWA install logic, network requests, form field names, or navigation behavior are altered. The work is scoped to layout, spacing, typography hierarchy, and visual polish using the existing MUI v5 component stack and existing theme tokens (`employeeSurface.*`, `primary.*`).

The redesign must remain mobile-first and responsive, support light and dark mode through theme tokens, and meet baseline accessibility standards (contrast, focus visibility, touch target size).

## Glossary

- **Login_Page**: The React component rendered by `app-karyawan/src/pages/employeeMobile/login/index.jsx` that presents the employee login experience in the PWA.
- **Employee_Portal**: The employee-facing Progressive Web App for Sankyu Indonesia employees.
- **Content_Element**: Any text, label, heading, input field, control, button, or alert currently present on the Login_Page.
- **Accent_Color**: The existing primary blue brand color, expressed through the header gradient `linear-gradient(160deg, #0B2746 0%, #123C6C 54%, #2F74BC 100%)` and the primary button gradient derived from `theme.palette.primary.dark` and `theme.palette.primary.main`.
- **Primary_CTA**: The "Masuk" primary submit button that initiates login.
- **Install_Control**: The PWA install button labeled "Install App" (when an install prompt is available) or "Install belum tersedia" (when no automatic prompt is available).
- **Standalone_Mode**: The display state in which the Employee_Portal is running as an installed PWA, detected via `window.matchMedia('(display-mode: standalone)')`.
- **Theme_Token**: A value sourced from the MUI theme palette, including `employeeSurface.card`, `employeeSurface.borderSoft`, `employeeSurface.shadowMedium`, `primary.main`, `primary.dark`, `text.primary`, `text.secondary`, and `background.paper`.
- **Touch_Target**: An interactive control region a user taps, measured by its rendered minimum height and width.
- **Light_Mode**: The theme state where `theme.palette.mode` equals `'light'`.
- **Dark_Mode**: The theme state where `theme.palette.mode` equals `'dark'`.

## Requirements

### Requirement 1: Preserve All Existing Content

**User Story:** As an employee, I want every piece of information and control from the current login page to remain present after the redesign, so that I do not lose any guidance or capability I rely on.

#### Acceptance Criteria

1. WHEN the Login_Page is rendered, THE Login_Page SHALL display the brand label "SANKYU" and the title "Portal Karyawan" in the header region.
2. WHEN the Login_Page is rendered, THE Login_Page SHALL display the overline label "Login Karyawan".
3. WHEN the Login_Page is rendered, THE Login_Page SHALL display the heading "Masuk dengan NIK".
4. WHEN the Login_Page is rendered, THE Login_Page SHALL display the description text "Gunakan NIK dan password yang sudah diberikan oleh Admin. Jika lupa, hubungi Admin untuk reset password."
5. WHEN the Login_Page is rendered, THE Login_Page SHALL display the NIK input field with its badge icon adornment.
6. WHEN the Login_Page is rendered, THE Login_Page SHALL display the Password input field with its lock icon adornment.
7. WHEN the Login_Page is rendered, THE Login_Page SHALL display the "Tampilkan password" show/hide password checkbox control in its default unchecked state.
8. WHEN the Login_Page is rendered, THE Login_Page SHALL display the Primary_CTA labeled "Masuk".
9. WHILE the Employee_Portal is not in Standalone_Mode, WHEN the Login_Page is rendered, THE Login_Page SHALL display the Install_Control.
10. WHILE the Employee_Portal is not in Standalone_Mode AND no automatic install prompt is available, WHEN the Login_Page is rendered, THE Login_Page SHALL display the info alert text "Jika tombol install belum aktif, buka menu browser lalu pilih Add to Home Screen atau Install App."

### Requirement 2: Preserve Existing Functionality

**User Story:** As an employee, I want the login form, password toggle, and PWA install behavior to work exactly as before, so that the redesign does not break any task I need to complete.

#### Acceptance Criteria

1. WHEN the employee submits the form with a NIK and password, THE Login_Page SHALL send the login request using the same field names `nik` and `password` to the existing employee authentication endpoint.
2. WHILE a login request is in progress, THE Primary_CTA SHALL display the loading label "Memproses..." and SHALL be disabled.
3. WHEN the login request completes, whether it succeeds or fails, THE Primary_CTA SHALL return to its enabled state and restore its default (non-loading) label.
4. WHEN the employee toggles the "Tampilkan password" checkbox, THE Login_Page SHALL switch the Password input field between masked and visible text.
5. THE NIK input field SHALL retain the `required` attribute, `autoFocus` behavior, and `autoComplete="username"` attribute.
6. THE Password input field SHALL retain the `required` attribute and `autoComplete="current-password"` attribute.
7. WHEN the employee activates the Install_Control AND an automatic install prompt is available, THE Login_Page SHALL trigger the existing browser install prompt.
8. WHEN the employee activates the Install_Control AND no automatic install prompt is available, THE Login_Page SHALL display the existing informational guidance message via snackbar.
9. THE Login_Page SHALL retain the existing `beforeinstallprompt` and `appinstalled` event handlers without behavioral change.
10. WHEN a successful login response is received, THE Login_Page SHALL navigate the employee to the existing post-login destination.
11. IF the login request returns an error response that includes an error message, THEN THE Login_Page SHALL display the returned error message via snackbar and SHALL keep the entered NIK and password values in their input fields.
12. IF the login request fails without a returned error message, THEN THE Login_Page SHALL display a generic Indonesian error message via snackbar and SHALL keep the entered NIK and password values in their input fields.

### Requirement 3: Preserve Brand Accent Color

**User Story:** As a Sankyu employee, I want the login page to keep the familiar blue brand identity, so that the portal still feels official and trustworthy.

#### Acceptance Criteria

1. THE Login_Page header SHALL render the Accent_Color gradient exactly as `linear-gradient(160deg, #0B2746 0%, #123C6C 54%, #2F74BC 100%)`, with the three color stops and 160-degree angle matching this definition without deviation.
2. THE Primary_CTA SHALL render a gradient whose start color equals the `primary.dark` Theme_Token value and whose end color equals the `primary.main` Theme_Token value, with no intermediate color stops other than these two.
3. THE Login_Page SHALL source 100% of its accent, surface, border, and shadow colors from existing Theme_Token values, such that no color value outside the established Accent_Color and Theme_Token set is hardcoded in the Login_Page.
4. IF a referenced Theme_Token value required by the Login_Page is unavailable or unresolved at render time, THEN THE Login_Page SHALL apply the established Accent_Color as the fallback and SHALL NOT substitute a new hardcoded color value.

### Requirement 4: Apply Minimalist and Modern Visual Style

**User Story:** As an employee, I want a cleaner and more modern login screen, so that the page feels easier to read and less cluttered.

#### Acceptance Criteria

1. THE Login_Page SHALL apply vertical and horizontal spacing values between Content_Elements that are integer multiples of an 8px base unit (8px, 16px, 24px, 32px), with no spacing value that is not a multiple of 8px.
2. THE Login_Page SHALL render exactly one Primary_CTA, and the Primary_CTA SHALL have a higher visual emphasis level than every secondary control, observable as a filled/contained appearance versus the non-filled appearance of secondary controls.
3. THE Login_Page SHALL render the Install_Control at a lower visual emphasis level than the Primary_CTA, observable as a non-filled (text or outlined) appearance versus the filled Primary_CTA.
4. THE Login_Page SHALL render the heading "Masuk dengan NIK" with both a larger font size and a heavier font weight than the description text, such that the heading is one or more typographic levels above the description.
5. THE Login_Page SHALL render all icons from the MUI icon set or as SVG, and SHALL NOT render any emoji character as an icon.
6. THE Login_Page SHALL use only the existing MUI v5 component types (Paper, TextField, Button, Checkbox, Alert, Typography, Stack, Box, Divider, FormControlLabel, InputAdornment) and SHALL NOT introduce component types outside this set.

### Requirement 5: Mobile-First Responsiveness

**User Story:** As an employee using a phone, I want the login page to fit and adapt to my screen, so that I can log in comfortably on any mobile device.

#### Acceptance Criteria

1. THE Login_Page SHALL render with a mobile-first layout that occupies 100% of the available container width across the supported viewport width range of 320px to 1024px.
2. WHEN the viewport width changes to any value within the range of 320px to 1024px, THE Login_Page SHALL reflow its layout so that no Content_Element extends beyond the viewport bounds and no horizontal scrollbar is produced.
3. WHILE the viewport width is 360px, THE Login_Page SHALL render all text Content_Elements at a computed font size of at least 16px with no truncation or clipping of their content.
4. WHILE the viewport width is 360px, THE Login_Page SHALL present all interactive Content_Elements (input fields, buttons, links) with a minimum touch-target size of 44px by 44px and with no overlap between adjacent targets.
5. IF the rendered content height at a viewport width of 360px exceeds the visible viewport height, THEN THE Login_Page SHALL enable vertical scrolling so that every Content_Element remains reachable.

### Requirement 6: Theme Mode Support

**User Story:** As an employee, I want the login page to look correct in both light and dark mode, so that it matches my device and portal theme preference.

#### Acceptance Criteria

1. WHILE the theme is in Light_Mode, THE Login_Page SHALL render surfaces, borders, and text using the Light_Mode Theme_Token values.
2. WHILE the theme is in Dark_Mode, THE Login_Page SHALL render surfaces, borders, and text using the Dark_Mode Theme_Token values.
3. THE Login_Page SHALL derive input field background colors from the value of the `background.paper` Theme_Token defined for the currently active theme mode.
4. WHEN the active theme mode changes between Light_Mode and Dark_Mode while the Login_Page is displayed, THE Login_Page SHALL re-render all surfaces, borders, text, and input field backgrounds using the Theme_Token values of the newly active theme mode within 500 milliseconds.

### Requirement 7: Accessibility Baseline

**User Story:** As an employee with visual or motor accessibility needs, I want sufficient contrast, visible focus, and adequately sized controls, so that I can use the login page reliably.

#### Acceptance Criteria

1. THE Login_Page SHALL present all text and essential interactive elements with a contrast ratio of at least 4.5:1 against their immediate background.
2. THE Primary_CTA SHALL render with a Touch_Target of at least 44px in height and at least 44px in width.
3. THE Install_Control SHALL render with a Touch_Target of at least 44px in height and at least 44px in width.
4. WHEN an interactive control receives keyboard focus, THE Login_Page SHALL display a visible focus indicator on that control with a contrast ratio of at least 3:1 against adjacent colors and a minimum visible thickness of 2px.
5. THE NIK and Password input fields SHALL each retain a visible text label that is programmatically associated with its input field.
