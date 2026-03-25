import { useMemo } from 'react';

import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';

import EnhancedTable, { createRowNumberColumn } from '@/components/dataTable';

import formatLeaveDate from './utils';

function EmployeeLeaveTable({ rows, onDetail, onEdit, onDelete }) {
	if (rows.length === 0) {
		return (
			<Stack py={8} alignItems="center" spacing={1}>
				<Typography variant="h6">Belum ada database cuti karyawan</Typography>
				<Typography variant="body2" color="text.secondary">
					Tambahkan data cuti karyawan pertama dari halaman ini.
				</Typography>
			</Stack>
		);
	}

	const columns = useMemo(
		() => [
			createRowNumberColumn(),
			{ field: 'employeeName', headerName: 'NAMA KARYAWAN', minWidth: 220, flex: 1 },
			{ field: 'employeeNo', headerName: 'NIK', minWidth: 140 },
			{ field: 'leaveType', headerName: 'JENIS CUTI', minWidth: 180 },
			{ field: 'leaveDays', headerName: 'JUMLAH CUTI', minWidth: 130, type: 'number' },
			{
				field: 'periodStart',
				headerName: 'PERIODE DARI',
				minWidth: 150,
				valueFormatter: (params) => formatLeaveDate(params.value),
			},
			{
				field: 'periodEnd',
				headerName: 'PERIODE SAMPAI',
				minWidth: 150,
				valueFormatter: (params) => formatLeaveDate(params.value),
			},
			{ field: 'remainingLeave', headerName: 'SISA CUTI', minWidth: 120, type: 'number' },
			{
				field: 'notes',
				headerName: 'CATATAN',
				minWidth: 220,
				flex: 1.2,
				renderCell: (params) => params.value || '-',
			},
		],
		[],
	);

	return (
		<EnhancedTable
			rows={rows}
			columns={columns}
			columnResizeKey="employee-leave-database-table"
			getContextMenuActions={() => [
				{
					key: 'detail',
					label: 'Detail',
					icon: <VisibilityOutlinedIcon fontSize="small" color="info" />,
					onClick: onDetail,
				},
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

export default EmployeeLeaveTable;
