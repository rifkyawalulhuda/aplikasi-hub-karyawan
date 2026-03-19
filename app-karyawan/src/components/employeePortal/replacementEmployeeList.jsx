import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

function ReplacementEmployeeList({ items = [], emptyLabel = '-', textColor = 'text.secondary' }) {
	if (!items.length) {
		return (
			<Typography variant="body2" color={textColor}>
				{emptyLabel}
			</Typography>
		);
	}

	return (
		<Stack spacing={0.5}>
			{items.map((item, index) => (
				<Typography key={`${item.id}-${item.sequenceNo || index}`} variant="body2" color={textColor}>
					{`${index + 1}. ${item.fullName} (${item.employeeNo})`}
				</Typography>
			))}
		</Stack>
	);
}

export default ReplacementEmployeeList;
