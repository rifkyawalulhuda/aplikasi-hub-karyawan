import { useEffect, useState } from 'react';

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
			sx={{
				p: 2.5,
				borderRadius: 4,
				background: 'linear-gradient(145deg, #123B66 0%, #235D96 54%, #4C9AE8 100%)',
				color: '#FFFFFF',
			}}
		>
			<Stack spacing={1.5}>
				<Stack direction="row" spacing={1.25} alignItems="center">
					<DownloadForOfflineOutlinedIcon />
					<Typography variant="h6" sx={{ color: '#FFFFFF' }}>
						Install aplikasi
					</Typography>
				</Stack>
				<Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.82)' }}>
					Pasang Hub Karyawan di layar utama HP agar akses login dan informasi karyawan lebih cepat.
				</Typography>
				<Button
					variant="contained"
					onClick={handleInstall}
					sx={{
						alignSelf: 'flex-start',
						bgcolor: '#FFFFFF',
						color: '#123B66',
						'&:hover': {
							bgcolor: '#EAF3FF',
						},
					}}
				>
					Install Sekarang
				</Button>
			</Stack>
		</Paper>
	);
}

export default InstallAppCard;
