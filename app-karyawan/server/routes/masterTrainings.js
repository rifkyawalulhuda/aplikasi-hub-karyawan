import { Router } from 'express';

import prisma from '../lib/prisma.js';
import requireSiteIsolation from '../middleware/requireSiteIsolation.js';

const router = Router();

router.use(requireSiteIsolation({ modelType: 'shared' }));

function withAsync(handler) {
	return (req, res, next) => {
		Promise.resolve(handler(req, res, next)).catch(next);
	};
}

function normalizeString(value = '') {
	return String(value).trim().replace(/\s+/g, ' ');
}

function normalizeGrade(value = '') {
	return normalizeString(value).toUpperCase();
}

function formatGradeLabel(grade = '') {
	const match = String(grade).match(/^RANK_(\d+)$/);
	return match ? `Rank ${match[1]}` : String(grade || '');
}

function parseId(value) {
	const parsed = Number(value);
	return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function mapTraining(record) {
	return {
		id: record.id,
		name: record.name,
		category: record.category || '',
		requirementCount: record._count?.jobRequirementTrainings ?? 0,
		trainingCount: record._count?.employeeTrainings ?? 0,
		skillMapCount: record._count?.skillMaps ?? 0,
	};
}

const TRAINING_USAGE_COUNT_SELECT = {
	jobRequirementTrainings: true,
	employeeTrainings: true,
	skillMaps: true,
};

function validatePayload(payload = {}) {
	const name = normalizeString(payload.name);
	const category = normalizeString(payload.category) || null;

	if (!name) {
		throw Object.assign(new Error('Nama training wajib diisi.'), { statusCode: 400 });
	}

	if (name.length > 255) {
		throw Object.assign(new Error('Nama training maksimal 255 karakter.'), { statusCode: 400 });
	}

	return { name, category };
}

async function getRequirementContext(grade) {
	const profile = await prisma.jobRequirementProfile.findUnique({ where: { grade } });

	if (!profile) {
		throw Object.assign(new Error('Profil job requirement untuk grade tersebut tidak ditemukan.'), {
			statusCode: 404,
		});
	}

	const [trainings, links] = await Promise.all([
		prisma.masterTraining.findMany({ orderBy: [{ category: 'asc' }, { name: 'asc' }] }),
		prisma.jobRequirementTraining.findMany({
			where: { profileId: profile.id },
			orderBy: { sortOrder: 'asc' },
			select: { masterTrainingId: true },
		}),
	]);

	return {
		profile,
		trainings,
		selectedIds: links.map((link) => link.masterTrainingId),
	};
}

router.get(
	'/',
	withAsync(async (_req, res) => {
		const records = await prisma.masterTraining.findMany({
			include: { _count: { select: TRAINING_USAGE_COUNT_SELECT } },
			orderBy: [{ category: 'asc' }, { name: 'asc' }],
		});

		return res.json(records.map(mapTraining));
	}),
);

router.post(
	'/',
	withAsync(async (req, res) => {
		const data = validatePayload(req.body);
		const record = await prisma.masterTraining.create({
			data,
			include: { _count: { select: TRAINING_USAGE_COUNT_SELECT } },
		});

		return res.status(201).json(mapTraining(record));
	}),
);

router.put(
	'/:id',
	withAsync(async (req, res) => {
		const id = parseId(req.params.id);

		if (!id) {
			return res.status(400).json({ message: 'ID tidak valid.' });
		}

		const existing = await prisma.masterTraining.findUnique({ where: { id } });

		if (!existing) {
			return res.status(404).json({ message: 'Master training tidak ditemukan.' });
		}

		const data = validatePayload(req.body);
		const record = await prisma.masterTraining.update({
			where: { id },
			data,
			include: { _count: { select: TRAINING_USAGE_COUNT_SELECT } },
		});

		return res.json(mapTraining(record));
	}),
);

router.delete(
	'/:id',
	withAsync(async (req, res) => {
		const id = parseId(req.params.id);

		if (!id) {
			return res.status(400).json({ message: 'ID tidak valid.' });
		}

		const existing = await prisma.masterTraining.findUnique({
			where: { id },
			include: { _count: { select: TRAINING_USAGE_COUNT_SELECT } },
		});

		if (!existing) {
			return res.status(404).json({ message: 'Master training tidak ditemukan.' });
		}

		const usedInGrades = existing._count.jobRequirementTrainings;
		const usedInSkillMaps = existing._count.skillMaps;
		const usedInRecords = existing._count.employeeTrainings;

		if (usedInGrades > 0 || usedInSkillMaps > 0 || usedInRecords > 0) {
			const parts = [];

			if (usedInGrades > 0) {
				parts.push(`${usedInGrades} syarat grade`);
			}

			if (usedInSkillMaps > 0) {
				parts.push(`${usedInSkillMaps} pemetaan skill`);
			}

			if (usedInRecords > 0) {
				parts.push(`${usedInRecords} riwayat pelatihan karyawan`);
			}

			return res.status(409).json({
				message: `Training "${existing.name}" tidak bisa dihapus karena masih dipakai di ${parts.join(
					', ',
				)}. Lepaskan pemakaian tersebut terlebih dahulu.`,
			});
		}

		await prisma.masterTraining.delete({ where: { id } });

		return res.status(204).send();
	}),
);

router.get(
	'/:id/usage',
	withAsync(async (req, res) => {
		const id = parseId(req.params.id);

		if (!id) {
			return res.status(400).json({ message: 'ID tidak valid.' });
		}

		const training = await prisma.masterTraining.findUnique({
			where: { id },
			include: {
				jobRequirementTrainings: {
					include: { profile: { select: { grade: true } } },
					orderBy: { sortOrder: 'asc' },
				},
				skillMaps: {
					include: { masterSkill: { select: { id: true, category: true, name: true } } },
				},
			},
		});

		if (!training) {
			return res.status(404).json({ message: 'Master training tidak ditemukan.' });
		}

		const [employeeTrainingCount, participantCount] = await Promise.all([
			prisma.employeeTraining.count({ where: { masterTrainingId: id } }),
			prisma.employeeTrainingParticipant.count({
				where: { employeeTraining: { masterTrainingId: id }, employeeId: { not: null } },
			}),
		]);

		return res.json({
			id: training.id,
			name: training.name,
			category: training.category || '',
			requirementGrades: training.jobRequirementTrainings.map((row) => ({
				grade: row.profile.grade,
				gradeLabel: formatGradeLabel(row.profile.grade),
			})),
			skillMaps: training.skillMaps.map((map) => ({
				id: map.masterSkill.id,
				category: map.masterSkill.category,
				name: map.masterSkill.name,
			})),
			employeeTrainingCount,
			participantCount,
		});
	}),
);

router.get(
	'/requirement-map/:grade',
	withAsync(async (req, res) => {
		const grade = normalizeGrade(req.params.grade);
		const { profile, trainings, selectedIds } = await getRequirementContext(grade);

		return res.json({
			grade: profile.grade,
			profileId: profile.id,
			trainings: trainings.map((training) => ({
				id: training.id,
				name: training.name,
				category: training.category || '',
			})),
			selectedIds,
		});
	}),
);

router.put(
	'/requirement-map/:grade',
	withAsync(async (req, res) => {
		const grade = normalizeGrade(req.params.grade);
		const { profile } = await getRequirementContext(grade);

		const rawIds = Array.isArray(req.body?.masterTrainingIds) ? req.body.masterTrainingIds : [];
		const selectedIds = [...new Set(rawIds.map((value) => Number(value)).filter((value) => Number.isInteger(value) && value > 0))];

		if (selectedIds.length > 0) {
			const found = await prisma.masterTraining.findMany({
				where: { id: { in: selectedIds } },
				select: { id: true },
			});

			if (found.length !== selectedIds.length) {
				return res.status(400).json({ message: 'Sebagian master training tidak ditemukan.' });
			}
		}

		await prisma.$transaction([
			prisma.jobRequirementTraining.deleteMany({ where: { profileId: profile.id } }),
			...(selectedIds.length > 0
				? [
						prisma.jobRequirementTraining.createMany({
							data: selectedIds.map((masterTrainingId, index) => ({
								profileId: profile.id,
								masterTrainingId,
								sortOrder: index,
							})),
						}),
				  ]
				: []),
		]);

		const { trainings, selectedIds: savedIds } = await getRequirementContext(grade);

		return res.json({
			grade: profile.grade,
			profileId: profile.id,
			trainings: trainings.map((training) => ({
				id: training.id,
				name: training.name,
				category: training.category || '',
			})),
			selectedIds: savedIds,
		});
	}),
);

export default router;
