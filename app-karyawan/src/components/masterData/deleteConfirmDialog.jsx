import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Typography from '@mui/material/Typography';

function DeleteConfirmDialog({ open, loading, title, itemName, onClose, onConfirm }) {
	return (
		<Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="xs">
			<DialogTitle>Hapus Data</DialogTitle>
			<DialogContent>
				<Typography variant="body1">
					Apakah Anda yakin ingin menghapus {title}{' '}
					<Typography component="span" fontWeight={700}>
						{itemName}
					</Typography>
					?
				</Typography>
			</DialogContent>
			<DialogActions sx={{ px: 3, pb: 3 }}>
				<Button onClick={onClose} disabled={loading} color="inherit">
					Batal
				</Button>
				<Button onClick={onConfirm} disabled={loading} color="error" variant="contained">
					{loading ? 'Menghapus...' : 'Hapus'}
				</Button>
			</DialogActions>
		</Dialog>
	);
}

export default DeleteConfirmDialog;
