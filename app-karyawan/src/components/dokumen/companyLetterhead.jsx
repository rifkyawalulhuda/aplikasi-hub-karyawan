import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

const FONT_FAMILY = '"Arial", "Helvetica", sans-serif';
const LETTERHEAD_COLOR = '#0837d7';
const COMPANY_LINES = [
	'PT SANKYU INDONESIA INTERNATIONAL',
	'QUALITY, SAFETY, HEALTH, AND ENVIRONMENTAL DIVISION',
	'SISTEM MANAJEMEN TERINTEGRASI',
];
const LOGO_URL = '/forms/warning-letter-logos.png';

function CompanyLetterhead({ gap = 3.2 }) {
	return (
		<>
			<Stack direction="row" justifyContent="space-between" alignItems="flex-start">
				<Stack spacing={0.15}>
					{COMPANY_LINES.map((line) => (
						<Typography
							key={line}
							sx={{ fontFamily: FONT_FAMILY, fontSize: '8pt', fontWeight: 700, color: LETTERHEAD_COLOR }}
						>
							{line}
						</Typography>
					))}
				</Stack>
				<Box
					component="img"
					src={LOGO_URL}
					alt="Certification logos"
					sx={{ width: '44mm', height: 'auto', objectFit: 'contain' }}
				/>
			</Stack>
			<Box sx={{ borderTop: '1px solid #8e8e8e', mt: 0.7, mb: gap }} />
		</>
	);
}

export default CompanyLetterhead;
