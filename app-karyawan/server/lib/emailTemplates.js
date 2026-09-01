/**
 * HTML Email Templates — Workflow Pengajuan Cuti
 *
 * Responsive, email-client-safe HTML. Inline styles only.
 * Supports 4 email types:
 *   - submitted   : konfirmasi ke karyawan saat pengajuan dikirim
 *   - stageActivation : notifikasi ke approver saat tahap aktif
 *   - rejected    : notifikasi ke karyawan saat ditolak
 *   - approved    : notifikasi ke karyawan saat disetujui penuh
 */

// ─── Palette ────────────────────────────────────────────────────────────────
const C = {
	primary: '#1e40af',
	primaryLight: '#dbeafe',
	success: '#15803d',
	successLight: '#dcfce7',
	danger: '#b91c1c',
	dangerLight: '#fee2e2',
	warning: '#b45309',
	warningLight: '#fef9c3',
	text: '#1e293b',
	textMuted: '#64748b',
	border: '#e2e8f0',
	bg: '#f8fafc',
	white: '#ffffff',
};

// ─── Base wrapper ────────────────────────────────────────────────────────────
function wrapEmail({ headerColor, headerBg, headerIcon, headerTitle, headerSubtitle, body, ctaHref, ctaLabel, ctaColor }) {
	const year = new Date().getFullYear();
	return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${headerTitle}</title>
</head>
<body style="margin:0;padding:0;background:${C.bg};font-family:'Segoe UI',Arial,sans-serif;color:${C.text};">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.bg};padding:32px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:${C.white};border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

      <!-- Header -->
      <tr>
        <td style="background:${headerBg};padding:32px 40px;text-align:center;">
          <div style="font-size:40px;margin-bottom:12px;">${headerIcon}</div>
          <h1 style="margin:0 0 6px;font-size:22px;font-weight:700;color:${headerColor};letter-spacing:-0.3px;">${headerTitle}</h1>
          <p style="margin:0;font-size:14px;color:${headerColor};opacity:0.8;">${headerSubtitle}</p>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="padding:32px 40px;">
          ${body}
        </td>
      </tr>

      ${ctaHref ? `
      <!-- CTA -->
      <tr>
        <td style="padding:0 40px 32px;text-align:center;">
          <a href="${ctaHref}" style="display:inline-block;background:${ctaColor || C.primary};color:${C.white};text-decoration:none;font-weight:600;font-size:15px;padding:14px 32px;border-radius:8px;letter-spacing:0.2px;">${ctaLabel}</a>
        </td>
      </tr>` : ''}

      <!-- Footer -->
      <tr>
        <td style="background:${C.bg};padding:20px 40px;text-align:center;border-top:1px solid ${C.border};">
          <p style="margin:0;font-size:12px;color:${C.textMuted};">
            Email ini dikirim otomatis oleh Sistem Workflow Pengajuan Cuti &copy; ${year}.<br>
            Jangan balas email ini.
          </p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

// ─── Info row (label + value) ────────────────────────────────────────────────
function infoRow(label, value) {
	return `
  <tr>
    <td style="padding:8px 0;border-bottom:1px solid ${C.border};width:40%;vertical-align:top;">
      <span style="font-size:12px;text-transform:uppercase;letter-spacing:0.6px;color:${C.textMuted};font-weight:600;">${label}</span>
    </td>
    <td style="padding:8px 0 8px 16px;border-bottom:1px solid ${C.border};vertical-align:top;">
      <span style="font-size:14px;color:${C.text};font-weight:500;">${value || '-'}</span>
    </td>
  </tr>`;
}

// ─── Info table wrapper ──────────────────────────────────────────────────────
function infoTable(rows) {
	return `
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
    ${rows}
  </table>`;
}

// ─── Alert box ───────────────────────────────────────────────────────────────
function alertBox(text, color, bg) {
	return `<div style="background:${bg};border-left:4px solid ${color};border-radius:6px;padding:14px 16px;margin:20px 0;font-size:14px;color:${color};font-weight:500;">${text}</div>`;
}

// ─── Greeting ────────────────────────────────────────────────────────────────
function greeting(name) {
	return `<p style="margin:0 0 20px;font-size:16px;color:${C.text};">Halo <strong>${esc(name)}</strong>,</p>`;
}

// ─── Escape HTML ─────────────────────────────────────────────────────────────
function esc(str) {
	return String(str || '')
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

// ─── Date formatter ──────────────────────────────────────────────────────────
function fmtDate(date) {
	if (!date) return '-';
	return new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ─── Replacement employee list ───────────────────────────────────────────────
function replacementList(replacements) {
	if (!replacements || !replacements.length) return '-';
	return replacements
		.map((r) => `<span style="display:block;font-size:13px;color:${C.text};">${esc(r.fullName)} <span style="color:${C.textMuted};">(${esc(r.employeeNo)})</span></span>`)
		.join('');
}

// ════════════════════════════════════════════════════════════════════════════
// PUBLIC TEMPLATE FUNCTIONS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Email konfirmasi ke karyawan saat pengajuan cuti berhasil dikirim.
 */
function buildSubmittedEmail({ record, replacements, detailUrl }) {
	const body = `
    ${greeting(record.employee.fullName)}
    <p style="margin:0 0 4px;font-size:15px;color:${C.text};">Pengajuan cuti Anda telah <strong>berhasil dikirim</strong> dan sedang menunggu persetujuan atasan.</p>
    ${infoTable([
		infoRow('No. Request', `<strong style="color:${C.primary};">${esc(record.requestNumber)}</strong>`),
		infoRow('Jenis Cuti', esc(record.masterCutiKaryawan.leaveType)),
		infoRow('Periode', `${fmtDate(record.periodStart)} &ndash; ${fmtDate(record.periodEnd)}`),
		infoRow('Jumlah Hari', `${record.leaveDays} hari`),
		infoRow('Alamat Selama Cuti', esc(record.leaveAddress || '-')),
		infoRow('Alasan Cuti', esc(record.leaveReason || '-')),
		infoRow('Pengganti', replacementList(replacements)),
	].join(''))}
    ${alertBox('Silakan tunggu notifikasi persetujuan dari atasan Anda.', C.primary, C.primaryLight)}
  `;

	return wrapEmail({
		headerBg: C.primaryLight,
		headerColor: C.primary,
		headerIcon: '📋',
		headerTitle: 'Pengajuan Cuti Terkirim',
		headerSubtitle: `No. Request: ${record.requestNumber}`,
		body,
		ctaHref: detailUrl,
		ctaLabel: 'Lihat Detail Pengajuan',
		ctaColor: C.primary,
	});
}

/**
 * Email notifikasi ke approver saat tahap approval aktif.
 */
function buildStageActivationEmail({ record, approval, replacements, approvalUrl }) {
	const approver = approval.approverEmployee;
	const body = `
    ${greeting(approver.fullName)}
    <p style="margin:0 0 4px;font-size:15px;color:${C.text};">Ada pengajuan cuti yang membutuhkan <strong>persetujuan Anda</strong>.</p>
    ${infoTable([
		infoRow('No. Request', `<strong style="color:${C.primary};">${esc(record.requestNumber)}</strong>`),
		infoRow('Karyawan', `${esc(record.employee.fullName)} <span style="color:${C.textMuted};font-size:12px;">(${esc(record.employee.employeeNo)})</span>`),
		infoRow('Jenis Cuti', esc(record.masterCutiKaryawan.leaveType)),
		infoRow('Periode', `${fmtDate(record.periodStart)} &ndash; ${fmtDate(record.periodEnd)}`),
		infoRow('Jumlah Hari', `${record.leaveDays} hari`),
		infoRow('Alamat Selama Cuti', esc(record.leaveAddress || '-')),
		infoRow('Alasan Cuti', esc(record.leaveReason || '-')),
		infoRow('Pengganti', replacementList(replacements)),
		infoRow('Tahap Approval', esc(approval.stageLabel || approval.stageType)),
	].join(''))}
    ${alertBox('Harap segera proses approval ini melalui portal karyawan.', C.warning, C.warningLight)}
  `;

	return wrapEmail({
		headerBg: C.warningLight,
		headerColor: C.warning,
		headerIcon: '📨',
		headerTitle: 'Approval Cuti Menunggu Anda',
		headerSubtitle: `Request dari ${record.employee.fullName}`,
		body,
		ctaHref: approvalUrl,
		ctaLabel: 'Proses Approval Sekarang',
		ctaColor: C.warning,
	});
}

/**
 * Email notifikasi ke karyawan saat pengajuan cuti ditolak.
 */
function buildRejectedEmail({ record, replacements, detailUrl }) {
	const body = `
    ${greeting(record.employee.fullName)}
    <p style="margin:0 0 4px;font-size:15px;color:${C.text};">Pengajuan cuti Anda dengan nomor <strong>${esc(record.requestNumber)}</strong> telah <strong style="color:${C.danger};">ditolak</strong>.</p>
    ${infoTable([
		infoRow('No. Request', `<strong style="color:${C.danger};">${esc(record.requestNumber)}</strong>`),
		infoRow('Alasan Penolakan', `<span style="color:${C.danger};font-weight:600;">${esc(record.rejectionNote || '-')}</span>`),
		infoRow('Jenis Cuti', esc(record.masterCutiKaryawan.leaveType)),
		infoRow('Periode', `${fmtDate(record.periodStart)} &ndash; ${fmtDate(record.periodEnd)}`),
		infoRow('Jumlah Hari', `${record.leaveDays} hari`),
		infoRow('Alamat Selama Cuti', esc(record.leaveAddress || '-')),
		infoRow('Alasan Cuti', esc(record.leaveReason || '-')),
		infoRow('Pengganti', replacementList(replacements)),
	].join(''))}
    ${alertBox('Anda dapat membuka detail pengajuan untuk melakukan resubmit atau membatalkan pengajuan.', C.danger, C.dangerLight)}
  `;

	return wrapEmail({
		headerBg: C.dangerLight,
		headerColor: C.danger,
		headerIcon: '❌',
		headerTitle: 'Pengajuan Cuti Ditolak',
		headerSubtitle: `No. Request: ${record.requestNumber}`,
		body,
		ctaHref: detailUrl,
		ctaLabel: 'Buka Detail Pengajuan',
		ctaColor: C.danger,
	});
}

/**
 * Email notifikasi ke karyawan saat pengajuan cuti selesai di-approve.
 */
function buildApprovedEmail({ record, replacements, detailUrl }) {
	const body = `
    ${greeting(record.employee.fullName)}
    <p style="margin:0 0 4px;font-size:15px;color:${C.text};">Selamat! Pengajuan cuti Anda telah <strong style="color:${C.success};">disetujui sepenuhnya</strong>.</p>
    ${infoTable([
		infoRow('No. Request', `<strong style="color:${C.success};">${esc(record.requestNumber)}</strong>`),
		infoRow('Jenis Cuti', esc(record.masterCutiKaryawan.leaveType)),
		infoRow('Periode', `${fmtDate(record.periodStart)} &ndash; ${fmtDate(record.periodEnd)}`),
		infoRow('Jumlah Hari', `${record.leaveDays} hari`),
		infoRow('Sisa Cuti', `<strong>${record.remainingLeave} hari</strong>`),
		infoRow('Alamat Selama Cuti', esc(record.leaveAddress || '-')),
		infoRow('Alasan Cuti', esc(record.leaveReason || '-')),
		infoRow('Pengganti', replacementList(replacements)),
	].join(''))}
    ${alertBox('Selamat menikmati cuti Anda! Jaga kesehatan dan semoga istirahat menyenangkan.', C.success, C.successLight)}
  `;

	return wrapEmail({
		headerBg: C.successLight,
		headerColor: C.success,
		headerIcon: '✅',
		headerTitle: 'Pengajuan Cuti Disetujui',
		headerSubtitle: `No. Request: ${record.requestNumber}`,
		body,
		ctaHref: detailUrl,
		ctaLabel: 'Lihat Detail Pengajuan',
		ctaColor: C.success,
	});
}

export {
	buildSubmittedEmail,
	buildStageActivationEmail,
	buildRejectedEmail,
	buildApprovedEmail,
};
