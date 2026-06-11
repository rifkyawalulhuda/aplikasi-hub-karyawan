# Implementation Plan: Mobile Login Redesign

## Overview

This plan implements a presentation-only restyle of the existing employee mobile login page at
`app-karyawan/src/pages/employeeMobile/login/index.jsx`. All work is scoped to JSX structure and MUI v5 `sx`
styling props — no React state, handlers, network calls, form field names, navigation, or PWA install logic
change.

Because every implementation step edits the same single component file, the steps are sequenced so each one
builds on the previous and there is no orphaned styling. Verification is example-based (Vitest +
@testing-library/react) covering content preservation, behavior preservation, brand color, emphasis hierarchy,
theme mode, and accessibility baselines. Since this is a UI rendering/visual feature, the design has no
Correctness Properties section, so there are no property-based tests — unit/component tests are used instead and
are marked optional with `*`.

Tech/style conventions to follow throughout: React 18 + JSX (no TS), MUI v5 component set only, ESM imports with
`@` path aliases, tabs width 4, single quotes, semicolons, trailing commas, 120 print width. All user-facing text
stays in Indonesian and byte-for-byte identical to the current copy.

## Tasks

- [x] 1. Establish redesign baseline in the login component
  - [x] 1.1 Capture current behavior and prepare card/body shell
    - Read `src/pages/employeeMobile/login/index.jsx` and confirm the preserved imports, state
      (`nik`, `password`, `showPassword`, `submitting`, `installEvent`, `installing`, `isStandalone`), and
      handlers (`handleSubmit`, `handleInstallApp`, install effect) remain untouched.
    - Reorganize the JSX tree into the target regions (card `Paper` → header band → form body `Box component="form"`
      with intro block, fields stack, checkbox+CTA group, install section) without changing any element, prop name,
      or handler wiring.
    - Set the `Paper` styling contract: `width: '100%'`, `overflow: 'hidden'`, rounded radius, sourcing
      `employeeSurface.card`, `employeeSurface.borderSoft`, and `employeeSurface.shadowMedium` via `(theme) => …`
      callbacks (no hardcoded colors).
    - _Requirements: 1.1, 3.3, 4.6, 5.1, 6.1, 6.2_

  - [x]* 1.2 Write content-preservation render tests
    - Add a co-located test for the login page rendered inside an `EmployeePortal` `ThemeProvider`
      (`createEmployeePortalTheme('light')`), mocking `@/services/employeeApi`, `@/contexts/employeeAuthContext`,
      `notistack`, and `react-router-dom`.
    - Assert presence of "SANKYU", "Portal Karyawan", overline "Login Karyawan", heading "Masuk dengan NIK", the
      exact description text, NIK + Password fields with their icon adornments, the unchecked "Tampilkan password"
      checkbox, and the "Masuk" button.
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8_

- [x] 2. Restyle the header band (brand region)
  - [x] 2.1 Apply header band layout and verbatim brand gradient
    - Style the header `Box` with internal padding `p: 3` (24px) and `Stack spacing={1}`.
    - Render the background as the exact gradient `linear-gradient(160deg, #0B2746 0%, #123C6C 54%, #2F74BC 100%)`.
    - Render the "SANKYU" brand label as `Typography variant="overline"` and "Portal Karyawan" as a higher-emphasis
      title (`variant="subtitle1"`/`h6`), using `#FFFFFF`/`rgba(255,255,255,*)` contrast text only over the dark
      gradient.
    - _Requirements: 1.1, 3.1, 4.1, 4.4_

  - [x]* 2.2 Write brand gradient test for the header
    - Assert the header element's computed background/backgroundImage contains the exact gradient string with the
      three stops and 160deg angle.
    - _Requirements: 3.1_

- [x] 3. Restyle the intro block typography
  - [x] 3.1 Apply overline, heading, and description hierarchy
    - Render the overline "Login Karyawan" (`variant="overline"`, heavier weight, `primary.main`), the heading
      "Masuk dengan NIK" (`variant="h6"`/`h5`, `fontWeight: 700`, `text.primary`), and the description
      (`variant="body2"`, `color="text.secondary"`).
    - Ensure the heading font size and weight are strictly greater than the description; pin minimum readable text
      to `fontSize: '1rem'` (16px) where the MUI default would fall below 16px.
    - Use `Stack spacing={1}` (8px) within the intro block.
    - _Requirements: 1.2, 1.3, 1.4, 4.1, 4.4, 5.3_

  - [x]* 3.2 Write typography hierarchy and icon tests
    - Assert heading font size and font weight are strictly greater than the description's (via theme variants /
      computed styles), and assert no emoji is rendered as an icon (adornment icons are MUI SVG icons).
    - _Requirements: 4.4, 4.5_

- [x] 4. Restyle the fields stack and show-password control
  - [x] 4.1 Apply field spacing, input styling, and checkbox row
    - Wrap the two `TextField`s in a `Stack spacing={2}` (16px); keep the badge icon (NIK) and lock icon (Password)
      `InputAdornment`s.
    - Preserve field attributes exactly: NIK `required` + `autoFocus` + `autoComplete="username"`, Password
      `required` + `autoComplete="current-password"`, and field names `nik`/`password`.
    - Derive input background from `background.paper` for the active mode; size the "Tampilkan password"
      `FormControlLabel` row so its tappable area is >=44px tall and not overlapping adjacent targets; pin field
      input/label text to >=16px.
    - _Requirements: 1.5, 1.6, 1.7, 2.4, 2.5, 2.6, 4.1, 5.3, 5.4, 6.3, 7.5_

  - [x]* 4.2 Write field behavior and accessibility tests
    - Assert NIK/Password expose accessible names tied to visible labels; assert toggling the checkbox switches the
      Password input `type` between `password` and `text`; assert `required`/`autoFocus`/`autoComplete` attributes
      are retained.
    - _Requirements: 2.4, 2.5, 2.6, 7.5_

- [x] 5. Restyle the primary CTA
  - [x] 5.1 Apply contained gradient CTA with touch target and loading state
    - Render the single `Button variant="contained"` "Masuk" full width with `minHeight: 48` (>=44px), using the
      two-stop gradient `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main}
      100%)` (no third stop).
    - Preserve the submit lifecycle: disabled "Memproses..." label with `CircularProgress` while `submitting`,
      restored default label on resolve/reject.
    - Ensure focus-visible ring is not suppressed (no `outline: none` without a >=2px `primary.main` replacement).
    - _Requirements: 1.8, 2.2, 2.3, 3.2, 4.2, 7.2, 7.4_

  - [x]* 5.2 Write CTA emphasis, gradient, and loading tests
    - Assert exactly one contained button exists; assert its gradient resolves from `primary.dark` and `primary.main`
      with no third stop; assert it renders `minHeight >= 44`; assert the loading label/disabled state toggles
      correctly.
    - _Requirements: 2.2, 2.3, 3.2, 4.2, 7.2_

- [x] 6. Restyle the install section
  - [x] 6.1 Apply install section layout, outlined control, and info alert
    - Render the install region (shown only when not in `Standalone_Mode`) with `Divider`, an outlined install
      `Button` (`minHeight: 44`, full width, label "Install App" / "Install belum tersedia"), and the info
      `Alert severity="info" variant="outlined"` with the exact guidance text.
    - Keep `handleInstallApp` behavior intact (prompt when `installEvent` present, info snackbar otherwise) and the
      `beforeinstallprompt`/`appinstalled` effect unchanged; source colors from `employeeSurface.borderSoft`/`divider`
      and `primary.main` alpha only.
    - _Requirements: 1.9, 1.10, 2.7, 2.8, 2.9, 3.3, 4.3, 7.3_

  - [x]* 6.2 Write install section presence and emphasis tests
    - With standalone mocked false and no install event, assert the install button and exact info alert text render
      and that the install button is `outlined`; with standalone true, assert the install section is absent.
    - _Requirements: 1.9, 1.10, 4.3, 7.3_

- [x] 7. Checkpoint - Ensure all tests pass
  - Run `npm run test:run` and `npm run lint`; ensure all tests pass. Ask the user if questions arise.

- [x] 8. Finalize theme-mode and behavior wiring
  - [x] 8.1 Verify token-driven mode behavior and snackbar/navigation flow
    - Confirm all surface/border/shadow/text values read through `(theme) => …` callbacks so a light/dark switch
      re-renders correct values with no page-local mode conditionals beyond existing `alpha(...)` tweaks.
    - Confirm login flow wiring is unchanged end to end: `employeeAuthRequest('/login', …)` body uses `nik`/`password`,
      success navigates to the existing destination, error with a message shows it via snackbar (values retained),
      and error without a message shows a generic Indonesian message (values retained).
    - _Requirements: 2.1, 2.10, 2.11, 2.12, 3.4, 6.1, 6.2, 6.3, 6.4_

  - [x]* 8.2 Write theme-mode and login-flow integration tests
    - Render in dark theme and assert dark-mode token values for surface/border/text and `background.paper`-derived
      input background, then re-render in light theme and assert updated values.
    - Assert submit calls `employeeAuthRequest('/login', …)` with `nik`/`password`; assert navigation on success;
      assert error-with-message and error-without-message snackbar behavior with retained field values.
    - _Requirements: 2.1, 2.10, 2.11, 2.12, 6.1, 6.2, 6.3_

- [x] 9. Final checkpoint - Ensure all tests pass
  - Run `npm run test:run`, `npm run lint`, and `npm run build` for a build sanity check; ensure everything passes.
    Ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional test sub-tasks and can be skipped for a faster MVP; core restyle tasks are not
  optional.
- Every implementation sub-task edits the same file (`src/pages/employeeMobile/login/index.jsx`), so they are
  sequenced across separate waves to avoid write conflicts; test sub-tasks edit a separate co-located test file.
- This is a UI rendering/visual feature, so there are no property-based tests — verification uses example-based
  component tests plus the manual checks listed in the design (responsive reflow, contrast, touch targets).
- Each task references specific granular requirement clauses for traceability.
- Manual/non-automatable checks from the design (320px–1024px reflow, >=16px text at 360px, contrast >=4.5:1,
  focus >=3:1/>=2px, mode switch <500ms) are outside the coding tasks above and verified manually in a browser.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "2.1"] },
    { "id": 2, "tasks": ["2.2", "3.1"] },
    { "id": 3, "tasks": ["3.2", "4.1"] },
    { "id": 4, "tasks": ["4.2", "5.1"] },
    { "id": 5, "tasks": ["5.2", "6.1"] },
    { "id": 6, "tasks": ["6.2", "8.1"] },
    { "id": 7, "tasks": ["8.2"] }
  ]
}
```
