const MASTER_DATA_PAGE_CONFIG = {
	workLocations: {
		resource: 'work-locations',
		title: 'Master Work Location',
		breadcrumb: 'Work Location',
		groupBreadcrumb: 'Master Data Karyawan',
		fieldLabel: 'Work Location',
		fieldPlaceholder: 'Masukkan work location',
		description: 'Kelola daftar work location yang akan dipakai pada data karyawan.',
		fields: [
			{
				name: 'name',
				label: 'Work Location',
				placeholder: 'Masukkan work location',
				searchable: true,
			},
		],
		tableColumns: [
			{ id: 'id', label: 'NO' },
			{ id: 'name', label: 'WORK LOCATION' },
		],
	},
	departments: {
		resource: 'departments',
		title: 'Master Department',
		breadcrumb: 'Department',
		groupBreadcrumb: 'Master Data Karyawan',
		fieldLabel: 'Department',
		fieldPlaceholder: 'Masukkan department',
		description: 'Kelola daftar department untuk struktur organisasi karyawan.',
		fields: [
			{
				name: 'name',
				label: 'Department',
				placeholder: 'Masukkan department',
				searchable: true,
			},
		],
		tableColumns: [
			{ id: 'id', label: 'NO' },
			{ id: 'name', label: 'DEPARTMENT' },
		],
	},
	jobRoles: {
		resource: 'job-roles',
		title: 'Master Job Role',
		breadcrumb: 'Job Role',
		groupBreadcrumb: 'Master Data Karyawan',
		fieldLabel: 'Job Role',
		fieldPlaceholder: 'Masukkan job role',
		description: 'Kelola daftar job role atau peran kerja karyawan.',
		fields: [
			{
				name: 'name',
				label: 'Job Role',
				placeholder: 'Masukkan job role',
				searchable: true,
			},
		],
		tableColumns: [
			{ id: 'id', label: 'NO' },
			{ id: 'name', label: 'JOB ROLE' },
		],
	},
	jobLevels: {
		resource: 'job-levels',
		title: 'Master Job Level',
		breadcrumb: 'Job Level',
		groupBreadcrumb: 'Master Data Karyawan',
		fieldLabel: 'Job Level',
		fieldPlaceholder: 'Masukkan job level',
		description: 'Kelola daftar level jabatan karyawan.',
		fields: [
			{
				name: 'name',
				label: 'Job Level',
				placeholder: 'Masukkan job level',
				searchable: true,
			},
		],
		tableColumns: [
			{ id: 'id', label: 'NO' },
			{ id: 'name', label: 'JOB LEVEL' },
		],
	},
	masterDokPkb: {
		resource: 'master-dok-pkb',
		title: 'Master Dok PKB',
		breadcrumb: 'Master Dok PKB',
		groupBreadcrumb: 'Master Data Dokumen',
		fieldLabel: 'Master Dok PKB',
		fieldPlaceholder: 'Masukkan pasal PKB',
		description: 'Kelola master dokumen PKB berupa pasal dan isi dokumen.',
		searchPlaceholder: 'Pasal, isi, nomor...',
		fields: [
			{
				name: 'article',
				label: '(PKB) Pasal',
				placeholder: 'Masukkan pasal PKB',
				searchable: true,
			},
			{
				name: 'content',
				label: 'Isi',
				placeholder: 'Masukkan isi dokumen PKB',
				type: 'multiline',
				rows: 5,
				searchable: true,
			},
		],
		tableColumns: [
			{ id: 'id', label: 'NO' },
			{ id: 'article', label: '(PKB) PASAL' },
			{ id: 'content', label: 'ISI' },
		],
	},
};

export default MASTER_DATA_PAGE_CONFIG;
