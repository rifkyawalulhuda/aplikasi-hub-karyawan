import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { formatGuidanceDate } from './constants';

const PAGE_WIDTH = '210mm';
const PAGE_HEIGHT = '297mm';
const FONT_FAMILY = '"Arial", "Helvetica", sans-serif';
const INFO_LINE_HEIGHT = '12.24pt';

const meetingMarkerPositions = {
	1: 148.58,
	2: 161.99,
	3: 175.44,
	4: 188.86,
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
				top: '138.65pt',
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

function GuidancePrintDocument({ record }) {
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
					backgroundImage: 'url("/forms/guidance-record-template.png")',
					backgroundRepeat: 'no-repeat',
					backgroundSize: '100% 100%',
					backgroundPosition: 'center',
					fontFamily: FONT_FAMILY,
					'@media print': {
						width: PAGE_WIDTH,
						height: PAGE_HEIGHT,
					},
				}}
			>
				<MeetingNumberMarker value={record.meetingNumber} />

				<InfoValue value={formatGuidanceDate(record.meetingDate)} left={146.06} top={144.2} width={120} />
				<InfoValue value={record.meetingTime} left={146.06} top={156.44} width={120} />
				<InfoValue value={record.location} left={146.06} top={168.68} width={120} />

				<InfoValue
					value={[
						record.employeeName,
						record.employeeNo,
						record.departmentName,
						record.positionName,
						record.rank,
					].join('\n')}
					left={405.55}
					top={132.2}
					width={126}
				/>

				<SectionText value={record.problemFaced} left={62.4} top={252} width={458} height={90} />
				<SectionText value={record.problemCause} left={62.4} top={370} width={458} height={106} />
				<SectionText value={record.problemSolving} left={62.4} top={505} width={458} height={130} />

				<Box
					sx={{
						position: 'absolute',
						inset: 0,
						pointerEvents: 'none',
						zIndex: 0,
					}}
				/>
			</Box>
		</Box>
	);
}

export default GuidancePrintDocument;
