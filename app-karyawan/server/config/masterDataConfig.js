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
	},
};

export default MASTER_DATA_CONFIG;
