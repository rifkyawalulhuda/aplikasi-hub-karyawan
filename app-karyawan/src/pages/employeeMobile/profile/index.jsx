import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import LockResetOutlinedIcon from '@mui/icons-material/LockResetOutlined';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';

import ChangePasswordDialog from '@/components/employeePortal/changePasswordDialog';
import FeedbackState from '@/components/employeePortal/feedbackState';
import { useEmployeeAuth } from '@/contexts/employeeAuthContext';
import { changeEmployeePassword, employeeMeRequest } from '@/services/employeeApi';
import { formatLongDate, getEmployeePortalErrorMessage, handleEmployeeUnauthorized } from '@/utils/employeePortal';

function FieldItem({ label, value }) {
	return (
		<Stack spacing={0.5}>
			<Typography variant="caption" sx={{ color: 'text.secondary', letterSpacing: '0.08em' }}>
				{label}
			</Typography>
			<Typography variant="body1" sx={{ color: 'text.primary', fontWeight: 600 }}>
				{value || '-'}
			</Typography>
		</Stack>
	);
}

function EmployeeProfilePage() {
	const navigate = useNavigate();
	const { enqueueSnackbar } = useSnackbar();
	const { logout } = useEmployeeAuth();
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [profile, setProfile] = useState(null);
	const [changePasswordOpen, setChangePasswordOpen] = useState(false);
	const [changePasswordLoading, setChangePasswordLoading] = useState(false);
	const [changePasswordError, setChangePasswordError] = useState('');
	const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

	const loadProfile = async () => {
		setLoading(true);
		setError('');

		try {
			const response = await employeeMeRequest('/profile');
			setProfile(response);
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

	const handleOpenChangePassword = () => {
		setChangePasswordError('');
		setChangePasswordOpen(true);
	};

	const handleCloseChangePassword = () => {
		if (changePasswordLoading) {
			return;
		}

		setChangePasswordError('');
		setChangePasswordOpen(false);
	};

	const handleSubmitChangePassword = async (values) => {
		setChangePasswordLoading(true);
		setChangePasswordError('');

		try {
			const response = await changeEmployeePassword(values);
			enqueueSnackbar(response.message || 'Password berhasil diperbarui.', {
				variant: 'success',
			});
			setChangePasswordOpen(false);
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

			setChangePasswordError(getEmployeePortalErrorMessage(requestError));
		} finally {
			setChangePasswordLoading(false);
		}
	};

	useEffect(() => {
		loadProfile();
	}, []);

	if (loading) {
		return <FeedbackState loading />;
	}

	if (error) {
		return (
			<FeedbackState
				type="error"
				title="Profil belum bisa dimuat."
				description={error}
				actionLabel="Muat Ulang"
				onAction={loadProfile}
			/>
		);
	}

	return (
		<>
			<Stack spacing={2}>
				<Paper
					sx={{
						p: 2.5,
						borderRadius: 4,
						border: (theme) => `1px solid ${theme.palette.employeeSurface.borderSoft}`,
						backgroundColor: (theme) => theme.palette.employeeSurface.card,
						boxShadow: (theme) => theme.palette.employeeSurface.shadowSoft,
					}}
				>
					<Stack spacing={1.5}>
						<Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 700 }}>
							Identitas Utama
						</Typography>
						<Divider />
						<FieldItem label="Nama Lengkap" value={profile?.fullName} />
						<FieldItem label="NIK" value={profile?.employeeNo} />
						<FieldItem label="Jenis Kelamin" value={profile?.genderLabel} />
						<FieldItem label="Tanggal Lahir" value={formatLongDate(profile?.birthDate)} />
						<FieldItem label="Usia" value={profile?.age ? `${profile.age} tahun` : '-'} />
					</Stack>
				</Paper>

				<Paper
					sx={{
						p: 2.5,
						borderRadius: 4,
						border: (theme) => `1px solid ${theme.palette.employeeSurface.borderSoft}`,
						backgroundColor: (theme) => theme.palette.employeeSurface.card,
						boxShadow: (theme) => theme.palette.employeeSurface.shadowSoft,
					}}
				>
					<Stack spacing={1.5}>
						<Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 700 }}>
							Data Kepegawaian
						</Typography>
						<Divider />
						<FieldItem label="Employment Type" value={profile?.employmentTypeLabel} />
						<FieldItem label="Site / Div" value={profile?.siteDiv} />
						<FieldItem label="Department" value={profile?.departmentName} />
						<FieldItem label="Work Location" value={profile?.workLocationName} />
						<FieldItem label="Job Role" value={profile?.jobRoleName} />
						<FieldItem label="Job Level" value={profile?.jobLevelName} />
						<FieldItem label="Education Level" value={profile?.educationLevel} />
						<FieldItem label="Grade" value={profile?.gradeLabel} />
						<FieldItem label="Join Date" value={formatLongDate(profile?.joinDate)} />
						<FieldItem label="Length Of Service" value={profile?.lengthOfService} />
					</Stack>
				</Paper>

				<Paper
					sx={{
						p: 2.5,
						borderRadius: 4,
						border: (theme) => `1px solid ${theme.palette.employeeSurface.borderSoft}`,
						backgroundColor: (theme) => theme.palette.employeeSurface.card,
						boxShadow: (theme) => theme.palette.employeeSurface.shadowSoft,
					}}
				>
					<Stack spacing={1.5}>
						<Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 700 }}>
							Kontak
						</Typography>
						<Divider />
						<FieldItem label="Phone Number" value={profile?.phoneNumber} />
						<FieldItem label="Email" value={profile?.email} />
					</Stack>
				</Paper>

				<Paper
					sx={{
						p: 2.5,
						borderRadius: 4,
						background: (theme) => theme.palette.employeeSurface.cardGradient,
						border: (theme) => `1px solid ${theme.palette.employeeSurface.borderSoft}`,
						boxShadow: (theme) => theme.palette.employeeSurface.shadowSoft,
					}}
				>
					<Stack spacing={2}>
						<Stack spacing={0.75}>
							<Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 700 }}>
								Keamanan Akun
							</Typography>
							<Typography variant="body2" color="text.secondary">
								Perbarui password akun Anda secara mandiri untuk menjaga keamanan akses Portal Karyawan.
							</Typography>
						</Stack>
						<Button
							variant="contained"
							fullWidth
							startIcon={<LockResetOutlinedIcon />}
							onClick={handleOpenChangePassword}
							sx={{
								minHeight: 48,
								borderRadius: 3,
								background: (theme) =>
									`linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
							}}
						>
							Ubah Password
						</Button>
					</Stack>
				</Paper>

				<Button
					variant="contained"
					fullWidth
					color="error"
					startIcon={<LogoutRoundedIcon />}
					onClick={() => setLogoutConfirmOpen(true)}
					sx={{
						minHeight: 50,
						borderRadius: 3,
						mt: 0.5,
						boxShadow: 'none',
					}}
				>
					Logout
				</Button>
			</Stack>

			<ChangePasswordDialog
				open={changePasswordOpen}
				loading={changePasswordLoading}
				errorMessage={changePasswordError}
				onClose={handleCloseChangePassword}
				onSubmit={handleSubmitChangePassword}
			/>
			<Dialog open={logoutConfirmOpen} onClose={() => setLogoutConfirmOpen(false)} fullWidth maxWidth="xs">
				<DialogTitle sx={{ pb: 1 }}>Konfirmasi Logout</DialogTitle>
				<DialogContent sx={{ pt: '4px !important' }}>
					<DialogContentText>Anda yakin ingin keluar dari aplikasi PWA Karyawan?</DialogContentText>
				</DialogContent>
				<DialogActions sx={{ px: 3, pb: 2 }}>
					<Button onClick={() => setLogoutConfirmOpen(false)} color="inherit">
						Batal
					</Button>
					<Button
						variant="contained"
						color="error"
						onClick={() => {
							setLogoutConfirmOpen(false);
							logout();
							navigate('/karyawan/login', { replace: true });
						}}
					>
						Ya, Logout
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
}

export default EmployeeProfilePage;
