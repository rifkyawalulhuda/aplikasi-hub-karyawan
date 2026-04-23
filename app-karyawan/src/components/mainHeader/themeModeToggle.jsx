import { useDispatch, useSelector } from '@/store';
import { setConfigKey } from '@/store/theme';
import { selectThemeMode } from '@/store/theme/selectors';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Tooltip from '@mui/material/Tooltip';

import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';

function ThemeModeToggle() {
	const dispatch = useDispatch();
	const mode = useSelector(selectThemeMode);
	const isDarkMode = mode === 'dark';

	const handleChange = (_event, checked) => {
		dispatch(setConfigKey({ key: 'mode', value: checked ? 'dark' : 'light' }));
	};

	return (
		<Tooltip title={isDarkMode ? 'Beralih ke light mode' : 'Beralih ke dark mode'}>
			<Stack
				direction="row"
				alignItems="center"
				spacing={0.75}
				sx={{
					display: {
						xs: 'none',
						md: 'inline-flex',
					},
					px: 1,
					py: 0.4,
					borderRadius: 999,
					border: '1px solid',
					borderColor: 'divider',
					backgroundColor: 'background.paper',
					flexShrink: 0,
				}}
			>
				<LightModeOutlinedIcon
					fontSize="small"
					sx={{
						color: isDarkMode ? 'text.disabled' : 'primary.main',
					}}
				/>
				<Box sx={{ display: 'flex', alignItems: 'center' }}>
					<Switch
						checked={isDarkMode}
						onChange={handleChange}
						inputProps={{
							'aria-label': 'Toggle admin light or dark mode',
						}}
						size="small"
					/>
				</Box>
				<DarkModeOutlinedIcon
					fontSize="small"
					sx={{
						color: isDarkMode ? 'primary.main' : 'text.disabled',
					}}
				/>
			</Stack>
		</Tooltip>
	);
}

export default ThemeModeToggle;
