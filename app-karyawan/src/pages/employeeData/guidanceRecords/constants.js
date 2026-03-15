export const GUIDANCE_RECORD_CATEGORY = {
	GUIDANCE: 'GUIDANCE',
	DIRECTION: 'DIRECTION',
};

export const guidanceCategoryConfigs = {
	[GUIDANCE_RECORD_CATEGORY.GUIDANCE]: {
		value: GUIDANCE_RECORD_CATEGORY.GUIDANCE,
		label: 'Bimbingan',
		formTitle: 'Formulir Catatan Bimbingan Karyawan',
		recordTitle: 'Data Bimbingan',
		sectionOneLabel: 'Permasalahan yang Dihadapi',
		sectionTwoLabel: null,
		sectionCauseLabel: 'Penyebab Masalah',
		sectionSolvingLabel: 'Pemecahan Masalah (Oleh Atasan Langsung)',
		emptyTitle: 'Belum ada data bimbingan & pengarahan',
		emptyDescription: 'Tambahkan formulir catatan bimbingan atau pengarahan karyawan pertama.',
	},
	[GUIDANCE_RECORD_CATEGORY.DIRECTION]: {
		value: GUIDANCE_RECORD_CATEGORY.DIRECTION,
		label: 'Pengarahan',
		formTitle: 'Formulir Catatan Pengarahan Karyawan',
		recordTitle: 'Data Pengarahan',
		sectionOneLabel: 'A.1 Pengetahuan/Keterampilan Kerja',
		sectionTwoLabel: 'A.2 Tanggung Jawab Pekerjaan',
		sectionCauseLabel: 'Penyebab Masalah',
		sectionSolvingLabel: 'Pemecahan Masalah (Oleh Atasan Langsung)',
		emptyTitle: 'Belum ada data bimbingan & pengarahan',
		emptyDescription: 'Tambahkan formulir catatan bimbingan atau pengarahan karyawan pertama.',
	},
};

export const guidanceCategoryOptions = Object.values(guidanceCategoryConfigs);

export function getGuidanceCategoryConfig(category) {
	return guidanceCategoryConfigs[category] || guidanceCategoryConfigs[GUIDANCE_RECORD_CATEGORY.GUIDANCE];
}

export function formatGuidanceDate(value) {
	if (!value) {
		return '';
	}

	const raw = String(value).trim();
	const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);

	if (isoMatch) {
		const [, year, month, day] = isoMatch;
		return `${day}/${month}/${year}`;
	}

	const parsed = new Date(raw);

	if (Number.isNaN(parsed.getTime())) {
		return raw;
	}

	return `${String(parsed.getDate()).padStart(2, '0')}/${String(parsed.getMonth() + 1).padStart(
		2,
		'0',
	)}/${parsed.getFullYear()}`;
}
