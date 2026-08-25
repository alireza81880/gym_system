import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Phone, 
  CreditCard, 
  DollarSign, 
  Edit3, 
  Trash2, 
  ExternalLink, 
  CheckCircle,
  Percent,
  Wallet,
  Briefcase
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Coach } from '../../types';
import { CoachDetailModal } from './CoachDetailModal';

export const CoachList: React.FC = () => {
  const { 
    coaches, 
    addCoach, 
    updateCoach, 
    deleteCoach, 
    getCoachStats, 
    formatMoney, 
    formatNum, 
    t, 
    lang 
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [selectedCoachForDetail, setSelectedCoachForDetail] = useState<string | null>(null);

  // Form Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoachId, setEditingCoachId] = useState<string | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [phone, setPhone] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [commissionRate, setCommissionRate] = useState<number>(70);
  const [joinDate, setJoinDate] = useState('');
  const [bankCard, setBankCard] = useState('');
  const [bankShaba, setBankShaba] = useState('');
  const [bankName, setBankName] = useState('');
  const [monthlyTargetStudents, setMonthlyTargetStudents] = useState<number>(15);
  const [notes, setNotes] = useState('');

  const specialties = Array.from(new Set(coaches.map(c => c.specialty)));

  const filteredCoaches = coaches.filter(coach => {
    const matchesSearch = 
      coach.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coach.phone.includes(searchTerm) ||
      coach.specialty.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecialty = selectedSpecialty === 'all' || coach.specialty === selectedSpecialty;
    return matchesSearch && matchesSpecialty;
  });

  const openAddModal = () => {
    setEditingCoachId(null);
    setFullName('');
    setNationalId('');
    setPhone('');
    setSpecialty('پرورش اندام و فیتنس');
    setCommissionRate(70);
    setJoinDate(new Date().toLocaleDateString('fa-IR'));
    setBankCard('');
    setBankShaba('');
    setBankName('بانک ملی');
    setMonthlyTargetStudents(15);
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (coach: Coach) => {
    setEditingCoachId(coach.id);
    setFullName(coach.fullName);
    setNationalId(coach.nationalId);
    setPhone(coach.phone);
    setSpecialty(coach.specialty);
    setCommissionRate(coach.commissionRate);
    setJoinDate(coach.joinDate);
    setBankCard(coach.bankCard || '');
    setBankShaba(coach.bankShaba || '');
    setBankName(coach.bankName || '');
    setMonthlyTargetStudents(coach.monthlyTargetStudents || 15);
    setNotes(coach.notes || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone) return;

    if (editingCoachId) {
      updateCoach(editingCoachId, {
        fullName,
        nationalId,
        phone,
        specialty,
        commissionRate,
        joinDate,
        bankCard,
        bankShaba,
        bankName,
        monthlyTargetStudents,
        notes,
      });
    } else {
      addCoach({
        fullName,
        nationalId,
        phone,
        specialty,
        commissionRate,
        joinDate: joinDate || '1403/05/25',
        status: 'active',
        bankCard,
        bankShaba,
        bankName,
        monthlyTargetStudents,
        notes,
      });
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900 dark:text-white flex items-center gap-2">
            <Users className="h-6 w-6 text-amber-500" />
            <span>{t.coachManagementTitle}</span>
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-2xl">
            {t.coachManagementDesc}
          </p>
        </div>

        <button
          id="add-coach-btn"
          onClick={openAddModal}
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold rounded-xl text-sm shadow-xs transition-colors flex items-center justify-center gap-2 flex-shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>{t.addCoach}</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 rtl:right-3 rtl:left-auto left-auto top-3 h-4 w-4 text-stone-400" />
          <input
            id="coach-search-input"
            type="text"
            placeholder="جستجوی نام مربی، رشته یا تلفن..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-10 rtl:pr-10 rtl:pl-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <select
          id="coach-specialty-filter"
          value={selectedSpecialty}
          onChange={(e) => setSelectedSpecialty(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm text-stone-700 dark:text-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option value="all">تمامی تخصص‌ها ({coaches.length})</option>
          {specialties.map(spec => (
            <option key={spec} value={spec}>{spec}</option>
          ))}
        </select>
      </div>

      {/* Coaches Grid */}
      {filteredCoaches.length === 0 ? (
        <div className="bg-white dark:bg-stone-900 p-12 text-center rounded-2xl border border-stone-200 dark:border-stone-800 text-stone-500">
          {t.noCoachesFound}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredCoaches.map((coach) => {
            const stats = getCoachStats(coach.id);
            return (
              <div
                key={coach.id}
                id={`coach-card-${coach.id}`}
                className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 shadow-xs hover:border-stone-400 dark:hover:border-stone-700 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar of Card */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      <div className="h-12 w-12 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-white flex items-center justify-center font-bold text-lg border border-stone-200 dark:border-stone-700">
                        {coach.fullName.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-stone-900 dark:text-white">
                          {coach.fullName}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-stone-500 dark:text-stone-400">{coach.specialty}</span>
                          <span className="h-1 w-1 rounded-full bg-stone-300"></span>
                          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                            %{coach.commissionRate} سهم مربی
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(coach)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                        title={t.edit}
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`آیا از حذف مربی ${coach.fullName} اطمینان دارید؟`)) {
                            deleteCoach(coach.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                        title={t.delete}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Metrics Bar */}
                  <div className="grid grid-cols-3 gap-2 mt-4 p-3 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-100 dark:border-stone-800 text-center">
                    <div>
                      <div className="text-[11px] text-stone-500 dark:text-stone-400">{t.assignedStudents}</div>
                      <div className="text-sm font-bold text-stone-900 dark:text-white font-mono mt-0.5">
                        {formatNum(stats.totalStudents)} نفر
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-stone-500 dark:text-stone-400">{t.coachEarned}</div>
                      <div className="text-sm font-bold text-amber-600 dark:text-amber-400 font-mono mt-0.5">
                        {formatMoney(stats.totalCoachShare)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-stone-500 dark:text-stone-400">{t.remainingCoachBalance}</div>
                      <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                        {formatMoney(stats.remainingBalance)}
                      </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="mt-3 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 px-1">
                    <span className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5" />
                      <span className="font-mono">{coach.phone}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CreditCard className="h-3.5 w-3.5" />
                      <span className="font-mono">{coach.bankCard ? coach.bankCard.slice(0, 9) + '...' : 'بدون کارت'}</span>
                    </span>
                  </div>
                </div>

                {/* Card Action Button */}
                <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-2">
                  <span className="text-xs text-stone-400">
                    عضویت: <span className="font-mono">{coach.joinDate}</span>
                  </span>

                  <button
                    id={`view-coach-ledger-${coach.id}`}
                    onClick={() => setSelectedCoachForDetail(coach.id)}
                    className="px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
                  >
                    <span>{t.coachDetails}</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Coach Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-white dark:bg-stone-900 rounded-2xl shadow-xl border border-stone-200 dark:border-stone-800 overflow-hidden my-8">
            <div className="p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-stone-900 dark:text-white">
                {editingCoachId ? t.editCoach : t.addCoach}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-stone-700 dark:text-stone-300 mb-1">
                  {t.coachName} *
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="مثلاً: علیرضا محمدی"
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-stone-700 dark:text-stone-300 mb-1">
                    {t.phoneNumber} *
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="09121234567"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-mono text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-stone-700 dark:text-stone-300 mb-1">
                    {t.nationalId}
                  </label>
                  <input
                    type="text"
                    value={nationalId}
                    onChange={(e) => setNationalId(e.target.value)}
                    placeholder="0012345678"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-mono text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-stone-700 dark:text-stone-300 mb-1">
                    {t.specialty}
                  </label>
                  <input
                    type="text"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    placeholder="پرورش اندام، کراس‌فیت، فیتنس..."
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-stone-700 dark:text-stone-300 mb-1">
                    {t.commissionPercent} (%) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-mono text-sm font-bold text-amber-600"
                    required
                  />
                  <span className="text-[10px] text-stone-400 mt-0.5 block">{t.commissionNotice}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-stone-700 dark:text-stone-300 mb-1">
                    {t.bankCard}
                  </label>
                  <input
                    type="text"
                    value={bankCard}
                    onChange={(e) => setBankCard(e.target.value)}
                    placeholder="6037-xxxx-xxxx-xxxx"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block font-medium text-stone-700 dark:text-stone-300 mb-1">
                    {t.bankShaba}
                  </label>
                  <input
                    type="text"
                    value={bankShaba}
                    onChange={(e) => setBankShaba(e.target.value)}
                    placeholder="IR..."
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-mono text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-stone-700 dark:text-stone-300 mb-1">
                  توضیحات و سوابق قهرمانی / مدارک
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="سوابق مربیگری، افتخارات، مدارک بین‌المللی..."
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm"
                />
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
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

      {/* Coach Detail Ledger Modal */}
      {selectedCoachForDetail && (
        <CoachDetailModal
          coachId={selectedCoachForDetail}
          onClose={() => setSelectedCoachForDetail(null)}
        />
      )}

    </div>
  );
};
