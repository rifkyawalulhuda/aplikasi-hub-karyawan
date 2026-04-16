import { useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';

import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import calculateWorkingDays, { fetchNationalHolidays } from '@/utils/dateUtils';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';

function getDefaultReplacementEmployeeIds(initialValue = null) {
	if (initialValue?.replacementEmployees?.length > 0) {
		return [...initialValue.replacementEmployees]
			.sort((left, right) => (left.sequenceNo || 0) - (right.sequenceNo || 0))
			.map((item) => item.id);
	}

	if (initialValue?.replacementEmployeeId) {
		return [initialValue.replacementEmployeeId];
	}

	return [''];
}

function toDefaultValues(initialValue = null) {
	return {
		masterCutiKaryawanId: initialValue?.masterCutiKaryawanId || '',
		leaveDays: initialValue?.leaveDays || '',
		periodStart: initialValue?.periodStart || '',
		periodEnd: initialValue?.periodEnd || '',
		leaveAddress: initialValue?.leaveAddress || '',
		leaveReason: initialValue?.leaveReason || '',
		replacementEmployeesInput: getDefaultReplacementEmployeeIds(initialValue).map((replacementEmployeeId) => ({
			replacementEmployeeId,
		})),
	};
}

function formatDateForDisplay(value) {
	if (!value) {
		return '-';
	}

	const raw = String(value).trim();
	const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);

	if (!isoMatch) {
		return raw;
	}

	const [, year, month, day] = isoMatch;
	return `${day}/${month}/${year}`;
}

const DEFAULT_REPLACEMENT_OPTIONS_MESSAGE =
	'Pilih periode cuti terlebih dahulu untuk melihat kandidat pengganti yang valid.';

function LeaveRequestFormDialog({
	open,
	loading,
	leaveTypeOptions = [],
	replacementOptions = [],
	replacementOptionsMessage = '',
	submissionDate = '',
	initialValue,
	title,
	onClose,
	onSubmit,
	onLoadReplacementOptions,
	onInvalidSubmit,
}) {
	const theme = useTheme();
	const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
	const {
		control,
		handleSubmit,
		reset,
		setValue,
		watch,
		formState: { errors },
	} = useForm({
		defaultValues: toDefaultValues(initialValue),
		mode: 'onChange',
	});
	const { fields, append, remove } = useFieldArray({
		control,
		name: 'replacementEmployeesInput',
	});

	const selectedLeaveTypeId = Number(watch('masterCutiKaryawanId'));
	const leaveDaysRawValue = watch('leaveDays');
	const replacementEmployeesInput = watch('replacementEmployeesInput') || [];
	const replacementEmployeeIds = replacementEmployeesInput.map((item) => item?.replacementEmployeeId);
	const leaveDaysValue =
		leaveDaysRawValue === '' || typeof leaveDaysRawValue === 'undefined' ? Number.NaN : Number(leaveDaysRawValue);
	const selectedLeaveType = useMemo(
		() => leaveTypeOptions.find((option) => option.id === selectedLeaveTypeId) || null,
		[leaveTypeOptions, selectedLeaveTypeId],
	);
	const availableLeaveBalance = selectedLeaveType?.availableLeaveBalance ?? null;
	const remainingLeavePreview =
		availableLeaveBalance == null || Number.isNaN(leaveDaysValue) ? '' : availableLeaveBalance - leaveDaysValue;
	const leaveDaysExceeded =
		availableLeaveBalance != null && !Number.isNaN(leaveDaysValue) && leaveDaysValue > availableLeaveBalance;
	const availableLeaveHelperText = selectedLeaveType
		? 'Saldo jenis cuti yang dipilih.'
		: 'Pilih jenis cuti terlebih dahulu.';
	let remainingLeaveHelperText = 'Pilih jenis cuti terlebih dahulu.';

	if (leaveDaysExceeded) {
		remainingLeaveHelperText = 'Jumlah cuti tidak cukup.';
	} else if (selectedLeaveType) {
		remainingLeaveHelperText = 'Preview sisa cuti setelah pengajuan.';
	}
	const filledReplacementIds = replacementEmployeeIds.filter(
		(value) => value !== '' && typeof value !== 'undefined' && value !== null,
	);
	const hasDuplicateReplacementIds =
		new Set(filledReplacementIds.map((value) => Number(value))).size !== filledReplacementIds.length;
	const canAddReplacement = fields.length < 4;
	const isSubmitDisabled =
		loading || leaveTypeOptions.length === 0 || leaveDaysExceeded || hasDuplicateReplacementIds;

	useEffect(() => {
		reset(toDefaultValues(initialValue));
	}, [initialValue, open, reset]);

	const periodStartValue = watch('periodStart');
	const periodEndValue = watch('periodEnd');
	const [nationalHolidays, setNationalHolidays] = useState([]);
	const [resolvedReplacementOptions, setResolvedReplacementOptions] = useState(replacementOptions);
	const [, setResolvedReplacementOptionsMessage] = useState(
		replacementOptionsMessage || DEFAULT_REPLACEMENT_OPTIONS_MESSAGE,
	);
	const [replacementOptionsLoading, setReplacementOptionsLoading] = useState(false);
	const loadReplacementOptionsRef = useRef(onLoadReplacementOptions);
	const hasAvailableReplacementOptions = resolvedReplacementOptions.length > 0;
	const getReplacementRequiredMessage = (index) =>
		index === 0 ? 'Minimal 1 pengganti selama cuti wajib dipilih.' : 'Pengganti selama cuti wajib dipilih.';

	useEffect(() => {
		loadReplacementOptionsRef.current = onLoadReplacementOptions;
	}, [onLoadReplacementOptions]);

	useEffect(() => {
		let isMounted = true;
		const loadHolidays = async () => {
			const yearToFetch = periodStartValue ? new Date(periodStartValue).getFullYear() : new Date().getFullYear();
			if (!Number.isNaN(yearToFetch)) {
				const data = await fetchNationalHolidays(yearToFetch);
				if (isMounted) {
					setNationalHolidays(data);
				}
			}
		};
		loadHolidays();
		return () => {
			isMounted = false;
		};
	}, [periodStartValue]);

	useEffect(() => {
		if (periodStartValue && periodEndValue) {
			const calculatedDays = calculateWorkingDays(periodStartValue, periodEndValue, nationalHolidays);
			setValue('leaveDays', calculatedDays > 0 ? calculatedDays : '', {
				shouldValidate: true,
				shouldDirty: true,
			});
		}
	}, [periodStartValue, periodEndValue, setValue, nationalHolidays]);

	useEffect(() => {
		setResolvedReplacementOptions(replacementOptions);
		setResolvedReplacementOptionsMessage(replacementOptionsMessage || DEFAULT_REPLACEMENT_OPTIONS_MESSAGE);
	}, [replacementOptions, replacementOptionsMessage]);

	useEffect(() => {
		if (!open) {
			return undefined;
		}

		let isMounted = true;

		const syncReplacementOptions = async () => {
			if (!periodStartValue || !periodEndValue) {
				if (isMounted) {
					setResolvedReplacementOptions([]);
					setResolvedReplacementOptionsMessage(DEFAULT_REPLACEMENT_OPTIONS_MESSAGE);
					setReplacementOptionsLoading(false);
				}
				return;
			}

			if (typeof loadReplacementOptionsRef.current !== 'function') {
				setReplacementOptionsLoading(false);
				return;
			}

			setReplacementOptionsLoading(true);

			try {
				const response = await loadReplacementOptionsRef.current({
					periodStart: periodStartValue,
					periodEnd: periodEndValue,
				});

				if (!isMounted) {
					return;
				}

				setResolvedReplacementOptions(response?.replacementOptions || []);
				setResolvedReplacementOptionsMessage(
					response?.replacementOptionsMessage ||
						'Tidak ada kandidat pengganti yang valid untuk periode cuti yang dipilih.',
				);
			} catch (error) {
				if (!isMounted) {
					return;
				}

				setResolvedReplacementOptions([]);
				setResolvedReplacementOptionsMessage(
					error.message || 'Kandidat pengganti tidak dapat dimuat. Silakan coba lagi.',
				);
			} finally {
				if (isMounted) {
					setReplacementOptionsLoading(false);
				}
			}
		};

		syncReplacementOptions();

		return () => {
			isMounted = false;
		};
	}, [open, periodEndValue, periodStartValue]);

	useEffect(() => {
		if (replacementOptionsLoading || !periodStartValue || !periodEndValue) {
			return;
		}

		const validReplacementIds = new Set(resolvedReplacementOptions.map((item) => item.id));

		replacementEmployeesInput.forEach((item, index) => {
			const numericValue = Number(item?.replacementEmployeeId);

			if (!Number.isInteger(numericValue)) {
				return;
			}

			if (!validReplacementIds.has(numericValue)) {
				setValue(`replacementEmployeesInput.${index}.replacementEmployeeId`, '', {
					shouldDirty: true,
					shouldValidate: true,
				});
			}
		});
	}, [
		periodEndValue,
		periodStartValue,
		replacementEmployeesInput,
		replacementOptionsLoading,
		resolvedReplacementOptions,
		setValue,
	]);

	const handleFormSubmit = (values) => {
		onSubmit({
			...values,
			replacementEmployeeIds: (values.replacementEmployeesInput || []).map((item) => item?.replacementEmployeeId),
		});
	};

	const handleFormInvalid = (formErrors) => {
		const replacementError =
			formErrors?.replacementEmployeesInput?.find((item) => item?.replacementEmployeeId)?.replacementEmployeeId
				?.message || '';

		if (replacementError && typeof onInvalidSubmit === 'function') {
			onInvalidSubmit(replacementError, formErrors);
		}
	};

	return (
		<Dialog
			open={open}
			onClose={loading ? undefined : onClose}
			fullWidth
			fullScreen={fullScreen}
			maxWidth="sm"
			PaperProps={{
				sx: {
					m: fullScreen ? 0 : 2,
					width: fullScreen ? '100%' : undefined,
					maxWidth: fullScreen ? '100%' : undefined,
					height: fullScreen ? '100%' : undefined,
					maxHeight: fullScreen ? '100%' : undefined,
					borderRadius: fullScreen ? 0 : 3,
					display: 'flex',
				},
			}}
		>
			<DialogTitle>{title}</DialogTitle>
			<DialogContent
				sx={{
					px: fullScreen ? 2 : 3,
					pb: fullScreen ? 2 : 3,
				}}
			>
				<Grid
					container
					spacing={2}
					component="form"
					id="employee-leave-request-form"
					sx={{ pt: 1 }}
					onSubmit={handleSubmit(handleFormSubmit, handleFormInvalid)}
				>
					<Grid item xs={12}>
						<TextField
							label="Tanggal Pengajuan"
							value={formatDateForDisplay(submissionDate)}
							fullWidth
							disabled
						/>
					</Grid>
					<Grid item xs={12}>
						<Controller
							name="masterCutiKaryawanId"
							control={control}
							rules={{ required: 'Jenis cuti wajib dipilih.' }}
							render={({ field }) => (
								<Autocomplete
									options={leaveTypeOptions}
									value={leaveTypeOptions.find((option) => option.id === Number(field.value)) || null}
									onChange={(_, selectedOption) => field.onChange(selectedOption?.id || '')}
									isOptionEqualToValue={(option, value) => option.id === value.id}
									getOptionLabel={(option) => option?.leaveType || ''}
									renderInput={(params) => (
										<TextField
											{...params}
											label="Jenis Cuti"
											error={Boolean(errors.masterCutiKaryawanId)}
											helperText={errors.masterCutiKaryawanId?.message || ' '}
										/>
									)}
								/>
							)}
						/>
					</Grid>
					<Grid item xs={12} sm={6}>
						<TextField
							label="Jumlah Cuti Tahunan Tersedia"
							value={availableLeaveBalance ?? ''}
							fullWidth
							disabled
							helperText={availableLeaveHelperText}
						/>
					</Grid>
					<Grid item xs={12} sm={6}>
						<Controller
							name="leaveDays"
							control={control}
							rules={{
								required: 'Jumlah hari cuti wajib diisi.',
								validate: (value) => {
									const numericValue = Number(value);

									if (!Number.isInteger(numericValue) || numericValue <= 0) {
										return 'Jumlah hari cuti wajib diisi dengan angka yang valid.';
									}

									if (availableLeaveBalance != null && numericValue > availableLeaveBalance) {
										return 'Jumlah cuti tidak cukup untuk jenis cuti yang dipilih.';
									}

									return true;
								},
							}}
							render={({ field }) => (
								<TextField
									{...field}
									label="Jumlah Hari Cuti"
									type="number"
									fullWidth
									disabled
									inputProps={{ min: 1, step: 1 }}
									error={Boolean(errors.leaveDays)}
									helperText={
										errors.leaveDays?.message || 'Dihitung otomatis dari periode tanggal cuti.'
									}
								/>
							)}
						/>
					</Grid>
					<Grid item xs={12} sm={6}>
						<Controller
							name="periodStart"
							control={control}
							rules={{ required: 'Periode cuti dari wajib diisi.' }}
							render={({ field }) => (
								<TextField
									{...field}
									label="Periode Dari"
									type="date"
									fullWidth
									InputLabelProps={{ shrink: true }}
									error={Boolean(errors.periodStart)}
									helperText={errors.periodStart?.message || ' '}
								/>
							)}
						/>
					</Grid>
					<Grid item xs={12} sm={6}>
						<Controller
							name="periodEnd"
							control={control}
							rules={{ required: 'Periode cuti sampai wajib diisi.' }}
							render={({ field }) => (
								<TextField
									{...field}
									label="Periode Sampai"
									type="date"
									fullWidth
									InputLabelProps={{ shrink: true }}
									error={Boolean(errors.periodEnd)}
									helperText={errors.periodEnd?.message || ' '}
								/>
							)}
						/>
					</Grid>
					<Grid item xs={12} sm={6}>
						<TextField
							label="Sisa Cuti"
							value={remainingLeavePreview}
							fullWidth
							disabled
							error={leaveDaysExceeded}
							helperText={remainingLeaveHelperText}
						/>
					</Grid>
					<Grid item xs={12}>
						<Controller
							name="leaveAddress"
							control={control}
							rules={{ required: 'Alamat selama cuti wajib diisi.' }}
							render={({ field }) => (
								<TextField
									{...field}
									label="Alamat Selama Cuti"
									fullWidth
									multiline
									minRows={3}
									error={Boolean(errors.leaveAddress)}
									helperText={errors.leaveAddress?.message || ' '}
								/>
							)}
						/>
					</Grid>
					<Grid item xs={12}>
						<Controller
							name="leaveReason"
							control={control}
							rules={{ required: 'Alasan cuti wajib diisi.' }}
							render={({ field }) => (
								<TextField
									{...field}
									label="Alasan Cuti"
									fullWidth
									multiline
									minRows={3}
									error={Boolean(errors.leaveReason)}
									helperText={errors.leaveReason?.message || ' '}
								/>
							)}
						/>
					</Grid>
					<Grid item xs={12}>
						<Stack spacing={2}>
							<Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
								<Typography variant="subtitle2" sx={{ color: 'text.primary', fontWeight: 700 }}>
									Pengganti Selama Cuti
								</Typography>
								<Button
									type="button"
									size="small"
									startIcon={<AddCircleOutlineOutlinedIcon />}
									onClick={() => append({ replacementEmployeeId: '' })}
									disabled={!canAddReplacement}
								>
									Tambah Pengganti
								</Button>
							</Stack>
							{fields.map((fieldItem, index) => {
								const currentValue = replacementEmployeeIds[index];
								const selectedIdsFromOtherFields = replacementEmployeeIds
									.filter((_, selectedIndex) => selectedIndex !== index)
									.map((value) => Number(value))
									.filter((value) => Number.isInteger(value));
								const availableOptions = resolvedReplacementOptions.filter(
									(option) =>
										option.id === Number(currentValue) ||
										!selectedIdsFromOtherFields.includes(option.id),
								);
								const fieldError = errors.replacementEmployeesInput?.[index]?.replacementEmployeeId;

								return (
									<Stack
										key={fieldItem.id}
										direction="row"
										spacing={1}
										alignItems="flex-start"
										sx={{
											pb: 0.75,
											'& .MuiFormControl-root': {
												flex: 1,
											},
										}}
									>
										<Controller
											name={`replacementEmployeesInput.${index}.replacementEmployeeId`}
											control={control}
											rules={{
												required: getReplacementRequiredMessage(index),
												validate: (value) => {
													if (
														value === '' ||
														typeof value === 'undefined' ||
														value === null
													) {
														return getReplacementRequiredMessage(index);
													}

													const numericValue = Number(value);

													if (!Number.isInteger(numericValue)) {
														return 'Pengganti selama cuti tidak valid.';
													}

													const isValidCandidate = resolvedReplacementOptions.some(
														(option) => option.id === numericValue,
													);

													if (!isValidCandidate) {
														return 'Pengganti selama cuti tidak valid untuk periode yang dipilih.';
													}

													const duplicateCount = replacementEmployeeIds.filter(
														(item) => Number(item) === numericValue,
													).length;

													if (duplicateCount > 1) {
														return 'Pengganti selama cuti tidak boleh duplikat.';
													}

													return true;
												},
											}}
											render={({ field }) => (
												<Autocomplete
													fullWidth
													options={availableOptions}
													loading={replacementOptionsLoading}
													loadingText=""
													noOptionsText=""
													value={
														resolvedReplacementOptions.find(
															(option) => option.id === Number(field.value),
														) || null
													}
													onChange={(_, selectedOption) =>
														field.onChange(selectedOption?.id || '')
													}
													isOptionEqualToValue={(option, value) => option.id === value.id}
													getOptionLabel={(option) =>
														option?.fullName
															? `${option.fullName} (${option.employeeNo})`
															: ''
													}
													renderInput={(params) => (
														<TextField
															{...params}
															label={`Pengganti ${index + 1}`}
															error={Boolean(fieldError)}
														/>
													)}
												/>
											)}
										/>
										<IconButton
											type="button"
											color="error"
											onClick={() => remove(index)}
											disabled={fields.length === 1}
											sx={{ mt: 1 }}
										>
											<DeleteOutlineOutlinedIcon />
										</IconButton>
									</Stack>
								);
							})}
						</Stack>
					</Grid>
				</Grid>
			</DialogContent>
			<DialogActions
				sx={{
					px: fullScreen ? 2 : 3,
					pb: fullScreen ? 2 : 3,
					pt: 1.5,
					position: fullScreen ? 'sticky' : 'static',
					bottom: 0,
					bgcolor: 'background.paper',
					borderTop: (currentTheme) =>
						fullScreen ? `1px solid ${currentTheme.palette.employeeSurface.borderSoft}` : 'none',
				}}
			>
				<Button onClick={onClose} disabled={loading} color="inherit">
					Batal
				</Button>
				<Button
					type="submit"
					form="employee-leave-request-form"
					variant="contained"
					disabled={
						isSubmitDisabled ||
						replacementOptionsLoading ||
						!hasAvailableReplacementOptions ||
						!periodStartValue ||
						!periodEndValue
					}
				>
					{loading ? 'Memproses...' : 'Simpan'}
				</Button>
			</DialogActions>
		</Dialog>
	);
}

export default LeaveRequestFormDialog;
