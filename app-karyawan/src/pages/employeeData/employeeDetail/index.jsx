import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';

import Avatar from '@mui/material/Avatar';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import InputAdornment from '@mui/material/InputAdornment';
import Link from '@mui/material/Link';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import ArrowForwardIosOutlinedIcon from '@mui/icons-material/ArrowForwardIosOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';

import CardHeader from '@/components/cardHeader';
import PageHeader from '@/components/pageHeader';
import useUrlSearchKeyword from '@/hooks/useUrlSearchKeyword';
import apiRequest from '@/services/api';

const ROWS_PER_PAGE_OPTIONS = [15, 30, 50, 100];

async function fetchEmployees() {
	return apiRequest('/master/employees');
}

function getInitials(fullName = '') {
	return fullName
		.split(' ')
		.slice(0, 2)
		.map((w) => w[0] || '')
		.join('')
		.toUpperCase();
}

function EmployeeDetailListPage() {
	const navigate = useNavigate();
	const { enqueueSnackbar } = useSnackbar();
	const [rows, setRows] = useState([]);
	const [loading, setLoading] = useState(true);
	const [searchKeyword, setSearchKeyword] = useUrlSearchKeyword();
	const [departmentFilter, setDepartmentFilter] = useState('ALL');
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(15);

	useEffect(() => {
		const init = async () => {
			setLoading(true);
			try {
				const data = await fetchEmployees();
				setRows(data);
			} catch (error) {
				enqueueSnackbar(error.message, { variant: 'error' });
			} finally {
				setLoading(false);
			}
		};
		init();
	}, [enqueueSnackbar]);

	const departments = useMemo(
		() => Array.from(new Set(rows.map((r) => r.departmentName || '').filter(Boolean))).sort(),
		[rows],
	);

	const filteredRows = useMemo(() => {
		const kw = searchKeyword.trim().toLowerCase();
		return rows.filter((row) => {
			const matchesDept = departmentFilter === 'ALL' || row.departmentName === departmentFilter;
			if (!matchesDept) return false;
			if (!kw) return true;
			return [row.fullName, row.employeeNo, row.departmentName, row.jobLevelName, row.jobRoleName].some((v) =>
				String(v || '')
					.toLowerCase()
					.includes(kw),
			);
		});
	}, [rows, searchKeyword, departmentFilter]);

	const paginatedRows = useMemo(
		() => filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
		[filteredRows, page, rowsPerPage],
	);

	const handlePageChange = (_e, newPage) => {
		setPage(newPage);
	};

	const handleRowsPerPageChange = (e) => {
		setRowsPerPage(Number(e.target.value));
		setPage(0);
	};

	return (
		<>
			<PageHeader title="Detail Karyawan">
				<Breadcrumbs aria-label="breadcrumb" sx={{ textTransform: 'uppercase' }}>
					<Link underline="hover" href="#!">
						Data Karyawan
					</Link>
					<Typography color="text.tertiary">Detail Karyawan</Typography>
				</Breadcrumbs>
			</PageHeader>
			<Card sx={{ minHeight: '60vh', p: 3 }}>
				<CardHeader
					title="Detail Karyawan"
					subtitle="Pilih karyawan untuk melihat ringkasan lengkap data dan histori."
					size="small"
					sx={{ flexDirection: 'column', alignItems: 'stretch', gap: 2, mb: 2.5 }}
				>
					<Grid container spacing={1.5} alignItems="center">
						<Grid item xs={12} md={6}>
							<TextField
								fullWidth
								size="small"
								label="Cari Karyawan"
								value={searchKeyword}
								onChange={(e) => setSearchKeyword(e.target.value)}
								placeholder="Nama, NIK, jabatan..."
								InputProps={{
									startAdornment: (
										<InputAdornment position="start">
											<SearchOutlinedIcon fontSize="small" />
										</InputAdornment>
									),
								}}
							/>
						</Grid>
						<Grid item xs={12} md={4}>
							<TextField
								fullWidth
								size="small"
								select
								label="Departemen"
								value={departmentFilter}
								onChange={(e) => setDepartmentFilter(e.target.value)}
							>
								<MenuItem value="ALL">Semua Departemen</MenuItem>
								{departments.map((dep) => (
									<MenuItem key={dep} value={dep}>
										{dep}
									</MenuItem>
								))}
							</TextField>
						</Grid>
					</Grid>
				</CardHeader>

				{loading ? (
					<Stack alignItems="center" justifyContent="center" py={10}>
						<CircularProgress />
					</Stack>
				) : (
					<>
						<TableContainer>
							<Table size="small" sx={{ minWidth: 700 }}>
								<TableHead>
									<TableRow
										sx={{ '& th': { fontWeight: 700, bgcolor: 'primary.main', color: 'white' } }}
									>
										<TableCell>NO</TableCell>
										<TableCell>KARYAWAN</TableCell>
										<TableCell>NIK</TableCell>
										<TableCell>DEPARTEMEN</TableCell>
										<TableCell>JOB LEVEL</TableCell>
										<TableCell>JOB ROLE</TableCell>
										<TableCell>TIPE</TableCell>
										<TableCell align="center">AKSI</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{paginatedRows.length === 0 ? (
										<TableRow>
											<TableCell
												colSpan={8}
												align="center"
												sx={{ py: 6, color: 'text.secondary' }}
											>
												Tidak ada karyawan ditemukan
											</TableCell>
										</TableRow>
									) : (
										paginatedRows.map((row, index) => (
											<TableRow
												key={row.id}
												hover
												sx={{ cursor: 'pointer' }}
												onClick={() => navigate(`/data-karyawan/detail-karyawan/${row.id}`)}
											>
												<TableCell>{page * rowsPerPage + index + 1}</TableCell>
												<TableCell>
													<Stack direction="row" alignItems="center" spacing={1.5}>
														<Avatar
															sx={{
																width: 34,
																height: 34,
																fontSize: 13,
																fontWeight: 700,
																bgcolor: 'primary.main',
															}}
														>
															{getInitials(row.fullName)}
														</Avatar>
														<Typography variant="body2" fontWeight={600}>
															{row.fullName}
														</Typography>
													</Stack>
												</TableCell>
												<TableCell sx={{ color: 'text.secondary', fontSize: 13 }}>
													{row.employeeNo}
												</TableCell>
												<TableCell>{row.departmentName}</TableCell>
												<TableCell>{row.jobLevelName}</TableCell>
												<TableCell>{row.jobRoleName}</TableCell>
												<TableCell>
													<Chip
														size="small"
														label={row.employmentType}
														color={
															row.employmentType === 'Permanent' ? 'primary' : 'default'
														}
														variant="outlined"
													/>
												</TableCell>
												<TableCell align="center">
													<Tooltip title="Lihat Detail">
														<ArrowForwardIosOutlinedIcon
															fontSize="small"
															sx={{ color: 'primary.main', cursor: 'pointer' }}
														/>
													</Tooltip>
												</TableCell>
											</TableRow>
										))
									)}
								</TableBody>
							</Table>
						</TableContainer>
						<TablePagination
							component="div"
							count={filteredRows.length}
							page={page}
							onPageChange={handlePageChange}
							rowsPerPage={rowsPerPage}
							onRowsPerPageChange={handleRowsPerPageChange}
							rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
							labelRowsPerPage="Rows per page"
							labelDisplayedRows={({ from, to, count }) => `${from}-${to} of ${count}`}
						/>
					</>
				)}
			</Card>
		</>
	);
}

export default EmployeeDetailListPage;
