import { useMemo } from 'react';

import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';

import EnhancedTable, { createRowNumberColumn } from '@/components/dataTable';

import { formatUnitLicenseDate, getUnitLicenseStatusChipColor } from './utils';

function UnitLicenseCertificationTable({ rows, onEdit, onDelete }) {
	if (rows.length === 0) {
		return (
			<Stack py={8} alignItems="center" spacing={1}>
				<Typography variant="h6">Belum ada data lisensi & sertifikasi unit</Typography>
				<Typography variant="body2" color="text.secondary">
					Tambahkan data lisensi atau sertifikasi unit pertama dari halaman ini.
				</Typography>
			</Stack>
		);
	}

	const columns = useMemo(
		() => [
			createRowNumberColumn(),
			{ field: 'unitName', headerName: 'NAMA UNIT', minWidth: 220, flex: 1 },
			{ field: 'assetNo', headerName: 'ASSET NO', minWidth: 140 },
			{ field: 'unitType', headerName: 'JENIS UNIT', minWidth: 150 },
			{ field: 'capacity', headerName: 'KAPASITAS', minWidth: 130 },
			{ field: 'unitSerialNumber', headerName: 'UNIT/SERIAL NUMBER', minWidth: 180 },
			{ field: 'documentNumber', headerName: 'NO. DOKUMEN', minWidth: 170 },
			{ field: 'issuedBy', headerName: 'DITERBITKAN', minWidth: 170 },
			{ field: 'vendorName', headerName: 'VENDOR PENGURUS', minWidth: 190 },
			{
				field: 'expiryDate',
				headerName: 'MASA BERLAKU',
				minWidth: 150,
				valueFormatter: (params) => formatUnitLicenseDate(params.value),
			},
			{
				field: 'status',
				headerName: 'STATUS',
				minWidth: 140,
				renderCell: (params) => (
					<Chip
						size="small"
						label={params.value}
						color={getUnitLicenseStatusChipColor(params.value)}
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
			columnResizeKey="unit-license-certifications-table"
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

export default UnitLicenseCertificationTable;
