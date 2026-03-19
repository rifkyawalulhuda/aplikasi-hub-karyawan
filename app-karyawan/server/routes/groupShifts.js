import { Router } from 'express';

import prisma from '../lib/prisma.js';

const router = Router();

function withAsync(handler) {
	return (req, res, next) => {
		Promise.resolve(handler(req, res, next)).catch(next);
	};
}

function normalizeString(value = '') {
	return String(value).trim().replace(/\s+/g, ' ');
}

function mapGroupShift(record) {
	const foremen = record.foremen.map((assignment) => ({
		id: assignment.employee.id,
		employeeNo: assignment.employee.employeeNo,
		fullName: assignment.employee.fullName,
		jobLevelName: assignment.employee.jobLevel.name,
	}));

	return {
		id: record.id,
		groupShiftName: record.groupShiftName,
		foremanIds: foremen.map((item) => item.id),
		foremen,
		foremanNames: foremen.map((item) => item.fullName).join(', '),
	};
}

async function getGroupShiftOrThrow(id) {
	const record = await prisma.masterGroupShift.findUnique({
		where: { id },
		include: {
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
		},
	});

	if (!record) {
		throw Object.assign(new Error('Master Group Shift tidak ditemukan.'), { statusCode: 404 });
	}

	return record;
}

async function validatePayload(payload = {}) {
	const groupShiftName = normalizeString(payload.groupShiftName);
	const rawForemanIds = Array.isArray(payload.foremanIds) ? payload.foremanIds : [];
	const foremanIds = [
		...new Set(rawForemanIds.map((value) => Number(value)).filter((value) => Number.isInteger(value))),
	];

	if (!groupShiftName) {
		throw Object.assign(new Error('Nama Group Shift wajib diisi.'), { statusCode: 400 });
	}

	if (foremanIds.length === 0) {
		throw Object.assign(new Error('Minimal satu Foreman wajib dipilih.'), { statusCode: 400 });
	}

	const employees = await prisma.employee.findMany({
		where: {
			id: {
				in: foremanIds,
			},
		},
		include: {
			jobLevel: true,
		},
	});

	if (employees.length !== foremanIds.length) {
		throw Object.assign(new Error('Data Foreman yang dipilih tidak ditemukan.'), { statusCode: 400 });
	}

	const invalidEmployees = employees.filter(
		(employee) => normalizeString(employee.jobLevel.name).toLowerCase() !== 'foreman',
	);

	if (invalidEmployees.length > 0) {
		throw Object.assign(new Error('Foreman yang dipilih harus memiliki Jabatan "Foreman".'), {
			statusCode: 400,
		});
	}

	return {
		groupShiftName,
		foremanIds,
	};
}

router.get(
	'/',
	withAsync(async (_req, res) => {
		const records = await prisma.masterGroupShift.findMany({
			include: {
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
			},
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

		const record = await getGroupShiftOrThrow(id);
		return res.json(mapGroupShift(record));
	}),
);

router.post(
	'/',
	withAsync(async (req, res) => {
		const data = await validatePayload(req.body);
		const record = await prisma.masterGroupShift.create({
			data: {
				groupShiftName: data.groupShiftName,
				foremen: {
					create: data.foremanIds.map((employeeId) => ({
						employeeId,
					})),
				},
			},
			include: {
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
			},
		});

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

		await getGroupShiftOrThrow(id);
		const data = await validatePayload(req.body);

		const record = await prisma.masterGroupShift.update({
			where: { id },
			data: {
				groupShiftName: data.groupShiftName,
				foremen: {
					deleteMany: {},
					create: data.foremanIds.map((employeeId) => ({
						employeeId,
					})),
				},
			},
			include: {
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
			},
		});

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

		await getGroupShiftOrThrow(id);
		await prisma.masterGroupShift.delete({
			where: { id },
		});

		return res.status(204).send();
	}),
);

export default router;
