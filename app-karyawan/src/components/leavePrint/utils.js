const MONTH_LABELS = [
	'Januari',
	'Februari',
	'Maret',
	'April',
	'Mei',
	'Juni',
	'Juli',
	'Agustus',
	'September',
	'Oktober',
	'November',
	'Desember',
];

const LEAVE_TYPE_CHECKBOX_MAP = {
	'cuti tahunan': 'C1',
	'cuti 10 tahunan': 'C2',
	'cuti 10 tahun': 'C2',
	'cuti spesial': 'C3',
	'cuti special': 'C3',
	'cuti haid': 'H1',
	'cuti melahirkan': 'H2',
	dispensasi: 'DP',
	'sakit ijin dokter': 'S1',
	'sakit karena kecelakaan': 'S2',
	skorsing: 'SC',
	absen: 'A',
	ijin: 'B',
};

const CHECKBOX_GROUPS = [
	[
		{ key: 'C1', label: 'Cuti Tahunan ( C1 )', sublabel: 'Annual leave ( C1 )' },
		{ key: 'C2', label: 'Cuti 10 Tahunan ( C2 )', sublabel: '10 th year leave ( C2 )' },
		{ key: 'C3', label: 'Cuti Spesial ( C3 )', sublabel: 'Special Leave ( C3 )' },
	],
	[
		{ key: 'H1', label: 'Cuti Haid ( H1 )', sublabel: 'IQ leave ( h1 )' },
		{ key: 'H2', label: 'Cuti Melahirkan ( H2 )', sublabel: 'Maternity leave ( H2 )' },
		{ key: 'DP', label: 'Dispensasi ( DP )', sublabel: 'Dispensation ( DP )' },
	],
	[
		{ key: 'S1', label: 'Sakit Ijin Dokter ( S1 )', sublabel: 'Certificate Doctor ( S1 )' },
		{ key: 'S2', label: 'Sakit Karena Kecelakaan ( S2 )', sublabel: 'Accident work sick ( S2 )' },
		{ key: 'SC', label: 'Skorsing ( SC )', sublabel: 'Scorsing ( SC )' },
	],
	[
		{ key: 'A', label: 'Absen ( A )', sublabel: 'Absent ( A )' },
		{ key: 'B', label: 'Ijin ( B )', sublabel: 'Permission ( B )' },
	],
];

const FM_GROUP_STAGE_TYPES = ['FOREMAN_GROUP_SHIFT', 'FOREMAN', 'GENERAL_FOREMAN', 'SECTION_CHIEF'];
const DEPT_MANAGER_STAGE_TYPES = ['DY_DEPT_MANAGER', 'DEPT_MANAGER'];

function normalizeString(value = '') {
	return String(value).trim().replace(/\s+/g, ' ');
}

function normalizeLeaveType(value = '') {
	return normalizeString(value).toLowerCase();
}

function formatPrintLongDate(value) {
	if (!value) {
		return '';
	}

	const raw = normalizeString(value);
	const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);

	if (isoMatch) {
		const [, year, month, day] = isoMatch;
		return `${Number(day)} ${MONTH_LABELS[Number(month) - 1]} ${year}`;
	}

	const parsed = new Date(raw);

	if (Number.isNaN(parsed.getTime())) {
		return raw;
	}

	return `${parsed.getDate()} ${MONTH_LABELS[parsed.getMonth()]} ${parsed.getFullYear()}`;
}

function formatPrintShortDate(value) {
	if (!value) {
		return '';
	}

	const raw = normalizeString(value);
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

function getLeaveTypeCode(leaveType = '') {
	return LEAVE_TYPE_CHECKBOX_MAP[normalizeLeaveType(leaveType)] || '';
}

function buildCheckboxState(leaveType = '') {
	const activeCode = getLeaveTypeCode(leaveType);

	return CHECKBOX_GROUPS.map((row) =>
		row.map((item) => ({
			...item,
			checked: item.key === activeCode,
		})),
	);
}

function getLatestApprovedStage(approvals, revisionNo, stageTypes) {
	const approvedStages = (approvals || [])
		.filter(
			(item) =>
				item.revisionNo === revisionNo &&
				item.status === 'APPROVED' &&
				(stageTypes || []).includes(item.stageType) &&
				item.actedAt,
		)
		.slice()
		.sort((left, right) => new Date(right.actedAt).getTime() - new Date(left.actedAt).getTime());

	const latest = approvedStages[0];

	if (!latest) {
		return {
			date: '',
			name: '',
		};
	}

	return {
		date: formatPrintShortDate(latest.actedAt),
		name: latest.approver?.fullName || '',
	};
}

function buildBalanceFields(record) {
	const leaveTypeCode = getLeaveTypeCode(record.leaveType);
	const availableBalance = String(record.availableLeaveBalance ?? '');
	const remainingBalance = String(record.remainingLeave ?? '');

	return {
		existingAnnualLeave: leaveTypeCode === 'C1' ? availableBalance : '',
		remainingAnnualLeave: leaveTypeCode === 'C1' ? remainingBalance : '',
		existingTenYearLeave: leaveTypeCode === 'C2' ? availableBalance : '',
		remainingTenYearLeave: leaveTypeCode === 'C2' ? remainingBalance : '',
	};
}

function buildLeavePrintPayload(record) {
	const replacements = (record.replacementEmployees || []).slice(0, 4);

	return {
		requestNumber: record.requestNumber || '',
		employeeName: record.employeeName || '',
		employeeNo: record.employeeNo || '',
		employeeSiteDiv: record.employeeSiteDiv || '',
		employeeDepartmentName: record.employeeDepartmentName || '',
		leaveType: record.leaveType || '',
		leaveTypeCode: getLeaveTypeCode(record.leaveType),
		checkboxRows: buildCheckboxState(record.leaveType),
		submissionDateLong: formatPrintLongDate(record.submissionDate),
		submissionDateShort: formatPrintShortDate(record.submissionDate),
		periodStartShort: formatPrintShortDate(record.periodStart),
		periodEndShort: formatPrintShortDate(record.periodEnd),
		leaveDaysLabel: String(record.leaveDays ?? ''),
		availableLeaveBalanceLabel: String(record.availableLeaveBalance ?? ''),
		remainingLeaveLabel: String(record.remainingLeave ?? ''),
		leaveAddress: record.leaveAddress || '',
		leaveReason: record.leaveReason || '',
		notes: record.notes || '',
		replacementEmployees: replacements,
		applicantApproval: {
			date: formatPrintShortDate(record.submissionDate),
			name: record.employeeName || '',
		},
		fmGroupApproval: getLatestApprovedStage(record.approvals || [], record.revisionNo, FM_GROUP_STAGE_TYPES),
		deptManagerApproval: getLatestApprovedStage(
			record.approvals || [],
			record.revisionNo,
			DEPT_MANAGER_STAGE_TYPES,
		),
		siteDivManagerApproval: getLatestApprovedStage(record.approvals || [], record.revisionNo, ['SITE_DIV_MANAGER']),
		...buildBalanceFields(record),
	};
}

export { CHECKBOX_GROUPS, buildLeavePrintPayload, formatPrintLongDate, formatPrintShortDate, getLeaveTypeCode };
