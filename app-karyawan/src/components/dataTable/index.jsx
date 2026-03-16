import { useEffect, useMemo, useState } from 'react';
import Table from '@mui/material/Table';

import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';

function getInitialColumnWidths(headCells = []) {
	return headCells.reduce((accumulator, headCell) => {
		const configuredWidth = headCell.width ?? headCell.sx?.width ?? headCell.sx?.minWidth;

		if (configuredWidth) {
			accumulator[headCell.id] = configuredWidth;
		}

		return accumulator;
	}, {});
}

function descendingComparator(a, b, orderBy) {
	if (b[orderBy] < a[orderBy]) {
		return -1;
	}
	if (b[orderBy] > a[orderBy]) {
		return 1;
	}
	return 0;
}

function getComparator(order, orderBy) {
	return order === 'desc'
		? (a, b) => descendingComparator(a, b, orderBy)
		: (a, b) => -descendingComparator(a, b, orderBy);
}

function EnhancedTableHead(props) {
	const { order, orderBy, onRequestSort, headCells, columnWidths, onResizeStart, resizableColumns } = props;
	const createSortHandler = (property) => (event) => {
		onRequestSort(event, property);
	};

	return (
		<TableHead sx={{ bgcolor: 'background.default' }}>
			<TableRow>
				{headCells.map((headCell, i) => (
					<TableCell
						key={headCell.id || i}
						align={headCell.numeric ? 'right' : 'left'}
						padding={headCell.disablePadding ? 'none' : 'normal'}
						sortDirection={orderBy === headCell.id ? order : false}
						sx={{
							position: 'relative',
							...(columnWidths[headCell.id]
								? {
										width: columnWidths[headCell.id],
										minWidth: columnWidths[headCell.id],
										maxWidth: columnWidths[headCell.id],
								  }
								: {}),
							...headCell.sx,
						}}
					>
						<div style={{ paddingRight: resizableColumns ? 10 : 0 }}>
							{headCell.disableSort ? (
								headCell.label
							) : (
								<TableSortLabel
									active={orderBy === headCell.id}
									direction={orderBy === headCell.id ? order : 'asc'}
									onClick={createSortHandler(headCell.id)}
								>
									{headCell.label}
									{orderBy === headCell.id ? (
										<span
											style={{
												fontSize: '10px',
											}}
										>
											{order === 'desc' ? 'Descending' : 'Ascending'}
										</span>
									) : null}
								</TableSortLabel>
							)}
						</div>
						{resizableColumns && headCell.id ? (
							<button
								type="button"
								aria-label={`Resize column ${headCell.id}`}
								onMouseDown={(event) => onResizeStart(event, headCell.id)}
								style={{
									position: 'absolute',
									top: 0,
									right: 0,
									width: 10,
									height: '100%',
									cursor: 'col-resize',
									userSelect: 'none',
									border: 0,
									padding: 0,
									background: 'transparent',
								}}
							/>
						) : null}
					</TableCell>
				))}
			</TableRow>
		</TableHead>
	);
}

/**
 * @param {object} props
 * @param {Array} props.rows
 * @param {Function} props.render
 * @param {boolean} props.dense
 * @param {Object} props.emptyRowsHeight
 * @param {Boolean} props.stickyHeader
 * @param {object} props.tableContainerProps
 * @param {number=} props.initialRowsPerPage
 * @param {number[]=} props.rowsPerPageOptions
 * @param {boolean=} props.resizableColumns
 * @param {string=} props.columnResizeKey
 * @param {object=} props.tableSx
 */
function EnhancedTable(props) {
	const {
		rows,
		headCells,
		render,
		dense = false,
		emptyRowsHeight = { default: 76, dense: 43 },
		stickyHeader,
		tableContainerProps,
		initialRowsPerPage = 5,
		rowsPerPageOptions = [5, 10, 25],
		resizableColumns = false,
		columnResizeKey,
		tableSx,
	} = props;
	const [order, setOrder] = useState('desc');
	const [orderBy, setOrderBy] = useState('');
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage);
	const [columnWidths, setColumnWidths] = useState(() => {
		const fallbackWidths = getInitialColumnWidths(headCells);

		if (!columnResizeKey || typeof window === 'undefined') {
			return fallbackWidths;
		}

		try {
			const storedWidths = window.localStorage.getItem(`table-widths:${columnResizeKey}`);
			return storedWidths ? { ...fallbackWidths, ...JSON.parse(storedWidths) } : fallbackWidths;
		} catch (error) {
			return fallbackWidths;
		}
	});

	const visibleColumns = useMemo(
		() =>
			headCells.map((headCell) => ({
				id: headCell.id,
				width: columnWidths[headCell.id],
			})),
		[headCells, columnWidths],
	);

	const handleRequestSort = (event, property) => {
		const isAsc = orderBy === property && order === 'asc';
		setOrder(isAsc ? 'desc' : 'asc');
		setOrderBy(property);
	};

	const handleChangePage = (event, newPage) => {
		setPage(newPage);
	};

	const handleChangeRowsPerPage = (event) => {
		setRowsPerPage(parseInt(event.target.value, 10));
		setPage(0);
	};

	useEffect(() => {
		if (!columnResizeKey || typeof window === 'undefined') {
			return;
		}

		window.localStorage.setItem(`table-widths:${columnResizeKey}`, JSON.stringify(columnWidths));
	}, [columnResizeKey, columnWidths]);

	const handleResizeStart = (event, columnId) => {
		event.preventDefault();
		event.stopPropagation();

		const initialWidth =
			Number.parseFloat(columnWidths[columnId]) || event.currentTarget.parentElement.offsetWidth || 120;
		const startX = event.clientX;

		const handleMouseMove = (moveEvent) => {
			const nextWidth = Math.max(60, Math.round(initialWidth + (moveEvent.clientX - startX)));

			setColumnWidths((currentWidths) => ({
				...currentWidths,
				[columnId]: nextWidth,
			}));
		};

		const handleMouseUp = () => {
			window.removeEventListener('mousemove', handleMouseMove);
			window.removeEventListener('mouseup', handleMouseUp);
		};

		window.addEventListener('mousemove', handleMouseMove);
		window.addEventListener('mouseup', handleMouseUp);
	};

	const formatDisplayedRows = ({ from, to, count }) => `${from}-${to} of ${count !== -1 ? count : `more than ${to}`}`;

	// Avoid a layout jump when reaching the last page with empty rows.
	const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - rows.length) : 0;
	const sortedRows = rows.slice().sort(getComparator(order, orderBy));
	const paginatedRows = sortedRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

	return (
		<>
			<TableContainer {...tableContainerProps}>
				<Table
					sx={{ width: '100%', ...tableSx }}
					stickyHeader={stickyHeader}
					aria-labelledby="tableTitle"
					size={dense ? 'small' : 'medium'}
				>
					{resizableColumns ? (
						<colgroup>
							{visibleColumns.map((column, index) => (
								<col
									key={column.id || index}
									style={column.width ? { width: column.width } : undefined}
								/>
							))}
						</colgroup>
					) : null}
					<EnhancedTableHead
						order={order}
						orderBy={orderBy}
						onRequestSort={handleRequestSort}
						rowCount={rows.length}
						headCells={headCells}
						columnWidths={columnWidths}
						onResizeStart={handleResizeStart}
						resizableColumns={resizableColumns}
					/>
					<TableBody>
						{paginatedRows.map((row, i) =>
							render(row, i, {
								rowNumber: page * rowsPerPage + i + 1,
							}),
						)}
						{emptyRows > 0 && (
							<TableRow
								style={{
									height: (dense ? emptyRowsHeight.dense : emptyRowsHeight.default) * emptyRows,
								}}
							>
								<TableCell colSpan="100%" />
							</TableRow>
						)}
					</TableBody>
				</Table>
			</TableContainer>
			<TablePagination
				rowsPerPageOptions={rowsPerPageOptions}
				component="div"
				count={rows.length}
				rowsPerPage={rowsPerPage}
				page={page}
				onPageChange={handleChangePage}
				onRowsPerPageChange={handleChangeRowsPerPage}
				labelRowsPerPage="Rows per page"
				labelDisplayedRows={formatDisplayedRows}
			/>
		</>
	);
}

export default EnhancedTable;
