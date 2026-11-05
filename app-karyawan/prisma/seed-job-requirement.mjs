import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SOURCE_FORM_NO = 'SII-QSHE-002-03';
const SOURCE_NOTE = 'Seed awal dari form SII-QSHE-002-03. Matriks centang perlu diverifikasi HR sebelum dipakai produksi.';

const SOFT_SKILL = 'SOFT_SKILL';
const HARD_SKILL = 'HARD_SKILL';

const SOFT_FULL = [
	'Berpikir Kreatif',
	'Berpikir Kritis',
	'Kerjasama Tim',
	'Negosiasi',
	'Presentasi',
	'Empati',
	'Kepemimpinan',
	'Adaptif',
	'Manajemen Waktu',
	'Motivasi Diri',
	'Networking',
	'Berpikir Analitis',
	'Berpikir Inovatif',
	'Problem Solving',
	'Rasa Ingin Tahu',
	'Flexibility',
	'Pengambil Keputusan',
];

const HARD_LEADERSHIP = [
	'Kemampuan Bahasa Asing',
	'Inggris',
	'Microsoft Office',
	'Word',
	'Excel',
	'PowerPoint',
	'Pengetahuan Umum',
	'Keterampilan Menulis',
	'Analisa Data',
	'Project Management',
];

const HARD_LEADERSHIP_NO_ENGLISH = [
	'Microsoft Office',
	'Word',
	'Excel',
	'PowerPoint',
	'Pengetahuan Umum',
	'Keterampilan Menulis',
	'Analisa Data',
	'Project Management',
];

const TRAINING_ADVANCE_LEADERSHIP = [
	{ name: 'Developing Others Via Learning', category: 'Advance Leadership' },
	{ name: 'Driving Performance with Coaching', category: 'Advance Leadership' },
	{ name: 'Leading Corporate Transformation', category: 'Advance Leadership' },
	{ name: 'Strategic Decision Making', category: 'Integration Thinking' },
];

const TRAINING_DEVELOPING_LEADERSHIP = [
	{ name: 'Developing Leadership Skill', category: 'Developing Leadership' },
	{ name: 'Coaching For Optimal Performance', category: 'Developing Leadership' },
	{ name: 'Building High Performance Team', category: 'Developing Leadership' },
	{ name: 'Enhancing Delegation Skill', category: 'Developing Leadership' },
	{ name: 'Analytical and Creative Thinking for Problem Solving', category: 'Integration Thinking' },
];

const TRAINING_DEVELOPING_KNOWLEDGE = [
	{ name: 'Advanced Management System', category: 'Developing Knowledge' },
	{ name: 'Professionalism Work Ethics', category: 'Developing Knowledge' },
	{ name: 'Business Communication Skill', category: 'Developing Knowledge' },
];

const TRAINING_BASIC_LEADERSHIP_FULL = [
	{ name: 'Basic Management System', category: 'Basic Leadership Training' },
	{ name: 'Team Work Leadership', category: 'Basic Leadership Training' },
	{ name: 'Effective Management', category: 'Basic Leadership Training' },
	{ name: 'Building Great Team Work', category: 'Basic Leadership Training' },
	{ name: 'Metode Riset', category: 'Integration Thinking' },
	{ name: 'Planning and Organizing', category: 'Integration Thinking' },
];

const TRAINING_BASIC_LEADERSHIP_SHORT = [
	{ name: 'Basic Management System', category: 'Basic Leadership Training' },
	{ name: 'Interpersonal Skill', category: 'Basic Leadership Training' },
	{ name: 'Basic Communication Skill', category: 'Basic Leadership Training' },
];

const TRAINING_AWARENESS_MANAGEMENT = [
	{ name: 'Sistem Manajemen Keselamatan (K3)', category: 'Awareness Management System' },
	{ name: 'Sistem Manajemen Lingkungan', category: 'Awareness Management System' },
	{ name: 'Sistem Manajemen Mutu', category: 'Awareness Management System' },
	{ name: 'Sistem Manajemen Anti Penyuapan', category: 'Awareness Management System' },
	{ name: 'Service Excellent', category: 'Service Excellent' },
];

const TRAINING_ORIENTASI = [
	{ name: 'Induction', category: 'Orientasi Training' },
	{ name: 'Pengenalan Profil Perusahaan', category: 'Orientasi Training' },
	{ name: 'Peraturan Perusahaan dan Kode Etik', category: 'Orientasi Training' },
	{ name: 'Pengenalan Bisnis Unit', category: 'Orientasi Training' },
	{ name: 'Informasi Pekerjaan / Lingkungan Kerja', category: 'Orientasi Training' },
	{ name: 'Safety and Health', category: 'Orientasi Training' },
	{ name: 'Payroll dan Pajak PPh 21', category: 'Orientasi Training' },
	{ name: 'BPJS dan Asuransi Kesehatan', category: 'Orientasi Training' },
	{ name: 'Service Excellent', category: 'Service Excellent' },
];

const COMPETENCY_BASE = [
	{ name: 'Sistem Manajemen', category: 'Kompetensi Dasar' },
	{ name: 'ISO 37001:2016', category: 'Sistem Manajemen' },
	{ name: 'ISO 45001:2018', category: 'Sistem Manajemen' },
	{ name: 'ISO 14001:2015', category: 'Sistem Manajemen' },
	{ name: 'ISO 9001:2015', category: 'Sistem Manajemen' },
];

const COMPETENCY_FULL = [
	{ name: 'Behaviour Based Safety', category: 'Leadership Training' },
	...COMPETENCY_BASE,
	{ name: 'Training for Trainer', category: 'Leadership Training' },
	{ name: 'Problem Solving Training', category: 'Leadership Training' },
];

const COMPETENCY_MID = [
	{ name: 'Behaviour Based Safety', category: 'Leadership Training' },
	...COMPETENCY_BASE,
];

const COMPETENCY_BASIC = [{ name: 'Behaviour Based Safety', category: 'Leadership Training' }];

const PROFILES = [
	{
		grade: 'RANK_11',
		name: 'General Manager',
		minEducation: 'S1',
		minExperienceYears: 10,
		soft: SOFT_FULL,
		hard: HARD_LEADERSHIP,
		trainings: [...COMPETENCY_BASE, ...TRAINING_ADVANCE_LEADERSHIP],
		sourceRev: '01',
		effectiveDate: '2024-08-01',
	},
	{
		grade: 'RANK_10',
		name: 'Deputy General Manager',
		minEducation: 'S1',
		minExperienceYears: 10,
		soft: SOFT_FULL,
		hard: HARD_LEADERSHIP,
		trainings: [...COMPETENCY_BASE, ...TRAINING_ADVANCE_LEADERSHIP],
		sourceRev: '00',
		effectiveDate: '2024-04-01',
	},
	{
		grade: 'RANK_9',
		name: 'Division Manager',
		minEducation: 'D3',
		minExperienceYears: 10,
		soft: SOFT_FULL,
		hard: HARD_LEADERSHIP,
		trainings: [...COMPETENCY_FULL, ...TRAINING_ADVANCE_LEADERSHIP],
		sourceRev: '00',
		effectiveDate: '2024-04-01',
	},
	{
		grade: 'RANK_8',
		name: 'Deputy Division Manager',
		minEducation: 'D3',
		minExperienceYears: 10,
		soft: [...SOFT_FULL, 'Interpersonal Skills'],
		hard: HARD_LEADERSHIP,
		trainings: [...COMPETENCY_FULL, ...TRAINING_ADVANCE_LEADERSHIP],
		sourceRev: '00',
		effectiveDate: '2024-04-01',
	},
	{
		grade: 'RANK_7',
		name: 'Department Manager',
		minEducation: 'D3',
		minExperienceYears: 10,
		soft: [...SOFT_FULL, 'Interpersonal Skills'],
		hard: HARD_LEADERSHIP,
		trainings: [...COMPETENCY_FULL, ...TRAINING_ADVANCE_LEADERSHIP],
		sourceRev: '00',
		effectiveDate: '2024-04-01',
	},
	{
		grade: 'RANK_6',
		name: 'Deputy Department Manager',
		minEducation: 'D3',
		minExperienceYears: 5,
		soft: [...SOFT_FULL, 'Interpersonal Skills'],
		hard: HARD_LEADERSHIP,
		trainings: [...COMPETENCY_FULL, ...TRAINING_DEVELOPING_LEADERSHIP],
		sourceRev: '00',
		effectiveDate: '2024-04-01',
	},
	{
		grade: 'RANK_5',
		name: 'Section Chief',
		minEducation: 'D3',
		minExperienceYears: 5,
		soft: [...SOFT_FULL, 'Interpersonal Skills'],
		hard: HARD_LEADERSHIP,
		trainings: [...COMPETENCY_FULL, ...TRAINING_DEVELOPING_KNOWLEDGE],
		sourceRev: '00',
		effectiveDate: '2024-04-01',
	},
	{
		grade: 'RANK_4',
		name: 'General Foreman / Senior Staff',
		minEducation: 'SMA',
		minExperienceYears: 5,
		soft: [...SOFT_FULL, 'Interpersonal Skills'],
		hard: HARD_LEADERSHIP,
		trainings: [...COMPETENCY_MID, ...TRAINING_BASIC_LEADERSHIP_FULL],
		sourceRev: '00',
		effectiveDate: '2024-04-01',
	},
	{
		grade: 'RANK_3',
		name: 'Foreman / Junior Staff',
		minEducation: 'SMA',
		minExperienceYears: 5,
		soft: [...SOFT_FULL, 'Interpersonal Skills'],
		hard: HARD_LEADERSHIP_NO_ENGLISH,
		trainings: [...COMPETENCY_MID, ...TRAINING_BASIC_LEADERSHIP_SHORT],
		sourceRev: '00',
		effectiveDate: '2024-04-01',
	},
	{
		grade: 'RANK_2',
		name: 'Skill Worker',
		minEducation: 'SMA',
		minExperienceYears: 1,
		soft: [
			'Berpikir Kreatif',
			'Kerjasama Tim',
			'Empati',
			'Motivasi Diri',
			'Berpikir Inovatif',
			'Rasa Ingin Tahu',
			'Flexibility',
		],
		hard: ['Microsoft Office', 'Word', 'Excel', 'Pengetahuan Umum'],
		trainings: [...COMPETENCY_BASIC, ...TRAINING_AWARENESS_MANAGEMENT],
		sourceRev: '00',
		effectiveDate: '2024-04-01',
	},
	{
		grade: 'RANK_1',
		name: 'General Worker',
		minEducation: 'SMA',
		minExperienceYears: 0,
		soft: ['Berpikir Kreatif', 'Empati', 'Motivasi Diri', 'Berpikir Inovatif', 'Rasa Ingin Tahu', 'Flexibility'],
		hard: ['Pengetahuan Umum'],
		trainings: [...COMPETENCY_BASIC, ...TRAINING_ORIENTASI],
		sourceRev: '00',
		effectiveDate: '2024-04-01',
	},
];

function buildTrainingCatalog() {
	const catalog = new Map();

	PROFILES.forEach((profile) => {
		profile.trainings.forEach((training) => {
			if (!catalog.has(training.name)) {
				catalog.set(training.name, training);
			}
		});
	});

	return [...catalog.values()];
}

async function seedMasterTrainings() {
	const catalog = buildTrainingCatalog();
	const ids = new Map();

	for (const training of catalog) {
		const record = await prisma.masterTraining.upsert({
			where: { name: training.name },
			update: { category: training.category },
			create: { name: training.name, category: training.category },
		});

		ids.set(training.name, record.id);
	}

	return ids;
}

function buildSkillCatalog() {
	const catalog = new Map();

	PROFILES.forEach((profile) => {
		profile.soft.forEach((name) => {
			catalog.set(`${SOFT_SKILL}:${name}`, { category: SOFT_SKILL, name });
		});
		profile.hard.forEach((name) => {
			catalog.set(`${HARD_SKILL}:${name}`, { category: HARD_SKILL, name });
		});
	});

	return [...catalog.values()];
}

async function seedMasterSkills() {
	const catalog = buildSkillCatalog();
	const ids = new Map();

	for (const skill of catalog) {
		const record = await prisma.masterSkill.upsert({
			where: { category_name: { category: skill.category, name: skill.name } },
			update: {},
			create: { category: skill.category, name: skill.name },
		});

		ids.set(`${skill.category}:${skill.name}`, record.id);
	}

	return ids;
}

async function seedProfiles(trainingIds, skillIds) {
	for (const profile of PROFILES) {
		const savedProfile = await prisma.jobRequirementProfile.upsert({
			where: { grade: profile.grade },
			update: {
				minEducation: profile.minEducation,
				minExperienceYears: profile.minExperienceYears,
				allowedEmploymentTypes: ['PERMANENT', 'CONTRACT'],
				allowedGenders: ['MALE', 'FEMALE'],
				sourceFormNo: SOURCE_FORM_NO,
				sourceRev: profile.sourceRev,
				effectiveDate: new Date(`${profile.effectiveDate}T00:00:00.000Z`),
				notes: `${profile.name}. ${SOURCE_NOTE}`,
			},
			create: {
				grade: profile.grade,
				minEducation: profile.minEducation,
				minExperienceYears: profile.minExperienceYears,
				allowedEmploymentTypes: ['PERMANENT', 'CONTRACT'],
				allowedGenders: ['MALE', 'FEMALE'],
				sourceFormNo: SOURCE_FORM_NO,
				sourceRev: profile.sourceRev,
				effectiveDate: new Date(`${profile.effectiveDate}T00:00:00.000Z`),
				notes: `${profile.name}. ${SOURCE_NOTE}`,
			},
		});

		await prisma.jobRequirementTraining.deleteMany({ where: { profileId: savedProfile.id } });

		// Skill rows are upserted, never wiped: HR-maintained targetLevel must survive a re-seed.
		const desiredSkills = [
			...profile.soft.map((name, index) => ({
				profileId: savedProfile.id,
				category: SOFT_SKILL,
				name,
				masterSkillId: skillIds.get(`${SOFT_SKILL}:${name}`) || null,
				sortOrder: index,
			})),
			...profile.hard.map((name, index) => ({
				profileId: savedProfile.id,
				category: HARD_SKILL,
				name,
				masterSkillId: skillIds.get(`${HARD_SKILL}:${name}`) || null,
				sortOrder: index,
			})),
		];

		const currentSkills = await prisma.jobRequirementSkill.findMany({
			where: { profileId: savedProfile.id },
			select: { id: true, category: true, name: true },
		});
		const currentKeys = new Set(currentSkills.map((row) => `${row.category}:${row.name}`));
		const desiredKeys = new Set(desiredSkills.map((row) => `${row.category}:${row.name}`));

		// Never delete on re-seed: requirement rows may have been added by HR through the UI,
		// and some already carry employee assessments. Only add what is missing.
		const keptExtra = currentSkills
			.filter((row) => !desiredKeys.has(`${row.category}:${row.name}`))
			.map((row) => `${row.category}:${row.name}`);

		if (keptExtra.length > 0) {
			console.warn(`  ${profile.grade} mempertahankan ${keptExtra.length} skill di luar seed: ${keptExtra.join(', ')}`);
		}

		for (const row of desiredSkills) {
			if (currentKeys.has(`${row.category}:${row.name}`)) {
				await prisma.jobRequirementSkill.updateMany({
					where: { profileId: row.profileId, category: row.category, name: row.name },
					data: { masterSkillId: row.masterSkillId, sortOrder: row.sortOrder },
				});
				continue;
			}

			await prisma.jobRequirementSkill.create({ data: row });
		}

		const trainingRows = profile.trainings
			.map((training, index) => ({
				profileId: savedProfile.id,
				masterTrainingId: trainingIds.get(training.name),
				sortOrder: index,
			}))
			.filter((row) => row.masterTrainingId);

		if (trainingRows.length > 0) {
			await prisma.jobRequirementTraining.createMany({ data: trainingRows });
		}

		console.log(
			`  ${profile.grade.padEnd(8)} ${profile.name.padEnd(34)} skill=${profile.soft.length + profile.hard.length} training=${trainingRows.length}`,
		);
	}
}

async function seedAssessmentPeriod() {
	const existing = await prisma.skillAssessmentPeriod.findFirst({ where: { isActive: true } });

	if (existing) {
		console.log(`Periode asesmen aktif: ${existing.name}`);
		return;
	}

	const period = await prisma.skillAssessmentPeriod.upsert({
		where: { name: '2026-S1' },
		update: { isActive: true },
		create: {
			name: '2026-S1',
			startDate: new Date('2026-01-01T00:00:00.000Z'),
			endDate: new Date('2026-06-30T00:00:00.000Z'),
			isActive: true,
			notes: 'Periode awal hasil migrasi asesmen yang sudah ada.',
		},
	});

	console.log(`Periode asesmen dibuat: ${period.name}`);
}

async function main() {
	console.log('Seed Job Requirement (SII-QSHE-002-03)');
	const trainingIds = await seedMasterTrainings();
	const skillIds = await seedMasterSkills();
	console.log(`Master training: ${trainingIds.size} item`);
	console.log(`Master skill: ${skillIds.size} item`);
	await seedProfiles(trainingIds, skillIds);
	await seedAssessmentPeriod();
	console.log('Selesai. Matriks perlu diverifikasi HR sebelum dipakai produksi.');
}

main()
	.catch((error) => {
		console.error(error);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
