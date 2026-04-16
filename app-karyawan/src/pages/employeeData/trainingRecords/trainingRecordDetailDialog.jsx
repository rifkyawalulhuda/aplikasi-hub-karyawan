import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { formatTrainingDate, formatTrainingTypeLabel } from './utils';

function TrainingRecordDetailDialog({ open, data, onClose }) {
	return (
		<Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
			<DialogTitle>Detail Pelatihan Karyawan</DialogTitle>
			<DialogContent>
				<Stack spacing={2} pt={1}>
					<Grid container spacing={2}>
						<Grid item xs={12} md={4}>
							<TextField label="NO" value={data?.id || '-'} fullWidth disabled />
						</Grid>
						<Grid item xs={12} md={4}>
							<TextField
								label="Jenis Pelatihan"
								value={formatTrainingTypeLabel(data?.trainingType)}
								fullWidth
								disabled
							/>
						</Grid>
						<Grid item xs={12} md={4}>
							<TextField label="Jumlah Hari" value={data?.dayCount ?? '-'} fullWidth disabled />
						</Grid>
						<Grid item xs={12}>
							<Typography variant="subtitle1" fontWeight={700}>
								Nama Peserta
							</Typography>
							<Divider sx={{ my: 1.5 }} />
							<Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
								{data?.participantNames?.length ? (
									data.participantNames.map((name, index) => (
										<Chip key={`${name}-${index}`} label={name} variant="outlined" />
									))
								) : (
									<Typography variant="body2" color="text.secondary">
										-
									</Typography>
								)}
							</Stack>
						</Grid>
						<Grid item xs={12} md={12}>
							<TextField label="Materi Pelatihan" value={data?.material || '-'} fullWidth disabled />
						</Grid>
					</Grid>

					<Stack spacing={1}>
						<Typography variant="subtitle1" fontWeight={700}>
							Trainer
						</Typography>
						<Divider />
						<Grid container spacing={2} pt={0.5}>
							<Grid item xs={12} md={6}>
								<TextField label="Lembaga" value={data?.trainerInstitution || '-'} fullWidth disabled />
							</Grid>
							<Grid item xs={12} md={6}>
								<TextField label="Nama" value={data?.trainerName || '-'} fullWidth disabled />
							</Grid>
						</Grid>
					</Stack>

					<Grid container spacing={2}>
						<Grid item xs={12} md={6}>
							<TextField
								label="Dari Tanggal"
								value={formatTrainingDate(data?.startDate)}
								fullWidth
								disabled
							/>
						</Grid>
						<Grid item xs={12} md={6}>
							<TextField
								label="Sampai Tanggal"
								value={formatTrainingDate(data?.endDate)}
								fullWidth
								disabled
							/>
						</Grid>
						<Grid item xs={12}>
							<TextField
								label="Alamat Pelatihan"
								value={data?.address || '-'}
								fullWidth
								disabled
								multiline
							/>
						</Grid>
						<Grid item xs={12}>
							<TextField label="Keterangan" value={data?.notes || '-'} fullWidth disabled multiline />
						</Grid>
					</Grid>
				</Stack>
			</DialogContent>
			<DialogActions sx={{ px: 3, pb: 3 }}>
				<Button onClick={onClose} variant="contained">
					Tutup
				</Button>
			</DialogActions>
		</Dialog>
	);
}

export default TrainingRecordDetailDialog;
