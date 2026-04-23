/* eslint-disable no-param-reassign */
import { createSlice } from '@reduxjs/toolkit';

export const ADMIN_THEME_STORAGE_KEY = 'hub-karyawan-admin-theme-config';
const LEGACY_THEME_STORAGE_KEY = 'SLIM_MUI_THEME_DATA';

const initialState = {
	themeConfig: {
		mode: 'light',
		stickyHeader: true,
		pageTransitions: false,
		fontFamily: 'Rubik',
		borderRadius: 2,
	},
};

const getInitialState = () => {
	if (typeof window === 'undefined') {
		return initialState;
	}

	const localStorageData =
		window.localStorage.getItem(ADMIN_THEME_STORAGE_KEY) || window.localStorage.getItem(LEGACY_THEME_STORAGE_KEY);

	if (localStorageData) {
		try {
			const parsedThemeConfig = JSON.parse(localStorageData);
			return {
				themeConfig: {
					...initialState.themeConfig,
					...parsedThemeConfig,
					mode: parsedThemeConfig?.mode === 'dark' ? 'dark' : 'light',
				},
			};
		} catch {
			return initialState;
		}
	}
	return initialState;
};

const useSlice = createSlice({
	name: 'themeSlice',
	initialState: getInitialState(),
	reducers: {
		setDefaultConfig: (state) => {
			state.themeConfig = initialState.themeConfig;
		},
		setConfig: (state, action) => {
			state.themeConfig = action.payload;
		},
		setConfigKey: (state, action) => {
			state.themeConfig[action.payload.key] = action.payload.value;
		},
	},
});

export const { setConfig, setDefaultConfig, setConfigKey } = useSlice.actions;

export default useSlice.reducer;
