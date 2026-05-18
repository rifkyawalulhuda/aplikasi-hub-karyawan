# Code Review Fix

## Overall Assessment

The code appears to implement an employee hub with a React/Vite frontend and Express/Prisma backend for employee master data, admin users, leave workflows, notifications, and employee self-service.

The app has useful domain structure and Prisma usage, but the backend currently has major authentication and credential-handling risks.

Overall rating: Requires Significant Refactoring

---

## Context Detected

- Language: JavaScript/JSX
- Framework/Libraries: React, Vite, Express, Prisma, Material UI, ExcelJS
- Purpose: Employee/admin HR hub with leave, employee data, notifications, and self-service flows
- Assumptions: This review focused on repository code because the git worktree is clean and no specific diff was provided.

---

## Key Findings

### Finding 1: Admin and Master Data APIs Are Mounted Without Authentication

- Severity: Critical
- Category: Security
- Location: `app-karyawan/server/index.js`, lines 122 and 128
- Issue: Most admin routes are mounted directly without any authentication middleware. Only `employeeMe` uses `requireEmployeeAuth`.
- Impact: Anyone who can reach the API can read, create, update, or delete employee/admin/master data.
- Recommendation: Add admin session/token auth middleware and mount it before all admin-only routes.

```diff
- app.use('/api/master/employees', employeesRouter);
- app.use('/api/master/admins', adminsRouter);
+ app.use('/api/master/employees', requireAdminAuth, employeesRouter);
+ app.use('/api/master/admins', requireAdminAuth, adminsRouter);
```

### Finding 2: Passwords Are Stored, Queried, and Returned as Plaintext

- Severity: Critical
- Category: Security
- Location: `app-karyawan/server/routes/auth.js` line 34, `app-karyawan/server/routes/employees.js` line 226, `app-karyawan/server/routes/admins.js` line 24
- Issue: Login checks compare raw `password` values in Prisma queries, and API serializers return password fields to clients.
- Impact: A database leak or API exposure compromises all accounts immediately; returning passwords also leaks credentials to any client/session.
- Recommendation: Hash passwords with `bcrypt` or `argon2`, compare using constant-time verifier APIs, and never serialize password fields.

```diff
- where: { password, employee: { employeeNo: { equals: nik, mode: 'insensitive' } } }
+ where: { employee: { employeeNo: { equals: nik, mode: 'insensitive' } } }

- password: record.password,
+ // never return password hashes or plaintext passwords
```

### Finding 3: Notification Read State Can Be Spoofed by Supplying employeeId

- Severity: High
- Category: Security
- Location: `app-karyawan/server/routes/notifications.js` line 47
- Issue: `resolveEmployeeId()` trusts `body.employeeId`, `query.employeeId`, or `x-admin-employee-id` instead of deriving identity from an authenticated session.
- Impact: A caller can read or mutate another admin employee's notification read state.
- Recommendation: Derive `employeeId` from `req.admin.employeeId` after authentication and reject caller-provided identity.

```diff
- const fromQuery = Number(req.query.employeeId);
- const fromHeader = Number(req.headers['x-admin-employee-id']);
+ const candidate = req.admin?.employeeId;
```

### Finding 4: Employee JWT Uses a Hardcoded Default Secret

- Severity: High
- Category: Security
- Location: `app-karyawan/server/lib/employeeSession.js` line 3
- Issue: If `EMPLOYEE_AUTH_SECRET` is missing, the app falls back to `dev-employee-auth-secret`.
- Impact: Production tokens can be forged if deployment misses the env var.
- Recommendation: Fail startup when the secret is missing outside local development.

```diff
- return process.env.EMPLOYEE_AUTH_SECRET || DEFAULT_SECRET;
+ if (!process.env.EMPLOYEE_AUTH_SECRET) throw new Error('EMPLOYEE_AUTH_SECRET is required');
+ return process.env.EMPLOYEE_AUTH_SECRET;
```

### Finding 5: Large List Endpoints Are Unpaginated

- Severity: Medium
- Category: Performance
- Location: `app-karyawan/server/routes/employees.js` line 1049, `app-karyawan/server/routes/notifications.js` line 479
- Issue: Several `findMany()` calls load full datasets or build live notifications from broad queries.
- Impact: As data grows, response time and memory usage will degrade, and notification endpoints may become expensive.
- Recommendation: Add pagination, date windows, indexed filters, and avoid recomputing all live notifications on every request.

### Finding 6: Admin Login Does Not Establish a Verifiable Server-Side Session

- Severity: Medium
- Category: Security
- Location: `app-karyawan/server/routes/auth.js` line 53
- Issue: Admin login returns only a user object, while backend admin routes do not verify any token/session.
- Impact: Frontend "logged in" state is not a security boundary; direct API calls bypass it.
- Recommendation: Issue an admin access token or secure HTTP-only session cookie, then enforce it on admin routes.
