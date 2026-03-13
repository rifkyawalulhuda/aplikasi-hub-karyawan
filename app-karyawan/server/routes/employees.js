import { Router } from 'express';

import prisma from '../lib/prisma.js';

const router = Router();

const EMPLOYMENT_TYPES = ['PERMANENT', 'CONTRACT'];
const GENDERS = ['MALE', 'FEMALE'];
const EDUCATION_LEVELS = ['SMA', 'D3', 'S1', 'S2'];
const GRADE_RANKS = ['RANK_1', 'RANK_2', 'RANK_3', 'RANK_4', 'RANK_5', 'RANK_6', 'RANK_7', 'RANK_8', 'RANK_9'];

function withAsync(handler) {
	return (req, res, next) => {
		Promise.resolve(handler(req, res, next)).catch(next);
	};
}

function normalizeString(value = '') {
	return String(value).trim().replace(/\s+/g, ' ');
}

function toDateOnly(value) {
	if (!value) {
		return null;
	}

	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? null : date;
}

function diffYears(fromDate, toDate = new Date()) {
	let years = toDate.getFullYear() - fromDate.getFullYear();
	const monthDiff = toDate.getMonth() - fromDate.getMonth();

	if (monthDiff < 0 || (monthDiff === 0 && toDate.getDate() < fromDate.getDate())) {
		years -= 1;
	}

	return years;
}

function diffService(fromDate, toDate = new Date()) {
	let years = toDate.getFullYear() - fromDate.getFullYear();
	let months = toDate.getMonth() - fromDate.getMonth();

	if (toDate.getDate() < fromDate.getDate()) {
		months -= 1;
	}

	if (months < 0) {
		years -= 1;
		months += 12;
	}

	return `${Math.max(years, 0)} tahun ${Math.max(months, 0)} bulan`;
}

function formatDateForClient(value) {
	return value ? value.toISOString().split('T')[0] : null;
}

function mapEmployee(employee) {
	return {
		id: employee.id,
		employeeNo: employee.employeeNo,
		password: employee.password,
		fullName: employee.fullName,
		employmentType: employee.employmentType,
		siteDiv: employee.siteDiv,
		departmentId: employee.departmentId,
		departmentName: employee.department.name,
		lengthOfService: diffService(employee.joinDate),
		age: diffYears(employee.birthDate),
		birthDate: formatDateForClient(employee.birthDate),
		gender: employee.gender,
		workLocationId: employee.workLocationId,
		workLocationName: employee.workLocation.name,
		jobRoleId: employee.jobRoleId,
		jobRoleName: employee.jobRole.name,
		jobLevelId: employee.jobLevelId,
		jobLevelName: employee.jobLevel.name,
		educationLevel: employee.educationLevel,
		grade: employee.grade,
		joinDate: formatDateForClient(employee.joinDate),
		phoneNumber: employee.phoneNumber,
		email: employee.email,
	};
}

async function ensureLookupExists(model, id, label) {
	const item = await prisma[model].findUnique({ where: { id } });

	if (!item) {
		throw Object.assign(new Error(`${label} tidak ditemukan.`), { statusCode: 400 });
	}
}

async function validatePayload(payload, currentEmployeeId = null) {
	const employeeNo = normalizeString(payload.employeeNo);
	const password = normalizeString(payload.password);
	const fullName = normalizeString(payload.fullName);
	const siteDiv = normalizeString(payload.siteDiv || 'CLC');
	const phoneNumber = normalizeString(payload.phoneNumber);
	const email = normalizeString(payload.email || '');
	const departmentId = Number(payload.departmentId);
	const workLocationId = Number(payload.workLocationId);
	const jobRoleId = Number(payload.jobRoleId);
	const jobLevelId = Number(payload.jobLevelId);
	const birthDate = toDateOnly(payload.birthDate);
	const joinDate = toDateOnly(payload.joinDate);

	if (!employeeNo) throw Object.assign(new Error('Employee No wajib diisi.'), { statusCode: 400 });
	if (!password) throw Object.assign(new Error('Password wajib diisi.'), { statusCode: 400 });
	if (!fullName) throw Object.assign(new Error('Fullname wajib diisi.'), { statusCode: 400 });
	if (!EMPLOYMENT_TYPES.includes(payload.employmentType)) {
		throw Object.assign(new Error('Employment Type tidak valid.'), { statusCode: 400 });
	}
	if (!siteDiv) throw Object.assign(new Error('Site / Div wajib diisi.'), { statusCode: 400 });
	if (!Number.isInteger(departmentId))
		throw Object.assign(new Error('Department wajib dipilih.'), { statusCode: 400 });
	if (!birthDate) throw Object.assign(new Error('Birth Date wajib diisi.'), { statusCode: 400 });
	if (!GENDERS.includes(payload.gender)) throw Object.assign(new Error('Gender tidak valid.'), { statusCode: 400 });
	if (!Number.isInteger(workLocationId))
		throw Object.assign(new Error('Work Location wajib dipilih.'), { statusCode: 400 });
	if (!Number.isInteger(jobRoleId)) throw Object.assign(new Error('Job Role wajib dipilih.'), { statusCode: 400 });
	if (!Number.isInteger(jobLevelId)) throw Object.assign(new Error('Job Level wajib dipilih.'), { statusCode: 400 });
	if (!EDUCATION_LEVELS.includes(payload.educationLevel)) {
		throw Object.assign(new Error('Education Level tidak valid.'), { statusCode: 400 });
	}
	if (!GRADE_RANKS.includes(payload.grade)) throw Object.assign(new Error('Grade tidak valid.'), { statusCode: 400 });
	if (!joinDate) throw Object.assign(new Error('Join Date wajib diisi.'), { statusCode: 400 });
	if (!phoneNumber) throw Object.assign(new Error('Phone Number wajib diisi.'), { statusCode: 400 });

	const duplicate = await prisma.employee.findFirst({
		where: {
			employeeNo: { equals: employeeNo, mode: 'insensitive' },
			...(currentEmployeeId ? { NOT: { id: currentEmployeeId } } : {}),
		},
	});

	if (duplicate) {
		throw Object.assign(new Error('Employee No sudah ada.'), { statusCode: 409 });
	}

	await Promise.all([
		ensureLookupExists('department', departmentId, 'Department'),
		ensureLookupExists('workLocation', workLocationId, 'Work Location'),
		ensureLookupExists('jobRole', jobRoleId, 'Job Role'),
		ensureLookupExists('jobLevel', jobLevelId, 'Job Level'),
	]);

	return {
		employeeNo,
		password,
		fullName,
		employmentType: payload.employmentType,
		siteDiv,
		departmentId,
		birthDate,
		gender: payload.gender,
		workLocationId,
		jobRoleId,
		jobLevelId,
		educationLevel: payload.educationLevel,
		grade: payload.grade,
		joinDate,
		phoneNumber,
		email: email || null,
	};
}

async function getEmployeeOrThrow(id) {
	const employee = await prisma.employee.findUnique({
		where: { id },
		include: { department: true, workLocation: true, jobRole: true, jobLevel: true },
	});

	if (!employee) {
		throw Object.assign(new Error('Master Karyawan tidak ditemukan.'), { statusCode: 404 });
	}

	return employee;
}

router.get(
	'/',
	withAsync(async (req, res) => {
		const employees = await prisma.employee.findMany({
			include: { department: true, workLocation: true, jobRole: true, jobLevel: true },
			orderBy: { id: 'asc' },
		});

		return res.json(employees.map(mapEmployee));
	}),
);

router.post(
	'/',
	withAsync(async (req, res) => {
		const data = await validatePayload(req.body);
		const employee = await prisma.employee.create({
			data,
			include: { department: true, workLocation: true, jobRole: true, jobLevel: true },
		});

		return res.status(201).json(mapEmployee(employee));
	}),
);

router.put(
	'/:id',
	withAsync(async (req, res) => {
		const id = Number(req.params.id);
		if (Number.isNaN(id)) {
			return res.status(400).json({ message: 'ID tidak valid.' });
		}

		await getEmployeeOrThrow(id);
		const data = await validatePayload(req.body, id);
		const employee = await prisma.employee.update({
			where: { id },
			data,
			include: { department: true, workLocation: true, jobRole: true, jobLevel: true },
		});

		return res.json(mapEmployee(employee));
	}),
);

router.delete(
	'/:id',
	withAsync(async (req, res) => {
		const id = Number(req.params.id);
		if (Number.isNaN(id)) {
			return res.status(400).json({ message: 'ID tidak valid.' });
		}

		await getEmployeeOrThrow(id);
		await prisma.employee.delete({ where: { id } });
		return res.status(204).send();
	}),
);

export default router;
