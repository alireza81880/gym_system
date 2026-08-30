import React, { useState, useMemo } from 'react';
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
import { useSettings } from '../../stores';
import { Coach } from '../../types';
import { CoachDetailModal } from './CoachDetailModal';
import { GlassPageHeader } from '../common/GlassPageHeader';
import { GlassCard } from '../common/GlassCard';
import { GlassButton } from '../common/GlassButton';
import { GlassBadge } from '../common/GlassBadge';
import { GlassModal } from '../common/GlassModal';

export const CoachList: React.FC = () => {
  const { 
    formatMoney, 
    formatNum, 
    t, 
    lang 
  } = useApp();

  const {
    coaches, 
    addCoach, 
    updateCoach, 
    deleteCoach, 
    getCoachStats, 
  } = useSettings();

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

  const specialties = useMemo(() => {
    return Array.from(new Set(coaches.map(c => c.specialty)));
  }, [coaches]);

  const coachStatsMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof getCoachStats>>();
    coaches.forEach(c => {
      map.set(c.id, getCoachStats(c.id));
    });
    return map;
  }, [coaches, getCoachStats]);

  const filteredCoaches = useMemo(() => {
    return coaches.filter(coach => {
      const matchesSearch = 
        coach.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        coach.phone.includes(searchTerm) ||
        coach.specialty.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSpecialty = selectedSpecialty === 'all' || coach.specialty === selectedSpecialty;
      return matchesSearch && matchesSpecialty;
    });
  }, [coaches, searchTerm, selectedSpecialty]);

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
      <GlassPageHeader
        title={t.coachManagementTitle}
        subtitle={t.coachManagementDesc}
        icon={<Users className="w-6 h-6 text-[var(--gym-brand,#10b981)]" />}
        actions={
          <GlassButton
            id="add-coach-btn"
            variant="neon"
            size="md"
            icon={<Plus className="h-4 w-4" />}
            onClick={openAddModal}
          >
            {t.addCoach}
          </GlassButton>
        }
      />

      {/* Search & Filter Bar */}
      <GlassCard variant="subtle" className="p-3.5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--gym-text-muted)]" />
            <input
              id="coach-search-input"
              type="text"
              placeholder="جستجوی نام مربی، رشته یا تلفن..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-9 pl-4 py-2 rounded-xl glass-subtle border border-[var(--gym-border)] text-xs text-[var(--gym-text)] focus:border-[var(--gym-brand,#10b981)] outline-none"
            />
          </div>

          <select
            id="coach-specialty-filter"
            value={selectedSpecialty}
            onChange={(e) => setSelectedSpecialty(e.target.value)}
            className="px-3 py-2 rounded-xl glass-subtle border border-[var(--gym-border)] text-xs text-[var(--gym-text)] bg-[var(--gym-surface)] outline-none"
          >
            <option value="all" className="bg-stone-900 text-white">تمامی تخصص‌ها ({coaches.length})</option>
            {specialties.map(spec => (
              <option key={spec} value={spec} className="bg-stone-900 text-white">{spec}</option>
            ))}
          </select>
        </div>
      </GlassCard>

      {/* Coaches Grid */}
      {filteredCoaches.length === 0 ? (
        <GlassCard variant="subtle" className="p-12 text-center text-[var(--gym-text-muted)] text-xs">
          {t.noCoachesFound}
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredCoaches.map((coach) => {
            const stats = coachStatsMap.get(coach.id) || getCoachStats(coach.id);
            return (
              <GlassCard
                key={coach.id}
                id={`coach-card-${coach.id}`}
                variant="regular"
                className="p-5 flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Top Bar of Card */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      <div className="h-12 w-12 rounded-2xl bg-[var(--gym-brand,#10b981)]/15 text-[var(--gym-brand,#10b981)] border border-[var(--gym-brand,#10b981)]/30 flex items-center justify-center font-bold text-lg">
                        {coach.fullName.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-[var(--gym-text,#fff)]">
                          {coach.fullName}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-[var(--gym-text-muted)]">{coach.specialty}</span>
                          <span className="h-1 w-1 rounded-full bg-[var(--gym-border)]"></span>
                          <span className="text-xs font-semibold text-amber-400">
                            %{coach.commissionRate} سهم مربی
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(coach)}
                        className="p-1.5 rounded-lg text-[var(--gym-text-muted)] hover:text-blue-400 hover:bg-blue-500/15 transition-colors cursor-pointer"
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
                        className="p-1.5 rounded-lg text-[var(--gym-text-muted)] hover:text-rose-400 hover:bg-rose-500/15 transition-colors cursor-pointer"
                        title={t.delete}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Metrics Bar */}
                  <div className="grid grid-cols-3 gap-2 mt-4 p-3 rounded-2xl glass-subtle border border-[var(--gym-border)] text-center">
                    <div>
                      <div className="text-[11px] text-[var(--gym-text-muted)]">{t.assignedStudents}</div>
                      <div className="text-sm font-bold text-[var(--gym-text,#fff)] font-mono mt-0.5">
                        {formatNum(stats.totalStudents)} نفر
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-[var(--gym-text-muted)]">{t.coachEarned}</div>
                      <div className="text-sm font-bold text-amber-400 font-mono mt-0.5">
                        {formatMoney(stats.totalCoachShare)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-[var(--gym-text-muted)]">{t.remainingCoachBalance}</div>
                      <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
                        {formatMoney(stats.remainingBalance)}
                      </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="mt-3 flex items-center justify-between text-xs text-[var(--gym-text-secondary)] px-1">
                    <span className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-[var(--gym-brand,#10b981)]" />
                      <span className="font-mono">{coach.phone}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CreditCard className="h-3.5 w-3.5 text-amber-400" />
                      <span className="font-mono">{coach.bankCard ? coach.bankCard.slice(0, 9) + '...' : 'بدون کارت'}</span>
                    </span>
                  </div>
                </div>

                {/* Card Action Button */}
                <div className="pt-3 border-t border-[var(--gym-border)] flex items-center justify-between gap-2">
                  <span className="text-xs text-[var(--gym-text-muted)]">
                    عضویت: <span className="font-mono">{coach.joinDate}</span>
                  </span>

                  <GlassButton
                    id={`view-coach-ledger-${coach.id}`}
                    variant="secondary"
                    size="sm"
                    icon={<ExternalLink className="h-3.5 w-3.5" />}
                    onClick={() => setSelectedCoachForDetail(coach.id)}
                  >
                    {t.coachDetails}
                  </GlassButton>
                </div>

              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Add / Edit Coach Modal */}
      {isModalOpen && (
        <GlassModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingCoachId ? t.editCoach : t.addCoach}
          subtitle="تعیین درصد پورسانت، اطلاعات بانکی و تخصص مربی"
          icon={<Users className="w-5 h-5 text-[var(--gym-brand,#10b981)]" />}
        >
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-[var(--gym-text-secondary)] mb-1">
                {t.coachName} *
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="مثلاً: علیرضا محمدی"
                className="w-full px-3 py-2 rounded-xl glass-subtle border border-[var(--gym-border)] text-sm text-[var(--gym-text)] focus:border-[var(--gym-brand,#10b981)] outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[var(--gym-text-secondary)] mb-1">
                  {t.phoneNumber} *
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="09121234567"
                  className="w-full px-3 py-2 rounded-xl glass-subtle border border-[var(--gym-border)] font-mono text-sm text-[var(--gym-text)] focus:border-[var(--gym-brand,#10b981)] outline-none"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-[var(--gym-text-secondary)] mb-1">
                  {t.nationalId}
                </label>
                <input
                  type="text"
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value)}
                  placeholder="0012345678"
                  className="w-full px-3 py-2 rounded-xl glass-subtle border border-[var(--gym-border)] font-mono text-sm text-[var(--gym-text)]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[var(--gym-text-secondary)] mb-1">
                  {t.specialty}
                </label>
                <input
                  type="text"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  placeholder="پرورش اندام، کراس‌فیت، فیتنس..."
                  className="w-full px-3 py-2 rounded-xl glass-subtle border border-[var(--gym-border)] text-sm text-[var(--gym-text)]"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-[var(--gym-text-secondary)] mb-1">
                  {t.commissionPercent} (%) *
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl glass-subtle border border-[var(--gym-border)] font-mono text-sm font-bold text-amber-400"
                  required
                />
                <span className="text-[10px] text-[var(--gym-text-muted)] mt-0.5 block">{t.commissionNotice}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[var(--gym-text-secondary)] mb-1">
                  {t.bankCard}
                </label>
                <input
                  type="text"
                  value={bankCard}
                  onChange={(e) => setBankCard(e.target.value)}
                  placeholder="6037-xxxx-xxxx-xxxx"
                  className="w-full px-3 py-2 rounded-xl glass-subtle border border-[var(--gym-border)] font-mono text-sm text-[var(--gym-text)]"
                />
              </div>
              <div>
                <label className="block font-semibold text-[var(--gym-text-secondary)] mb-1">
                  {t.bankShaba}
                </label>
                <input
                  type="text"
                  value={bankShaba}
                  onChange={(e) => setBankShaba(e.target.value)}
                  placeholder="IR..."
                  className="w-full px-3 py-2 rounded-xl glass-subtle border border-[var(--gym-border)] font-mono text-sm text-[var(--gym-text)]"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[var(--gym-text-secondary)] mb-1">
                توضیحات و سوابق قهرمانی / مدارک
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="سوابق مربیگری، افتخارات، مدارک بین‌المللی..."
                className="w-full px-3 py-2 rounded-xl glass-subtle border border-[var(--gym-border)] text-sm text-[var(--gym-text)]"
              />
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-[var(--gym-border)]">
              <GlassButton
                variant="ghost"
                size="sm"
                onClick={() => setIsModalOpen(false)}
              >
                {t.cancel}
              </GlassButton>
              <GlassButton
                variant="neon"
                size="sm"
                type="submit"
              >
                {t.save}
              </GlassButton>
            </div>
          </form>
        </GlassModal>
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
