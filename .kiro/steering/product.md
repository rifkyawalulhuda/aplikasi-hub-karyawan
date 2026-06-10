---
inclusion: always
---

# Product Overview

**Aplikasi Hub Karyawan** is an internal employee management hub for Sankyu Indonesia (mining/industrial services). Two user groups:

1. **Admin Portal** — HR/admin staff manage employee master data, leave requests, discipline records, certifications, training, and notifications.
2. **Employee Portal (PWA)** — Employees view their own data, submit leave requests, and receive push notifications on mobile.

## Core Domains

| Domain | Description | API Prefix |
|--------|-------------|------------|
| Employee Master Data | Personal info, department, job role/level, grade, employment type, group shifts | `/api/master/employees` |
| Leave Management | Multi-stage approval workflow, balance tracking, email notifications, revision history | `/api/data-karyawan/employee-leaves` |
| Discipline Records | Guidance/direction meetings, warning letters, reprimands, suspension letters (linked to PKB articles) | `/api/data-karyawan/guidance-records`, `/api/data-karyawan/warning-letters` |
| License & Certifications | Employee document tracking with expiry dates; unit-level certifications tied to vendors | `/api/data-karyawan/license-certifications`, `/api/data-unit/license-certifications` |
| Training | Internal/external training records with participant tracking | `/api/data-karyawan/pelatihan-karyawan` |
| Notifications | Admin notification center with read-state; employee push notifications via Web Push | `/api/notifications` |
| Group Shifts | Shift group assignments with foreman mappings | `/api/master/group-shifts` |
| Sites | Multi-tenant site management with data isolation | `/api/master/sites` |

## Leave Approval Workflow

The leave system uses a multi-stage approval chain based on organizational hierarchy:

- Foreman → Section Chief → Department Manager
- Each stage sends email notifications to the next approver
- Failed email deliveries are logged in `emailWorkflowFailures`
- Leave balances are seeded annually and decremented on approval

## Authorization Model

- **Admin auth**: Token-based (Bearer) via `MasterAdmin` table. Middleware: `requireAdminAuth`.
- **Super admin**: Additional privilege layer. Middleware: `requireSuperAdmin`.
- **Site isolation**: Multi-tenant data scoping. Middleware: `requireSiteIsolation`. Queries append `siteId` parameter.
- **Employee auth**: Separate session context for self-service portal. Middleware: `requireEmployeeAuth`.
- Admin token stored in localStorage under key `hub-karyawan-auth`.
- Employee routes (`/employee-auth`, `/employee-me`) bypass admin auth header injection.

## Localization Rules

- The application language is **Indonesian (Bahasa Indonesia)**.
- All UI labels, form placeholders, error messages, validation messages, and toast notifications must be in Indonesian.
- Server error messages are in Indonesian (e.g., "Data sudah ada.", "Terjadi kesalahan pada server.").
- Use Indonesian domain terminology consistently:

| Indonesian Term | English Equivalent | Context |
|----------------|-------------------|---------|
| karyawan | employee | General employee reference |
| cuti | leave | Leave/time-off management |
| pembinaan | guidance | Guidance/coaching records |
| peringatan | warning | Warning letters |
| pelatihan | training | Training records |
| surat teguran | reprimand letter | Discipline escalation |
| surat peringatan (SP) | warning letter | Formal warning (SP1, SP2, SP3) |
| PKB | company regulation | Perjanjian Kerja Bersama |
| foreman | foreman | First-level supervisor |
| section chief | section chief | Mid-level approver |
| dept manager | department manager | Final approver |

## Multi-Tenant (Site) Architecture

- The system supports multiple operational sites (e.g., different mining locations).
- Data is isolated per site using `siteId` scoping on queries.
- Admin users may be scoped to specific sites; super admins access all sites.
- Frontend appends `siteId` query parameter via the `appendSiteIdParam` utility.
- Site approval configurations define per-site workflow behavior.

## Notification Channels

- **Email** — Workflow notifications (leave approvals, escalations) via nodemailer.
- **Web Push** — Employee-facing push notifications via `web-push` library.
- **WhatsApp** — Optional notification channel via `whatsappService`.
- **In-app** — Admin notification center with read/unread state tracking.
