import { PrismaClient } from '@prisma/client';
import fs from 'fs';
const prisma = new PrismaClient();

function formatLongDateForNotice(value) {
	if (!value) return '-';
	const parsed = value instanceof Date ? value : new Date(value);
	if (Number.isNaN(parsed.getTime())) return '-';
	return parsed.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
}

function createPendingApprovalNotification(approval) {
	const activatedAt = approval.updatedAt || approval.createdAt;

	return {
		id: `emp-approval-pending-${approval.id}-${activatedAt.toISOString()}`,
		category: 'LEAVE_APPROVAL_PENDING',
		severity: 'warning',
		title: `Approval menunggu tindakan: ${approval.employeeLeave.requestNumber}`,
		description: `Permohonan cuti ${approval.employeeLeave.employee.fullName} menunggu persetujuan Anda.`,
		targetPath: `/karyawan/cuti/approval/${approval.id}`,
		targetSearch: '',
		dateLabel: `Sejak: ${formatLongDateForNotice(activatedAt)}`,
		sortDate: activatedAt.toISOString(),
		href: `/karyawan/cuti/approval/${approval.id}`,
	};
}

async function check() {
  const employeeId = 14; 
  const pendingApprovals = await prisma.employeeLeaveApproval.findMany({
    where: {
      approverEmployeeId: employeeId,
      status: 'PENDING',
    },
    include: {
      employeeLeave: {
        include: { employee: true },
      },
    },
    orderBy: [{ createdAt: 'desc' }],
  });

  const notifs = pendingApprovals.map(createPendingApprovalNotification);
  fs.writeFileSync('test-out-4.json', JSON.stringify({ pendingApprovalsCount: pendingApprovals.length, notifs }, null, 2), 'utf-8');
}

check().catch(console.error).finally(() => prisma.$disconnect());
