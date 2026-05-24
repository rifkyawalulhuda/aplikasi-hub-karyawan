import { Router } from 'express';

import { hashPassword } from '../lib/password.js';
import prisma from '../lib/prisma.js';
import requireSuperAdmin from '../middleware/requireSuperAdmin.js';

const router = Router();
const ALLOWED_ROLES = ['super_admin', 'admin', 'user'];

function withAsync(handler) {
	return (req, res, next) => {
		Promise.resolve(handler(req, res, next)).catch(next);
	};
}

function normalizeString(value = '') {
	return String(value).trim().replace(/\s+/g, ' ');
}

function mapAdmin(record) {
	return {
		id: record.id,
		employeeId: record.employeeId,
		employeeName: record.employee.fullName,
		employeeNo: record.employee.employeeNo,
		role: record.role,
		siteId: record.siteId ?? null,
		siteName: record.site?.name ?? null,
	};
}

async function getEmployeeOrThrow(employeeId) {
	const employee = await prisma.employee.findUnique({
		where: { id: employeeId },
	});

	if (!employee) {
		throw Object.assign(new Error('Nama wajib dipilih.'), { statusCode: 400 });
	}

	return employee;
}

async function validatePayload(body, currentId = null) {
	const employeeId = Number(body.employeeId);
	const password = normalizeString(body.password);
	const role = normalizeString(body.role).toLowerCase();
	const siteId = body.siteId != null ? Number(body.siteId) : null;

	if (!Number.isInteger(employeeId)) {
		throw Object.assign(new Error('Nama wajib dipilih.'), { statusCode: 400 });
	}

	if (!password && !currentId) {
		throw Object.assign(new Error('Password wajib diisi.'), { statusCode: 400 });
	}

	if (!ALLOWED_ROLES.includes(role)) {
		throw Object.assign(new Error('Role tidak valid. Hanya super_admin, admin, atau user yang diperbolehkan.'), { statusCode: 400 });
	}

	// For admin or user roles, siteId is required
	if ((role === 'admin' || role === 'user') && !siteId) {
		throw Object.assign(new Error('Site wajib dipilih untuk role yang dipilih.'), { statusCode: 400 });
	}

	// Validate siteId references a valid MasterSite
	if (role === 'admin' || role === 'user') {
		const site = await prisma.masterSite.findUnique({ where: { id: siteId } });
		if (!site) {
			throw Object.assign(new Error('Site tidak valid.'), { statusCode: 400 });
		}
	}

	await getEmployeeOrThrow(employeeId);

	const duplicate = await prisma.masterAdmin.findFirst({
		where: {
			employeeId,
			...(currentId ? { NOT: { id: currentId } } : {}),
		},
	});

	if (duplicate) {
		throw Object.assign(new Error('Nama sudah terdaftar sebagai Master Admin.'), { statusCode: 409 });
	}

	return {
		employeeId,
		...(password ? { password: await hashPassword(password) } : {}),
		role,
		// For super_admin, siteId is always null; for admin/user, use the provided siteId
		siteId: role === 'super_admin' ? null : siteId,
	};
}

router.get(
	'/',
	requireSuperAdmin,
	withAsync(async (req, res) => {
		const records = await prisma.masterAdmin.findMany({
			include: {
				employee: true,
				site: true,
			},
			orderBy: { id: 'asc' },
		});

		return res.json(records.map(mapAdmin));
	}),
);

router.post(
	'/',
	requireSuperAdmin,
	withAsync(async (req, res) => {
		const data = await validatePayload(req.body);
		const record = await prisma.masterAdmin.create({
			data,
			include: {
				employee: true,
				site: true,
			},
		});

		return res.status(201).json(mapAdmin(record));
	}),
);

router.put(
	'/:id',
	requireSuperAdmin,
	withAsync(async (req, res) => {
		const id = Number(req.params.id);

		if (Number.isNaN(id)) {
			return res.status(400).json({ message: 'ID tidak valid.' });
		}

		const existing = await prisma.masterAdmin.findUnique({
			where: { id },
		});

		if (!existing) {
			return res.status(404).json({ message: 'Master Admin tidak ditemukan.' });
		}

		const data = await validatePayload(req.body, id);

		// Prevent super_admin from demoting themselves
		if (existing.id === req.admin.id && existing.role === 'super_admin' && data.role !== 'super_admin') {
			return res.status(400).json({ message: 'Super Admin tidak dapat menurunkan role diri sendiri.' });
		}

		// Determine if tokenVersion should be incremented:
		// - password change OR siteId change
		const siteChanged = existing.siteId !== data.siteId;
		const shouldIncrementToken = !!data.password || siteChanged;

		const updateData = {
			...data,
			...(shouldIncrementToken ? { tokenVersion: { increment: 1 } } : {}),
		};
		const record = await prisma.masterAdmin.update({
			where: { id },
			data: updateData,
			include: {
				employee: true,
				site: true,
			},
		});

		return res.json(mapAdmin(record));
	}),
);

router.delete(
	'/:id',
	requireSuperAdmin,
	withAsync(async (req, res) => {
		const id = Number(req.params.id);

		if (Number.isNaN(id)) {
			return res.status(400).json({ message: 'ID tidak valid.' });
		}

		const existing = await prisma.masterAdmin.findUnique({
			where: { id },
		});

		if (!existing) {
			return res.status(404).json({ message: 'Master Admin tidak ditemukan.' });
		}

		await prisma.masterAdmin.delete({
			where: { id },
		});

		return res.status(204).send();
	}),
);

export default router;
