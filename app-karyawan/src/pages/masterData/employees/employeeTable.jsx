import { useMemo } from 'react';

import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';

import EnhancedTable, { createRowNumberColumn } from '@/components/dataTable';
import { formatEmploymentTypeLabel, formatGradeLabel } from '@/constants/employeeMaster';
import { useAuth } from '@/contexts/authContext';

function EmployeeTable({ rows, onEdit, onDelete }) {
	const { user } = useAuth();
	const isSuperAdmin = user?.role === 'super_admin';
	if (rows.length === 0) {
		return (
			<Stack py={8} alignItems="center" spacing={1}>
				<Typography variant="h6">Belum ada data karyawan</Typography>
				<Typography variant="body2" color="text.secondary">
					Tambahkan master karyawan pertama dari form input.
				</Typography>
			</Stack>
		);
	}

	const columns = useMemo(
		() => [
			createRowNumberColumn(),
			{ field: 'employeeNo', headerName: 'EMPLOYEE NO', minWidth: 150 },
			{ field: 'fullName', headerName: 'FULLNAME', minWidth: 220, flex: 1 },
			{
				field: 'employmentType',
				headerName: 'EMPLOYMENT TYPE',
				minWidth: 170,
				renderCell: (params) => formatEmploymentTypeLabel(params.value),
			},
			...(isSuperAdmin
				? [
						{
							field: 'siteName',
							headerName: 'SITE',
							minWidth: 130,
							renderCell: (params) => params.value || '-',
						},
				  ]
				: []),
			{ field: 'departmentName', headerName: 'DEPARTMENT', minWidth: 180 },
			{
				field: 'groupShiftName',
				headerName: 'GROUP SHIFT',
				minWidth: 160,
				renderCell: (params) => params.value || '-',
			},
			{ field: 'lengthOfService', headerName: 'LENGTH OF SERVICE', minWidth: 170 },
			{ field: 'age', headerName: 'AGE', minWidth: 90 },
			{ field: 'birthDate', headerName: 'BIRTH DATE', minWidth: 140 },
			{ field: 'gender', headerName: 'GENDER', minWidth: 120 },
			{ field: 'workLocationName', headerName: 'WORK LOCATION', minWidth: 170 },
			{ field: 'jobRoleName', headerName: 'JOB ROLE', minWidth: 170 },
			{ field: 'jobLevelName', headerName: 'JOB LEVEL', minWidth: 150 },
			{ field: 'educationLevel', headerName: 'EDUCATION LEVEL', minWidth: 180 },
			{
				field: 'grade',
				headerName: 'GRADE',
				minWidth: 120,
				renderCell: (params) => formatGradeLabel(params.value),
			},
			{ field: 'joinDate', headerName: 'JOIN DATE', minWidth: 140 },
			{ field: 'phoneNumber', headerName: 'PHONE NUMBER', minWidth: 160 },
			{
				field: 'email',
				headerName: 'EMAIL',
				minWidth: 220,
				flex: 1,
				renderCell: (params) => params.value || '-',
			},
		],
		[isSuperAdmin],
	);

	return (
		<EnhancedTable
			rows={rows}
			columns={columns}
			columnResizeKey="master-employees-table"
			getContextMenuActions={() => [
				{
					key: 'edit',
					label: 'Edit',
					icon: <EditOutlinedIcon fontSize="small" color="primary" />,
					onClick: onEdit,
				},
				{
					key: 'delete',
					label: 'Hapus',
					icon: <DeleteOutlineOutlinedIcon fontSize="small" color="error" />,
					onClick: onDelete,
				},
			]}
			height={520}
		/>
	);
}

export default EmployeeTable;
