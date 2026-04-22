function normalizeString(value = '') {
	return String(value).trim().replace(/\s+/g, ' ');
}

function toDateOnly(value) {
	if (!value) {
		return null;
	}

	if (value instanceof Date) {
		return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate(), 12));
	}

	if (typeof value === 'string') {
		const raw = normalizeString(value);
		const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);

		if (isoMatch) {
			const [, year, month, day] = isoMatch;
			return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 12));
		}
	}

	const parsed = new Date(value);
	return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDateForClient(value) {
	if (!value) {
		return null;
	}

	return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(
		2,
		'0',
	)}`;
}

function diffYears(fromDate, toDate = new Date()) {
	let years = toDate.getFullYear() - fromDate.getFullYear();
	const monthDiff = toDate.getMonth() - fromDate.getMonth();

	if (monthDiff < 0 || (monthDiff === 0 && toDate.getDate() < fromDate.getDate())) {
		years -= 1;
	}

	return years;
}

function diffService(fromDate, toDate = new Date()) {
	let years = toDate.getFullYear() - fromDate.getFullYear();
	let months = toDate.getMonth() - fromDate.getMonth();

	if (toDate.getDate() < fromDate.getDate()) {
		months -= 1;
	}

	if (months < 0) {
		years -= 1;
		months += 12;
	}

	return `${Math.max(years, 0)} tahun ${Math.max(months, 0)} bulan`;
}

function formatEmploymentTypeLabel(value = '') {
	const normalizedValue = normalizeString(value).toUpperCase();

	if (normalizedValue === 'PERMANENT') {
		return 'Permanent';
	}

	if (normalizedValue === 'CONTRACT') {
		return 'Contract';
	}

	return normalizeString(value);
}

function formatGradeLabel(value = '') {
	const normalizedValue = normalizeString(value).toUpperCase();
	const match = normalizedValue.match(/^RANK_(\d+)$/);

	if (match) {
		return `Rank ${match[1]}`;
	}

	return normalizeString(value);
}

function formatGenderLabel(value = '') {
	return normalizeString(value).toUpperCase() === 'FEMALE' ? 'Perempuan' : 'Laki-laki';
}

function buildEmployeePortalProfile(employee) {
	return {
		id: employee.id,
		employeeNo: employee.employeeNo,
		fullName: employee.fullName,
		employmentType: employee.employmentType,
		employmentTypeLabel: formatEmploymentTypeLabel(employee.employmentType),
		siteDiv: employee.siteDiv,
		departmentId: employee.departmentId,
		departmentName: employee.department.name,
		workLocationId: employee.workLocationId,
		workLocationName: employee.workLocation.name,
		jobRoleId: employee.jobRoleId,
		jobRoleName: employee.jobRole.name,
		jobLevelId: employee.jobLevelId,
		jobLevelName: employee.jobLevel.name,
		educationLevel: employee.educationLevel,
		grade: employee.grade,
		gradeLabel: formatGradeLabel(employee.grade),
		joinDate: formatDateForClient(employee.joinDate),
		lengthOfService: diffService(employee.joinDate),
		birthDate: formatDateForClient(employee.birthDate),
		age: diffYears(employee.birthDate),
		gender: employee.gender,
		genderLabel: formatGenderLabel(employee.gender),
		phoneNumber: employee.phoneNumber,
		email: employee.email,
	};
}

function mapEmployeePortalSession(employee) {
	return {
		id: employee.id,
		employeeId: employee.id,
		name: employee.fullName,
		nik: employee.employeeNo,
		departmentName: employee.department.name,
		jobLevelName: employee.jobLevel.name,
	};
}

function formatGuidanceCategoryLabel(value = '') {
	return normalizeString(value).toUpperCase() === 'DIRECTION' ? 'Pengarahan' : 'Bimbingan';
}

function formatDisciplineCategoryLabel(value = '') {
	const normalizedValue = normalizeString(value).toUpperCase();

	if (normalizedValue === 'REPRIMAND') {
		return 'Surat Teguran';
	}

	if (normalizedValue === 'SUSPENSION') {
		return 'Skorsing';
	}

	return 'Surat Peringatan';
}

function formatDisciplineDocumentTitle(record) {
	if (record?.category === 'REPRIMAND') {
		return 'Surat Teguran';
	}

	if (record?.category === 'SUSPENSION') {
		return 'Skorsing';
	}

	if (record?.warningLevel) {
		return `Surat Peringatan ${record.warningLevel}`;
	}

	return 'Surat Peringatan';
}

function mapEmployeeGuidanceRecord(record) {
	return {
		id: record.id,
		category: record.category,
		categoryLabel: formatGuidanceCategoryLabel(record.category),
		meetingNumber: record.meetingNumber,
		meetingDate: formatDateForClient(record.meetingDate),
		meetingTime: record.meetingTime,
		location: record.location,
		problemFaced: record.problemFaced,
		problemFacedSecondary: record.problemFacedSecondary,
		problemCause: record.problemCause,
		problemSolving: record.problemSolving,
	};
}

function mapEmployeeWarningLetter(record) {
	return {
		id: record.id,
		category: record.category,
		categoryLabel: formatDisciplineCategoryLabel(record.category),
		documentTitle: formatDisciplineDocumentTitle(record),
		warningLevel: record.warningLevel,
		letterNumber: record.letterNumber,
		letterDate: formatDateForClient(record.letterDate),
		departmentName: record.departmentName || record.employee.department?.name || '',
		jobRoleName: record.employee.jobRole?.name || '',
		jobLevelName: record.jobLevelName || record.employee.jobLevel?.name || '',
		violation: record.violation,
		articleLabel: record.articleLabel,
		articleContent: record.articleContent,
		superiorName: record.superiorEmployee.fullName,
		superiorJobLevelName: record.superiorEmployee.jobLevel.name,
	};
}

function formatTrainingTypeLabel(value = '') {
	const normalizedValue = normalizeString(value).toUpperCase();

	if (normalizedValue === 'INTERNAL') {
		return 'Internal';
	}

	if (normalizedValue === 'EXTERNAL') {
		return 'External';
	}

	return normalizeString(value) || '-';
}

function formatEmployeeLabel(employee) {
	if (!employee) {
		return '';
	}

	return `${employee.fullName} (${employee.employeeNo})`;
}

function buildParticipantSummary(participantNames = []) {
	if (!participantNames.length) {
		return '-';
	}

	if (participantNames.length === 1) {
		return participantNames[0];
	}

	return `${participantNames[0]} + ${participantNames.length - 1} lainnya`;
}

function mapEmployeeTrainingRecord(record, selfEmployee = null) {
	const selfEmployeeId = selfEmployee?.id || null;
	const selfEmployeeName = normalizeString(selfEmployee?.fullName || '').toLowerCase();
	const selfEmployeeNo = normalizeString(selfEmployee?.employeeNo || '').toLowerCase();

	const participants = (record.participants || []).map((item) => ({
		id: item.id,
		employeeId: item.employeeId || null,
		employeeName: item.employee?.fullName || '',
		employeeNo: item.employee?.employeeNo || '',
		participantName: item.participantName || '',
		displayLabel: item.employee ? formatEmployeeLabel(item.employee) : item.participantName || '',
		isSelf: selfEmployeeId
			? item.employeeId === selfEmployeeId ||
				(Boolean(selfEmployeeName) &&
					normalizeString(item.participantName || '').toLowerCase().includes(selfEmployeeName)) ||
				(Boolean(selfEmployeeNo) &&
					normalizeString(item.participantName || '').toLowerCase().includes(selfEmployeeNo))
			: false,
	}));
	const participantNames = participants.map((item) => item.displayLabel).filter(Boolean);
	const selfParticipant = participants.find((item) => item.isSelf) || null;

	return {
		id: record.id,
		trainingType: record.trainingType,
		trainingTypeLabel: formatTrainingTypeLabel(record.trainingType),
		participants,
		participantNames,
		participantCount: participants.length,
		participantSummary: buildParticipantSummary(participantNames),
		selfParticipantName: selfParticipant?.displayLabel || '',
		material: record.material || '',
		trainerInstitution: record.trainerInstitution || '',
		trainerName: record.trainerName || '',
		startDate: formatDateForClient(record.startDate),
		endDate: formatDateForClient(record.endDate),
		dayCount: record.dayCount,
		address: record.address || '',
		notes: record.notes || '',
	};
}

export {
	buildEmployeePortalProfile,
	diffService,
	diffYears,
	formatDateForClient,
	formatTrainingTypeLabel,
	mapEmployeeGuidanceRecord,
	mapEmployeePortalSession,
	mapEmployeeTrainingRecord,
	mapEmployeeWarningLetter,
	formatDisciplineCategoryLabel,
	formatDisciplineDocumentTitle,
	normalizeString,
	toDateOnly,
};
