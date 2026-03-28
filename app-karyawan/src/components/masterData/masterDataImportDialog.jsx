import { useRef, useState } from 'react';
import { useSnackbar } from 'notistack';

import AttachFileOutlinedIcon from '@mui/icons-material/AttachFileOutlined';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { downloadFile } from '@/services/api';

function MasterDataImportDialog({ open, loading, title, description, templateHref, onClose, onImport }) {
	const { enqueueSnackbar } = useSnackbar();
	const inputRef = useRef(null);
	const [selectedFile, setSelectedFile] = useState(null);
	const [downloadingTemplate, setDownloadingTemplate] = useState(false);

	const handleClose = () => {
		if (loading || downloadingTemplate) {
			return;
		}

		setSelectedFile(null);
		onClose();
	};

	const handleFileChange = (event) => {
		setSelectedFile(event.target.files?.[0] || null);
	};

	const handleImport = async () => {
		if (!selectedFile) {
			return;
		}

		const isSuccess = await onImport(selectedFile);

		if (isSuccess && inputRef.current) {
			inputRef.current.value = '';
			setSelectedFile(null);
		}
	};

	const handleDownloadTemplate = async () => {
		if (!templateHref || downloadingTemplate) {
			return;
		}

		setDownloadingTemplate(true);

		try {
			const fallbackFileName = templateHref.split('/').filter(Boolean).pop() || 'template.xlsx';
			await downloadFile(templateHref, fallbackFileName);
		} catch (error) {
			enqueueSnackbar(error.message || 'Download template gagal.', {
				variant: 'error',
			});
		} finally {
			setDownloadingTemplate(false);
		}
	};

	return (
		<Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
			<DialogTitle>{title}</DialogTitle>
			<DialogContent>
				<Stack spacing={2} pt={1}>
					<Typography variant="body2" color="text.secondary">
						{description}
					</Typography>
					<Button
						onClick={handleDownloadTemplate}
						disabled={!templateHref || loading || downloadingTemplate}
						variant="outlined"
						startIcon={<DownloadOutlinedIcon />}
					>
						{downloadingTemplate ? 'Mengunduh...' : 'Download Template'}
					</Button>
					<input
						ref={inputRef}
						type="file"
						accept=".xlsx"
						onChange={handleFileChange}
						style={{ display: 'none' }}
						id="master-data-import-input"
					/>
					<Button
						component="label"
						htmlFor="master-data-import-input"
						variant="outlined"
						startIcon={<AttachFileOutlinedIcon />}
					>
						Pilih File Excel
					</Button>
					<Typography variant="body2" color={selectedFile ? 'text.primary' : 'text.secondary'}>
						{selectedFile ? selectedFile.name : 'Belum ada file dipilih.'}
					</Typography>
				</Stack>
			</DialogContent>
			<DialogActions sx={{ px: 3, pb: 3 }}>
				<Button onClick={handleClose} disabled={loading || downloadingTemplate} color="inherit">
					Batal
				</Button>
				<Button
					onClick={handleImport}
					disabled={loading || downloadingTemplate || !selectedFile}
					variant="contained"
					startIcon={<CloudUploadOutlinedIcon />}
				>
					{loading ? 'Mengimport...' : 'Import Excel'}
				</Button>
			</DialogActions>
		</Dialog>
	);
}

export default MasterDataImportDialog;
