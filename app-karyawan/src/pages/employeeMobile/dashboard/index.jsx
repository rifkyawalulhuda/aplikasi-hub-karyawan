import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import FeedbackState from '@/components/employeePortal/feedbackState';
import InstallAppCard from '@/components/employeePortal/installAppCard';
import { useEmployeeAuth } from '@/contexts/employeeAuthContext';
import { employeeMeRequest } from '@/services/employeeApi';
import { formatLongDate, getEmployeePortalErrorMessage, handleEmployeeUnauthorized } from '@/utils/employeePortal';

function SummaryCard({ label, value, helper }) {
	return (
		<Paper sx={{ p: 2, borderRadius: 4 }}>
			<Stack spacing={0.5}>
				<Typography variant="caption" sx={{ color: '#5D738B', letterSpacing: '0.08em' }}>
					{label}
				</Typography>
				<Typography variant="h5" sx={{ color: '#123B66', fontWeight: 700 }}>
					{value}
				</Typography>
				<Typography variant="body2" color="text.secondary">
					{helper}
				</Typography>
			</Stack>
		</Paper>
	);
}

function ActivityCard({ title, subtitle, description, meta }) {
	return (
		<Paper sx={{ p: 2, borderRadius: 4 }}>
			<Stack spacing={1}>
				<Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
					<Box>
						<Typography variant="subtitle2" sx={{ color: '#123B66', fontWeight: 700 }}>
							{title}
						</Typography>
						<Typography variant="body2" color="text.secondary">
							{subtitle}
						</Typography>
					</Box>
					{meta ? <Chip label={meta} size="small" color="primary" variant="outlined" /> : null}
				</Stack>
				<Typography variant="body2" color="text.secondary">
					{description}
				</Typography>
			</Stack>
		</Paper>
	);
}

function EmployeeDashboardPage() {
	const navigate = useNavigate();
	const { enqueueSnackbar } = useSnackbar();
	const { logout, user } = useEmployeeAuth();
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [data, setData] = useState(null);

	const loadDashboard = async () => {
		setLoading(true);
		setError('');

		try {
			const response = await employeeMeRequest('/dashboard');
			setData(response);
		} catch (requestError) {
			if (
				handleEmployeeUnauthorized({
					error: requestError,
					logout,
					navigate,
					enqueueSnackbar,
				})
			) {
				return;
			}

			setError(getEmployeePortalErrorMessage(requestError));
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadDashboard();
	}, []);

	if (loading) {
		return <FeedbackState loading />;
	}

	if (error) {
		return (
			<FeedbackState
				type="error"
				title="Data dashboard belum bisa dimuat."
				description={error}
				actionLabel="Coba Lagi"
				onAction={loadDashboard}
			/>
		);
	}

	const profile = data?.profile;

	return (
		<Stack spacing={2}>
			<Paper
				sx={{
					p: 2.5,
					borderRadius: 5,
					background: 'linear-gradient(145deg, #123B66 0%, #1F5E9B 54%, #58A6F3 100%)',
					color: '#FFFFFF',
				}}
			>
				<Stack spacing={1.5}>
					<Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
						Selamat datang, {user?.name}
					</Typography>
					<Typography variant="h5" sx={{ color: '#FFFFFF', fontWeight: 700 }}>
						{profile?.fullName}
					</Typography>
					<Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
						<Chip
							label={`NIK ${profile?.employeeNo}`}
							sx={{ bgcolor: 'rgba(255,255,255,0.18)', color: '#FFFFFF' }}
						/>
						<Chip
							label={profile?.employmentTypeLabel}
							sx={{ bgcolor: 'rgba(255,255,255,0.18)', color: '#FFFFFF' }}
						/>
						<Chip
							label={profile?.gradeLabel}
							sx={{ bgcolor: 'rgba(255,255,255,0.18)', color: '#FFFFFF' }}
						/>
					</Stack>
					<Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.82)' }}>
						{profile?.departmentName} | {profile?.jobRoleName} | {profile?.workLocationName}
					</Typography>
				</Stack>
			</Paper>

			<InstallAppCard />

			<Box
				sx={{
					display: 'grid',
					gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
					gap: 1.5,
				}}
			>
				<SummaryCard
					label="Bimbingan"
					value={data?.summary?.guidanceCount ?? 0}
					helper="Total catatan milik Anda"
				/>
				<SummaryCard
					label="Surat Peringatan"
					value={data?.summary?.warningLetterCount ?? 0}
					helper="Riwayat dokumen disipliner"
				/>
				<SummaryCard
					label="Pengajuan Cuti"
					value={data?.summary?.leaveRequestCount ?? 0}
					helper="Total request cuti Anda"
				/>
				<SummaryCard
					label="Masa Kerja"
					value={profile?.lengthOfService || '-'}
					helper="Dihitung dari join date"
				/>
				<SummaryCard
					label="Kontak"
					value={profile?.phoneNumber || '-'}
					helper={profile?.email || 'Email belum tersedia'}
				/>
			</Box>

			<Paper sx={{ p: 2.5, borderRadius: 4 }}>
				<Stack spacing={1.5}>
					<Typography variant="h6" sx={{ color: '#123B66', fontWeight: 700 }}>
						Informasi Karyawan
					</Typography>
					<Stack spacing={1}>
						<Typography variant="body2" color="text.secondary">
							Department: <strong>{profile?.departmentName}</strong>
						</Typography>
						<Typography variant="body2" color="text.secondary">
							Jabatan: <strong>{profile?.jobLevelName}</strong>
						</Typography>
						<Typography variant="body2" color="text.secondary">
							Site / Div: <strong>{profile?.siteDiv}</strong>
						</Typography>
						<Typography variant="body2" color="text.secondary">
							Tanggal bergabung: <strong>{formatLongDate(profile?.joinDate)}</strong>
						</Typography>
					</Stack>
				</Stack>
			</Paper>

			<Paper sx={{ p: 2.5, borderRadius: 4 }}>
				<Stack spacing={1.5}>
					<Typography variant="h6" sx={{ color: '#123B66', fontWeight: 700 }}>
						Aktivitas Terbaru
					</Typography>
					<Divider />
					<Stack spacing={1.25}>
						{data?.recentGuidanceRecords?.length ? (
							data.recentGuidanceRecords.map((item) => (
								<ActivityCard
									key={`guidance-${item.id}`}
									title={item.categoryLabel}
									subtitle={`${formatLongDate(item.meetingDate)} | ${item.meetingTime}`}
									description={item.problemFaced}
									meta={item.location}
								/>
							))
						) : (
							<Typography variant="body2" color="text.secondary">
								Belum ada riwayat bimbingan atau pengarahan.
							</Typography>
						)}
						{data?.recentWarningLetters?.length
							? data.recentWarningLetters.map((item) => (
									<ActivityCard
										key={`warning-${item.id}`}
										title={
											item.warningLevel
												? `Surat Peringatan ${item.warningLevel}`
												: 'Surat Teguran'
										}
										subtitle={formatLongDate(item.letterDate)}
										description={item.violation}
										meta={item.letterNumber}
									/>
							  ))
							: null}
					</Stack>
				</Stack>
			</Paper>
		</Stack>
	);
}

export default EmployeeDashboardPage;
