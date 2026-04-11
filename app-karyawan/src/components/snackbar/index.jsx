import { forwardRef } from 'react';
import { SnackbarProvider, enqueueSnackbar } from 'notistack';

import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import { alpha, useTheme } from '@mui/material/styles';

function MuiSnackbar(props) {
	const { message, severity, title, sx, alertProps } = props;
	const theme = useTheme();
	const isDarkMode = theme.palette.mode === 'dark';

	return (
		<Alert
			severity={severity}
			sx={{
				boxShadow: theme.shadows[27],
				border: '1px solid',
				borderColor: alpha(theme.palette.common.white, isDarkMode ? 0.1 : 0.16),
				backgroundColor: isDarkMode ? alpha(theme.palette.background.paper, 0.96) : alpha('#FFFFFF', 0.96),
				backdropFilter: 'blur(12px)',
				color: theme.palette.text.primary,
				'& .MuiAlert-icon': {
					alignItems: 'center',
				},
				...sx,
			}}
			{...alertProps}
		>
			<AlertTitle>{title}</AlertTitle>
			{message}
		</Alert>
	);
}

const MuiSnackbarVariant = forwardRef((props, ref) => (
	<div ref={ref}>
		<MuiSnackbar {...props} />
	</div>
));

export function Provider({ children }) {
	return (
		<SnackbarProvider
			maxSnack={3}
			anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
			Components={{
				muiSnackbar: MuiSnackbarVariant,
			}}
		>
			{children}
		</SnackbarProvider>
	);
}

export default enqueueSnackbar;
