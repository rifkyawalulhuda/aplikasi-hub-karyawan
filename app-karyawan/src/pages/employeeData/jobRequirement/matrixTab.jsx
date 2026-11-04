import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSnackbar } from 'notistack';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Pagination from '@mui/material/Pagination';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';

import { fetchDepartments, fetchSkillMatrix } from '@/services/jobRequirement';

const READINESS_COLORS = {
	SIAP: 'success',
	DALAM_PENGEMBANGAN: 'warning',
	BELUM_LENGKAP: 'info',
	BELUM_DINILAI: 'default',
};

function getGradeLabel(grade = '') {
	const match = String(grade).match(/^RANK_(\d+)$/);
	return match ? `Rank ${match[1]}` : grade;
}

function excelFillColor(cell) {
	if (cell.met) {
		return cell.level >= 4 ? 'A5D6A7' : 'C8E6C9';
	}

	return cell.level === 0 ? 'EF9A9A' : 'FFCC80';
}

function cellStyle(cell) {
	if (!cell || !cell.required) {
		return {
			backgroundColor: 'action.hover',
			color: 'text.disabled',
		};
	}

	if (cell.level == null) {
		return {
			backgroundColor: 'transparent',
			color: 'text.disabled',
			border: '1px dashed',
			borderColor: 'divider',
		};
	}

	if (cell.met) {
		return {
			backgroundColor: cell.level >= 4 ? 'rgba(46, 125, 50, 0.28)' : 'rgba(46, 125, 50, 0.16)',
			color: 'text.primary',
		};
	}

	if (cell.level === 0) {
		return { backgroundColor: 'rgba(211, 47, 47, 0.26)', color: 'text.primary' };
	}

	return { backgroundColor: 'rgba(237, 108, 2, 0.26)', color: 'text.primary' };
}

function MatrixTab({ period, onOpenPeriodDialog }) {
	const { enqueueSnackbar } = useSnackbar();
	const [departments, setDepartments] = useState([]);
	const [departmentId, setDepartmentId] = useState('');
	const [gradeFilter, setGradeFilter] = useState('ALL');
	const [hideIrrelevant, setHideIrrelevant] = useState(false);
	const [page, setPage] = useState(1);
	const [loading, setLoading] = useState(false);
	const [payload, setPayload] = useState(null);
	const [exporting, setExporting] = useState(false);

	useEffect(() => {
		fetchDepartments()
			.then((rows) => setDepartments(rows || []))
			.catch((error) => enqueueSnackbar(error.message, { variant: 'error' }));
	}, [enqueueSnackbar]);

	const load = useCallback(async () => {
		if (!departmentId) {
			setPayload(null);
			return;
		}

		setLoading(true);

		try {
			const result = await fetchSkillMatrix({
				departmentId,
				periodId: period?.id,
				grade: gradeFilter === 'ALL' ? undefined : gradeFilter,
				page,
			});

			setPayload(result);
		} catch (error) {
			enqueueSnackbar(error.message, { variant: 'error' });
			setPayload(null);
		} finally {
			setLoading(false);
		}
	}, [departmentId, period?.id, gradeFilter, page, enqueueSnackbar]);

	useEffect(() => {
		load();
	}, [load]);

	const columns = useMemo(() => {
		if (!payload) {
			return [];
		}

		if (!hideIrrelevant) {
			return payload.columns;
		}

		return payload.columns.filter((column) => column.requiredGradeCount > 1);
	}, [payload, hideIrrelevant]);

	const gradeOptions = useMemo(
		() => (payload?.rows || []).map((row) => row.grade).filter((value, index, all) => all.indexOf(value) === index),
		[payload],
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

			const matrixSheet = workbook.addWorksheet('Matriks');
			const header = [
				'Nama',
				'NIK',
				'Grade',
				'Readiness',
				'Skill Dinilai',
				'Status',
				...columns.map((column) => column.skillName),
			];

			matrixSheet.addRow(header);
			matrixSheet.getRow(1).font = { bold: true };
			matrixSheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

			payload.rows.forEach((row) => {
				const values = [
					row.fullName,
					row.employeeNo,
					row.gradeLabel,
					row.readinessPercent == null ? '' : `${row.readinessPercent}%`,
					`${row.assessedItems}/${row.totalItems}`,
					row.readinessStatusLabel,
					...columns.map((column) => {
						const cell = row.cells[column.key];

						if (!cell?.required) {
							return 'N/A';
						}

						return cell.level == null ? '' : cell.level;
					}),
				];

				const excelRow = matrixSheet.addRow(values);

				columns.forEach((column, index) => {
					const cell = row.cells[column.key];
					const excelCell = excelRow.getCell(index + 7);

					excelCell.alignment = { horizontal: 'center' };

					if (!cell?.required) {
						excelCell.fill = {
							type: 'pattern',
							pattern: 'solid',
							fgColor: { argb: 'F2F2F2' },
						};
						excelCell.font = { color: { argb: '9E9E9E' } };
						return;
					}

					if (cell.level == null) {
						excelCell.font = { color: { argb: '9E9E9E' } };
						return;
					}

					excelCell.fill = {
						type: 'pattern',
						pattern: 'solid',
						fgColor: { argb: excelFillColor(cell) },
					};
					excelCell.font = { bold: cell.met, color: { argb: '212121' } };
				});
			});

			matrixSheet.columns = [
				{ width: 28 },
				{ width: 14 },
				{ width: 10 },
				{ width: 11 },
				{ width: 13 },
				{ width: 22 },
				...columns.map(() => ({ width: 11 })),
			];

			const summarySheet = workbook.addWorksheet('Ringkasan');
			summarySheet.addRow(['Departemen', payload.department?.name || '-']);
			summarySheet.addRow(['Periode', payload.period?.name || '-']);
			summarySheet.addRow(['Jumlah karyawan', payload.summary.employeeCount]);
			summarySheet.addRow(['Jumlah grade', payload.summary.gradeCount]);
			summarySheet.addRow(['Jumlah skill', payload.summary.skillCount]);
			summarySheet.addRow(['Sel wajib', payload.summary.requiredCells]);
			summarySheet.addRow(['Sel sudah dinilai', payload.summary.assessedCells]);
			summarySheet.addRow(['Sel N/A', `${payload.summary.naCells} (${payload.summary.naPercent}%)`]);
			summarySheet.addRow(['Karyawan sudah dinilai', payload.summary.assessedEmployees]);
			summarySheet.addRow(['Karyawan asesmen lengkap', payload.summary.completeEmployees ?? 0]);
			summarySheet.addRow(['Karyawan siap', payload.summary.readyEmployees]);
			summarySheet.addRow([
				'Rata-rata readiness',
				payload.summary.averageReadiness == null ? '-' : `${payload.summary.averageReadiness}%`,
			]);
			summarySheet.getColumn(1).width = 28;
			summarySheet.getColumn(2).width = 22;
			summarySheet.getColumn(1).font = { bold: true };

			const gapSheet = workbook.addWorksheet('Gap');
			gapSheet.addRow([
				'Skill',
				'Kategori',
				'Wajib untuk',
				'Dinilai',
				'Belum memenuhi',
				'Rata-rata gap',
				'Coverage %',
				'% Memenuhi',
			]);
			gapSheet.getRow(1).font = { bold: true };

			(payload.skills || [])
				.filter((stat) => stat.gapCount > 0)
				.sort((left, right) => right.gapCount - left.gapCount)
				.forEach((stat) => {
					gapSheet.addRow([
						stat.skillName,
						stat.category === 'SOFT_SKILL' ? 'Soft Skill' : 'Hard Skill',
						stat.requiredCount,
						stat.assessedCount,
						stat.gapCount,
						stat.averageGap,
						stat.coveragePercent ?? '-',
						stat.metPercent ?? '-',
					]);
				});
			gapSheet.columns = [
				{ width: 34 },
				{ width: 14 },
				{ width: 12 },
				{ width: 10 },
				{ width: 16 },
				{ width: 13 },
				{ width: 12 },
				{ width: 12 },
			];

			const buffer = await workbook.xlsx.writeBuffer();
			const blob = new Blob([buffer], {
				type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			});
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement('a');

			link.href = url;
			link.download = `matriks-kompetensi-${payload.department?.name || 'departemen'}-${new Date()
				.toISOString()
				.slice(0, 10)}.xlsx`;
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

	if (!period) {
		return (
			<Alert
				severity="warning"
				action={
					<Button color="inherit" size="small" onClick={onOpenPeriodDialog}>
						Atur Periode
					</Button>
				}
			>
				Belum ada periode asesmen aktif.
			</Alert>
		);
	}

	return (
		<Stack spacing={2}>
			<Grid container spacing={1.5}>
				<Grid item xs={12} md={4}>
					<TextField
						fullWidth
						size="small"
						select
						label="Departemen"
						value={departmentId}
						onChange={(event) => {
							setDepartmentId(event.target.value);
							setPage(1);
						}}
						helperText="Matriks dibatasi per departemen agar tetap terbaca."
					>
						<MenuItem value="">
							<em>Pilih departemen</em>
						</MenuItem>
						{departments.map((department) => (
							<MenuItem key={department.id} value={department.id}>
								{department.name}
							</MenuItem>
						))}
					</TextField>
				</Grid>
				<Grid item xs={12} md={3}>
					<TextField
						fullWidth
						size="small"
						select
						label="Grade"
						value={gradeFilter}
						onChange={(event) => {
							setGradeFilter(event.target.value);
							setPage(1);
						}}
						disabled={!departmentId}
					>
						<MenuItem value="ALL">Semua Grade</MenuItem>
						{gradeOptions.map((grade) => (
							<MenuItem key={grade} value={grade}>
								{getGradeLabel(grade)}
							</MenuItem>
						))}
					</TextField>
				</Grid>
				<Grid item xs={12} md={3}>
					<Stack justifyContent="center" height="100%">
						<FormControlLabel
							control={
								<Switch
									size="small"
									checked={hideIrrelevant}
									onChange={(event) => setHideIrrelevant(event.target.checked)}
								/>
							}
							label={
								<Typography variant="body2" color="text.secondary">
									Sembunyikan skill yang hanya wajib di 1 grade
								</Typography>
							}
						/>
					</Stack>
				</Grid>
				<Grid item xs={12} md={2}>
					<Stack justifyContent="center" height="100%" alignItems="flex-end">
						<Button
							variant="outlined"
							size="small"
							startIcon={<DownloadOutlinedIcon />}
							onClick={handleExport}
							disabled={!payload || exporting}
						>
							{exporting ? 'Menyiapkan...' : 'Export Excel'}
						</Button>
					</Stack>
				</Grid>
			</Grid>

			{!departmentId ? (
				<Alert severity="info">Pilih departemen untuk menampilkan matriks kompetensi.</Alert>
			) : null}

			{loading ? (
				<Stack alignItems="center" justifyContent="center" py={10}>
					<CircularProgress />
				</Stack>
			) : null}

			{payload && !loading ? (
				<>
					<Grid container spacing={1.5}>
						{[
							{ label: 'Karyawan', value: payload.summary.employeeCount },
							{ label: 'Skill (kolom)', value: payload.summary.skillCount },
							{
								label: 'Sel N/A',
								value: `${payload.summary.naCells} (${payload.summary.naPercent}%)`,
							},
							{
								label: 'Rata-rata readiness',
								value:
									payload.summary.averageReadiness == null
										? '-'
										: `${payload.summary.averageReadiness}%`,
							},
							{ label: 'Siap', value: payload.summary.readyEmployees },
						].map((item) => (
							<Grid item xs={6} md={2.4} key={item.label}>
								<Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 1.5 }}>
									<Typography variant="caption" color="text.secondary">
										{item.label}
									</Typography>
									<Typography variant="h6">{item.value}</Typography>
								</Box>
							</Grid>
						))}
					</Grid>

					<Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
						<Typography variant="caption" color="text.secondary">
							Legenda:
						</Typography>
						{[
							{ label: 'Memenuhi', bg: 'rgba(46, 125, 50, 0.2)' },
							{ label: 'Di atas target', bg: 'rgba(46, 125, 50, 0.32)' },
							{ label: 'Di bawah target', bg: 'rgba(237, 108, 2, 0.26)' },
							{ label: 'Level 0', bg: 'rgba(211, 47, 47, 0.26)' },
						].map((legend) => (
							<Stack key={legend.label} direction="row" spacing={0.5} alignItems="center">
								<Box sx={{ width: 14, height: 14, borderRadius: 0.5, backgroundColor: legend.bg }} />
								<Typography variant="caption" color="text.secondary">
									{legend.label}
								</Typography>
							</Stack>
						))}
						<Stack direction="row" spacing={0.5} alignItems="center">
							<Box
								sx={{
									width: 14,
									height: 14,
									borderRadius: 0.5,
									border: '1px dashed',
									borderColor: 'divider',
								}}
							/>
							<Typography variant="caption" color="text.secondary">
								Belum dinilai
							</Typography>
						</Stack>
						<Stack direction="row" spacing={0.5} alignItems="center">
							<Box sx={{ width: 14, height: 14, borderRadius: 0.5, backgroundColor: 'action.hover' }} />
							<Typography variant="caption" color="text.secondary">
								N/A (tidak wajib di grade-nya)
							</Typography>
						</Stack>
					</Stack>

					<Box sx={{ overflowX: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
						<Box component="table" sx={{ borderCollapse: 'collapse', minWidth: '100%' }}>
							<Box component="thead">
								<Box component="tr">
									{[
										{ label: 'KARYAWAN', width: 220 },
										{ label: 'GRADE', width: 84 },
										{ label: 'READINESS', width: 104 },
										{ label: 'STATUS', width: 150 },
									].map((head) => (
										<Box
											component="th"
											key={head.label}
											sx={{
												position: 'sticky',
												left: 0,
												zIndex: 3,
												backgroundColor: 'background.paper',
												borderBottom: '1px solid',
												borderColor: 'divider',
												px: 1.5,
												py: 1,
												textAlign: 'left',
												fontSize: 11,
												fontWeight: 800,
												letterSpacing: '0.03em',
												whiteSpace: 'nowrap',
												minWidth: head.width,
											}}
										>
											{head.label}
										</Box>
									))}
									{columns.map((column) => (
										<Tooltip
											key={column.key}
											title={`${column.skillName} — wajib di ${column.requiredGradeCount} grade, target maksimal ${column.maxTarget}`}
										>
											<Box
												component="th"
												sx={{
													borderBottom: '1px solid',
													borderColor: 'divider',
													borderLeft: '1px solid',
													borderLeftColor: 'divider',
													px: 0.5,
													py: 1,
													verticalAlign: 'bottom',
													minWidth: 52,
													maxWidth: 64,
												}}
											>
												<Typography
													variant="caption"
													sx={{
														writingMode: 'vertical-rl',
														transform: 'rotate(180deg)',
														height: 118,
														whiteSpace: 'nowrap',
														overflow: 'hidden',
														textOverflow: 'ellipsis',
														fontWeight: 600,
														fontSize: 10.5,
													}}
												>
													{column.skillName}
												</Typography>
												<Typography
													variant="caption"
													color="text.secondary"
													display="block"
													textAlign="center"
												>
													{column.requiredGradeCount}g
												</Typography>
											</Box>
										</Tooltip>
									))}
								</Box>
							</Box>
							<Box component="tbody">
								{payload.rows.map((row) => (
									<Box
										component="tr"
										key={row.employeeId}
										sx={{ '&:hover': { backgroundColor: 'action.hover' } }}
									>
										<Box
											component="td"
											sx={{
												position: 'sticky',
												left: 0,
												zIndex: 2,
												backgroundColor: 'background.paper',
												borderBottom: '1px solid',
												borderColor: 'divider',
												px: 1.5,
												py: 0.75,
												whiteSpace: 'nowrap',
											}}
										>
											<Typography variant="body2" fontWeight={600}>
												{row.fullName}
											</Typography>
											<Typography variant="caption" color="text.secondary">
												{row.employeeNo}
											</Typography>
										</Box>
										<Box
											component="td"
											sx={{
												borderBottom: '1px solid',
												borderColor: 'divider',
												px: 1.5,
												py: 0.75,
											}}
										>
											{row.gradeLabel}
										</Box>
										<Box
											component="td"
											sx={{
												borderBottom: '1px solid',
												borderColor: 'divider',
												px: 1.5,
												py: 0.75,
											}}
										>
											{row.readinessPercent == null ? (
												<Typography variant="caption" color="text.disabled">
													-
												</Typography>
											) : (
												<Stack spacing={0.25}>
													<Typography variant="caption" fontWeight={700}>
														{row.readinessPercent}%
													</Typography>
													<Typography
														variant="caption"
														color={row.isComplete ? 'text.secondary' : 'info.main'}
														fontWeight={row.isComplete ? 400 : 600}
													>
														{row.assessedItems}/{row.totalItems}
													</Typography>
												</Stack>
											)}
										</Box>
										<Box
											component="td"
											sx={{
												borderBottom: '1px solid',
												borderColor: 'divider',
												px: 1.5,
												py: 0.75,
											}}
										>
											<Chip
												size="small"
												variant="outlined"
												color={READINESS_COLORS[row.readinessStatus] || 'default'}
												label={row.readinessStatusLabel}
											/>
										</Box>
										{columns.map((column) => {
											const cell = row.cells[column.key];
											const style = cellStyle(cell);

											return (
												<Tooltip
													key={column.key}
													title={
														!cell?.required
															? 'Tidak wajib untuk grade ini'
															: `${column.skillName}: level ${
																	cell.level ?? 'belum dinilai'
															  } / target ${cell.targetLevel}`
													}
												>
													<Box
														component="td"
														sx={{
															borderBottom: '1px solid',
															borderColor: 'divider',
															borderLeft: '1px solid',
															borderLeftColor: 'divider',
															textAlign: 'center',
															fontSize: 12,
															fontWeight: cell?.met ? 700 : 500,
															px: 0.25,
															py: 0.75,
															...style,
														}}
													>
														{!cell?.required ? '-' : cell.level ?? ''}
													</Box>
												</Tooltip>
											);
										})}
									</Box>
								))}
							</Box>
						</Box>
					</Box>

					{payload.totalPages > 1 ? (
						<Stack alignItems="center">
							<Pagination
								count={payload.totalPages}
								page={payload.page}
								onChange={(_event, value) => setPage(value)}
								size="small"
							/>
						</Stack>
					) : null}

					{payload.gaps.length > 0 ? (
						<Box>
							<Typography variant="subtitle2" sx={{ mb: 1 }}>
								Skill dengan gap terbanyak
							</Typography>
							<Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
								{payload.gaps.map((gap) => (
									<Chip
										key={gap.key}
										size="small"
										variant="outlined"
										color="warning"
										label={`${gap.skillName} · ${gap.gapCount} orang · rata-rata gap ${gap.averageGap}`}
									/>
								))}
							</Stack>
						</Box>
					) : null}
				</>
			) : null}
		</Stack>
	);
}

export default MatrixTab;
