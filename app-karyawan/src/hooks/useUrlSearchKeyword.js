import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

function useUrlSearchKeyword(paramName = 'search') {
	const [searchParams, setSearchParams] = useSearchParams();
	const keyword = searchParams.get(paramName) || '';

	const setKeyword = useCallback(
		(nextValue) => {
			const nextSearchParams = new URLSearchParams(searchParams);
			const normalizedValue = String(nextValue || '');

			if (normalizedValue) {
				nextSearchParams.set(paramName, normalizedValue);
			} else {
				nextSearchParams.delete(paramName);
			}

			setSearchParams(nextSearchParams, { replace: true });
		},
		[paramName, searchParams, setSearchParams],
	);

	return [keyword, setKeyword];
}

export default useUrlSearchKeyword;
