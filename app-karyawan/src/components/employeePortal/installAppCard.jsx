import { useEffect, useState } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';

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
				border: (theme) => `1px solid ${theme.palette.employeeSurface.borderSoft}`,
				backgroundColor: (theme) => theme.palette.employeeSurface.soft,
				boxShadow: (theme) => theme.palette.employeeSurface.shadowSoft,
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
							bgcolor: (theme) =>
								alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.22 : 0.12),
							color: 'primary.main',
						}}
					>
						<DownloadForOfflineOutlinedIcon fontSize="small" />
					</Box>
					<Box>
						<Typography variant="subtitle1" sx={{ color: 'text.primary', fontWeight: 700 }}>
							Install aplikasi
						</Typography>
						<Typography variant="body2" color="text.secondary">
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
						background: (theme) =>
							`linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
					}}
				>
					Install Sekarang
				</Button>
			</Stack>
		</Paper>
	);
}

export default InstallAppCard;
