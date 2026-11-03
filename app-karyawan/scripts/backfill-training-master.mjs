import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const APPLY = process.argv.includes('--apply');
const MIN_PARTIAL_LENGTH = 5;

function normalize(value = '') {
	return String(value).trim().replace(/\s+/g, ' ').toLowerCase();
}

function findMatch(material, masterList, byName) {
	const key = normalize(material);

	if (!key) {
		return { master: null, strategy: 'EMPTY' };
	}

	const exact = byName.get(key);

	if (exact) {
		return { master: exact, strategy: 'EXACT' };
	}

	if (key.length < MIN_PARTIAL_LENGTH) {
		return { master: null, strategy: 'NONE' };
	}

	const partial = masterList.find((master) => {
		const masterKey = normalize(master.name);
		return masterKey.length >= MIN_PARTIAL_LENGTH && (key.includes(masterKey) || masterKey.includes(key));
	});

	return partial ? { master: partial, strategy: 'PARTIAL' } : { master: null, strategy: 'NONE' };
}

async function main() {
	const masters = await prisma.masterTraining.findMany({ orderBy: { name: 'asc' } });
	const byName = new Map(masters.map((master) => [normalize(master.name), master]));

	const trainings = await prisma.employeeTraining.findMany({
		where: { masterTrainingId: null },
		orderBy: { id: 'asc' },
	});

	const summary = {
		mode: APPLY ? 'APPLY' : 'DRY_RUN',
		masterTraining: masters.length,
		scanned: trainings.length,
		matchedExact: 0,
		matchedPartial: 0,
		unmatched: 0,
		updated: 0,
	};

	const unmatchedSamples = [];
	const updates = [];

	for (const training of trainings) {
		const { master, strategy } = findMatch(training.material, masters, byName);

		if (!master) {
			summary.unmatched += 1;

			if (unmatchedSamples.length < 20) {
				unmatchedSamples.push({ id: training.id, material: training.material });
			}

			continue;
		}

		if (strategy === 'EXACT') {
			summary.matchedExact += 1;
		} else {
			summary.matchedPartial += 1;
		}

		updates.push({ id: training.id, masterTrainingId: master.id, strategy, material: training.material });
	}

	if (APPLY && updates.length > 0) {
		await prisma.$transaction(
			updates.map((update) =>
				prisma.employeeTraining.update({
					where: { id: update.id },
					data: { masterTrainingId: update.masterTrainingId },
				}),
			),
		);
		summary.updated = updates.length;
	}

	console.log(JSON.stringify(summary, null, 2));

	if (updates.length > 0 && !APPLY) {
		console.log('\nContoh pencocokan (dry-run, tidak disimpan):');
		updates.slice(0, 10).forEach((update) => {
			console.log(`  [${update.strategy}] ${update.material} -> masterTrainingId=${update.masterTrainingId}`);
		});
	}

	if (unmatchedSamples.length > 0) {
		console.log('\nContoh yang belum cocok (perlu pemetaan manual):');
		unmatchedSamples.forEach((sample) => {
			console.log(`  #${sample.id} ${sample.material}`);
		});
	}

	if (!APPLY) {
		console.log('\nJalankan ulang dengan --apply untuk menyimpan perubahan.');
	}
}

main()
	.catch((error) => {
		console.error(error);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
