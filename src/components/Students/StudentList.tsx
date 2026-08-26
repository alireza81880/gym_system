import React, { useState } from 'react';
import { 
  GraduationCap, 
  Plus, 
  Search, 
  Phone, 
  CreditCard, 
  DollarSign, 
  Edit3, 
  Trash2, 
  ExternalLink, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  Calendar,
  Filter,
  UserCheck
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Student, PackageType, PaymentMethod, StudentStatus } from '../../types';
import { StudentDetailModal } from './StudentDetailModal';
import { MemberRegistrationDrawer } from './MemberRegistrationDrawer';
import { MoneyService } from '../../services/moneyService';
import { DateService } from '../../services/dateService';

interface StudentListProps {
  initialOpenNewModal?: boolean;
  onModalClosed?: () => void;
}

export const StudentList: React.FC<StudentListProps> = ({ 
  initialOpenNewModal = false,
  onModalClosed
}) => {
  const { 
    students, 
    coaches, 
    packages,
    addStudent, 
    updateStudent, 
    deleteStudent, 
    recordStudentPayment, 
    renewStudentMembership, 
    formatMoney, 
    formatNum, 
    t, 
    lang 
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCoachId, setSelectedCoachId] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDebtFilter, setSelectedDebtFilter] = useState('all'); // all, with_debt, settled

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

  // Add/Edit Form Fields
  const [fullName, setFullName] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [phone, setPhone] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [coachId, setCoachId] = useState('');
  const [packageType, setPackageType] = useState<PackageType>('1_month');
  const [registrationDate, setRegistrationDate] = useState('1403/05/25');
  const [expireDate, setExpireDate] = useState('1403/06/25');
  const [totalFee, setTotalFee] = useState<number>(2800000);
  const [initialPayment, setInitialPayment] = useState<number>(2800000);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pos');
  const [sessionsTotal, setSessionsTotal] = useState<number>(12);
  const [height, setHeight] = useState<number>(175);
  const [weight, setWeight] = useState<number>(75);
  const [goal, setGoal] = useState('افزایش حجم و تناسب اندام');
  const [medicalNotes, setMedicalNotes] = useState('');

  // Optional Services State
  const [wantsCoach, setWantsCoach] = useState(false);
  const [wantsWorkoutPlan, setWantsWorkoutPlan] = useState(false);
  const [wantsDietPlan, setWantsDietPlan] = useState(false);
  const [coachFee, setCoachFee] = useState<number>(0);
  const [workoutPlanFee, setWorkoutPlanFee] = useState<number>(500000);
  const [dietPlanFee, setDietPlanFee] = useState<number>(400000);

  const getPackagePrice = (pkg: PackageType): number => {
    const found = packages.find(p => p.type === pkg);
    if (found) return found.price;
    const defaults: Record<PackageType, number> = {
      '1_month': 2800000,
      '3_months': 6800000,
      '6_months': 12000000,
      '12_months': 22000000,
      'vip_personal': 4500000,
      '12_sessions': 2400000,
      '24_sessions': 4200000,
    };
    return defaults[pkg] || 2500000;
  };

  const getPackageSessions = (pkg: PackageType): number => {
    const found = packages.find(p => p.type === pkg);
    if (found) return found.sessionsCount;
    if (pkg === '12_sessions') return 12;
    if (pkg === '24_sessions') return 24;
    if (pkg === '3_months') return 36;
    return 24;
  };

  const recalculateTotal = (
    pkg: PackageType, 
    withCoach: boolean, 
    withWorkout: boolean, 
    withDiet: boolean, 
    cId?: string
  ) => {
    const base = getPackagePrice(pkg);
    const selectedCoach = coaches.find(c => c.id === (cId !== undefined ? cId : coachId));
    const cFee = withCoach ? (selectedCoach?.baseSalary ? Math.round(selectedCoach.baseSalary / 20) : 1000000) : 0;
    const wFee = withWorkout ? 500000 : 0;
    const dFee = withDiet ? 400000 : 0;
    
    setCoachFee(cFee);
    const sum = base + cFee + wFee + dFee;
    setTotalFee(sum);
    setInitialPayment(sum);
  };

  const handlePackageChange = (pkg: PackageType) => {
    setPackageType(pkg);
    setSessionsTotal(getPackageSessions(pkg));
    recalculateTotal(pkg, wantsCoach, wantsWorkoutPlan, wantsDietPlan);
  };

  const handleCoachChange = (cId: string) => {
    setCoachId(cId);
    if (cId === '' || cId === 'none') {
      setWantsCoach(false);
      recalculateTotal(packageType, false, wantsWorkoutPlan, wantsDietPlan, '');
    } else {
      setWantsCoach(true);
      recalculateTotal(packageType, true, wantsWorkoutPlan, wantsDietPlan, cId);
    }
  };

  const handleToggleCoach = (checked: boolean) => {
    setWantsCoach(checked);
    if (!checked) {
      setCoachId('');
    } else if (!coachId && coaches[0]) {
      setCoachId(coaches[0].id);
    }
    recalculateTotal(packageType, checked, wantsWorkoutPlan, wantsDietPlan, checked ? coachId || coaches[0]?.id : '');
  };

  const handleToggleWorkoutPlan = (checked: boolean) => {
    setWantsWorkoutPlan(checked);
    recalculateTotal(packageType, wantsCoach, checked, wantsDietPlan);
  };

  const handleToggleDietPlan = (checked: boolean) => {
    setWantsDietPlan(checked);
    recalculateTotal(packageType, wantsCoach, wantsWorkoutPlan, checked);
  };

  const openAddModal = () => {
    setEditingStudent(null);
    setFullName('');
    setNationalId('');
    setPhone('');
    setEmergencyPhone('');
    setCoachId('');
    setWantsCoach(false);
    setWantsWorkoutPlan(false);
    setWantsDietPlan(false);
    setPackageType('1_month');
    const base = getPackagePrice('1_month');
    setTotalFee(base);
    setInitialPayment(base);
    setPaymentMethod('pos');
    setSessionsTotal(getPackageSessions('1_month'));
    setRegistrationDate('1403/05/25');
    setExpireDate('1403/06/25');
    setHeight(175);
    setWeight(75);
    setGoal('تناسب اندام و هایپرتروفی');
    setMedicalNotes('');
    setIsAddModalOpen(true);
  };

  const openEditModal = (st: Student) => {
    setEditingStudent(st);
    setFullName(st.fullName);
    setNationalId(st.nationalId);
    setPhone(st.phone);
    setEmergencyPhone(st.emergencyPhone || '');
    setCoachId(st.coachId || '');
    setWantsCoach(Boolean(st.wantsCoach || (st.coachId && st.coachId !== '')));
    setWantsWorkoutPlan(Boolean(st.wantsWorkoutPlan));
    setWantsDietPlan(Boolean(st.wantsDietPlan));
    setPackageType(st.packageType);
    setTotalFee(st.totalFee);
    setInitialPayment(st.paidAmount);
    setSessionsTotal(st.sessionsTotal);
    setRegistrationDate(st.registrationDate);
    setExpireDate(st.expireDate);
    setHeight(st.height || 175);
    setWeight(st.weight || 75);
    setGoal(st.goal || '');
    setMedicalNotes(st.medicalNotes || '');
    setIsAddModalOpen(true);
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone) return;

    if (editingStudent) {
      updateStudent(editingStudent.id, {
        fullName,
        nationalId,
        phone,
        emergencyPhone,
        coachId: wantsCoach ? coachId : '',
        packageType,
        totalFee,
        paidAmount: initialPayment,
        sessionsTotal,
        registrationDate,
        expireDate,
        height,
        weight,
        goal,
        medicalNotes,
        wantsCoach,
        wantsWorkoutPlan,
        wantsDietPlan,
        coachFee: wantsCoach ? coachFee : 0,
        planFee: (wantsWorkoutPlan ? workoutPlanFee : 0) + (wantsDietPlan ? dietPlanFee : 0),
      });
    } else {
      addStudent(
        {
          fullName,
          nationalId: nationalId.trim(),
          phone,
          emergencyPhone,
          coachId: wantsCoach ? coachId : '',
          packageType,
          registrationDate,
          expireDate,
          totalFee,
          paidAmount: initialPayment,
          status: 'active',
          sessionsTotal,
          sessionsAttended: 0,
          height,
          weight,
          goal,
          medicalNotes,
          wantsCoach,
          wantsWorkoutPlan,
          wantsDietPlan,
          coachFee: wantsCoach ? coachFee : 0,
          planFee: (wantsWorkoutPlan ? workoutPlanFee : 0) + (wantsDietPlan ? dietPlanFee : 0),
        },
        initialPayment,
        paymentMethod
      );
    }

    setIsAddModalOpen(false);
    if (onModalClosed) onModalClosed();
  };

  const handleSettleDebtSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payDebtStudent || debtPayAmount <= 0) return;

    recordStudentPayment(payDebtStudent.id, debtPayAmount, debtPayMethod, debtPayNote);
    setPayDebtStudent(null);
    setDebtPayAmount(0);
  };

  const handleRenewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renewStudent) return;

    renewStudentMembership(
      renewStudent.id,
      renewPackage,
      renewFee,
      renewPaid,
      renewPayMethod,
      renewExpireDate
    );
    setRenewStudent(null);
  };

  // Filters
  const filteredStudents = students.filter(st => {
    const matchesSearch = 
      st.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      st.phone.includes(searchTerm) ||
      st.nationalId.includes(searchTerm) ||
      (st.memberNumber && st.memberNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCoach = selectedCoachId === 'all' || st.coachId === selectedCoachId;
    const matchesStatus = selectedStatus === 'all' || st.status === selectedStatus;
    const matchesDebt = 
      selectedDebtFilter === 'all' 
        ? true 
        : selectedDebtFilter === 'with_debt' 
        ? st.remainingDebt > 0 
        : st.remainingDebt === 0;

    return matchesSearch && matchesCoach && matchesStatus && matchesDebt;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-amber-500" />
            <span>{t.studentsTitle}</span>
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-2xl">
            {t.studentsDesc}
          </p>
        </div>

        <button
          id="add-student-btn"
          onClick={openAddModal}
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold rounded-xl text-sm shadow-xs transition-colors flex items-center justify-center gap-2 flex-shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>{t.newStudent}</span>
        </button>
      </div>

      {/* Search and Advanced Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="relative sm:col-span-2">
          <Search className="absolute right-3 rtl:right-3 rtl:left-auto left-auto top-3 h-4 w-4 text-stone-400" />
          <input
            id="student-search-input"
            type="text"
            placeholder="جستجوی نام، تلفن یا کدملی شاگرد..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-10 rtl:pr-10 rtl:pl-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <select
          value={selectedCoachId}
          onChange={(e) => setSelectedCoachId(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm text-stone-700 dark:text-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option value="all">تمامی مربیان</option>
          {coaches.map(c => (
            <option key={c.id} value={c.id}>{c.fullName}</option>
          ))}
        </select>

        <select
          value={selectedDebtFilter}
          onChange={(e) => setSelectedDebtFilter(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm text-stone-700 dark:text-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option value="all">تمامی وضعیت‌های مالی</option>
          <option value="with_debt">فقط بدهکاران شهریه</option>
          <option value="settled">تسویه شده و بدون بدهی</option>
        </select>
      </div>

      {/* Students Table */}
      {filteredStudents.length === 0 ? (
        <div className="bg-white dark:bg-stone-900 p-12 text-center rounded-2xl border border-stone-200 dark:border-stone-800 text-stone-500">
          {t.noStudentsFound}
        </div>
      ) : (
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right rtl:text-right">
              <thead className="bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-semibold border-b border-stone-200 dark:border-stone-700">
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
              <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
                {filteredStudents.map((st) => {
                  const coach = coaches.find(c => c.id === st.coachId);
                  const hasDebt = st.remainingDebt > 0;
                  return (
                    <tr key={st.id} className="hover:bg-stone-50/80 dark:hover:bg-stone-800/40 transition-colors">
                      
                      {/* Name & Phone & Member Number */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-stone-900 dark:text-white text-sm">
                            {st.fullName}
                          </span>
                          {st.memberNumber && (
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/25 shrink-0">
                              #{st.memberNumber}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-stone-400 font-mono flex items-center gap-2 mt-0.5">
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
                        {coach ? (
                          <span className="px-2 py-1 rounded-lg bg-amber-500/15 text-amber-900 dark:text-amber-300 font-semibold text-xs inline-flex items-center gap-1">
                            <UserCheck className="w-3.5 h-3.5 text-amber-500" />
                            {coach.fullName.split(' ')[0] + ' ' + (coach.fullName.split(' ')[1] || '')}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 font-normal text-xs">
                            بدون مربی (آزاد)
                          </span>
                        )}
                        
                        {/* Optional Plans Indicators */}
                        {(st.wantsWorkoutPlan || st.wantsDietPlan) && (
                          <div className="flex items-center gap-1 mt-1">
                            {st.wantsWorkoutPlan && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-bold" title="دارای برنامه تمرینی">
                                برنامه تمرین
                              </span>
                            )}
                            {st.wantsDietPlan && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold" title="دارای برنامه تغذیه">
                                رژیم
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Package */}
                      <td className="p-3.5 text-stone-700 dark:text-stone-300 font-medium">
                        {packages.find(p => p.type === st.packageType)?.name || st.packageType}
                      </td>

                      {/* Total Fee */}
                      <td className="p-3.5 font-mono font-semibold text-stone-800 dark:text-stone-200">
                        {formatMoney(st.totalFee)}
                      </td>

                      {/* Paid */}
                      <td className="p-3.5 font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                        {formatMoney(st.paidAmount)}
                      </td>

                      {/* Debt */}
                      <td className="p-3.5">
                        {hasDebt ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded font-mono font-bold text-xs bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                            {formatMoney(st.remainingDebt)}
                          </span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                            تسویه ✓
                          </span>
                        )}
                      </td>

                      {/* Sessions / Expire */}
                      <td className="p-3.5 text-stone-600 dark:text-stone-400">
                        <div className="font-mono">{st.expireDate}</div>
                        <div className="text-[10px] text-stone-400 font-mono">
                          {st.sessionsAttended} / {st.sessionsTotal} جلسه
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          st.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}>
                          {st.status === 'active' ? t.active : t.expired}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          
                          {/* Settle Debt Button */}
                          {hasDebt && (
                            <button
                              onClick={() => {
                                setPayDebtStudent(st);
                                setDebtPayAmount(st.remainingDebt);
                              }}
                              className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900 text-amber-700 dark:text-amber-300 font-bold"
                              title={t.payDebt}
                            >
                              <DollarSign className="h-4 w-4" />
                            </button>
                          )}

                          {/* Renew Button */}
                          <button
                            onClick={() => {
                              setRenewStudent(st);
                              const pr = getPackagePrice(st.packageType);
                              setRenewFee(pr);
                              setRenewPaid(pr);
                            }}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-emerald-600 hover:bg-stone-100 dark:hover:bg-stone-800"
                            title={t.renewMembership}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </button>

                          {/* View Detail Button */}
                          <button
                            onClick={() => setSelectedStudentForDetail(st.id)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
                            title="پرونده شاگرد"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </button>

                          {/* Edit Button */}
                          <button
                            onClick={() => openEditModal(st)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
                            title={t.edit}
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => {
                              if (confirm(`آیا از حذف شاگرد ${st.fullName} اطمینان دارید؟`)) {
                                deleteStudent(st.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-stone-100 dark:hover:bg-stone-800"
                            title={t.delete}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>

                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
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
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-xl bg-white dark:bg-stone-900 rounded-2xl shadow-xl border border-stone-200 dark:border-stone-800 overflow-hidden my-8">
            <div className="p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-stone-900 dark:text-white">
                {editingStudent ? 'ویرایش اطلاعات شاگرد' : t.newStudent}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  if (onModalClosed) onModalClosed();
                }}
                className="text-stone-400 hover:text-stone-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-stone-700 dark:text-stone-300 mb-1">
                    {t.studentName} *
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="نام و نام‌خانوادگی"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-stone-700 dark:text-stone-300 mb-1">
                    {t.phoneNumber} *
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0935..."
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-mono text-sm"
                    required
                  />
                </div>
              </div>

              {/* Package & Optional Services */}
              <div className="space-y-3 p-4 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700">
                <div>
                  <label className="block font-bold text-stone-900 dark:text-white mb-1.5 flex items-center justify-between">
                    <span>{t.packageType}</span>
                    <span className="text-xs font-normal text-stone-500">بر اساس تعرفه‌های مصوب باشگاه</span>
                  </label>
                  <select
                    value={packageType}
                    onChange={(e) => handlePackageChange(e.target.value as PackageType)}
                    className="w-full px-3 py-2.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm font-semibold text-stone-900 dark:text-white"
                  >
                    {packages.map(p => (
                      <option key={p.id} value={p.type}>
                        {p.name} ({p.durationDays} روزه / {p.sessionsCount} جلسه) - {formatMoney(p.price)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-2 border-t border-stone-200 dark:border-stone-700 space-y-2.5">
                  <div className="text-xs font-bold text-stone-800 dark:text-stone-200">
                    خدمات انتخابی و اختیاری (Optional Add-ons):
                  </div>

                  {/* Coach Optional */}
                  <div className="p-2.5 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={wantsCoach}
                        onChange={(e) => handleToggleCoach(e.target.checked)}
                        className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
                      />
                      <span className="text-xs font-semibold text-stone-900 dark:text-white">
                        درخواست مربی اختصاصی / خصوصی
                      </span>
                      <span className="text-[11px] text-stone-500 mr-auto font-mono">
                        {wantsCoach ? `+${formatMoney(coachFee)}` : '(بدون مربی / تمرین آزاد)'}
                      </span>
                    </label>

                    {wantsCoach && (
                      <div className="pt-1.5 pr-6">
                        <select
                          value={coachId}
                          onChange={(e) => handleCoachChange(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs"
                        >
                          <option value="">انتخاب مربی اختصاصی...</option>
                          {coaches.map(c => (
                            <option key={c.id} value={c.id}>
                              {c.fullName} ({c.specialty})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Workout Plan Optional */}
                  <div className="p-2.5 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={wantsWorkoutPlan}
                        onChange={(e) => handleToggleWorkoutPlan(e.target.checked)}
                        className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
                      />
                      <span className="text-xs font-semibold text-stone-900 dark:text-white">
                        صدور و تنظیم برنامه تمرینی اختصاصی
                      </span>
                      <span className="text-[11px] text-stone-500 mr-auto font-mono">
                        {wantsWorkoutPlan ? `+${formatMoney(workoutPlanFee)}` : 'اختیاری'}
                      </span>
                    </label>
                  </div>

                  {/* Diet Plan Optional */}
                  <div className="p-2.5 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={wantsDietPlan}
                        onChange={(e) => handleToggleDietPlan(e.target.checked)}
                        className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
                      />
                      <span className="text-xs font-semibold text-stone-900 dark:text-white">
                        تنظیم رژیم تغذیه و مکمل ورزشی
                      </span>
                      <span className="text-[11px] text-stone-500 mr-auto font-mono">
                        {wantsDietPlan ? `+${formatMoney(dietPlanFee)}` : 'اختیاری'}
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Financial Section */}
              <div className="p-3.5 rounded-xl bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/30 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-stone-900 dark:text-white mb-1">
                      {t.totalFee} ({t.currency})
                    </label>
                    <input
                      type="number"
                      value={totalFee || ''}
                      onChange={(e) => setTotalFee(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-amber-500/40 bg-white dark:bg-stone-900 font-mono text-sm font-bold text-stone-900 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                      {t.paidAmount} (دریافتی اولیه)
                    </label>
                    <input
                      type="number"
                      value={initialPayment || ''}
                      onChange={(e) => setInitialPayment(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-emerald-500/40 bg-white dark:bg-stone-900 font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-amber-500/20">
                  <div className="flex items-center gap-2">
                    <span>روش پرداخت:</span>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                      className="px-2 py-1 rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                    >
                      <option value="pos">کارتخوان (POS)</option>
                      <option value="card_transfer">کارت به کارت</option>
                      <option value="cash">نقدی</option>
                    </select>
                  </div>
                  <div className="font-mono text-rose-600 dark:text-rose-400 font-bold">
                    مانده بدهی: {formatMoney(Math.max(0, totalFee - initialPayment))}
                  </div>
                </div>
              </div>

              {/* Dates & Biometrics */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-stone-700 dark:text-stone-300 mb-1">
                    {t.expireDate}
                  </label>
                  <input
                    type="text"
                    value={expireDate}
                    onChange={(e) => setExpireDate(e.target.value)}
                    placeholder="1403/06/25"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block font-medium text-stone-700 dark:text-stone-300 mb-1">
                    هدف تمرینی
                  </label>
                  <input
                    type="text"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder="کاهش وزن، عضله‌سازی..."
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-stone-700 dark:text-stone-300 mb-1">
                  ملاحظات پزشکی یا آسیب‌دیدگی
                </label>
                <textarea
                  rows={2}
                  value={medicalNotes}
                  onChange={(e) => setMedicalNotes(e.target.value)}
                  placeholder="دیسک کمر، جراحی قبلی، محدودیت حرکتی..."
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm"
                />
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-stone-600 dark:text-stone-400 hover:bg-stone-100 rounded-lg"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold rounded-lg transition-colors"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Debt Modal */}
      {payDebtStudent && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white dark:bg-stone-900 rounded-2xl shadow-xl border border-stone-200 dark:border-stone-800 overflow-hidden my-8 p-6">
            <h3 className="text-base font-bold text-stone-900 dark:text-white mb-2">
              ثبت تسویه بدهی شهریه
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              شاگرد: <strong>{payDebtStudent.fullName}</strong> | کل بدهی معوق: <strong className="text-rose-600 font-mono">{formatMoney(payDebtStudent.remainingDebt)}</strong>
            </p>

            <form onSubmit={handleSettleDebtSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-stone-700 dark:text-stone-300 mb-1">
                  مبلغ دریافتی ({t.currency})
                </label>
                <input
                  type="number"
                  value={debtPayAmount || ''}
                  onChange={(e) => setDebtPayAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-mono text-sm font-bold text-emerald-600"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-stone-700 dark:text-stone-300 mb-1">
                  روش پرداخت
                </label>
                <select
                  value={debtPayMethod}
                  onChange={(e) => setDebtPayMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm"
                >
                  <option value="pos">کارتخوان (POS)</option>
                  <option value="card_transfer">کارت به کارت</option>
                  <option value="cash">نقدی</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-stone-700 dark:text-stone-300 mb-1">
                  توضیحات فیش
                </label>
                <input
                  type="text"
                  value={debtPayNote}
                  onChange={(e) => setDebtPayNote(e.target.value)}
                  placeholder="تسویه مانده شهریه دوره"
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPayDebtStudent(null)}
                  className="px-3 py-1.5 text-stone-600"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg"
                >
                  ثبت پرداخت و کسر بدهی
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Renew Membership Modal */}
      {renewStudent && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white dark:bg-stone-900 rounded-2xl shadow-xl border border-stone-200 dark:border-stone-800 overflow-hidden my-8 p-6">
            <h3 className="text-base font-bold text-stone-900 dark:text-white mb-2">
              تمدید دوره عضویت شاگرد
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              شاگرد: <strong>{renewStudent.fullName}</strong>
            </p>

            <form onSubmit={handleRenewSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-stone-700 dark:text-stone-300 mb-1">
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
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm"
                >
                  {packages.map(p => (
                    <option key={p.id} value={p.type}>
                      {p.name} ({p.durationDays} روزه / {p.sessionsCount} جلسه) - {formatMoney(p.price)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-stone-700 dark:text-stone-300 mb-1">
                    شهریه دوره
                  </label>
                  <input
                    type="number"
                    value={renewFee || ''}
                    onChange={(e) => setRenewFee(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-mono text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block font-medium text-emerald-600 dark:text-emerald-400 mb-1">
                    مبلغ پرداختی
                  </label>
                  <input
                    type="number"
                    value={renewPaid || ''}
                    onChange={(e) => setRenewPaid(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-mono text-sm font-bold text-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-stone-700 dark:text-stone-300 mb-1">
                  تاریخ پایان دوره جدید
                </label>
                <input
                  type="text"
                  value={renewExpireDate}
                  onChange={(e) => setRenewExpireDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-mono text-sm"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRenewStudent(null)}
                  className="px-3 py-1.5 text-stone-600"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold rounded-lg"
                >
                  تایید تمدید دوره
                </button>
              </div>
            </form>
          </div>
        </div>
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
