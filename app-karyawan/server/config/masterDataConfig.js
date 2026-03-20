const MASTER_DATA_CONFIG = {
	'work-locations': {
		label: 'Work Location',
		model: 'workLocation',
		path: 'work-locations',
		fields: [
			{
				name: 'name',
				label: 'Work Location',
				required: true,
				unique: true,
				searchable: true,
			},
		],
	},
	departments: {
		label: 'Department',
		model: 'department',
		path: 'departments',
		fields: [
			{
				name: 'name',
				label: 'Department',
				required: true,
				unique: true,
				searchable: true,
			},
		],
	},
	'job-roles': {
		label: 'Job Role',
		model: 'jobRole',
		path: 'job-roles',
		fields: [
			{
				name: 'name',
				label: 'Job Role',
				required: true,
				unique: true,
				searchable: true,
			},
		],
	},
	'job-levels': {
		label: 'Job Level',
		model: 'jobLevel',
		path: 'job-levels',
		fields: [
			{
				name: 'name',
				label: 'Job Level',
				required: true,
				unique: true,
				searchable: true,
			},
		],
	},
	'master-units': {
		label: 'Master Unit',
		model: 'masterUnit',
		path: 'master-units',
		fields: [
			{
				name: 'unitName',
				label: 'Nama Unit',
				required: true,
				searchable: true,
			},
			{
				name: 'unitType',
				label: 'Jenis Unit',
				required: true,
				searchable: true,
				options: ['Forklift', 'Cargo Lift', 'Kendaraan', 'Infrastruktur'],
			},
			{
				name: 'capacity',
				label: 'Kapasitas',
				required: true,
				searchable: true,
			},
			{
				name: 'unitSerialNumber',
				label: 'Unit/Serial Number',
				required: true,
				searchable: true,
			},
			{
				name: 'detailLainnya',
				label: 'Detail Lainnya',
				required: true,
				searchable: true,
			},
		],
		import: {
			worksheetName: 'Data Import',
			dataStartRow: 2,
			headers: ['Nama Unit', 'Jenis Unit', 'Kapasitas', 'Unit/Serial Number', 'Detail Lainnya'],
			instructionRowValues: {
				'Nama Unit': 'Contoh: Forklift CLC-C-111',
				'Jenis Unit': 'Pilih: Forklift, Cargo Lift, Kendaraan, atau Infrastruktur',
				Kapasitas: 'Contoh: 12T',
				'Unit/Serial Number': 'Contoh: 2112121',
				'Detail Lainnya': 'Contoh: 1212121',
			},
			errorFilePrefix: 'master-unit-import-errors',
		},
	},
	'master-vendors': {
		label: 'Master Vendor',
		model: 'masterVendor',
		path: 'master-vendors',
		fields: [
			{
				name: 'vendorName',
				label: 'Nama Vendor',
				required: true,
				searchable: true,
			},
			{
				name: 'vendorType',
				label: 'Jenis Vendor',
				required: true,
				searchable: true,
				options: ['Consumable', 'Building', 'Trucking', 'Jasa', 'Warehousing', 'Disposable'],
				allowCustomOption: true,
				customOptionLabel: 'Lainnya',
			},
			{
				name: 'address',
				label: 'Alamat',
				required: true,
				searchable: true,
			},
			{
				name: 'picName',
				label: 'Nama PIC',
				required: true,
				searchable: true,
			},
			{
				name: 'phoneNumber',
				label: 'Nomor Telfon',
				required: true,
				searchable: true,
			},
			{
				name: 'email',
				label: 'Email',
				required: true,
				searchable: true,
			},
			{
				name: 'detailLainnya',
				label: 'Detail Lainnya',
				required: true,
				searchable: true,
			},
		],
	},
	'master-dok-pkb': {
		label: 'Master Dok PKB',
		model: 'masterDokPkb',
		path: 'master-dok-pkb',
		fields: [
			{
				name: 'article',
				label: '(PKB) Pasal',
				required: true,
				unique: true,
				searchable: true,
			},
			{
				name: 'content',
				label: 'Isi',
				required: true,
				type: 'multiline',
				rows: 5,
				searchable: true,
			},
		],
		import: {
			worksheetName: 'Data Import',
			dataStartRow: 2,
			headers: ['(PKB) Pasal', 'Isi'],
			instructionRowValues: {
				'(PKB) Pasal': 'Isi pasal PKB, contoh: Pasal 14 ayat 16',
				Isi: 'Isi lengkap dokumen PKB. Baris kosong akan dilewati saat import.',
			},
			errorFilePrefix: 'master-dok-pkb-import-errors',
		},
	},
	'master-cuti-karyawan': {
		label: 'Master Cuti Karyawan',
		model: 'masterCutiKaryawan',
		path: 'master-cuti-karyawan',
		fields: [
			{
				name: 'leaveType',
				label: 'Jenis Cuti',
				required: true,
				searchable: true,
			},
		],
	},
};

export default MASTER_DATA_CONFIG;
