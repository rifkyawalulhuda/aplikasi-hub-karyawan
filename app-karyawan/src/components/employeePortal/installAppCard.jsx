import { useEffect, useState } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import DownloadForOfflineOutlinedIcon from '@mui/icons-material/DownloadForOfflineOutlined';

function isStandaloneMode() {
	if (typeof window === 'undefined') {
		return false;
	}

	return window.matchMedia('(display-mode: standalone)').matches;
}

function InstallAppCard() {
	const [installEvent, setInstallEvent] = useState(null);
	const [hidden, setHidden] = useState(() => isStandaloneMode());

	useEffect(() => {
		const handleBeforeInstallPrompt = (event) => {
			event.preventDefault();
			setInstallEvent(event);
		};

		const handleInstalled = () => {
			setHidden(true);
			setInstallEvent(null);
		};

		window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
		window.addEventListener('appinstalled', handleInstalled);

		return () => {
			window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
			window.removeEventListener('appinstalled', handleInstalled);
		};
	}, []);

	const handleInstall = async () => {
		if (!installEvent) {
			return;
		}

		await installEvent.prompt();
		await installEvent.userChoice;
		setInstallEvent(null);
	};

	if (hidden || !installEvent) {
		return null;
	}

	return (
		<Paper
			elevation={0}
			sx={{
				p: 2,
				borderRadius: 5,
				border: '1px solid rgba(18,59,102,0.08)',
				backgroundColor: 'rgba(255,255,255,0.88)',
				boxShadow: '0 14px 34px rgba(18, 59, 102, 0.08)',
				backdropFilter: 'blur(10px)',
			}}
		>
			<Stack spacing={1.5}>
				<Stack direction="row" spacing={1.25} alignItems="center">
					<Box
						sx={{
							width: 40,
							height: 40,
							display: 'grid',
							placeItems: 'center',
							borderRadius: 3,
							bgcolor: 'rgba(58, 147, 242, 0.12)',
							color: '#2F74BC',
						}}
					>
						<DownloadForOfflineOutlinedIcon fontSize="small" />
					</Box>
					<Box>
						<Typography variant="subtitle1" sx={{ color: '#123B66', fontWeight: 700 }}>
							Install aplikasi
						</Typography>
						<Typography variant="body2" sx={{ color: '#6D84A0' }}>
							Simpan Portal Karyawan di layar utama HP.
						</Typography>
					</Box>
				</Stack>
				<Button
					variant="contained"
					onClick={handleInstall}
					sx={{
						alignSelf: 'flex-start',
						borderRadius: 3,
						background: 'linear-gradient(135deg, #123B66 0%, #3A93F2 100%)',
						boxShadow: '0 12px 24px rgba(58, 147, 242, 0.18)',
					}}
				>
					Install Sekarang
				</Button>
			</Stack>
		</Paper>
	);
}

export default InstallAppCard;
