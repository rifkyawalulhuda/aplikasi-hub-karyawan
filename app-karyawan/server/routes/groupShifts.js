import { randomUUID } from 'crypto';
import fs from 'fs/promises';
import path from 'path';

import ExcelJS from 'exceljs';
import { Router } from 'express';
import multer from 'multer';

import prisma from '../lib/prisma.js';

const router = Router();
const upload = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: 10 * 1024 * 1024,
	},
});
const TEMPLATE_MAX_ROWS = 500;
const FOREMAN_JOB_LEVEL = 'foreman';
const IMPORT_HEADERS = ['Nama Group Shift', 'Foreman', 'Karyawan'];
const ERROR_REPORT_DIR = path.resolve(process.cwd(), 'tmp', 'import-results');
const GROUP_SHIFT_INCLUDE = {
	foremen: {
		include: {
			employee: {
				include: {
					jobLevel: true,
				},
			},
		},
		orderBy: {
			id: 'asc',
		},
	},
	employees: {
		include: {
			jobLevel: true,
		},
		orderBy: [{ fullName: 'asc' }, { id: 'asc' }],
	},
};

function withAsync(handler) {
	return (req, res, next) => {
		Promise.resolve(handler(req, res, next)).catch(next);
	};
}

function normalizeString(value = '') {
	return String(value).trim().replace(/\s+/g, ' ');
}

function normalizeNameKey(value = '') {
	return normalizeString(value).toLowerCase();
}

function normalizeJobLevelName(value = '') {
	return normalizeString(value).toLowerCase();
}

function getCellValue(value) {
	if (value && typeof value === 'object') {
		if (typeof value.text === 'string') {
			return value.text;
		}

		if (typeof value.result !== 'undefined') {
			return value.result;
		}
	}

	return value;
}

function parseDelimitedCell(value) {
	return String(getCellValue(value) || '')
		.split(';')
		.map((item) => normalizeString(item))
		.filter(Boolean);
}

function mapEmployeeSummary(employee) {
	return {
		id: employee.id,
		employeeNo: employee.employeeNo,
		fullName: employee.fullName,
		jobLevelName: employee.jobLevel?.name || '',
	};
}

function sortEmployeeSummaries(items = []) {
	return items.slice().sort((left, right) => {
		const leftName = normalizeNameKey(left.fullName);
		const rightName = normalizeNameKey(right.fullName);

		if (leftName !== rightName) {
			return leftName.localeCompare(rightName);
		}

		return left.id - right.id;
	});
}

function mapGroupShift(record) {
	const foremen = sortEmployeeSummaries(record.foremen.map((assignment) => mapEmployeeSummary(assignment.employee)));
	const employees = sortEmployeeSummaries(record.employees.map(mapEmployeeSummary));

	return {
		id: record.id,
		groupShiftName: record.groupShiftName,
		foremanIds: foremen.map((item) => item.id),
		foremen,
		foremanNames: foremen.map((item) => item.fullName).join(', '),
		employeeIds: employees.map((item) => item.id),
		employees,
		employeeNames: employees.map((item) => item.fullName).join(', '),
		employeeCount: employees.length,
	};
}

async function getGroupShiftOrThrow(db, id) {
	const record = await db.masterGroupShift.findUnique({
		where: { id },
		include: GROUP_SHIFT_INCLUDE,
	});

	if (!record) {
		throw Object.assign(new Error('Master Group Shift tidak ditemukan.'), { statusCode: 404 });
	}

	return record;
}

async function findExistingGroupShiftByName(db, groupShiftName) {
	const records = await db.masterGroupShift.findMany({
		where: {
			groupShiftName: {
				equals: groupShiftName,
				mode: 'insensitive',
			},
		},
		select: {
			id: true,
			groupShiftName: true,
		},
	});

	if (records.length > 1) {
		throw Object.assign(
			new Error(`Nama Group Shift "${groupShiftName}" duplikat pada database. Rapikan data terlebih dahulu.`),
			{ statusCode: 409 },
		);
	}

	return records[0] || null;
}

async function ensureGroupShiftNameUnique(db, groupShiftName, currentId = null) {
	const existingRecord = await findExistingGroupShiftByName(db, groupShiftName);

	if (existingRecord && existingRecord.id !== currentId) {
		throw Object.assign(new Error('Nama Group Shift sudah digunakan.'), { statusCode: 409 });
	}
}

async function validatePayload(db, payload = {}, currentId = null) {
	const groupShiftName = normalizeString(payload.groupShiftName);
	const rawForemanIds = Array.isArray(payload.foremanIds) ? payload.foremanIds : [];
	const rawEmployeeIds = Array.isArray(payload.employeeIds) ? payload.employeeIds : [];
	const foremanIds = [
		...new Set(rawForemanIds.map((value) => Number(value)).filter((value) => Number.isInteger(value))),
	];
	const employeeIds = [
		...new Set(rawEmployeeIds.map((value) => Number(value)).filter((value) => Number.isInteger(value))),
	];

	if (!groupShiftName) {
		throw Object.assign(new Error('Nama Group Shift wajib diisi.'), { statusCode: 400 });
	}

	if (foremanIds.length === 0) {
		throw Object.assign(new Error('Minimal satu Foreman wajib dipilih.'), { statusCode: 400 });
	}

	await ensureGroupShiftNameUnique(db, groupShiftName, currentId);

	const uniqueEmployeeIds = [...new Set([...foremanIds, ...employeeIds])];
	const employees = await db.employee.findMany({
		where: {
			id: {
				in: uniqueEmployeeIds,
			},
		},
		include: {
			jobLevel: true,
		},
	});

	const employeeLookup = new Map(employees.map((employee) => [employee.id, employee]));
	const missingForemanIds = foremanIds.filter((id) => !employeeLookup.has(id));
	const missingEmployeeIds = employeeIds.filter((id) => !employeeLookup.has(id));

	if (missingForemanIds.length > 0) {
		throw Object.assign(new Error('Data Foreman yang dipilih tidak ditemukan.'), { statusCode: 400 });
	}

	if (missingEmployeeIds.length > 0) {
		throw Object.assign(new Error('Data Karyawan yang dipilih tidak ditemukan.'), { statusCode: 400 });
	}

	const invalidForemen = foremanIds
		.map((id) => employeeLookup.get(id))
		.filter((employee) => normalizeJobLevelName(employee.jobLevel?.name) !== FOREMAN_JOB_LEVEL);

	if (invalidForemen.length > 0) {
		throw Object.assign(new Error('Foreman yang dipilih harus memiliki Job Level "Foreman".'), {
			statusCode: 400,
		});
	}

	return {
		groupShiftName,
		foremanIds,
		employeeIds,
	};
}

async function syncGroupShiftEmployees(db, groupShiftId, employeeIds = []) {
	const uniqueEmployeeIds = [...new Set(employeeIds)].filter((value) => Number.isInteger(value));

	if (uniqueEmployeeIds.length === 0) {
		await db.employee.updateMany({
			where: {
				groupShiftId,
			},
			data: {
				groupShiftId: null,
			},
		});
		return;
	}

	await db.employee.updateMany({
		where: {
			groupShiftId,
			id: {
				notIn: uniqueEmployeeIds,
			},
		},
		data: {
			groupShiftId: null,
		},
	});

	await db.employee.updateMany({
		where: {
			id: {
				in: uniqueEmployeeIds,
			},
		},
		data: {
			groupShiftId,
		},
	});
}

async function saveGroupShift(db, payload = {}, currentId = null) {
	const data = await validatePayload(db, payload, currentId);
	let groupShiftId = currentId;

	if (currentId) {
		await db.masterGroupShift.update({
			where: { id: currentId },
			data: {
				groupShiftName: data.groupShiftName,
				foremen: {
					deleteMany: {},
					create: data.foremanIds.map((employeeId) => ({
						employeeId,
					})),
				},
			},
		});
	} else {
		const createdRecord = await db.masterGroupShift.create({
			data: {
				groupShiftName: data.groupShiftName,
				foremen: {
					create: data.foremanIds.map((employeeId) => ({
						employeeId,
					})),
				},
			},
			select: {
				id: true,
			},
		});

		groupShiftId = createdRecord.id;
	}

	await syncGroupShiftEmployees(db, groupShiftId, data.employeeIds);

	return getGroupShiftOrThrow(db, groupShiftId);
}

function worksheetRowToPayload(row, headerMap) {
	const payload = {};

	headerMap.forEach((columnNumber, header) => {
		payload[header] = getCellValue(row.getCell(columnNumber).value);
	});

	return payload;
}

function buildEmployeeNameLookup(employees = []) {
	return employees.reduce((lookup, employee) => {
		const key = normalizeNameKey(employee.fullName);
		const currentItems = lookup.get(key) || [];
		currentItems.push(employee);
		lookup.set(key, currentItems);
		return lookup;
	}, new Map());
}

function ensureUniqueNames(names = [], label) {
	const seenNames = new Set();

	names.forEach((name) => {
		const key = normalizeNameKey(name);

		if (seenNames.has(key)) {
			throw new Error(`${label} "${name}" duplikat dalam satu baris import.`);
		}

		seenNames.add(key);
	});
}

function resolveEmployeesByNames(names, employeeLookup, label, validator) {
	ensureUniqueNames(names, label);

	return names.map((name) => {
		const matches = employeeLookup.get(normalizeNameKey(name)) || [];

		if (matches.length === 0) {
			throw new Error(`${label} "${name}" tidak ditemukan di Master Karyawan.`);
		}

		if (matches.length > 1) {
			throw new Error(`${label} "${name}" duplikat di Master Karyawan. Gunakan nama yang unik terlebih dahulu.`);
		}

		const employee = matches[0];

		if (typeof validator === 'function') {
			validator(employee, name);
		}

		return employee;
	});
}

async function createErrorReport(rows) {
	await fs.mkdir(ERROR_REPORT_DIR, { recursive: true });

	const workbook = new ExcelJS.Workbook();
	const worksheet = workbook.addWorksheet('Import Errors');
	worksheet.addRow([...IMPORT_HEADERS, 'Error Message']);

	rows.forEach((row) => {
		worksheet.addRow([
			row.raw['Nama Group Shift'] || '',
			row.raw.Foreman || '',
			row.raw.Karyawan || '',
			row.error,
		]);
	});

	const headerRow = worksheet.getRow(1);
	headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
	headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB71C1C' } };
	worksheet.columns = [
		{ width: 28 },
		{ width: 42 },
		{ width: 54 },
		{ width: 48 },
	];

	const fileName = `master-group-shift-import-errors-${randomUUID()}.xlsx`;
	const filePath = path.join(ERROR_REPORT_DIR, fileName);
	await workbook.xlsx.writeFile(filePath);

	return fileName;
}

router.get(
	'/import-template',
	withAsync(async (_req, res) => {
		const employees = await prisma.employee.findMany({
			include: {
				jobLevel: true,
			},
			orderBy: [{ fullName: 'asc' }, { id: 'asc' }],
		});

		const foremanNames = employees
			.filter((employee) => normalizeJobLevelName(employee.jobLevel?.name) === FOREMAN_JOB_LEVEL)
			.map((employee) => employee.fullName);
		const employeeNames = employees.map((employee) => employee.fullName);

		const workbook = new ExcelJS.Workbook();
		const dataSheet = workbook.addWorksheet('Data Import');
		const guideSheet = workbook.addWorksheet('Petunjuk');
		const referenceSheet = workbook.addWorksheet('Referensi');
		referenceSheet.state = 'veryHidden';

		dataSheet.columns = [
			{ header: 'Nama Group Shift', key: 'groupShiftName', width: 28 },
			{ header: 'Foreman', key: 'foremen', width: 42 },
			{ header: 'Karyawan', key: 'employees', width: 54 },
		];

		const instructions = [
			'Nama unik group shift',
			'Pisahkan banyak nama dengan tanda ;',
			'Pisahkan banyak nama dengan tanda ;',
		];

		const headerRow = dataSheet.getRow(1);
		headerRow.values = IMPORT_HEADERS;
		headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
		headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1565C0' } };
		headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
		dataSheet.getRow(2).values = instructions;
		dataSheet.getRow(2).font = { italic: true, color: { argb: 'FF546E7A' } };
		dataSheet.getRow(2).alignment = { vertical: 'top', wrapText: true };
		dataSheet.views = [{ state: 'frozen', ySplit: 2 }];
		dataSheet.autoFilter = {
			from: 'A1',
			to: 'C1',
		};

		referenceSheet.getCell('A1').value = 'Foreman';
		referenceSheet.getCell('B1').value = 'Karyawan';

		const normalizedForemanNames = foremanNames.length > 0 ? foremanNames : [''];
		const normalizedEmployeeNames = employeeNames.length > 0 ? employeeNames : [''];

		normalizedForemanNames.forEach((name, index) => {
			referenceSheet.getCell(`A${index + 2}`).value = name;
		});

		normalizedEmployeeNames.forEach((name, index) => {
			referenceSheet.getCell(`B${index + 2}`).value = name;
		});

		for (let rowNumber = 3; rowNumber <= TEMPLATE_MAX_ROWS + 2; rowNumber += 1) {
			['B', 'C'].forEach((column) => {
				dataSheet.getCell(`${column}${rowNumber}`).note = {
					texts: [
						{
							font: {
								bold: true,
							},
							text: 'Format multi nama:\n',
						},
						{
							text: 'Pisahkan setiap nama dengan tanda titik koma (;), contoh: ANDI; BUDI; CICI',
						},
					],
				};
			});
		}

		guideSheet.columns = [{ width: 120 }];
		[
			'Template resmi ini dibuat otomatis dari data master terbaru.',
			'Isi data mulai dari baris 3 pada sheet "Data Import".',
			'Baris 2 hanya berisi petunjuk dan tidak perlu diubah.',
			'Kolom Foreman wajib diisi minimal satu nama dan setiap nama dipisahkan dengan tanda ;.',
			'Kolom Karyawan boleh dikosongkan jika group shift belum punya anggota.',
			'Nama pada kolom Foreman dan Karyawan harus sama persis dengan nama di Master Karyawan.',
			'Satu karyawan hanya boleh muncul pada satu group shift di file import yang sama.',
			'Jika karyawan pada database sebelumnya terhubung ke group lain, assignment lama akan dipindahkan otomatis ke group baru saat row import berhasil diproses.',
			'Jika ada baris gagal saat import, sistem akan mengunduh file error report.',
		].forEach((text) => guideSheet.addRow([text]));

		guideSheet.getCell('A1').font = { bold: true };
		guideSheet.eachRow((row) => {
			row.alignment = { vertical: 'top', wrapText: true };
		});

		res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
		res.setHeader('Content-Disposition', 'attachment; filename="master-group-shift-import-template.xlsx"');

		await workbook.xlsx.write(res);
		return res.end();
	}),
);

router.post(
	'/import',
	upload.single('file'),
	withAsync(async (req, res) => {
		if (!req.file) {
			return res.status(400).json({ message: 'File Excel wajib dipilih.' });
		}

		const workbook = new ExcelJS.Workbook();
		await workbook.xlsx.load(req.file.buffer);
		const worksheet = workbook.getWorksheet('Data Import') || workbook.worksheets[0];

		if (!worksheet) {
			return res.status(400).json({ message: 'Sheet Excel tidak ditemukan.' });
		}

		const headerMap = new Map();
		worksheet.getRow(1).eachCell((cell, columnNumber) => {
			headerMap.set(normalizeString(cell.value), columnNumber);
		});

		const missingHeaders = IMPORT_HEADERS.filter((header) => !headerMap.has(header));
		if (missingHeaders.length > 0) {
			return res.status(400).json({
				message: `Template Excel tidak valid. Header tidak ditemukan: ${missingHeaders.join(', ')}`,
			});
		}

		const [employees, existingGroupShifts] = await Promise.all([
			prisma.employee.findMany({
				include: {
					jobLevel: true,
					groupShift: true,
				},
				orderBy: [{ fullName: 'asc' }, { id: 'asc' }],
			}),
			prisma.masterGroupShift.findMany({
				select: {
					id: true,
					groupShiftName: true,
				},
				orderBy: [{ groupShiftName: 'asc' }, { id: 'asc' }],
			}),
		]);

		const employeeLookup = buildEmployeeNameLookup(employees);
		const groupShiftLookup = existingGroupShifts.reduce((lookup, groupShift) => {
			const key = normalizeNameKey(groupShift.groupShiftName);
			const currentItems = lookup.get(key) || [];
			currentItems.push(groupShift);
			lookup.set(key, currentItems);
			return lookup;
		}, new Map());

		const importedRows = [];
		const errorRows = [];
		const seenGroupShiftNames = new Set();
		const seenEmployeeAssignments = new Map();

		for (let rowNumber = 3; rowNumber <= worksheet.rowCount; rowNumber += 1) {
			const row = worksheet.getRow(rowNumber);
			const raw = worksheetRowToPayload(row, headerMap);
			const isEmpty = IMPORT_HEADERS.every((header) => !normalizeString(raw[header] || ''));

			if (isEmpty) {
				continue;
			}

			try {
				const groupShiftName = normalizeString(raw['Nama Group Shift']);
				const groupShiftKey = normalizeNameKey(groupShiftName);

				if (!groupShiftName) {
					throw new Error('Nama Group Shift wajib diisi.');
				}

				if (seenGroupShiftNames.has(groupShiftKey)) {
					throw new Error(`Nama Group Shift "${groupShiftName}" duplikat pada file import.`);
				}

				seenGroupShiftNames.add(groupShiftKey);

				const existingMatches = groupShiftLookup.get(groupShiftKey) || [];
				if (existingMatches.length > 1) {
					throw new Error(
						`Nama Group Shift "${groupShiftName}" duplikat pada database. Rapikan data terlebih dahulu.`,
					);
				}

				const foremanNames = parseDelimitedCell(raw.Foreman);
				const employeeNames = parseDelimitedCell(raw.Karyawan);

				if (foremanNames.length === 0) {
					throw new Error('Minimal satu Foreman wajib diisi pada kolom Foreman.');
				}

				const foremen = resolveEmployeesByNames(foremanNames, employeeLookup, 'Foreman', (employee, name) => {
					if (normalizeJobLevelName(employee.jobLevel?.name) !== FOREMAN_JOB_LEVEL) {
						throw new Error(`Foreman "${name}" harus memiliki Job Level Foreman.`);
					}
				});
				const assignedEmployees = resolveEmployeesByNames(employeeNames, employeeLookup, 'Karyawan');

				assignedEmployees.forEach((employee) => {
					const existingAssignment = seenEmployeeAssignments.get(employee.id);

					if (existingAssignment && existingAssignment !== groupShiftName) {
						throw new Error(
							`Karyawan "${employee.fullName}" konflik lintas group pada file import (${existingAssignment} dan ${groupShiftName}).`,
						);
					}

					seenEmployeeAssignments.set(employee.id, groupShiftName);
				});

				const savedRecord = await prisma.$transaction((tx) =>
					saveGroupShift(
						tx,
						{
							groupShiftName,
							foremanIds: foremen.map((employee) => employee.id),
							employeeIds: assignedEmployees.map((employee) => employee.id),
						},
						existingMatches[0]?.id || null,
					),
				);

				importedRows.push(mapGroupShift(savedRecord));
			} catch (error) {
				errorRows.push({
					rowNumber,
					raw,
					error: error.message || 'Terjadi kesalahan saat memproses baris.',
				});
			}
		}

		if (errorRows.length > 0) {
			const fileName = await createErrorReport(errorRows);

			return res.json({
				message:
					importedRows.length > 0
						? 'Import selesai sebagian. Beberapa baris gagal diproses.'
						: 'Import gagal. Periksa file hasil error.',
				importedCount: importedRows.length,
				failedCount: errorRows.length,
				rows: importedRows,
				errorReportUrl: `/master/group-shifts/import-errors/${fileName}`,
			});
		}

		return res.json({
			message: 'Import Master Group Shift berhasil.',
			importedCount: importedRows.length,
			failedCount: 0,
			rows: importedRows,
			errorReportUrl: null,
		});
	}),
);

router.get(
	'/import-errors/:fileName',
	withAsync(async (req, res) => {
		const safeFileName = path.basename(req.params.fileName);
		const filePath = path.join(ERROR_REPORT_DIR, safeFileName);

		try {
			await fs.access(filePath);
		} catch {
			return res.status(404).json({ message: 'File error report tidak ditemukan.' });
		}

		return res.download(filePath, safeFileName);
	}),
);

router.get(
	'/',
	withAsync(async (_req, res) => {
		const records = await prisma.masterGroupShift.findMany({
			include: GROUP_SHIFT_INCLUDE,
			orderBy: {
				id: 'asc',
			},
		});

		return res.json(records.map(mapGroupShift));
	}),
);

router.get(
	'/:id',
	withAsync(async (req, res) => {
		const id = Number(req.params.id);

		if (Number.isNaN(id)) {
			return res.status(400).json({ message: 'ID tidak valid.' });
		}

		const record = await getGroupShiftOrThrow(prisma, id);
		return res.json(mapGroupShift(record));
	}),
);

router.post(
	'/',
	withAsync(async (req, res) => {
		const record = await prisma.$transaction((tx) => saveGroupShift(tx, req.body));
		return res.status(201).json(mapGroupShift(record));
	}),
);

router.put(
	'/:id',
	withAsync(async (req, res) => {
		const id = Number(req.params.id);

		if (Number.isNaN(id)) {
			return res.status(400).json({ message: 'ID tidak valid.' });
		}

		await getGroupShiftOrThrow(prisma, id);
		const record = await prisma.$transaction((tx) => saveGroupShift(tx, req.body, id));

		return res.json(mapGroupShift(record));
	}),
);

router.delete(
	'/:id',
	withAsync(async (req, res) => {
		const id = Number(req.params.id);

		if (Number.isNaN(id)) {
			return res.status(400).json({ message: 'ID tidak valid.' });
		}

		await getGroupShiftOrThrow(prisma, id);

		await prisma.$transaction(async (tx) => {
			await tx.employee.updateMany({
				where: {
					groupShiftId: id,
				},
				data: {
					groupShiftId: null,
				},
			});

			await tx.masterGroupShift.delete({
				where: { id },
			});
		});

		return res.status(204).send();
	}),
);

export default router;
