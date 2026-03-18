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

export {
	buildEmployeePortalProfile,
	diffService,
	diffYears,
	formatDateForClient,
	mapEmployeeGuidanceRecord,
	mapEmployeePortalSession,
	mapEmployeeWarningLetter,
	normalizeString,
	toDateOnly,
};
