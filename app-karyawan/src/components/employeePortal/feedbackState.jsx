import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

function FeedbackState({ type = 'info', title, description, loading = false, actionLabel, onAction }) {
	if (loading) {
		return (
			<Paper sx={{ borderRadius: 4, p: 4 }}>
				<Stack spacing={2} alignItems="center">
					<CircularProgress />
					<Typography variant="body2" color="text.secondary">
						Memuat data...
					</Typography>
				</Stack>
			</Paper>
		);
	}

	return (
		<Paper sx={{ borderRadius: 4, p: 3 }}>
			<Stack spacing={2}>
				<Alert severity={type}>{title}</Alert>
				{description ? (
					<Typography variant="body2" color="text.secondary">
						{description}
					</Typography>
				) : null}
				{actionLabel && onAction ? (
					<Box>
						<Button variant="contained" onClick={onAction}>
							{actionLabel}
						</Button>
					</Box>
				) : null}
			</Stack>
		</Paper>
	);
}

export default FeedbackState;
