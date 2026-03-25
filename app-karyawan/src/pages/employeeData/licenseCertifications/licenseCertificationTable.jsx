import { useMemo } from 'react';

import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';

import EnhancedTable, { createRowNumberColumn } from '@/components/dataTable';

import { formatLicenseDate, getLicenseStatusChipColor } from './utils';

function LicenseCertificationTable({ rows, onEdit, onDelete }) {
	if (rows.length === 0) {
		return (
			<Stack py={8} alignItems="center" spacing={1}>
				<Typography variant="h6">Belum ada data lisensi & sertifikasi</Typography>
				<Typography variant="body2" color="text.secondary">
					Tambahkan data lisensi atau sertifikasi karyawan pertama dari halaman ini.
				</Typography>
			</Stack>
		);
	}

	const columns = useMemo(
		() => [
			createRowNumberColumn(),
			{ field: 'employeeName', headerName: 'NAMA', minWidth: 220, flex: 1 },
			{ field: 'employeeNo', headerName: 'NIK', minWidth: 140 },
			{ field: 'documentName', headerName: 'DOKUMEN', minWidth: 200 },
			{ field: 'documentType', headerName: 'JENIS DOKUMEN', minWidth: 170 },
			{ field: 'type', headerName: 'TYPE', minWidth: 140 },
			{ field: 'documentNumber', headerName: 'NO. DOKUMEN', minWidth: 170 },
			{ field: 'issuer', headerName: 'DITERBITKAN', minWidth: 170 },
			{
				field: 'expiryDate',
				headerName: 'MASA BERLAKU',
				minWidth: 150,
				valueFormatter: (params) => formatLicenseDate(params.value),
			},
			{
				field: 'status',
				headerName: 'STATUS',
				minWidth: 140,
				renderCell: (params) => (
					<Chip
						size="small"
						label={params.value}
						color={getLicenseStatusChipColor(params.value)}
						variant="outlined"
					/>
				),
			},
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
			columnResizeKey="license-certifications-table"
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

export default LicenseCertificationTable;
