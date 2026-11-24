import { useEffect, useState } from 'react';
import useMediaQuery from '@mui/material/useMediaQuery';

export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/** True when the user asked the OS to reduce motion. */
export function useReducedMotion() {
	return useMediaQuery(REDUCED_MOTION_QUERY, { noSsr: true });
}

/**
 * Animates a number from 0 to `target` on mount / whenever the target changes.
 * Returns `target` unchanged when reduced motion is requested.
 */
export function useCountUp(target, { duration = 650 } = {}) {
	const reducedMotion = useReducedMotion();
	const numericTarget = Number(target) || 0;
	const [value, setValue] = useState(() => (reducedMotion ? numericTarget : 0));

	useEffect(() => {
		if (reducedMotion || numericTarget <= 0) {
			setValue(numericTarget);
			return undefined;
		}

		let frameId;
		const startTime = performance.now();

		const tick = (now) => {
			const progress = Math.min((now - startTime) / duration, 1);
			const eased = 1 - (1 - progress) ** 3;
			setValue(Math.round(numericTarget * eased));

			if (progress < 1) {
				frameId = requestAnimationFrame(tick);
			}
		};

		frameId = requestAnimationFrame(tick);

		return () => cancelAnimationFrame(frameId);
	}, [duration, numericTarget, reducedMotion]);

	return value;
}

/** Staggered entrance used by the dashboard cards; disabled under reduced motion. */
export function entranceSx(delay = 0) {
	return {
		'@keyframes dashboardEntrance': {
			from: { opacity: 0, transform: 'translateY(10px)' },
			to: { opacity: 1, transform: 'translateY(0)' },
		},
		animation: 'dashboardEntrance 420ms cubic-bezier(0.22, 1, 0.36, 1) both',
		animationDelay: `${delay}ms`,
		'@media (prefers-reduced-motion: reduce)': {
			animation: 'none',
		},
	};
}
