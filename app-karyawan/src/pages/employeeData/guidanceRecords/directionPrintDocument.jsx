import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

const PAGE_WIDTH = '210mm';
const PAGE_HEIGHT = '297mm';
const FONT_FAMILY = '"Arial", "Helvetica", sans-serif';
const INFO_LINE_HEIGHT = '12.24pt';

const meetingMarkerPositions = {
	1: 162.74,
	2: 176.17,
	3: 189.6,
	4: 203.02,
};

function PositionedText({ children, left, top, width, height, sx }) {
	return (
		<Box
			sx={{
				position: 'absolute',
				left: `${left}pt`,
				top: `${top}pt`,
				width: width ? `${width}pt` : 'auto',
				height: height ? `${height}pt` : 'auto',
				zIndex: 1,
				...sx,
			}}
		>
			{children}
		</Box>
	);
}

function MeetingNumberMarker({ value }) {
	const position = meetingMarkerPositions[value];

	if (!position) {
		return null;
	}

	return (
		<Box
			sx={{
				position: 'absolute',
				left: `${position}pt`,
				top: '140.8pt',
				width: '11pt',
				height: '11pt',
				transform: 'translate(-50%, -50%)',
				border: '1.4pt solid #111',
				borderRadius: '50%',
				zIndex: 1,
			}}
		/>
	);
}

function InfoValue({ value, left, top, width }) {
	return (
		<PositionedText left={left} top={top} width={width}>
			<Typography
				sx={{
					fontFamily: FONT_FAMILY,
					fontSize: '9.7pt',
					lineHeight: INFO_LINE_HEIGHT,
					whiteSpace: 'pre-line',
					color: 'common.black',
				}}
			>
				{value || ''}
			</Typography>
		</PositionedText>
	);
}

function SectionText({ value, left, top, width, height }) {
	return (
		<PositionedText left={left} top={top} width={width} height={height}>
			<Typography
				sx={{
					fontFamily: FONT_FAMILY,
					fontSize: '9.4pt',
					lineHeight: 1.45,
					whiteSpace: 'pre-wrap',
					wordBreak: 'break-word',
					color: 'common.black',
				}}
			>
				{value || ''}
			</Typography>
		</PositionedText>
	);
}

function DirectionPrintDocument({ record }) {
	return (
		<Box
			className="guidance-print-page"
			sx={{
				width: PAGE_WIDTH,
				height: PAGE_HEIGHT,
				mx: 'auto',
				bgcolor: 'common.white',
				color: 'common.black',
				boxShadow: '0 12px 30px rgba(15, 23, 42, 0.12)',
				overflow: 'hidden',
				breakInside: 'avoid-page',
				breakAfter: 'avoid-page',
				pageBreakInside: 'avoid',
				pageBreakAfter: 'avoid',
				'@media print': {
					width: PAGE_WIDTH,
					height: PAGE_HEIGHT,
					boxShadow: 'none',
					m: 0,
					overflow: 'hidden',
				},
			}}
		>
			<Box
				sx={{
					position: 'relative',
					width: PAGE_WIDTH,
					height: PAGE_HEIGHT,
					backgroundImage: 'url("/forms/direction-record-template.png")',
					backgroundRepeat: 'no-repeat',
					backgroundSize: '100% 100%',
					backgroundPosition: 'center',
					fontFamily: FONT_FAMILY,
				}}
			>
				<MeetingNumberMarker value={record.meetingNumber} />

				<InfoValue value={record.meetingDate} left={160.22} top={146.36} width={120} />
				<InfoValue value={record.meetingTime} left={160.22} top={158.6} width={120} />
				<InfoValue value={record.location} left={160.22} top={170.72} width={120} />

				<InfoValue
					value={[
						record.employeeName,
						record.employeeNo,
						record.departmentName,
						record.positionName,
						record.rank,
					].join('\n')}
					left={418.1}
					top={134.36}
					width={118}
				/>

				<SectionText value={record.problemFaced} left={76} top={253} width={452} height={79} />
				<SectionText value={record.problemFacedSecondary} left={76} top={352} width={452} height={92} />
				<SectionText value={record.problemCause} left={76} top={470} width={452} height={105} />
				<SectionText value={record.problemSolving} left={76} top={605} width={452} height={110} />
			</Box>
		</Box>
	);
}

export default DirectionPrintDocument;
