import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';

import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';

import CardHeader from '@/components/cardHeader';
import PageHeader from '@/components/pageHeader';
import { useAuth } from '@/contexts/authContext';
import apiRequest from '@/services/api';
import { fetchConfigsBySite, saveConfigsBulk } from '@/services/siteApprovalConfigService';

async function fetchSites() {
	return apiRequest('/master/sites');
}

async function fetchJobLevels() {
	return apiRequest('/master/job-levels');
}

function ApprovalChainPreview({ configRows }) {
	const rankedLevels = configRows
		.filter((row) => row.approvalRank !== null && row.approvalRank !== '')
		.map((row) => ({
			name: row.jobLevelName,
			rank: Number(row.approvalRank),
		}))
		.sort((a, b) => a.rank - b.rank);

	if (rankedLevels.length === 0) {
		return (
			<Box sx={{ mt: 2 }}>
				<Typography variant="subtitle2" gutterBottom>
					Preview Rantai Approval
				</Typography>
				<Typography variant="body2" color="text.secondary">
					Belum ada approval rank yang dikonfigurasi.
				</Typography>
			</Box>
		);
	}

	return (
		<Box sx={{ mt: 2 }}>
			<Typography variant="subtitle2" gutterBottom>
				Preview Rantai Approval
			</Typography>
			<Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
				{rankedLevels.map((level, index) => (
					<Stack key={level.name} direction="row" alignItems="center" spacing={0.5}>
						<Chip label={`${level.rank}. ${level.name}`} color="primary" variant="outlined" size="small" />
						{index < rankedLevels.length - 1 && (
							<Typography variant="body2" color="text.secondary">
								→
							</Typography>
						)}
					</Stack>
				))}
			</Stack>
		</Box>
	);
}

function SiteApprovalConfigPage() {
	const { user } = useAuth();
	const { enqueueSnackbar } = useSnackbar();
	const [sites, setSites] = useState([]);
	const [selectedSite, setSelectedSite] = useState(null);
	const [configRows, setConfigRows] = useState([]);
	const [loading, setLoading] = useState(false);
	const [loadingSites, setLoadingSites] = useState(true);
	const [saving, setSaving] = useState(false);

	// Fetch sites on mount
	useEffect(() => {
		const init = async () => {
			setLoadingSites(true);
			try {
				const siteList = await fetchSites();
				setSites(Array.isArray(siteList) ? siteList : []);
			} catch (error) {
				enqueueSnackbar(error.message, { variant: 'error' });
			} finally {
				setLoadingSites(false);
			}
		};

		init();
	}, [enqueueSnackbar]);

	// Fetch job levels and configs when site is selected
	useEffect(() => {
		if (!selectedSite) {
			setConfigRows([]);
			return;
		}

		const loadConfigs = async () => {
			setLoading(true);
			try {
				const [jobLevels, existingConfigs] = await Promise.all([
					fetchJobLevels(),
					fetchConfigsBySite(selectedSite.id),
				]);

				const configMap = {};
				const configs = Array.isArray(existingConfigs) ? existingConfigs : [];
				configs.forEach((config) => {
					configMap[config.jobLevelId] = config;
				});

				const rows = jobLevels.map((jl) => {
					const existing = configMap[jl.id];
					return {
						jobLevelId: jl.id,
						jobLevelName: jl.name,
						approvalRank: existing?.approvalRank ?? '',
						maxApprovalRank: existing?.maxApprovalRank ?? '',
					};
				});

				setConfigRows(rows);
			} catch (error) {
				enqueueSnackbar(error.message, { variant: 'error' });
			} finally {
				setLoading(false);
			}
		};

		loadConfigs();
	}, [selectedSite, enqueueSnackbar]);

	const handleApprovalRankChange = (index, value) => {
		setConfigRows((prev) => {
			const updated = [...prev];
			updated[index] = { ...updated[index], approvalRank: value };
			return updated;
		});
	};

	const handleMaxApprovalRankChange = (index, value) => {
		setConfigRows((prev) => {
			const updated = [...prev];
			updated[index] = { ...updated[index], maxApprovalRank: value };
			return updated;
		});
	};

	const handleSave = async () => {
		if (!selectedSite) return;

		const entries = configRows.map((row) => ({
			jobLevelId: row.jobLevelId,
			approvalRank: row.approvalRank === '' ? null : Number(row.approvalRank),
			maxApprovalRank: row.maxApprovalRank === '' ? null : Number(row.maxApprovalRank),
		}));

		setSaving(true);
		try {
			await saveConfigsBulk(selectedSite.id, entries);
			enqueueSnackbar('Konfigurasi approval berhasil disimpan.', { variant: 'success' });
		} catch (error) {
			enqueueSnackbar(error.message, { variant: 'error' });
		} finally {
			setSaving(false);
		}
	};

	// Redirect non-super_admin users
	if (user?.role !== 'super_admin') {
		return <Navigate to="/" replace />;
	}

	return (
		<>
			<PageHeader title="Konfigurasi Approval Site">
				<Breadcrumbs aria-label="breadcrumb" sx={{ textTransform: 'uppercase' }}>
					<Link underline="hover" href="#!">
						Data Master
					</Link>
					<Typography color="text.tertiary">Master Data Karyawan</Typography>
					<Typography color="text.tertiary">Konfigurasi Approval Site</Typography>
				</Breadcrumbs>
			</PageHeader>
			<Card sx={{ minHeight: '60vh', p: 3 }}>
				<CardHeader
					title="Konfigurasi Approval Site"
					subtitle="Atur hierarki approval workflow per site. Tentukan approval rank dan max approval rank untuk setiap job level."
					size="small"
					sx={{ mb: 2.5, alignItems: 'flex-start', gap: 1.5 }}
				/>

				<Autocomplete
					options={sites}
					getOptionLabel={(option) => option.name || ''}
					value={selectedSite}
					onChange={(_, newValue) => setSelectedSite(newValue)}
					loading={loadingSites}
					isOptionEqualToValue={(option, value) => option.id === value.id}
					renderInput={(params) => (
						<TextField
							{...params}
							label="Pilih Site"
							placeholder="Cari site..."
							size="small"
							InputProps={{
								...params.InputProps,
								endAdornment: (
									<>
										{loadingSites ? <CircularProgress color="inherit" size={20} /> : null}
										{params.InputProps.endAdornment}
									</>
								),
							}}
						/>
					)}
					sx={{ maxWidth: 400, mb: 3 }}
				/>

				{loading && (
					<Stack alignItems="center" justifyContent="center" py={10}>
						<CircularProgress />
					</Stack>
				)}

				{!loading && selectedSite && configRows.length > 0 && (
					<>
						<TableContainer>
							<Table size="small">
								<TableHead>
									<TableRow>
										<TableCell sx={{ fontWeight: 600 }}>Job Level</TableCell>
										<TableCell sx={{ fontWeight: 600, width: 180 }}>Approval Rank</TableCell>
										<TableCell sx={{ fontWeight: 600, width: 180 }}>Max Approval Rank</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{configRows.map((row, index) => (
										<TableRow key={row.jobLevelId}>
											<TableCell>{row.jobLevelName}</TableCell>
											<TableCell>
												<TextField
													size="small"
													type="number"
													value={row.approvalRank}
													onChange={(e) => handleApprovalRankChange(index, e.target.value)}
													placeholder="Kosong = bukan approver"
													inputProps={{ min: 1 }}
													fullWidth
												/>
											</TableCell>
											<TableCell>
												<TextField
													size="small"
													type="number"
													value={row.maxApprovalRank}
													onChange={(e) => handleMaxApprovalRankChange(index, e.target.value)}
													placeholder="Wajib diisi"
													inputProps={{ min: 1 }}
													fullWidth
												/>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</TableContainer>

						<ApprovalChainPreview configRows={configRows} />

						<Stack direction="row" justifyContent="flex-end" sx={{ mt: 3 }}>
							<Button
								variant="contained"
								startIcon={
									saving ? <CircularProgress size={18} color="inherit" /> : <SaveOutlinedIcon />
								}
								onClick={handleSave}
								disabled={saving}
							>
								{saving ? 'Menyimpan...' : 'Simpan Konfigurasi'}
							</Button>
						</Stack>
					</>
				)}

				{!loading && selectedSite && configRows.length === 0 && (
					<Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
						Tidak ada data job level yang tersedia.
					</Typography>
				)}

				{!loading && !selectedSite && (
					<Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
						Pilih site terlebih dahulu untuk melihat dan mengatur konfigurasi approval.
					</Typography>
				)}
			</Card>
		</>
	);
}

export default SiteApprovalConfigPage;
