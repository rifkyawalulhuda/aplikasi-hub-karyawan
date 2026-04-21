import { Router } from 'express';

import prisma from '../lib/prisma.js';
import {
	mapEmailWorkflowFailureLog,
	resolveEmailWorkflowFailureLog,
} from '../lib/emailWorkflowFailureLog.js';

const router = Router();
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

function withAsync(handler) {
	return (req, res, next) => {
		Promise.resolve(handler(req, res, next)).catch(next);
	};
}

function normalizeString(value = '') {
	return String(value).trim().replace(/\s+/g, ' ');
}

function parsePositiveInt(value, fallback, maxValue = Infinity) {
	const parsed = Number.parseInt(value, 10);

	if (!Number.isFinite(parsed) || parsed <= 0) {
		return fallback;
	}

	return Math.min(parsed, maxValue);
}

function normalizeStatus(value = 'all') {
	const normalized = normalizeString(value).toLowerCase();
	return ['all', 'open', 'resolved'].includes(normalized) ? normalized : 'all';
}

function resolveEmployeeId(req, payload = {}) {
	const fromBody = Number(payload.employeeId);
	const fromQuery = Number(req.query.employeeId);
	const fromHeader = Number(req.headers['x-admin-employee-id']);
	const candidate = [fromBody, fromQuery, fromHeader].find((value) => Number.isInteger(value));

	if (!Number.isInteger(candidate)) {
		throw Object.assign(new Error('employeeId admin wajib dikirim.'), { statusCode: 400 });
	}

	return candidate;
}

function buildWhereClause(query = {}) {
	const status = normalizeStatus(query.status);
	const keyword = normalizeString(query.keyword);
	const where = {};

	if (status === 'open') {
		where.status = 'OPEN';
	} else if (status === 'resolved') {
		where.status = 'RESOLVED';
	}

	if (keyword) {
		where.OR = [
			{ event: { contains: keyword, mode: 'insensitive' } },
			{ entityType: { contains: keyword, mode: 'insensitive' } },
			{ recipientEmail: { contains: keyword, mode: 'insensitive' } },
			{ recipientName: { contains: keyword, mode: 'insensitive' } },
			{ subject: { contains: keyword, mode: 'insensitive' } },
			{ errorMessage: { contains: keyword, mode: 'insensitive' } },
			{
				employeeLeave: {
					is: {
						requestNumber: {
							contains: keyword,
							mode: 'insensitive',
						},
					},
				},
			},
			{
				employeeLeaveApproval: {
					is: {
						approverEmployee: {
							is: {
								fullName: {
									contains: keyword,
									mode: 'insensitive',
								},
							},
						},
					},
				},
			},
		];
	}

	return where;
}

router.get(
	'/',
	withAsync(async (req, res) => {
		resolveEmployeeId(req);
		const page = parsePositiveInt(req.query.page, 1);
		const pageSize = parsePositiveInt(req.query.pageSize, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
		const where = buildWhereClause(req.query);

		const [records, totalCount, openCount, resolvedCount] = await Promise.all([
			prisma.emailWorkflowFailureLog.findMany({
				where,
				include: {
					employeeLeave: {
						include: {
							employee: true,
						},
					},
					employeeLeaveApproval: {
						include: {
							approverEmployee: true,
							employeeLeave: {
								include: {
									employee: true,
								},
							},
						},
					},
					resolvedByEmployee: true,
				},
				orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
				skip: (page - 1) * pageSize,
				take: pageSize,
			}),
			prisma.emailWorkflowFailureLog.count({ where }),
			prisma.emailWorkflowFailureLog.count({
				where: {
					...where,
					status: 'OPEN',
				},
			}),
			prisma.emailWorkflowFailureLog.count({
				where: {
					...where,
					status: 'RESOLVED',
				},
			}),
		]);

		return res.json({
			totalCount,
			openCount,
			resolvedCount,
			page,
			pageSize,
			totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
			items: records.map(mapEmailWorkflowFailureLog),
		});
	}),
);

router.get(
	'/:id',
	withAsync(async (req, res) => {
		resolveEmployeeId(req);
		const id = Number(req.params.id);

		if (Number.isNaN(id)) {
			return res.status(400).json({ message: 'ID tidak valid.' });
		}

		const record = await prisma.emailWorkflowFailureLog.findUnique({
			where: { id },
			include: {
				employeeLeave: {
					include: {
						employee: true,
						approvals: {
							include: {
								approverEmployee: true,
							},
						},
					},
				},
				employeeLeaveApproval: {
					include: {
						approverEmployee: true,
						employeeLeave: {
							include: {
								employee: true,
								approvals: {
									include: {
										approverEmployee: true,
									},
								},
							},
						},
					},
				},
				resolvedByEmployee: true,
			},
		});

		if (!record) {
			return res.status(404).json({ message: 'Log kegagalan email workflow tidak ditemukan.' });
		}

		return res.json({
			failureLog: mapEmailWorkflowFailureLog(record),
		});
	}),
);

router.post(
	'/:id/resolve',
	withAsync(async (req, res) => {
		const id = Number(req.params.id);

		if (Number.isNaN(id)) {
			return res.status(400).json({ message: 'ID tidak valid.' });
		}

		const resolvedByEmployeeId = resolveEmployeeId(req, req.body);
		const resolvedNote = normalizeString(req.body?.note || '');
		await resolveEmailWorkflowFailureLog(prisma, id, {
			resolvedByEmployeeId,
			resolvedNote,
		});

		const record = await prisma.emailWorkflowFailureLog.findUnique({
			where: { id },
			include: {
				employeeLeave: {
					include: {
						employee: true,
						approvals: {
							include: {
								approverEmployee: true,
							},
						},
					},
				},
				employeeLeaveApproval: {
					include: {
						approverEmployee: true,
						employeeLeave: {
							include: {
								employee: true,
								approvals: {
									include: {
										approverEmployee: true,
									},
								},
							},
						},
					},
				},
				resolvedByEmployee: true,
			},
		});

		return res.json({
			message: 'Log kegagalan email workflow berhasil di-resolve.',
			failureLog: mapEmailWorkflowFailureLog(record),
		});
	}),
);

export default router;
