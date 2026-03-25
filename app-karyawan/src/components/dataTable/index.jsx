import { useEffect, useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import { DataGrid } from '@mui/x-data-grid';

const DEFAULT_GRID_HEIGHT = 540;
const DEFAULT_PAGE_SIZE = 15;
const DEFAULT_PAGE_SIZE_OPTIONS = [15, 30, 50, 100];

const PAPER_SX = {
	borderRadius: 3,
	overflow: 'hidden',
	borderColor: 'rgba(15, 23, 42, 0.12)',
	boxShadow: '0 12px 30px rgba(15, 23, 42, 0.06)',
	backgroundColor: '#FFFFFF',
};

const GRID_WRAPPER_SX = {
	width: '100%',
	'& .MuiDataGrid-root': {
		border: 'none',
	},
	'& .MuiDataGrid-columnHeaders': {
		backgroundColor: '#F4F7FB',
		borderBottom: '1px solid rgba(15, 23, 42, 0.12)',
		borderTop: '1px solid rgba(15, 23, 42, 0.02)',
	},
	'& .MuiDataGrid-columnHeaderTitle': {
		fontWeight: 800,
		fontSize: '0.78rem',
		letterSpacing: '0.02em',
		color: '#20324A',
	},
	'& .MuiDataGrid-cell': {
		borderBottom: '1px solid rgba(15, 23, 42, 0.08)',
		alignItems: 'center',
		py: 1.15,
	},
	'& .MuiDataGrid-row:hover': {
		backgroundColor: 'rgba(25, 118, 210, 0.03)',
	},
	'& .MuiDataGrid-row.Mui-selected': {
		backgroundColor: 'rgba(25, 118, 210, 0.06)',
	},
	'& .MuiDataGrid-row.Mui-selected:hover': {
		backgroundColor: 'rgba(25, 118, 210, 0.08)',
	},
	'& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus': {
		outline: 'none',
	},
	'& .MuiDataGrid-columnSeparator': {
		color: 'rgba(15, 23, 42, 0.12)',
	},
	'& .MuiDataGrid-footerContainer': {
		borderTop: '1px solid rgba(15, 23, 42, 0.08)',
		backgroundColor: '#FBFCFE',
	},
};

const GRID_SX = {
	'& .MuiDataGrid-columnHeaderCheckbox .MuiCheckbox-root': {
		color: '#1976d2',
	},
	'& .MuiDataGrid-columnHeader': {
		position: 'relative',
	},
	'& .MuiDataGrid-columnHeader::after': {
		content: '""',
		position: 'absolute',
		top: 10,
		right: 0,
		width: 3,
		height: 'calc(100% - 20px)',
		borderRadius: 999,
		backgroundColor: 'transparent',
		transition: 'background-color 0.2s ease',
	},
	'& .MuiDataGrid-columnHeader:hover::after': {
		backgroundColor: 'rgba(25, 118, 210, 0.2)',
	},
	'& .MuiDataGrid-row': {
		cursor: 'context-menu',
	},
};

function getInitialColumnWidths(columns = []) {
	return columns.reduce((accumulator, column) => {
		const configuredWidth = column.width ?? column.minWidth;

		if (column.field && configuredWidth) {
			accumulator[column.field] = configuredWidth;
		}

		return accumulator;
	}, {});
}

function getColumnMinWidth(columns, field) {
	const safeColumns = columns || [];
	const column = safeColumns.find((item) => item.field === field);
	const rawMinWidth = column?.minWidth ?? 80;
	return Number.parseFloat(rawMinWidth) || 80;
}

function getDefaultRowId(row) {
	return row.id;
}

export function createRowNumberColumn(overrides = {}) {
	const defaultRenderCell = (params) => {
		const rowIndex = params.api.getRowIndexRelativeToVisibleRows(params.id);

		return (
			<Typography variant="body2" sx={{ fontWeight: 700, color: '#123B66' }}>
				{rowIndex != null ? rowIndex + 1 : params.value}
			</Typography>
		);
	};

	return {
		field: 'id',
		headerName: 'NO',
		width: 88,
		sortable: true,
		...overrides,
		renderCell: overrides.renderCell || defaultRenderCell,
	};
}

/**
 * @param {object} props
 * @param {Array} props.rows
 * @param {Array} props.columns
 * @param {Function=} props.getRowId
 * @param {Function=} props.getContextMenuActions
 * @param {Array=} props.rowSelectionModel
 * @param {Function=} props.onRowSelectionModelChange
 * @param {boolean=} props.checkboxSelection
 * @param {boolean=} props.disableRowSelectionOnClick
 * @param {boolean=} props.hideFooterSelectedRowCount
 * @param {number=} props.height
 * @param {number=} props.initialPageSize
 * @param {number[]=} props.pageSizeOptions
 * @param {string=} props.columnResizeKey
 * @param {object=} props.paperSx
 * @param {object=} props.gridWrapperSx
 * @param {object=} props.gridSx
 * @param {React.ReactNode=} props.footerContent
 */
function EnhancedTable(props) {
	const {
		rows,
		columns,
		getRowId = getDefaultRowId,
		getContextMenuActions,
		rowSelectionModel,
		onRowSelectionModelChange,
		checkboxSelection = false,
		disableRowSelectionOnClick = true,
		hideFooterSelectedRowCount = true,
		height = DEFAULT_GRID_HEIGHT,
		initialPageSize = DEFAULT_PAGE_SIZE,
		pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
		columnResizeKey,
		paperSx,
		gridWrapperSx,
		gridSx,
		footerContent,
	} = props;

	const [paginationModel, setPaginationModel] = useState({
		page: 0,
		pageSize: initialPageSize,
	});
	const [contextMenu, setContextMenu] = useState(null);
	const [columnWidths, setColumnWidths] = useState(() => {
		const fallbackWidths = getInitialColumnWidths(columns);

		if (!columnResizeKey || typeof window === 'undefined') {
			return fallbackWidths;
		}

		try {
			return {
				...fallbackWidths,
				...JSON.parse(window.localStorage.getItem(`table-widths:${columnResizeKey}`) || '{}'),
			};
		} catch (error) {
			return fallbackWidths;
		}
	});

	const rowLookup = useMemo(() => new Map(rows.map((row) => [String(getRowId(row)), row])), [getRowId, rows]);

	const resolvedColumns = useMemo(
		() =>
			columns.map((column) => ({
				...column,
				width: column.field
					? columnWidths[column.field] ?? column.width ?? column.minWidth ?? 120
					: column.width,
				flex: undefined,
			})),
		[columns, columnWidths],
	);

	useEffect(() => {
		setColumnWidths((currentWidths) => ({
			...getInitialColumnWidths(columns),
			...currentWidths,
		}));
	}, [columns]);

	useEffect(() => {
		if (!columnResizeKey || typeof window === 'undefined') {
			return;
		}

		window.localStorage.setItem(`table-widths:${columnResizeKey}`, JSON.stringify(columnWidths));
	}, [columnResizeKey, columnWidths]);

	const closeContextMenu = () => {
		setContextMenu(null);
	};

	const getAvailableContextActions = (row) =>
		(typeof getContextMenuActions === 'function' ? getContextMenuActions(row) : []).filter(
			(action) => action && typeof action.label === 'string' && typeof action.onClick === 'function',
		);

	const handleColumnResizeStart = (event, field) => {
		event.preventDefault();
		event.stopPropagation();

		const initialWidth = columnWidths[field] ?? columns.find((column) => column.field === field)?.width ?? 120;
		const minWidth = getColumnMinWidth(columns, field);
		const startX = event.clientX;

		const handleMouseMove = (moveEvent) => {
			const nextWidth = Math.max(minWidth, Math.round(initialWidth + (moveEvent.clientX - startX)));

			setColumnWidths((currentWidths) => {
				if (currentWidths[field] === nextWidth) {
					return currentWidths;
				}

				return {
					...currentWidths,
					[field]: nextWidth,
				};
			});
		};

		const handleMouseUp = () => {
			window.removeEventListener('mousemove', handleMouseMove);
			window.removeEventListener('mouseup', handleMouseUp);
		};

		window.addEventListener('mousemove', handleMouseMove);
		window.addEventListener('mouseup', handleMouseUp);
	};

	const handleColumnHeaderMouseDown = (event) => {
		if (event.button !== 0) {
			return;
		}

		const headerElement = event.target.closest('.MuiDataGrid-columnHeader');
		const field = headerElement?.getAttribute('data-field');

		if (!headerElement || !field || field === '__check__') {
			return;
		}

		const headerRect = headerElement.getBoundingClientRect();
		const isInResizeZone = event.clientX >= headerRect.right - 10;

		if (!isInResizeZone) {
			return;
		}

		handleColumnResizeStart(event, field);
	};

	const handleGridContextMenu = (event) => {
		const rowElement = event.target.closest('.MuiDataGrid-row');

		if (
			!rowElement ||
			event.target.closest('.MuiDataGrid-cellCheckbox') ||
			event.target.closest(
				'button, a, input, textarea, select, [role="button"], [data-disable-row-context-menu="true"]',
			)
		) {
			closeContextMenu();
			return;
		}

		const row = rowLookup.get(rowElement.getAttribute('data-id'));
		const actions = getAvailableContextActions(row);

		if (!row || !actions.length) {
			closeContextMenu();
			return;
		}

		event.preventDefault();
		setContextMenu({
			mouseX: event.clientX + 2,
			mouseY: event.clientY - 6,
			row,
			actions,
		});
	};

	const handleContextAction = (action) => {
		if (!contextMenu?.row || !action || typeof action.onClick !== 'function' || action.disabled) {
			return;
		}

		const { row } = contextMenu;
		closeContextMenu();
		action.onClick(row);
	};

	return (
		<Paper variant="outlined" sx={{ ...PAPER_SX, ...paperSx }}>
			<Box
				sx={{
					height,
					...GRID_WRAPPER_SX,
					...gridWrapperSx,
				}}
				onMouseDownCapture={handleColumnHeaderMouseDown}
				onContextMenu={handleGridContextMenu}
			>
				<DataGrid
					rows={rows}
					columns={resolvedColumns}
					getRowId={getRowId}
					density="compact"
					checkboxSelection={checkboxSelection}
					disableRowSelectionOnClick={disableRowSelectionOnClick}
					rowSelectionModel={rowSelectionModel}
					onRowSelectionModelChange={onRowSelectionModelChange}
					pagination
					paginationModel={paginationModel}
					onPaginationModelChange={setPaginationModel}
					pageSizeOptions={pageSizeOptions}
					columnHeaderHeight={56}
					rowHeight={52}
					hideFooterSelectedRowCount={hideFooterSelectedRowCount}
					showCellVerticalBorder
					showColumnVerticalBorder
					sx={{
						...GRID_SX,
						...gridSx,
					}}
				/>
				<Menu
					open={contextMenu !== null}
					onClose={closeContextMenu}
					anchorReference="anchorPosition"
					anchorPosition={
						contextMenu !== null ? { top: contextMenu.mouseY, left: contextMenu.mouseX } : undefined
					}
				>
					{contextMenu?.actions?.map((action) => (
						<MenuItem
							key={action.key || action.label}
							onClick={() => handleContextAction(action)}
							disabled={Boolean(action.disabled)}
						>
							{action.icon ? <ListItemIcon sx={{ minWidth: 32 }}>{action.icon}</ListItemIcon> : null}
							<ListItemText>{action.label}</ListItemText>
						</MenuItem>
					))}
				</Menu>
			</Box>
			{footerContent || null}
		</Paper>
	);
}

export default EnhancedTable;
