import React, { useState, useEffect, useMemo, memo } from 'react';
import { 
  GraduationCap, 
  Plus, 
  Search, 
  DollarSign, 
  Edit3, 
  Trash2, 
  ExternalLink, 
  RefreshCw, 
  UserCheck,
  ChevronRight,
  ChevronLeft,
  ChevronsRight,
  ChevronsLeft,
  Users
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Student, PackageType, PaymentMethod } from '../../types';
import { StudentDetailModal } from './StudentDetailModal';
import { MemberRegistrationDrawer } from './MemberRegistrationDrawer';
import { MoneyInput } from '../common/MoneyInput';
import { usePaginatedMembers } from '../../stores/memberStore';
import { GlassCard } from '../common/GlassCard';
import { GlassButton } from '../common/GlassButton';
import { GlassBadge } from '../common/GlassBadge';
import { GlassPageHeader } from '../common/GlassPageHeader';
import { GlassModal } from '../common/GlassModal';

interface StudentListProps {
  initialOpenNewModal?: boolean;
  onModalClosed?: () => void;
}

// Memoized Individual Member Row for Maximum Render Performance
interface MemberRowProps {
  student: Student;
  coachName?: string;
  packageName: string;
  onSelectDetail: (id: string) => void;
  onOpenPayDebt: (student: Student) => void;
  onOpenRenew: (student: Student) => void;
  onOpenEdit: (student: Student) => void;
  onDelete: (id: string, name: string) => void;
  formatMoney: (amount: number) => string;
  t: Record<string, string>;
}

const MemberRow = memo<MemberRowProps>(({
  student: st,
  coachName,
  packageName,
  onSelectDetail,
  onOpenPayDebt,
  onOpenRenew,
  onOpenEdit,
  onDelete,
  formatMoney,
  t,
}) => {
  const hasDebt = st.remainingDebt > 0;

  return (
    <tr className="hover:bg-[var(--gym-surface-glass)] transition-colors border-b border-[var(--gym-border)]">
      {/* Name & Phone & Member Number */}
      <td className="p-3.5">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[var(--gym-text,#fff)] text-sm">
            {st.fullName}
          </span>
          {st.memberNumber && (
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-[var(--gym-brand,#10b981)]/15 text-[var(--gym-brand,#10b981)] border border-[var(--gym-brand,#10b981)]/30 shrink-0">
              #{st.memberNumber}
            </span>
          )}
        </div>
        <div className="text-[11px] text-[var(--gym-text-muted,#9ca3af)] font-mono flex items-center gap-2 mt-0.5">
          <span>{st.phone}</span>
          {st.nationalId && (
            <>
              <span>•</span>
              <span>کدملی: {st.nationalId}</span>
            </>
          )}
        </div>
      </td>

      {/* Coach */}
      <td className="p-3.5">
        {coachName ? (
          <span className="px-2 py-1 rounded-xl bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-semibold text-xs inline-flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
            {coachName}
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded-xl glass-subtle text-[var(--gym-text-muted)] font-normal text-xs">
            بدون مربی (آزاد)
          </span>
        )}
        
        {/* Optional Plans Indicators */}
        {(st.wantsWorkoutPlan || st.wantsDietPlan) && (
          <div className="flex items-center gap-1 mt-1">
            {st.wantsWorkoutPlan && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-lg bg-blue-500/15 text-blue-300 border border-blue-500/30 font-bold" title="دارای برنامه تمرینی">
                تمرین
              </span>
            )}
            {st.wantsDietPlan && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold" title="دارای برنامه تغذیه">
                رژیم
              </span>
            )}
          </div>
        )}
      </td>

      {/* Package */}
      <td className="p-3.5 text-[var(--gym-text-secondary,#d1d5db)] font-medium">
        {packageName}
      </td>

      {/* Total Fee */}
      <td className="p-3.5 font-mono font-semibold text-[var(--gym-text,#fff)]">
        {formatMoney(st.totalFee)}
      </td>

      {/* Paid */}
      <td className="p-3.5 font-mono text-emerald-400 font-medium">
        {formatMoney(st.paidAmount)}
      </td>

      {/* Debt */}
      <td className="p-3.5">
        {hasDebt ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-lg font-mono font-bold text-xs bg-rose-500/15 text-rose-300 border border-rose-500/30">
            {formatMoney(st.remainingDebt)}
          </span>
        ) : (
          <span className="text-emerald-400 text-xs font-semibold">
            تسویه ✓
          </span>
        )}
      </td>

      {/* Sessions / Expire */}
      <td className="p-3.5 text-[var(--gym-text-muted,#9ca3af)]">
        <div className="font-mono text-[var(--gym-text-secondary)]">{st.expireDate}</div>
        <div className="text-[10px] font-mono text-[var(--gym-text-muted)]">
          {st.sessionsAttended} / {st.sessionsTotal} جلسه
        </div>
      </td>

      {/* Status */}
      <td className="p-3.5">
        <GlassBadge
          variant={st.status === 'active' ? 'success' : 'danger'}
          pulse={st.status === 'active'}
        >
          {st.status === 'active' ? t.active : t.expired}
        </GlassBadge>
      </td>

      {/* Actions */}
      <td className="p-3.5 text-center">
        <div className="flex items-center justify-center gap-1">
          {/* Settle Debt Button */}
          {hasDebt && (
            <button
              onClick={() => onOpenPayDebt(st)}
              className="p-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 hover:bg-amber-500/25 text-amber-300 font-bold transition-all cursor-pointer"
              title={t.payDebt}
            >
              <DollarSign className="h-4 w-4" />
            </button>
          )}

          {/* Renew Button */}
          <button
            onClick={() => onOpenRenew(st)}
            className="p-1.5 rounded-xl text-[var(--gym-text-muted)] hover:text-emerald-400 hover:bg-[var(--gym-surface-glass-strong)] transition-all cursor-pointer"
            title={t.renewMembership}
          >
            <RefreshCw className="h-4 w-4" />
          </button>

          {/* View Detail Button */}
          <button
            onClick={() => onSelectDetail(st.id)}
            className="p-1.5 rounded-xl text-[var(--gym-text-muted)] hover:text-[var(--gym-text,#fff)] hover:bg-[var(--gym-surface-glass-strong)] transition-all cursor-pointer"
            title="پرونده شاگرد"
          >
            <ExternalLink className="h-4 w-4" />
          </button>

          {/* Edit Button */}
          <button
            onClick={() => onOpenEdit(st)}
            className="p-1.5 rounded-xl text-[var(--gym-text-muted)] hover:text-[var(--gym-text,#fff)] hover:bg-[var(--gym-surface-glass-strong)] transition-all cursor-pointer"
            title={t.edit}
          >
            <Edit3 className="h-4 w-4" />
          </button>

          {/* Delete Button */}
          <button
            onClick={() => onDelete(st.id, st.fullName)}
            className="p-1.5 rounded-xl text-[var(--gym-text-muted)] hover:text-rose-400 hover:bg-[var(--gym-surface-glass-strong)] transition-all cursor-pointer"
            title={t.delete}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
});

MemberRow.displayName = 'MemberRow';

export const StudentList: React.FC<StudentListProps> = ({ 
  initialOpenNewModal = false,
  onModalClosed
}) => {
  const { 
    coaches, 
    packages,
    updateStudent, 
    deleteStudent, 
    recordStudentPayment, 
    renewStudentMembership, 
    formatMoney, 
    formatNum, 
    t, 
  } = useApp();

  // Search and Filter State with Debouncing
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCoachId, setSelectedCoachId] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDebtFilter, setSelectedDebtFilter] = useState<'all' | 'with_debt' | 'settled'>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Debounce search input (200ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 200);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // Fast paginated query from indexed repository
  const paginatedResult = usePaginatedMembers({
    page,
    pageSize,
    search: debouncedSearch,
    status: selectedStatus,
    coachId: selectedCoachId,
    debtFilter: selectedDebtFilter,
  });

  // Fast O(1) Coach & Package Lookup Maps
  const coachMap = useMemo(() => {
    const map = new Map<string, string>();
    coaches.forEach(c => map.set(c.id, c.fullName));
    return map;
  }, [coaches]);

  const packageMap = useMemo(() => {
    const map = new Map<string, string>();
    packages.forEach(p => map.set(p.type, p.name));
    return map;
  }, [packages]);

  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState<string | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(initialOpenNewModal);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  
  // Pay Debt Modal
  const [payDebtStudent, setPayDebtStudent] = useState<Student | null>(null);
  const [debtPayAmount, setDebtPayAmount] = useState<number>(0);
  const [debtPayMethod, setDebtPayMethod] = useState<PaymentMethod>('pos');
  const [debtPayNote, setDebtPayNote] = useState('');

  // Renew Modal
  const [renewStudent, setRenewStudent] = useState<Student | null>(null);
  const [renewPackage, setRenewPackage] = useState<PackageType>('1_month');
  const [renewFee, setRenewFee] = useState<number>(2800000);
  const [renewPaid, setRenewPaid] = useState<number>(2800000);
  const [renewPayMethod, setRenewPayMethod] = useState<PaymentMethod>('pos');
  const [renewExpireDate, setRenewExpireDate] = useState('1403/07/25');

  // Edit Form Fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [coachId, setCoachId] = useState('');
  const [packageType, setPackageType] = useState<PackageType>('1_month');
  const [expireDate, setExpireDate] = useState('1403/06/25');
  const [totalFee, setTotalFee] = useState<number>(2800000);
  const [initialPayment, setInitialPayment] = useState<number>(2800000);
  const [goal, setGoal] = useState('افزایش حجم و تناسب اندام');
  const [medicalNotes, setMedicalNotes] = useState('');
  const [wantsCoach, setWantsCoach] = useState(false);
  const [wantsWorkoutPlan, setWantsWorkoutPlan] = useState(false);
  const [wantsDietPlan, setWantsDietPlan] = useState(false);
  const [coachFee, setCoachFee] = useState<number>(0);
  const [workoutPlanFee, setWorkoutPlanFee] = useState<number>(500000);

  const getPackagePrice = (type: string) => {
    const pkg = packages.find(p => p.type === type);
    return pkg ? pkg.price : 2800000;
  };

  const openAddModal = () => {
    setEditingStudent(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (student: Student) => {
    setEditingStudent(student);
    setFullName(student.fullName);
    setPhone(student.phone);
    setCoachId(student.coachId || '');
    setPackageType((student.packageType as PackageType) || '1_month');
    setExpireDate(student.expireDate);
    setTotalFee(student.totalFee);
    setInitialPayment(student.paidAmount);
    setGoal(student.goal || 'فیتنس و سلامت');
    setMedicalNotes(student.medicalNotes || '');
    setWantsCoach(Boolean(student.wantsCoach));
    setWantsWorkoutPlan(Boolean(student.wantsWorkoutPlan));
    setWantsDietPlan(Boolean(student.wantsDietPlan));
    setCoachFee(student.coachFee || 0);
    setWorkoutPlanFee(student.planFee || 500000);
    setIsAddModalOpen(true);
  };

  const [isSubmittingDebt, setIsSubmittingDebt] = useState(false);
  const [isSubmittingRenew, setIsSubmittingRenew] = useState(false);

  const handleEditStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    updateStudent(editingStudent.id, {
      fullName,
      phone,
      coachId: wantsCoach ? coachId : '',
      packageType,
      expireDate,
      totalFee,
      paidAmount: initialPayment,
      remainingDebt: Math.max(0, totalFee - initialPayment),
      goal,
      medicalNotes,
      wantsCoach,
      coachFee: wantsCoach ? coachFee : 0,
      wantsWorkoutPlan,
      wantsDietPlan,
    });

    setIsAddModalOpen(false);
    setEditingStudent(null);
    if (onModalClosed) onModalClosed();
  };

  const handleSettleDebtSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payDebtStudent || debtPayAmount <= 0 || isSubmittingDebt) return;

    if (debtPayAmount > (payDebtStudent.remainingDebt || 0)) {
      alert(`مبلغ وارد شده (${formatMoney(debtPayAmount)}) نمی‌تواند بیشتر از مانده بدهی (${formatMoney(payDebtStudent.remainingDebt)}) باشد.`);
      return;
    }

    setIsSubmittingDebt(true);
    try {
      recordStudentPayment(
        payDebtStudent.id,
        debtPayAmount,
        debtPayMethod,
        debtPayNote || `تسویه مانده شهریه (${payDebtStudent.fullName})`
      );

      setPayDebtStudent(null);
      setDebtPayAmount(0);
      setDebtPayNote('');
    } finally {
      setIsSubmittingDebt(false);
    }
  };

  const handleRenewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renewStudent || isSubmittingRenew) return;

    if (renewPaid > renewFee) {
      alert(`مبلغ پرداختی (${formatMoney(renewPaid)}) نمی‌تواند بیشتر از شهریه دوره (${formatMoney(renewFee)}) باشد.`);
      return;
    }

    setIsSubmittingRenew(true);
    try {
      renewStudentMembership(
        renewStudent.id,
        renewPackage,
        renewFee,
        renewPaid,
        renewPayMethod,
        renewExpireDate
      );
      setRenewStudent(null);
    } finally {
      setIsSubmittingRenew(false);
    }
  };

  const handleDeleteStudent = (id: string, name: string) => {
    if (confirm(`آیا از حذف پرونده ورزشی «${name}» اطمینان دارید؟`)) {
      deleteStudent(id);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <GlassPageHeader
        title={t.studentsTitle}
        subtitle={`بانک اطلاعات اعضا، وضعیت پکیج‌ها، مانده مطالبات و سوابق ورزشی (مجموع ${formatNum(paginatedResult.total)} پرونده)`}
        icon={<GraduationCap className="h-6 w-6 text-[var(--gym-brand,#10b981)]" />}
        actions={
          <GlassButton
            id="add-student-btn"
            variant="neon"
            icon={<Plus className="h-4 w-4" />}
            onClick={openAddModal}
          >
            {t.newStudent}
          </GlassButton>
        }
      />

      {/* Search and Advanced Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="relative sm:col-span-2">
          <Search className="absolute right-3 rtl:right-3 rtl:left-auto left-auto top-3 h-4 w-4 text-[var(--gym-text-muted)]" />
          <input
            id="student-search-input"
            type="text"
            placeholder="جستجوی سریع بر اساس نام، موبایل، کدملی یا شماره عضویت..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-4 pr-10 rtl:pr-10 rtl:pl-4 py-2.5 rounded-2xl glass-subtle border-[var(--gym-border)] text-sm text-[var(--gym-text,#fff)] focus:outline-none focus:ring-2 focus:ring-[var(--gym-brand,#10b981)]"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput('')}
              className="absolute left-3 rtl:left-3 rtl:right-auto top-2.5 text-[var(--gym-text-muted)] hover:text-[var(--gym-text)] text-xs px-1.5 py-0.5 rounded cursor-pointer"
            >
              پاک کردن
            </button>
          )}
        </div>

        <select
          value={selectedCoachId}
          onChange={(e) => {
            setSelectedCoachId(e.target.value);
            setPage(1);
          }}
          className="px-3.5 py-2.5 rounded-2xl glass-subtle border-[var(--gym-border)] text-xs sm:text-sm text-[var(--gym-text,#fff)] focus:outline-none focus:ring-2 focus:ring-[var(--gym-brand,#10b981)] bg-[var(--gym-surface)]"
        >
          <option value="all" className="bg-stone-900 text-white">تمامی مربیان</option>
          {coaches.map(c => (
            <option key={c.id} value={c.id} className="bg-stone-900 text-white">{c.fullName}</option>
          ))}
        </select>

        <select
          value={selectedDebtFilter}
          onChange={(e) => {
            setSelectedDebtFilter(e.target.value as 'all' | 'with_debt' | 'settled');
            setPage(1);
          }}
          className="px-3.5 py-2.5 rounded-2xl glass-subtle border-[var(--gym-border)] text-xs sm:text-sm text-[var(--gym-text,#fff)] focus:outline-none focus:ring-2 focus:ring-[var(--gym-brand,#10b981)] bg-[var(--gym-surface)]"
        >
          <option value="all" className="bg-stone-900 text-white">تمامی وضعیت‌های مالی</option>
          <option value="with_debt" className="bg-stone-900 text-white">فقط بدهکاران شهریه</option>
          <option value="settled" className="bg-stone-900 text-white">تسویه شده و بدون بدهی</option>
        </select>
      </div>

      {/* Quick Status Chips */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[var(--gym-text-muted)]">فیلتر وضعیت:</span>
          {(['all', 'active', 'pending_renewal', 'expired'] as const).map(st => (
            <button
              key={st}
              onClick={() => {
                setSelectedStatus(st);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
                selectedStatus === st
                  ? 'glass-neon font-bold text-white'
                  : 'glass-subtle text-[var(--gym-text-muted)] hover:text-white'
              }`}
            >
              {st === 'all' ? 'همه' : st === 'active' ? 'فعال' : st === 'pending_renewal' ? 'رو به انقضا' : 'منقضی شده'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-[var(--gym-text-muted)]">
          <span>نمایش در هر صفحه:</span>
          {[25, 50, 100].map(sz => (
            <button
              key={sz}
              onClick={() => {
                setPageSize(sz);
                setPage(1);
              }}
              className={`px-2.5 py-1 rounded-xl font-mono text-xs cursor-pointer transition-all ${
                pageSize === sz
                  ? 'bg-[var(--gym-brand,#10b981)] text-stone-950 font-bold'
                  : 'glass-subtle text-[var(--gym-text-muted)] hover:text-white'
              }`}
            >
              {sz}
            </button>
          ))}
        </div>
      </div>

      {/* Students Table */}
      {paginatedResult.items.length === 0 ? (
        <GlassCard className="p-12 text-center text-[var(--gym-text-muted)] space-y-2">
          <Users className="w-8 h-8 mx-auto text-[var(--gym-text-muted)] mb-2 opacity-50" />
          <p className="font-bold text-[var(--gym-text,#fff)]">{t.noStudentsFound}</p>
          <p className="text-xs text-[var(--gym-text-muted)]">با تغییر عبارت جستجو یا فیلترها، مجدداً بررسی کنید.</p>
        </GlassCard>
      ) : (
        <GlassCard padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right rtl:text-right">
              <thead className="glass-subtle text-[var(--gym-text-secondary)] font-semibold border-b border-[var(--gym-border)]">
                <tr>
                  <th className="p-3.5">نام شاگرد / کدملی</th>
                  <th className="p-3.5">مربی اختصاصی</th>
                  <th className="p-3.5">نوع پکیج</th>
                  <th className="p-3.5">شهریه کل</th>
                  <th className="p-3.5">پرداختی</th>
                  <th className="p-3.5">مانده بدهی</th>
                  <th className="p-3.5">انقضا / جلسات</th>
                  <th className="p-3.5">وضعیت</th>
                  <th className="p-3.5 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--gym-border)]">
                {paginatedResult.items.map((st) => (
                  <MemberRow
                    key={st.id}
                    student={st}
                    coachName={coachMap.get(st.coachId || '')}
                    packageName={packageMap.get(st.packageType) || st.packageType}
                    onSelectDetail={setSelectedStudentForDetail}
                    onOpenPayDebt={setPayDebtStudent}
                    onOpenRenew={setRenewStudent}
                    onOpenEdit={openEditModal}
                    onDelete={handleDeleteStudent}
                    formatMoney={formatMoney}
                    t={t as Record<string, string>}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Bar */}
          <div className="p-4 border-t border-[var(--gym-border)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--gym-text-muted)] glass-subtle">
            <div>
              نمایش <span className="font-mono font-bold text-[var(--gym-text,#fff)]">{(paginatedResult.currentPage - 1) * pageSize + 1}</span> تا{' '}
              <span className="font-mono font-bold text-[var(--gym-text,#fff)]">
                {Math.min(paginatedResult.currentPage * pageSize, paginatedResult.total)}
              </span>{' '}
              از مجموع <span className="font-mono font-bold text-[var(--gym-text,#fff)]">{formatNum(paginatedResult.total)}</span> عضو
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(1)}
                disabled={paginatedResult.currentPage === 1}
                className="p-1.5 rounded-xl border border-[var(--gym-border)] glass-subtle disabled:opacity-30 hover:bg-[var(--gym-surface-glass-strong)] cursor-pointer"
                title="صفحه اول"
              >
                <ChevronsRight className="w-4 h-4 rtl:rotate-180" />
              </button>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={paginatedResult.currentPage === 1}
                className="p-1.5 rounded-xl border border-[var(--gym-border)] glass-subtle disabled:opacity-30 hover:bg-[var(--gym-surface-glass-strong)] cursor-pointer"
                title="صفحه قبل"
              >
                <ChevronRight className="w-4 h-4 rtl:rotate-180" />
              </button>

              <span className="px-3 py-1 font-mono font-semibold text-[var(--gym-text,#fff)]">
                صفحه {formatNum(paginatedResult.currentPage)} از {formatNum(paginatedResult.totalPages)}
              </span>

              <button
                onClick={() => setPage(p => Math.min(paginatedResult.totalPages, p + 1))}
                disabled={paginatedResult.currentPage >= paginatedResult.totalPages}
                className="p-1.5 rounded-xl border border-[var(--gym-border)] glass-subtle disabled:opacity-30 hover:bg-[var(--gym-surface-glass-strong)] cursor-pointer"
                title="صفحه بعد"
              >
                <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
              </button>
              <button
                onClick={() => setPage(paginatedResult.totalPages)}
                disabled={paginatedResult.currentPage >= paginatedResult.totalPages}
                className="p-1.5 rounded-xl border border-[var(--gym-border)] glass-subtle disabled:opacity-30 hover:bg-[var(--gym-surface-glass-strong)] cursor-pointer"
                title="صفحه آخر"
              >
                <ChevronsLeft className="w-4 h-4 rtl:rotate-180" />
              </button>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Fast Member Registration Drawer for New Members */}
      {isAddModalOpen && !editingStudent && (
        <MemberRegistrationDrawer
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            if (onModalClosed) onModalClosed();
          }}
        />
      )}

      {/* Edit Student Modal */}
      {isAddModalOpen && editingStudent && (
        <GlassModal
          isOpen={isAddModalOpen && !!editingStudent}
          onClose={() => {
            setIsAddModalOpen(false);
            if (onModalClosed) onModalClosed();
          }}
          title="ویرایش اطلاعات شاگرد"
          icon={<Edit3 className="w-5 h-5 text-[var(--gym-brand,#10b981)]" />}
          maxWidth="max-w-xl"
        >
          <form onSubmit={handleEditStudentSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-[var(--gym-text-secondary)] mb-1">
                  {t.studentName} *
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="نام و نام‌خانوادگی"
                  className="w-full px-3 py-2 rounded-xl glass-subtle border-[var(--gym-border)] text-sm text-[var(--gym-text)]"
                  required
                />
              </div>
              <div>
                <label className="block font-medium text-[var(--gym-text-secondary)] mb-1">
                  {t.phoneNumber} *
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0935..."
                  className="w-full px-3 py-2 rounded-xl glass-subtle border-[var(--gym-border)] font-mono text-sm text-[var(--gym-text)]"
                  required
                />
              </div>
            </div>

            {/* Package */}
            <div className="space-y-3 p-4 rounded-2xl glass-subtle border-[var(--gym-border)]">
              <div>
                <label className="block font-bold text-[var(--gym-text,#fff)] mb-1.5 flex items-center justify-between">
                  <span>{t.packageType}</span>
                  <span className="text-xs font-normal text-[var(--gym-text-muted)]">بر اساس تعرفه‌های مصوب باشگاه</span>
                </label>
                <select
                  value={packageType}
                  onChange={(e) => {
                    const val = e.target.value as PackageType;
                    setPackageType(val);
                    const pr = getPackagePrice(val);
                    setTotalFee(pr);
                  }}
                  className="w-full px-3 py-2.5 rounded-xl glass-subtle border-[var(--gym-border)] text-sm font-semibold text-[var(--gym-text,#fff)] bg-[var(--gym-surface)]"
                >
                  {packages.map(p => (
                    <option key={p.id} value={p.type} className="bg-stone-900 text-white">
                      {p.name} ({p.durationDays} روزه / {p.sessionsCount} جلسه) - {formatMoney(p.price)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 border-t border-[var(--gym-border)] space-y-2.5">
                <div className="text-xs font-bold text-[var(--gym-text-secondary)]">
                  خدمات انتخابی و اختیاری:
                </div>

                {/* Coach Optional */}
                <div className="p-2.5 rounded-xl glass-subtle border-[var(--gym-border)] space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={wantsCoach}
                      onChange={(e) => setWantsCoach(e.target.checked)}
                      className="w-4 h-4 rounded text-[var(--gym-brand,#10b981)]"
                    />
                    <span className="text-xs font-semibold text-[var(--gym-text,#fff)]">
                      درخواست مربی اختصاصی / خصوصی
                    </span>
                  </label>

                  {wantsCoach && (
                    <div className="pt-1.5 pr-6">
                      <select
                        value={coachId}
                        onChange={(e) => setCoachId(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl glass-subtle border-[var(--gym-border)] text-xs text-[var(--gym-text)] bg-[var(--gym-surface)]"
                      >
                        <option value="" className="bg-stone-900 text-white">انتخاب مربی اختصاصی...</option>
                        {coaches.map(c => (
                          <option key={c.id} value={c.id} className="bg-stone-900 text-white">
                            {c.fullName} ({c.specialty})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Financial Section */}
            <div className="p-3.5 rounded-2xl bg-[var(--gym-brand,#10b981)]/10 border border-[var(--gym-brand,#10b981)]/30 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[var(--gym-text,#fff)] mb-1">
                    {t.totalFee} ({t.currency})
                  </label>
                  <input
                    type="number"
                    value={totalFee || ''}
                    onChange={(e) => setTotalFee(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl glass-subtle border-[var(--gym-border)] font-mono text-sm font-bold text-[var(--gym-text,#fff)]"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-emerald-400 mb-1">
                    {t.paidAmount} (دریافتی ثبت‌شده)
                  </label>
                  <input
                    type="number"
                    value={initialPayment || ''}
                    onChange={(e) => setInitialPayment(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl glass-subtle border-[var(--gym-border)] font-mono text-sm font-bold text-emerald-400"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-[var(--gym-border)]">
                <div className="font-mono text-rose-400 font-bold">
                  مانده بدهی: {formatMoney(Math.max(0, totalFee - initialPayment))}
                </div>
              </div>
            </div>

            {/* Dates & Biometrics */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-[var(--gym-text-secondary)] mb-1">
                  {t.expireDate}
                </label>
                <input
                  type="text"
                  value={expireDate}
                  onChange={(e) => setExpireDate(e.target.value)}
                  placeholder="1403/06/25"
                  className="w-full px-3 py-2 rounded-xl glass-subtle border-[var(--gym-border)] font-mono text-sm text-[var(--gym-text)]"
                />
              </div>
              <div>
                <label className="block font-medium text-[var(--gym-text-secondary)] mb-1">
                  هدف تمرینی
                </label>
                <input
                  type="text"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="کاهش وزن، عضله‌سازی..."
                  className="w-full px-3 py-2 rounded-xl glass-subtle border-[var(--gym-border)] text-sm text-[var(--gym-text)]"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-[var(--gym-text-secondary)] mb-1">
                ملاحظات پزشکی یا آسیب‌دیدگی
              </label>
              <textarea
                rows={2}
                value={medicalNotes}
                onChange={(e) => setMedicalNotes(e.target.value)}
                placeholder="دیسک کمر، جراحی قبلی، محدودیت حرکتی..."
                className="w-full px-3 py-2 rounded-xl glass-subtle border-[var(--gym-border)] text-sm text-[var(--gym-text)]"
              />
            </div>

            <div className="pt-4 flex justify-end gap-2.5 border-t border-[var(--gym-border)]">
              <GlassButton
                type="button"
                variant="ghost"
                onClick={() => setIsAddModalOpen(false)}
              >
                {t.cancel}
              </GlassButton>
              <GlassButton
                type="submit"
                variant="neon"
              >
                {t.save}
              </GlassButton>
            </div>
          </form>
        </GlassModal>
      )}

      {/* Pay Debt Modal */}
      {payDebtStudent && (
        <GlassModal
          isOpen={!!payDebtStudent}
          onClose={() => setPayDebtStudent(null)}
          title="ثبت دریافت و تسویه بدهی"
          icon={<DollarSign className="w-5 h-5 text-emerald-400" />}
          maxWidth="max-w-md"
        >
          <div className="p-3 rounded-2xl bg-[var(--gym-brand,#10b981)]/10 border border-[var(--gym-brand,#10b981)]/30 mb-4 space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-[var(--gym-text-muted)]">شاگرد:</span>
              <span className="font-bold text-[var(--gym-text,#fff)]">{payDebtStudent.fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--gym-text-muted)]">بدهی فعلی:</span>
              <span className="font-mono font-bold text-rose-400">{formatMoney(payDebtStudent.remainingDebt)}</span>
            </div>
          </div>

          <form onSubmit={handleSettleDebtSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-[var(--gym-text,#fff)] mb-1.5">
                مبلغ دریافتی امروز
              </label>
              <MoneyInput
                value={debtPayAmount}
                onChange={(val) => setDebtPayAmount(val)}
                onFullAmount={() => setDebtPayAmount(payDebtStudent.remainingDebt)}
                fullAmountLabel="دریافت کل بدهی"
                placeholder="مبلغ پرداختی"
              />
            </div>

            {/* Live Remaining Balance */}
            <div className="p-3 rounded-2xl glass-subtle border-[var(--gym-border)] flex justify-between items-center">
              <span className="text-[var(--gym-text-muted)]">مانده پس از دریافت:</span>
              <span className={`font-mono font-bold ${
                Math.max(0, payDebtStudent.remainingDebt - debtPayAmount) > 0 
                  ? 'text-amber-400' 
                  : 'text-emerald-400'
              }`}>
                {Math.max(0, payDebtStudent.remainingDebt - debtPayAmount) > 0
                  ? formatMoney(Math.max(0, payDebtStudent.remainingDebt - debtPayAmount))
                  : 'تسویه کامل ✓'}
              </span>
            </div>

            <div>
              <label className="block font-medium text-[var(--gym-text-secondary)] mb-1">
                روش پرداخت
              </label>
              <select
                value={debtPayMethod}
                onChange={(e) => setDebtPayMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 rounded-xl glass-subtle border-[var(--gym-border)] text-xs text-[var(--gym-text)] bg-[var(--gym-surface)]"
              >
                <option value="pos" className="bg-stone-900 text-white">کارتخوان (POS)</option>
                <option value="card_transfer" className="bg-stone-900 text-white">کارت به کارت</option>
                <option value="cash" className="bg-stone-900 text-white">نقدی (صندوق)</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-[var(--gym-text-secondary)] mb-1">
                توضیحات و بابت فیش
              </label>
              <input
                type="text"
                value={debtPayNote}
                onChange={(e) => setDebtPayNote(e.target.value)}
                placeholder="تسویه مانده شهریه دوره"
                className="w-full px-3 py-2 rounded-xl glass-subtle border-[var(--gym-border)] text-xs text-[var(--gym-text)]"
              />
            </div>

            <div className="pt-3 flex justify-end gap-2.5 border-t border-[var(--gym-border)]">
              <GlassButton
                type="button"
                variant="ghost"
                onClick={() => setPayDebtStudent(null)}
              >
                انصراف
              </GlassButton>
              <GlassButton
                type="submit"
                variant="primary"
                disabled={debtPayAmount <= 0}
              >
                ثبت دریافت و کسر بدهی
              </GlassButton>
            </div>
          </form>
        </GlassModal>
      )}

      {/* Renew Membership Modal */}
      {renewStudent && (
        <GlassModal
          isOpen={!!renewStudent}
          onClose={() => setRenewStudent(null)}
          title="تمدید دوره عضویت شاگرد"
          subtitle={`شاگرد: ${renewStudent.fullName} (پایان دوره فعلی: ${renewStudent.expireDate})`}
          icon={<RefreshCw className="w-5 h-5 text-[var(--gym-brand,#10b981)]" />}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleRenewSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-[var(--gym-text-secondary)] mb-1">
                پکیج تمدید
              </label>
              <select
                value={renewPackage}
                onChange={(e) => {
                  const p = e.target.value as PackageType;
                  setRenewPackage(p);
                  const pr = getPackagePrice(p);
                  setRenewFee(pr);
                  setRenewPaid(pr);
                }}
                className="w-full px-3 py-2 rounded-xl glass-subtle border-[var(--gym-border)] text-xs font-semibold text-[var(--gym-text)] bg-[var(--gym-surface)]"
              >
                {packages.filter(p => p.isActive !== false && !p.isArchived).map(p => (
                  <option key={p.id} value={p.type} className="bg-stone-900 text-white">
                    {p.name} ({p.durationDays} روزه / {p.sessionsCount} جلسه) - {formatMoney(p.price)}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-[var(--gym-text-secondary)] mb-1">
                  شهریه دوره
                </label>
                <MoneyInput
                  value={renewFee}
                  onChange={(val) => {
                    setRenewFee(val);
                    setRenewPaid(val);
                  }}
                  placeholder="شهریه دوره"
                />
              </div>
              <div>
                <label className="block font-medium text-emerald-400 mb-1">
                  مبلغ پرداختی
                </label>
                <MoneyInput
                  value={renewPaid}
                  onChange={(val) => setRenewPaid(val)}
                  onFullAmount={() => setRenewPaid(renewFee)}
                  fullAmountLabel="دریافت کامل"
                  placeholder="مبلغ پرداختی"
                />
              </div>
            </div>

            <div className="p-3 rounded-2xl glass-subtle border-[var(--gym-border)] flex justify-between items-center">
              <span className="text-[var(--gym-text-muted)]">مانده بدهی این دوره:</span>
              <span className="font-mono font-bold text-amber-400">
                {Math.max(0, renewFee - renewPaid) > 0 ? formatMoney(Math.max(0, renewFee - renewPaid)) : 'تسویه کامل ✓'}
              </span>
            </div>

            <div>
              <label className="block font-medium text-[var(--gym-text-secondary)] mb-1">
                تاریخ انقضای دوره جدید
              </label>
              <input
                type="text"
                value={renewExpireDate}
                onChange={(e) => setRenewExpireDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl glass-subtle border-[var(--gym-border)] font-mono text-xs text-[var(--gym-text)]"
              />
            </div>

            <div className="pt-3 flex justify-end gap-2.5 border-t border-[var(--gym-border)]">
              <GlassButton
                type="button"
                variant="ghost"
                onClick={() => setRenewStudent(null)}
              >
                انصراف
              </GlassButton>
              <GlassButton
                type="submit"
                variant="neon"
              >
                تایید تمدید دوره
              </GlassButton>
            </div>
          </form>
        </GlassModal>
      )}

      {/* Student Dossier Detail Modal */}
      {selectedStudentForDetail && (
        <StudentDetailModal
          studentId={selectedStudentForDetail}
          onClose={() => setSelectedStudentForDetail(null)}
          onOpenRenew={(st) => {
            setRenewStudent(st);
            const pr = getPackagePrice(st.packageType);
            setRenewFee(pr);
            setRenewPaid(pr);
          }}
          onOpenPayDebt={(st) => {
            setPayDebtStudent(st);
            setDebtPayAmount(st.remainingDebt);
          }}
        />
      )}

    </div>
  );
};
