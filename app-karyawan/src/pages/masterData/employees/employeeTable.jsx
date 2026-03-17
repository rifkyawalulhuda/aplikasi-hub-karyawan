import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';

import EnhancedTable from '@/components/dataTable';
import { formatEmploymentTypeLabel, formatGradeLabel } from '@/constants/employeeMaster';

const stickyActionCellSx = {
	position: 'sticky',
	right: 0,
	minWidth: 128,
	backgroundColor: 'background.paper',
	zIndex: 2,
	boxShadow: '-6px 0 8px -8px rgba(15, 23, 42, 0.35)',
};

const HEAD_CELLS = [
	{ id: 'id', label: 'NO' },
	{ id: 'employeeNo', label: 'EMPLOYEE NO' },
	{ id: 'fullName', label: 'FULLNAME' },
	{ id: 'employmentType', label: 'EMPLOYMENT TYPE' },
	{ id: 'siteDiv', label: 'SITE / DIV' },
	{ id: 'departmentName', label: 'DEPARTMENT' },
	{ id: 'lengthOfService', label: 'LENGTH OF SERVICE' },
	{ id: 'age', label: 'AGE' },
	{ id: 'birthDate', label: 'BIRTH DATE' },
	{ id: 'gender', label: 'GENDER' },
	{ id: 'workLocationName', label: 'WORK LOCATION' },
	{ id: 'jobRoleName', label: 'JOB ROLE' },
	{ id: 'jobLevelName', label: 'JOB LEVEL' },
	{ id: 'educationLevel', label: 'EDUCATION LEVEL' },
	{ id: 'grade', label: 'GRADE' },
	{ id: 'joinDate', label: 'JOIN DATE' },
	{ id: 'phoneNumber', label: 'PHONE NUMBER' },
	{ id: 'email', label: 'EMAIL' },
	{ id: 'actions', label: 'AKSI', disableSort: true, sx: { ...stickyActionCellSx, zIndex: 4 } },
];

function EmployeeTable({ rows, onEdit, onDelete }) {
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

	return (
		<EnhancedTable
			rows={rows}
			headCells={HEAD_CELLS}
			stickyHeader
			initialRowsPerPage={15}
			rowsPerPageOptions={[15, 30, 50, 100]}
			tableContainerProps={{ sx: { maxHeight: 520 } }}
			render={(row, _index, { rowNumber }) => (
				<TableRow hover key={row.id}>
					<TableCell>{rowNumber}</TableCell>
					<TableCell>{row.employeeNo}</TableCell>
					<TableCell>{row.fullName}</TableCell>
					<TableCell>{formatEmploymentTypeLabel(row.employmentType)}</TableCell>
					<TableCell>{row.siteDiv}</TableCell>
					<TableCell>{row.departmentName}</TableCell>
					<TableCell>{row.lengthOfService}</TableCell>
					<TableCell>{row.age}</TableCell>
					<TableCell>{row.birthDate}</TableCell>
					<TableCell>{row.gender}</TableCell>
					<TableCell>{row.workLocationName}</TableCell>
					<TableCell>{row.jobRoleName}</TableCell>
					<TableCell>{row.jobLevelName}</TableCell>
					<TableCell>{row.educationLevel}</TableCell>
					<TableCell>{formatGradeLabel(row.grade)}</TableCell>
					<TableCell>{row.joinDate}</TableCell>
					<TableCell>{row.phoneNumber}</TableCell>
					<TableCell>{row.email || '-'}</TableCell>
					<TableCell sx={stickyActionCellSx}>
						<Stack direction="row" spacing={1}>
							<Tooltip title="Edit">
								<IconButton color="primary" onClick={() => onEdit(row)}>
									<EditOutlinedIcon />
								</IconButton>
							</Tooltip>
							<Tooltip title="Hapus">
								<IconButton color="error" onClick={() => onDelete(row)}>
									<DeleteOutlineOutlinedIcon />
								</IconButton>
							</Tooltip>
						</Stack>
					</TableCell>
				</TableRow>
			)}
		/>
	);
}

export default EmployeeTable;
