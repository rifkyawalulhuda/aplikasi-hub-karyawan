import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';

function LeaveDecisionDialog({ open, loading, title, requireNote = false, onClose, onSubmit }) {
	const {
		control,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm({
		defaultValues: {
			note: '',
		},
	});

	useEffect(() => {
		if (open) {
			reset({ note: '' });
		}
	}, [open, reset]);

	return (
		<Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="sm">
			<DialogTitle>{title}</DialogTitle>
			<DialogContent>
				<Controller
					name="note"
					control={control}
					rules={requireNote ? { required: 'Catatan wajib diisi.' } : {}}
					render={({ field }) => (
						<TextField
							{...field}
							label={requireNote ? 'Catatan' : 'Catatan (Opsional)'}
							fullWidth
							multiline
							minRows={4}
							sx={{ mt: 1 }}
							error={Boolean(errors.note)}
							helperText={errors.note?.message || ' '}
						/>
					)}
				/>
			</DialogContent>
			<DialogActions sx={{ px: 3, pb: 3 }}>
				<Button onClick={onClose} disabled={loading} color="inherit">
					Batal
				</Button>
				<Button onClick={handleSubmit(onSubmit)} variant="contained" disabled={loading}>
					{loading ? 'Memproses...' : 'Kirim'}
				</Button>
			</DialogActions>
		</Dialog>
	);
}

export default LeaveDecisionDialog;
