import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';

function TileSkeleton() {
	return (
		<Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 2.25, height: '100%' }}>
			<Stack direction="row" justifyContent="space-between">
				<Skeleton variant="text" width="60%" height={18} />
				<Skeleton variant="rounded" width={34} height={34} />
			</Stack>
			<Skeleton variant="text" width="45%" height={44} sx={{ mt: 1 }} />
			<Skeleton variant="text" width="75%" height={16} />
		</Box>
	);
}

function PanelSkeleton({ height = 320 }) {
	return (
		<Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 2.5, height: '100%' }}>
			<Skeleton variant="text" width="40%" height={22} />
			<Skeleton variant="text" width="60%" height={16} />
			<Skeleton variant="rounded" height={height} sx={{ mt: 2 }} />
		</Box>
	);
}

/** Layout-matched placeholder so the first paint mirrors the final grid. */
function DashboardSkeleton() {
	return (
		<Stack spacing={2.5} aria-busy="true" aria-label="Memuat dashboard">
			<Grid container spacing={2}>
				{Array.from({ length: 5 }).map((_, index) => (
					<Grid item xs={12} sm={6} md={4} lg={2.4} key={index}>
						<TileSkeleton />
					</Grid>
				))}
			</Grid>

			<Grid container spacing={2}>
				<Grid item xs={12} lg={7}>
					<PanelSkeleton height={300} />
				</Grid>
				<Grid item xs={12} lg={5}>
					<PanelSkeleton height={300} />
				</Grid>
			</Grid>

			<Grid container spacing={2}>
				<Grid item xs={12} lg={7}>
					<PanelSkeleton height={280} />
				</Grid>
				<Grid item xs={12} lg={5}>
					<PanelSkeleton height={280} />
				</Grid>
			</Grid>
		</Stack>
	);
}

export default DashboardSkeleton;
