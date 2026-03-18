import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';

import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import FeedbackState from '@/components/employeePortal/feedbackState';
import { useEmployeeAuth } from '@/contexts/employeeAuthContext';
import { employeeMeRequest } from '@/services/employeeApi';
import { formatLongDate, getEmployeePortalErrorMessage, handleEmployeeUnauthorized } from '@/utils/employeePortal';

function FieldItem({ label, value }) {
	return (
		<Stack spacing={0.5}>
			<Typography variant="caption" sx={{ color: '#5D738B', letterSpacing: '0.08em' }}>
				{label}
			</Typography>
			<Typography variant="body1" sx={{ color: '#123B66', fontWeight: 600 }}>
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
		<Stack spacing={2}>
			<Paper sx={{ p: 2.5, borderRadius: 4 }}>
				<Stack spacing={1.5}>
					<Typography variant="h6" sx={{ color: '#123B66', fontWeight: 700 }}>
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

			<Paper sx={{ p: 2.5, borderRadius: 4 }}>
				<Stack spacing={1.5}>
					<Typography variant="h6" sx={{ color: '#123B66', fontWeight: 700 }}>
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

			<Paper sx={{ p: 2.5, borderRadius: 4 }}>
				<Stack spacing={1.5}>
					<Typography variant="h6" sx={{ color: '#123B66', fontWeight: 700 }}>
						Kontak
					</Typography>
					<Divider />
					<FieldItem label="Phone Number" value={profile?.phoneNumber} />
					<FieldItem label="Email" value={profile?.email} />
				</Stack>
			</Paper>
		</Stack>
	);
}

export default EmployeeProfilePage;
