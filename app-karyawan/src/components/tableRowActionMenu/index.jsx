import { useMemo, useState } from 'react';

import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';

import MoreVertOutlinedIcon from '@mui/icons-material/MoreVertOutlined';

function TableRowActionMenu({
	row,
	actions = [],
	tooltip = 'Aksi',
	buttonColor = 'primary',
	buttonSize = 'small',
	iconSize = 'small',
}) {
	const [anchorEl, setAnchorEl] = useState(null);
	const menuOpen = Boolean(anchorEl);

	const availableActions = useMemo(
		() =>
			actions.filter(
				(action) => action && typeof action.onClick === 'function' && typeof action.label === 'string',
			),
		[actions],
	);

	if (!availableActions.length) {
		return null;
	}

	const handleOpenMenu = (event) => {
		setAnchorEl(event.currentTarget);
	};

	const handleCloseMenu = () => {
		setAnchorEl(null);
	};

	const handleActionClick = (action) => {
		if (action.disabled) {
			return;
		}

		action.onClick(row);
		handleCloseMenu();
	};

	return (
		<>
			<Tooltip title={tooltip}>
				<IconButton color={buttonColor} size={buttonSize} onClick={handleOpenMenu}>
					<MoreVertOutlinedIcon fontSize={iconSize} />
				</IconButton>
			</Tooltip>
			<Menu
				anchorEl={anchorEl}
				open={menuOpen}
				onClose={handleCloseMenu}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
				transformOrigin={{ vertical: 'top', horizontal: 'right' }}
			>
				{availableActions.map((action) => (
					<MenuItem
						key={action.key || action.label}
						onClick={() => handleActionClick(action)}
						disabled={Boolean(action.disabled)}
					>
						{action.icon ? <ListItemIcon sx={{ minWidth: 32 }}>{action.icon}</ListItemIcon> : null}
						<ListItemText>{action.label}</ListItemText>
					</MenuItem>
				))}
			</Menu>
		</>
	);
}

export default TableRowActionMenu;
