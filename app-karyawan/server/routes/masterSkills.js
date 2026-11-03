import { Router } from 'express';

import prisma from '../lib/prisma.js';
import requireSiteIsolation from '../middleware/requireSiteIsolation.js';

const router = Router();

router.use(requireSiteIsolation({ modelType: 'shared' }));

const SKILL_CATEGORIES = ['SOFT_SKILL', 'HARD_SKILL'];

function withAsync(handler) {
	return (req, res, next) => {
		Promise.resolve(handler(req, res, next)).catch(next);
	};
}

function normalizeString(value = '') {
	return String(value).trim().replace(/\s+/g, ' ');
}

function normalizeCategory(value = '') {
	const category = normalizeString(value).toUpperCase();

	if (!SKILL_CATEGORIES.includes(category)) {
		throw Object.assign(new Error('Kategori skill tidak valid.'), { statusCode: 400 });
	}

	return category;
}

function normalizeGrade(value = '') {
	return normalizeString(value).toUpperCase();
}

function parseId(value) {
	const parsed = Number(value);
	return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function skillKey(category, name) {
	return `${category}:${normalizeString(name).toLowerCase()}`;
}

function validateName(value) {
	const name = normalizeString(value);

	if (!name) {
		throw Object.assign(new Error('Nama skill wajib diisi.'), { statusCode: 400 });
	}

	if (name.length > 255) {
		throw Object.assign(new Error('Nama skill maksimal 255 karakter.'), { statusCode: 400 });
	}

	return name;
}

async function buildSkillUsage() {
	const [requirementGroups, assessmentGroups] = await Promise.all([
		prisma.jobRequirementSkill.groupBy({
			by: ['masterSkillId'],
			_count: { _all: true },
			where: { masterSkillId: { not: null } },
		}),
		prisma.employeeSkillAssessment.groupBy({
			by: ['category', 'skillName'],
			_count: { _all: true },
		}),
	]);

	const requirementCountById = new Map(
		requirementGroups.map((group) => [group.masterSkillId, group._count._all]),
	);
	const assessmentCountByKey = new Map(
		assessmentGroups.map((group) => [skillKey(group.category, group.skillName), group._count._all]),
	);

	return { requirementCountById, assessmentCountByKey };
}

function mapSkill(skill, usage) {
	return {
		id: skill.id,
		category: skill.category,
		name: skill.name,
		requirementCount: usage.requirementCountById.get(skill.id) || 0,
		assessmentCount: usage.assessmentCountByKey.get(skillKey(skill.category, skill.name)) || 0,
	};
}

async function getProfileOrThrow(grade) {
	const profile = await prisma.jobRequirementProfile.findUnique({ where: { grade } });

	if (!profile) {
		throw Object.assign(new Error('Profil job requirement untuk grade tersebut tidak ditemukan.'), {
			statusCode: 404,
		});
	}

	return profile;
}

async function buildMapping(grade) {
	const profile = await getProfileOrThrow(grade);
	const [skills, profileSkills] = await Promise.all([
		prisma.masterSkill.findMany({ orderBy: [{ category: 'asc' }, { name: 'asc' }] }),
		prisma.jobRequirementSkill.findMany({
			where: { profileId: profile.id },
			orderBy: { sortOrder: 'asc' },
		}),
	]);

	const requiredIds = new Set(profileSkills.map((skill) => skill.masterSkillId).filter(Boolean));
	const requiredKeys = new Set(profileSkills.map((skill) => skillKey(skill.category, skill.name)));

	return {
		grade: profile.grade,
		profileId: profile.id,
		skills: skills.map((skill) => ({
			id: skill.id,
			category: skill.category,
			name: skill.name,
			required:
				requiredIds.has(skill.id) || requiredKeys.has(skillKey(skill.category, skill.name)),
		})),
	};
}

router.get(
	'/',
	withAsync(async (_req, res) => {
		const [skills, usage] = await Promise.all([
			prisma.masterSkill.findMany({ orderBy: [{ category: 'asc' }, { name: 'asc' }] }),
			buildSkillUsage(),
		]);

		return res.json(skills.map((skill) => mapSkill(skill, usage)));
	}),
);

router.post(
	'/',
	withAsync(async (req, res) => {
		const category = normalizeCategory(req.body?.category);
		const name = validateName(req.body?.name);

		const existing = await prisma.masterSkill.findFirst({
			where: { category, name: { equals: name, mode: 'insensitive' } },
		});

		if (existing) {
			return res.status(409).json({ message: 'Skill dengan nama tersebut sudah ada di kategori ini.' });
		}

		const record = await prisma.masterSkill.create({ data: { category, name } });

		return res.status(201).json({
			id: record.id,
			category: record.category,
			name: record.name,
			requirementCount: 0,
			assessmentCount: 0,
		});
	}),
);

router.put(
	'/:id',
	withAsync(async (req, res) => {
		const id = parseId(req.params.id);

		if (!id) {
			return res.status(400).json({ message: 'ID tidak valid.' });
		}

		const existing = await prisma.masterSkill.findUnique({ where: { id } });

		if (!existing) {
			return res.status(404).json({ message: 'Skill tidak ditemukan.' });
		}

		const name = validateName(req.body?.name);

		if (name !== existing.name) {
			const duplicate = await prisma.masterSkill.findFirst({
				where: {
					category: existing.category,
					name: { equals: name, mode: 'insensitive' },
					NOT: { id },
				},
			});

			if (duplicate) {
				return res.status(409).json({ message: 'Skill dengan nama tersebut sudah ada di kategori ini.' });
			}

			await prisma.$transaction([
				prisma.masterSkill.update({ where: { id }, data: { name } }),
				prisma.jobRequirementSkill.updateMany({ where: { masterSkillId: id }, data: { name } }),
				prisma.employeeSkillAssessment.updateMany({
					where: { category: existing.category, skillName: existing.name },
					data: { skillName: name },
				}),
			]);
		}

		const [skills, usage] = await Promise.all([
			prisma.masterSkill.findMany({ orderBy: [{ category: 'asc' }, { name: 'asc' }] }),
			buildSkillUsage(),
		]);

		return res.json(mapSkill(skills.find((skill) => skill.id === id), usage));
	}),
);

router.delete(
	'/:id',
	withAsync(async (req, res) => {
		const id = parseId(req.params.id);

		if (!id) {
			return res.status(400).json({ message: 'ID tidak valid.' });
		}

		const existing = await prisma.masterSkill.findUnique({ where: { id } });

		if (!existing) {
			return res.status(404).json({ message: 'Skill tidak ditemukan.' });
		}

		const [requirementCount, assessmentCount] = await Promise.all([
			prisma.jobRequirementSkill.count({ where: { masterSkillId: id } }),
			prisma.employeeSkillAssessment.count({
				where: { category: existing.category, skillName: existing.name },
			}),
		]);

		if (requirementCount > 0 || assessmentCount > 0) {
			return res.status(409).json({
				message: `Skill tidak bisa dihapus. Dipakai di ${requirementCount} requirement grade dan memiliki ${assessmentCount} asesmen karyawan. Hapus asesmen lebih dulu lewat menu baris "Hapus Asesmen".`,
			});
		}

		await prisma.masterSkill.delete({ where: { id } });

		return res.status(204).send();
	}),
);

router.delete(
	'/:id/assessments',
	withAsync(async (req, res) => {
		const id = parseId(req.params.id);

		if (!id) {
			return res.status(400).json({ message: 'ID tidak valid.' });
		}

		const existing = await prisma.masterSkill.findUnique({ where: { id } });

		if (!existing) {
			return res.status(404).json({ message: 'Skill tidak ditemukan.' });
		}

		const result = await prisma.employeeSkillAssessment.deleteMany({
			where: { category: existing.category, skillName: existing.name },
		});

		return res.json({ deleted: result.count, skillName: existing.name });
	}),
);

router.get(
	'/mapping/:grade',
	withAsync(async (req, res) => {
		const grade = normalizeGrade(req.params.grade);
		const mapping = await buildMapping(grade);

		return res.json(mapping);
	}),
);

router.put(
	'/mapping/:grade',
	withAsync(async (req, res) => {
		const grade = normalizeGrade(req.params.grade);
		const category = normalizeCategory(req.body?.category);
		const profile = await getProfileOrThrow(grade);

		const rawIds = Array.isArray(req.body?.masterSkillIds) ? req.body.masterSkillIds : [];
		const selectedIds = [
			...new Set(
				rawIds.map((value) => Number(value)).filter((value) => Number.isInteger(value) && value > 0),
			),
		];

		const selectedSkills =
			selectedIds.length > 0
				? await prisma.masterSkill.findMany({
						where: { id: { in: selectedIds } },
				  })
				: [];

		if (selectedSkills.length !== selectedIds.length) {
			return res.status(400).json({ message: 'Sebagian skill tidak ditemukan di katalog.' });
		}

		const wrongCategory = selectedSkills.find((skill) => skill.category !== category);

		if (wrongCategory) {
			return res.status(400).json({
				message: `Skill "${wrongCategory.name}" bukan kategori ${category}.`,
			});
		}

		const currentRows = await prisma.jobRequirementSkill.findMany({
			where: { profileId: profile.id, category },
		});
		const selectedSet = new Set(selectedIds);
		const toRemove = currentRows.filter(
			(row) => !row.masterSkillId || !selectedSet.has(row.masterSkillId),
		);

		for (const row of toRemove) {
			const assessmentCount = await prisma.employeeSkillAssessment.count({
				where: { category, skillName: row.name },
			});

			if (assessmentCount > 0) {
				return res.status(409).json({
					message: `Skill "${row.name}" tidak bisa dilepas dari grade ini karena sudah memiliki ${assessmentCount} asesmen karyawan. Hapus asesmen lebih dulu lewat menu baris "Hapus Asesmen".`,
				});
			}
		}

		const currentByMasterId = new Map(
			currentRows.filter((row) => row.masterSkillId).map((row) => [row.masterSkillId, row]),
		);

		await prisma.$transaction(async (tx) => {
			if (toRemove.length > 0) {
				await tx.jobRequirementSkill.deleteMany({
					where: { id: { in: toRemove.map((row) => row.id) } },
				});
			}

			let sortOrder = currentRows.length;

			for (const skill of selectedSkills) {
				if (currentByMasterId.has(skill.id)) {
					continue;
				}

				await tx.jobRequirementSkill.create({
					data: {
						profileId: profile.id,
						category,
						name: skill.name,
						masterSkillId: skill.id,
						sortOrder,
					},
				});

				sortOrder += 1;
			}
		});

		const mapping = await buildMapping(grade);

		return res.json(mapping);
	}),
);

export default router;
