import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

function Footer() {
	return (
		<Box bgcolor={(theme) => theme.palette.background.paper} py={3} borderTop={1} borderColor="cuaternary.300">
			<Container maxWidth="lg">
				<Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
					<Typography variant="body1" textAlign="center">
						Copyright 2023. All rights reserved. Slim React MUI Template
					</Typography>
					<Typography variant="subtitle1" textAlign="center">
						Built by{' '}
						<Link
							underline="hover"
							sx={{
								cursor: 'pointer',
							}}
							href="https://antonioayola.netlify.app/"
							target="_blank"
							rel="noreferrer noopener"
							fontWeight="medium"
						>
							@Antonio Ayola
						</Link>{' '}
						with care.
					</Typography>
				</Stack>
			</Container>
		</Box>
	);
}

export default Footer;
