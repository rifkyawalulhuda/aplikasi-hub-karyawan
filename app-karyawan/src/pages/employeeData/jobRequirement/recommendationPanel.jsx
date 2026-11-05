import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSnackbar } from 'notistack';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';

import EnhancedTable from '@/components/dataTable';
import { fetchSkillTrainingRecommendations } from '@/services/jobRequirement';

function RecommendationPanel({ period }) {
	const { enqueueSnackbar } = useSnackbar();
	const [loading, setLoading] = useState(true);
	const [payload, setPayload] = useState(null);
	const [exporting, setExporting] = useState(false);

	const load = useCallback(async () => {
		setLoading(true);

		try {
			const result = await fetchSkillTrainingRecommendations({ periodId: period?.id });
			setPayload(result);
		} catch (error) {
			enqueueSnackbar(error.message, { variant: 'error' });
			setPayload(null);
		} finally {
			setLoading(false);
		}
	}, [period?.id, enqueueSnackbar]);

	useEffect(() => {
		load();
	}, [load]);

	const columns = useMemo(
		() => [
			{
				field: 'trainingName',
				headerName: 'TRAINING',
				minWidth: 260,
				flex: 1.2,
				renderCell: (params) => (
					<Stack spacing={0.2}>
						<Typography variant="body2" fontWeight={600}>
							{params.row.trainingName}
						</Typography>
						{params.row.category ? (
							<Typography variant="caption" color="text.secondary">
								{params.row.category}
							</Typography>
						) : null}
					</Stack>
				),
			},
			{
				field: 'employeeCount',
				headerName: 'KARYAWAN',
				minWidth: 110,
				type: 'number',
			},
			{
				field: 'skills',
				headerName: 'DARI SKILL',
				minWidth: 300,
				flex: 1.5,
				sortable: false,
				renderCell: (params) => (
					<Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ py: 0.5 }}>
						{(params.value || []).map((skill) => (
							<Chip
								key={skill.skillName}
								size="small"
								variant="outlined"
								label={`${skill.skillName} · ${skill.affectedEmployees} org · target ${skill.targetLevel}`}
							/>
						))}
					</Stack>
				),
			},
			{
				field: 'maxGap',
				headerName: 'GAP MAKS',
				minWidth: 110,
				type: 'number',
			},
			{
				field: 'employees',
				headerName: 'DAFTAR KARYAWAN',
				minWidth: 260,
				flex: 1,
				sortable: false,
				renderCell: (params) => (
					<Typography variant="body2" noWrap title={(params.value || []).map((e) => e.fullName).join(', ')}>
						{(params.value || []).map((employee) => employee.fullName).join(', ') || '-'}
					</Typography>
				),
			},
		],
		[],
	);

	const handleExport = async () => {
		if (!payload) {
			return;
		}

		setExporting(true);

		try {
			const ExcelJS = await import('exceljs');
			const Workbook = ExcelJS.Workbook || ExcelJS.default?.Workbook;
			const workbook = new Workbook();
			const sheet = workbook.addWorksheet('Rekomendasi Training');

			sheet.addRow(['TRAINING', 'KATEGORI', 'JUMLAH KARYAWAN', 'SKILL PENYEBAB', 'GAP MAKS', 'DAFTAR KARYAWAN']);
			sheet.getRow(1).font = { bold: true };
			sheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

			(payload.rows || []).forEach((row) => {
				sheet.addRow([
					row.trainingName,
					row.category || '',
					row.employeeCount,
					row.skills.map((skill) => `${skill.skillName} (target ${skill.targetLevel})`).join(', '),
					row.maxGap,
					(row.employees || []).map((employee) => employee.fullName).join(', '),
				]);
			});

			sheet.columns = [{ width: 36 }, { width: 22 }, { width: 18 }, { width: 50 }, { width: 10 }, { width: 60 }];

			const buffer = await workbook.xlsx.writeBuffer();
			const blob = new Blob([buffer], {
				type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			});
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement('a');

			link.href = url;
			link.download = `rekomendasi-training-${new Date().toISOString().slice(0, 10)}.xlsx`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			window.URL.revokeObjectURL(url);
		} catch (error) {
			enqueueSnackbar(error.message || 'Gagal membuat file Excel.', { variant: 'error' });
		} finally {
			setExporting(false);
		}
	};

	if (loading) {
		return (
			<Stack alignItems="center" justifyContent="center" py={6}>
				<CircularProgress size={28} />
			</Stack>
		);
	}

	if (!payload) {
		return null;
	}

	return (
		<Box>
			<Divider sx={{ my: 2 }} />
			<Stack spacing={1.5}>
				<Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" useFlexGap>
					<Box>
						<Typography variant="subtitle1" fontWeight={700}>
							Rekomendasi dari Skill Gap
						</Typography>
						<Typography variant="caption" color="text.secondary">
							Diturunkan dari skill yang belum mencapai target dan dipetakan ke training. Berbeda dari
							tabel di atas yang berbasis training wajib per grade.
						</Typography>
					</Box>
					<Button
						variant="outlined"
						size="small"
						startIcon={<DownloadOutlinedIcon />}
						onClick={handleExport}
						disabled={exporting || (payload.rows || []).length === 0}
					>
						{exporting ? 'Menyiapkan...' : 'Export Excel'}
					</Button>
				</Stack>

				{!payload.hasMapping ? (
					<Alert severity="info">
						Belum ada pemetaan skill ke training. Isi lewat{' '}
						<strong>Master Data → Master Training → Pemetaan Training</strong> agar rekomendasi otomatis
						muncul di sini.
					</Alert>
				) : null}

				<Grid container spacing={1.5}>
					{[
						{ label: 'Training direkomendasikan', value: payload.total },
						{ label: 'Karyawan punya gap', value: payload.employeesWithGap },
						{ label: 'Gap tanpa training terpetakan', value: payload.unmappedGapCount },
						{
							label: 'Skill wajib sudah dinilai',
							value: `${payload.assessedPairs ?? 0}/${payload.requiredPairs ?? 0}`,
						},
					].map((item) => (
						<Grid item xs={12} sm={6} md={3} key={item.label}>
							<Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 1.5 }}>
								<Typography variant="caption" color="text.secondary">
									{item.label}
								</Typography>
								<Typography variant="h6">{item.value}</Typography>
							</Box>
						</Grid>
					))}
				</Grid>

				{(payload.rows || []).length === 0 ? (
					<Alert severity={payload.assessedPairs > 0 ? 'success' : 'info'}>
						{(() => {
							if ((payload.assessedPairs ?? 0) === 0) {
								return 'Belum ada skill wajib yang dinilai pada periode ini, sehingga gap belum bisa dihitung. Isi asesmen lewat tab Asesmen Kompetensi.';
							}

							if ((payload.unmappedGapCount ?? 0) > 0) {
								return `Tidak ada training yang bisa direkomendasikan karena ${payload.unmappedGapCount} gap belum dipetakan ke training. Lengkapi Pemetaan Training.`;
							}

							return 'Tidak ada rekomendasi training dari skill gap pada periode ini — semua skill yang sudah dinilai memenuhi target.';
						})()}
					</Alert>
				) : (
					<EnhancedTable
						rows={payload.rows}
						columns={columns}
						getRowId={(row) => row.masterTrainingId}
						columnResizeKey="skill-training-recommendation-table"
					/>
				)}
			</Stack>
		</Box>
	);
}

export default RecommendationPanel;
