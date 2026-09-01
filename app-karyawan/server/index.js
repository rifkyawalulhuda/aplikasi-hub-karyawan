import 'dotenv/config';
import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import http from 'http';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import prisma from './lib/prisma.js';
import authRouter from './routes/auth.js';
import adminsRouter from './routes/admins.js';
import employeeAuthRouter from './routes/employeeAuth.js';
import employeeDocumentsRouter from './routes/employeeDocuments.js';
import employeeLeaveBalanceSeedsRouter from './routes/employeeLeaveBalanceSeeds.js';
import employeeLeaveDatabaseRouter from './routes/employeeLeaveDatabase.js';
import employeeLeavesRouter from './routes/employeeLeaves.js';
import emailWorkflowFailuresRouter from './routes/emailWorkflowFailures.js';
import globalSearchRouter from './routes/globalSearch.js';
import notificationsRouter from './routes/notifications.js';
import employeeTrainingsRouter from './routes/employeeTrainings.js';
import licenseCertificationsRouter from './routes/licenseCertifications.js';
import unitLicenseCertificationsRouter from './routes/unitLicenseCertifications.js';
import employeeMeRouter from './routes/employeeMe.js';
import guidanceRecordsRouter from './routes/guidanceRecords.js';
import groupShiftsRouter from './routes/groupShifts.js';
import vendorsRouter from './routes/vendors.js';
import employeesRouter from './routes/employees.js';
import masterDataRouter from './routes/masterData.js';
import warningLettersRouter from './routes/warningLetters.js';
import requireAdminAuth from './middleware/requireAdminAuth.js';
import requireSuperAdmin from './middleware/requireSuperAdmin.js';
import siteApprovalConfigsRouter from './routes/siteApprovalConfigs.js';
import sitesRouter from './routes/sites.js';
import b3WasteRecordsRouter from './routes/b3WasteRecords.js';
import b3WasteTypesRouter from './routes/b3WasteTypes.js';
import dashboardRouter from './routes/dashboard.js';

const app = express();
const port = Number(process.env.PORT || 4000);

// Trust reverse proxy (nginx/Cloudflare) in production so express-rate-limit
// can read the real client IP from X-Forwarded-For without throwing
// ERR_ERL_UNEXPECTED_X_FORWARDED_FOR.
app.set('trust proxy', 1);
const DEFAULT_ALLOWED_ORIGINS = [
	'http://localhost:5173',
	'http://127.0.0.1:5173',
	'https://aplikasi-hub.my.id',
	'https://www.aplikasi-hub.my.id',
	'https://pwa.aplikasi-hub.my.id',
	'https://pwa-karyawan*.vercel.app',
	'https://admin.aplikasi-hub.my.id',
	'https://app.aplikasi-hub.my.id',
];

function parseAllowedOrigins(rawValue = '') {
	const parsed = rawValue
		.split(',')
		.map((item) => item.trim().replace(/\/+$/, ''))
		.filter(Boolean);

	return [...new Set([...DEFAULT_ALLOWED_ORIGINS, ...parsed])];
}

function escapeRegex(value) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildOriginPattern(originPattern) {
	const normalizedPattern = String(originPattern || '')
		.trim()
		.replace(/\/+$/, '');

	if (!normalizedPattern) {
		return null;
	}

	if (!normalizedPattern.includes('*')) {
		return normalizedPattern;
	}

	return new RegExp(`^${escapeRegex(normalizedPattern).replace(/\\\*/g, '.*')}$`);
}

const allowedOrigins = parseAllowedOrigins(process.env.CORS_ALLOWED_ORIGINS || '');
const allowedOriginPatterns = allowedOrigins.map(buildOriginPattern).filter(Boolean);

function isOriginAllowed(origin) {
	const normalizedOrigin = String(origin || '')
		.trim()
		.replace(/\/+$/, '');

	return allowedOriginPatterns.some((allowedOriginPattern) => {
		if (allowedOriginPattern instanceof RegExp) {
			return allowedOriginPattern.test(normalizedOrigin);
		}

		return allowedOriginPattern === normalizedOrigin;
	});
}

app.use(
	cors({
		origin(origin, callback) {
			if (!origin) {
				callback(null, true);
				return;
			}

			if (isOriginAllowed(origin)) {
				callback(null, true);
				return;
			}

			callback(
				Object.assign(new Error(`Origin ${origin} tidak diizinkan oleh CORS.`), {
					statusCode: 403,
				}),
			);
		},
		credentials: true,
	}),
);

// Security headers
app.use(
	helmet({
		contentSecurityPolicy: false,
		crossOriginEmbedderPolicy: false,
	}),
);

// Response compression
app.use(compression());

// JSON body size limit (prevent large payload DoS)
app.use(express.json({ limit: '1mb' }));

// Rate limiting for auth endpoints (prevent brute-force)
const authRateLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 20, // max 20 login attempts per IP per window
	standardHeaders: true,
	legacyHeaders: false,
	message: { message: 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.' },
});

// General API rate limiter (prevent abuse)
const apiRateLimiter = rateLimit({
	windowMs: 1 * 60 * 1000, // 1 minute
	max: 200, // max 200 requests per IP per minute
	standardHeaders: true,
	legacyHeaders: false,
	message: { message: 'Terlalu banyak request. Coba lagi nanti.' },
});

app.use('/api', apiRateLimiter);

// Request timeout (30 seconds)
app.use((req, res, next) => {
	req.setTimeout(30000);
	res.setTimeout(30000);
	next();
});

app.get('/api/health', async (req, res) => {
	try {
		await prisma.$queryRaw`SELECT 1`;
		const memUsage = process.memoryUsage();
		return res.json({
			status: 'ok',
			uptime: Math.floor(process.uptime()),
			memory: {
				rss: Math.round(memUsage.rss / 1024 / 1024),
				heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
				heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
			},
		});
	} catch (error) {
		return res.status(500).json({
			status: 'error',
			message: 'Database connection failed.',
		});
	}
});

app.use('/api/auth', authRateLimiter, authRouter);
app.use('/api/employee-auth', authRateLimiter, employeeAuthRouter);
app.use('/api/employee-me', employeeMeRouter);
app.use('/api/global-search', requireAdminAuth, globalSearchRouter);
app.use('/api/dashboard', requireAdminAuth, dashboardRouter);
app.use('/api/notifications', requireAdminAuth, notificationsRouter);
app.use('/api/admin/email-workflow-failures', requireAdminAuth, emailWorkflowFailuresRouter);
app.use('/api/master/employees', requireAdminAuth, employeesRouter);
app.use('/api/master/admins', requireAdminAuth, adminsRouter);
app.use('/api/master/group-shifts', requireAdminAuth, groupShiftsRouter);
app.use('/api/master/master-vendors', requireAdminAuth, vendorsRouter);
app.use('/api/master/employee-documents', requireAdminAuth, employeeDocumentsRouter);
app.use('/api/master/site-approval-configs', requireAdminAuth, siteApprovalConfigsRouter);
app.use('/api/master/sites', requireAdminAuth, requireSuperAdmin, sitesRouter);
app.use('/api/master', requireAdminAuth, masterDataRouter);
app.use('/api/data-karyawan/guidance-records', requireAdminAuth, guidanceRecordsRouter);
app.use('/api/data-karyawan/warning-letters', requireAdminAuth, warningLettersRouter);
app.use('/api/data-karyawan/employee-leaves', requireAdminAuth, employeeLeavesRouter);
app.use('/api/data-karyawan/employee-leave-database', requireAdminAuth, employeeLeaveDatabaseRouter);
app.use('/api/data-karyawan/employee-leave-balance-seeds', requireAdminAuth, employeeLeaveBalanceSeedsRouter);
app.use('/api/data-karyawan/pelatihan-karyawan', requireAdminAuth, employeeTrainingsRouter);
app.use('/api/data-karyawan/license-certifications', requireAdminAuth, licenseCertificationsRouter);
app.use('/api/data-unit/license-certifications', requireAdminAuth, unitLicenseCertificationsRouter);
app.use('/api/b3-waste/records', requireAdminAuth, b3WasteRecordsRouter);
app.use('/api/b3-waste/types', requireAdminAuth, b3WasteTypesRouter);

// Serve static frontend build (production only)
const distPath = join(__dirname, '..', 'dist');
if (existsSync(distPath)) {
	app.use(express.static(distPath, { maxAge: '1d', etag: true }));
	// SPA fallback: semua non-API route diarahkan ke index.html
	app.get(/^(?!\/api).*$/, (req, res) => {
		res.sendFile(join(distPath, 'index.html'));
	});
}

app.use((error, req, res, next) => {
	if (res.headersSent) {
		return next(error);
	}

	console.error(error);

	if (error?.code === 'P2002') {
		return res.status(409).json({
			message: 'Data sudah ada.',
		});
	}

	if (error?.code === 'P2003') {
		return res.status(409).json({
			message: 'Data tidak bisa dihapus karena masih digunakan oleh data lain.',
		});
	}

	if (error?.statusCode) {
		return res.status(error.statusCode).json({
			message: error.message,
		});
	}

	return res.status(500).json({
		message: 'Terjadi kesalahan pada server.',
	});
});

const server = http.createServer(app);

server.on('error', (error) => {
	if (error?.code === 'EADDRINUSE') {
		console.warn(`Port ${port} sudah dipakai proses lain. Server dev tidak dijalankan ulang.`);
		return;
	}

	throw error;
});

server.listen(port, () => {
	console.log(`API server running on http://localhost:${port}`);
});
