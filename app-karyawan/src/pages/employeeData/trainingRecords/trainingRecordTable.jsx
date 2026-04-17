import { useMemo } from 'react';

import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';

import EnhancedTable, { createRowNumberColumn } from '@/components/dataTable';

import { formatTrainingDate, formatTrainingTypeLabel, getTrainingTypeChipColor } from './utils';

function TrainingRecordTable({ rows, onDetail, onEdit, onDelete }) {
	if (rows.length === 0) {
		return (
			<Stack py={8} alignItems="center" spacing={1}>
				<Typography variant="h6">Belum ada data pelatihan karyawan</Typography>
				<Typography variant="body2" color="text.secondary">
					Tambahkan data pelatihan karyawan pertama dari halaman ini.
				</Typography>
			</Stack>
		);
	}

	const columns = useMemo(
		() => [
			createRowNumberColumn(),
			{
				field: 'trainingType',
				headerName: 'JENIS PELATIHAN',
				minWidth: 150,
				renderCell: (params) => (
					<Chip
						size="small"
						label={formatTrainingTypeLabel(params.value)}
						color={getTrainingTypeChipColor(params.value)}
						variant="outlined"
					/>
				),
			},
			{
				field: 'participantSummary',
				headerName: 'NAMA PESERTA',
				minWidth: 230,
				flex: 1,
				renderCell: (params) => params.value || '-',
			},
			{ field: 'material', headerName: 'MATERI PELATIHAN', minWidth: 220, flex: 1 },
			{ field: 'trainerInstitution', headerName: 'LEMBAGA TRAINER', minWidth: 210 },
			{ field: 'trainerName', headerName: 'NAMA TRAINER', minWidth: 180 },
			{
				field: 'startDate',
				headerName: 'DARI TANGGAL',
				minWidth: 150,
				valueFormatter: (params) => formatTrainingDate(params.value),
			},
			{
				field: 'endDate',
				headerName: 'SAMPAI TANGGAL',
				minWidth: 150,
				valueFormatter: (params) => formatTrainingDate(params.value),
			},
			{ field: 'dayCount', headerName: 'JUMLAH HARI', minWidth: 120, type: 'number' },
			{
				field: 'address',
				headerName: 'ALAMAT PELATIHAN',
				minWidth: 240,
				flex: 1,
				renderCell: (params) => params.value || '-',
			},
			{
				field: 'notes',
				headerName: 'KETERANGAN',
				minWidth: 240,
				flex: 1,
				renderCell: (params) => params.value || '-',
			},
		],
		[],
	);

	return (
		<EnhancedTable
			rows={rows}
			columns={columns}
			columnResizeKey="employee-training-table"
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

export default TrainingRecordTable;
