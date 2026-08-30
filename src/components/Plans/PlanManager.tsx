import React, { useState } from 'react';
import { 
  FileText, 
  Dumbbell, 
  Apple, 
  Plus, 
  Printer, 
  Trash2, 
  User, 
  Check, 
  Sparkles,
  Calendar,
  Layers
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { usePlans, useMembers, useSettings } from '../../stores';
import { WorkoutPlan, DietPlan } from '../../types';
import { GlassPageHeader } from '../common/GlassPageHeader';
import { GlassCard } from '../common/GlassCard';
import { GlassButton } from '../common/GlassButton';
import { GlassBadge } from '../common/GlassBadge';
import { GlassModal } from '../common/GlassModal';

export const PlanManager: React.FC = () => {
  const { 
    t, 
    lang 
  } = useApp();

  const {
    workoutPlans, 
    dietPlans, 
    saveWorkoutPlan, 
    deleteWorkoutPlan, 
    saveDietPlan, 
    deleteDietPlan, 
  } = usePlans();

  const {
    students,
  } = useMembers();

  const {
    coaches,
  } = useSettings();

  const [activeTab, setActiveTab] = useState<'workout' | 'diet'>('workout');
  const [selectedPlanForPrint, setSelectedPlanForPrint] = useState<WorkoutPlan | DietPlan | null>(null);

  // New Workout Modal
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);
  const [wpStudentId, setWpStudentId] = useState(students[0]?.id || '');
  const [wpTitle, setWpTitle] = useState('برنامه بدنسازی هایپرتروفی و تفکیک عضلانی');
  const [wpGoal, setWpGoal] = useState('افزایش حجم عضلانی');
  const [wpNotes, setWpNotes] = useState('گرم کردن ۱۰ دقیقه قبل از شروع و حرکات کششی در پایان تمرین');

  // New Diet Modal
  const [isDietModalOpen, setIsDietModalOpen] = useState(false);
  const [dpStudentId, setDpStudentId] = useState(students[0]?.id || '');
  const [dpTitle, setDpTitle] = useState('رژیم افزایش وزن با پروتئین بالا');
  const [dpCalories, setDpCalories] = useState<number>(2700);
  const [dpWater, setDpWater] = useState<number>(3.5);
  const [dpSupplements, setDpSupplements] = useState('کراتین ۵ گرم بعد از تمرین + پروتئین وی ۱ پیمانه');

  const handleCreateWorkoutPlan = (e: React.FormEvent) => {
    e.preventDefault();
    const st = students.find(s => s.id === wpStudentId);
    if (!st) return;
    const coach = coaches.find(c => c.id === st.coachId);

    const newPlan: WorkoutPlan = {
      id: `wp-${Date.now()}`,
      studentId: st.id,
      studentName: st.fullName,
      coachId: st.coachId,
      coachName: coach ? coach.fullName : 'سرمربی باشگاه',
      title: wpTitle,
      createdAt: new Date().toLocaleDateString('fa-IR'),
      validUntil: st.expireDate,
      goal: wpGoal,
      coachNotes: wpNotes,
      days: [
        {
          id: 'd-1',
          dayTitle: 'روز اول: سینه و جلو بازو',
          exercises: [
            { id: 'ex-1', name: 'پرس سینه هالتر روی نیمکت تخت', sets: '4', reps: '10, 8, 8, 6', restTime: '90s' },
            { id: 'ex-2', name: 'بالاسینه دمبل متناوب', sets: '3', reps: '10-12', restTime: '60s' },
            { id: 'ex-3', name: 'کراس‌اور سیم‌کش از بالا', sets: '3', reps: '15', restTime: '45s' },
            { id: 'ex-4', name: 'جلو بازو هالتر ایستاده', sets: '4', reps: '10', restTime: '60s' },
          ],
        },
        {
          id: 'd-2',
          dayTitle: 'روز دوم: زیربغل و پشت بازو',
          exercises: [
            { id: 'ex-5', name: 'زیربغل سیم‌کش از جلو (لت)', sets: '4', reps: '12, 10, 8, 8', restTime: '75s' },
            { id: 'ex-6', name: 'زیربغل دمبل تک خم', sets: '3', reps: '10', restTime: '60s' },
            { id: 'ex-7', name: 'پشت بازو سیم‌کش طناب', sets: '4', reps: '12', restTime: '45s' },
            { id: 'ex-8', name: 'پشت بازو دیپ بین دو نیمکت', sets: '3', reps: '15', restTime: '60s' },
          ],
        },
      ],
    };

    saveWorkoutPlan(newPlan);
    setIsWorkoutModalOpen(false);
  };

  const handleCreateDietPlan = (e: React.FormEvent) => {
    e.preventDefault();
    const st = students.find(s => s.id === dpStudentId);
    if (!st) return;
    const coach = coaches.find(c => c.id === st.coachId);

    const newPlan: DietPlan = {
      id: `dp-${Date.now()}`,
      studentId: st.id,
      studentName: st.fullName,
      coachId: st.coachId,
      coachName: coach ? coach.fullName : 'کارشناس تغذیه باشگاه',
      title: dpTitle,
      dailyCaloriesTarget: dpCalories,
      createdAt: new Date().toLocaleDateString('fa-IR'),
      waterIntakeLiters: dpWater,
      supplementsNotes: dpSupplements,
      meals: [
        { id: 'm-1', mealName: 'صبحانه (۸:۰۰)', timing: 'صبح', items: '۴ عدد سفیده تخم مرغ + ۱ زرده، ۶۰ گرم جو دوسر پرک با شیر کم‌چرب و ۱ عدد موز', caloriesEstimate: 550 },
        { id: 'm-2', mealName: 'میان‌وعده اول (۱۱:۰۰)', timing: 'قبل ظهر', items: '۱ لیوان ماست پروتئینی ایسلندی + ۳۰ گرم بادام درختی خام', caloriesEstimate: 320 },
        { id: 'm-3', mealName: 'ناهار (۱۴:۰۰)', timing: 'ظهر', items: '۲۰۰ گرم سینه مرغ گریل شده + ۱۵۰ گرم برنج کته قهوه‌ای + بروکلی بخارپز', caloriesEstimate: 700 },
        { id: 'm-4', mealName: 'میان‌وعده قبل تمرین (۱۷:۳۰)', timing: 'عصر', items: '۲ عدد نان تست جو با ۲ قاشق کره بادام زمینی و عسل طبیعی', caloriesEstimate: 380 },
        { id: 'm-5', mealName: 'شام (۲۱:۰۰)', timing: 'شب', items: '۱۸۰ گرم فیله ماهی قزل‌آلا یا استیک گوشت کم‌چرب + سالاد فصل با روغن زیتون', caloriesEstimate: 600 },
      ],
    };

    saveDietPlan(newPlan);
    setIsDietModalOpen(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <GlassPageHeader
        title={t.plansTitle}
        subtitle={t.plansDesc}
        icon={<FileText className="w-6 h-6 text-[var(--gym-brand,#10b981)]" />}
        actions={
          <div className="flex items-center gap-2">
            <GlassButton
              variant="neon"
              size="md"
              icon={<Dumbbell className="h-4 w-4" />}
              onClick={() => setIsWorkoutModalOpen(true)}
            >
              {t.createWorkoutPlan}
            </GlassButton>

            <GlassButton
              variant="secondary"
              size="md"
              icon={<Apple className="h-4 w-4 text-emerald-400" />}
              onClick={() => setIsDietModalOpen(true)}
            >
              {t.createDietPlan}
            </GlassButton>
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex gap-2 p-1.5 glass-subtle rounded-2xl border border-[var(--gym-border)] w-fit">
        <button
          onClick={() => setActiveTab('workout')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'workout'
              ? 'bg-[var(--gym-brand,#10b981)] text-stone-950 shadow-xs'
              : 'text-[var(--gym-text-secondary)] hover:text-[var(--gym-text)]'
          }`}
        >
          <Dumbbell className="h-4 w-4" />
          <span>برنامه‌های تمرینی ({workoutPlans.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('diet')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'diet'
              ? 'bg-emerald-500 text-stone-950 shadow-xs'
              : 'text-[var(--gym-text-secondary)] hover:text-[var(--gym-text)]'
          }`}
        >
          <Apple className="h-4 w-4" />
          <span>برنامه‌های تغذیه و رژیم ({dietPlans.length})</span>
        </button>
      </div>

      {/* Workout Plans Content */}
      {activeTab === 'workout' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {workoutPlans.map((wp) => (
            <GlassCard
              key={wp.id}
              variant="regular"
              className="p-5 space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <GlassBadge variant="warning" size="sm">
                    شاگرد: {wp.studentName}
                  </GlassBadge>
                  <h3 className="text-base font-bold text-[var(--gym-text,#fff)] mt-1">
                    {wp.title}
                  </h3>
                  <div className="text-xs text-[var(--gym-text-muted)] mt-1 flex items-center gap-2">
                    <span>مربی: {wp.coachName}</span>
                    <span>•</span>
                    <span>تاریخ: {wp.createdAt}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setSelectedPlanForPrint(wp);
                      setTimeout(() => window.print(), 200);
                    }}
                    className="p-1.5 rounded-lg text-[var(--gym-text-muted)] hover:text-[var(--gym-text)] hover:bg-[var(--gym-surface-glass)] cursor-pointer transition-colors"
                    title="چاپ برنامه"
                  >
                    <Printer className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteWorkoutPlan(wp.id)}
                    className="p-1.5 rounded-lg text-[var(--gym-text-muted)] hover:text-rose-400 hover:bg-rose-500/15 cursor-pointer transition-colors"
                    title="حذف"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Days Accordion / Preview */}
              <div className="space-y-3 pt-2">
                {wp.days.map((day) => (
                  <div key={day.id} className="p-3 rounded-xl glass-subtle border border-[var(--gym-border)] text-xs">
                    <h4 className="font-bold text-[var(--gym-text,#fff)] mb-2 text-xs">
                      {day.dayTitle}
                    </h4>
                    <div className="space-y-1.5">
                      {day.exercises.map((ex) => (
                        <div key={ex.id} className="flex justify-between items-center py-1 border-b border-[var(--gym-border)] text-[11px]">
                          <span className="font-medium text-[var(--gym-text-secondary)]">{ex.name}</span>
                          <span className="font-mono text-[var(--gym-brand,#10b981)] font-bold">{ex.sets} ست × {ex.reps}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {wp.coachNotes && (
                <div className="text-xs text-[var(--gym-text-secondary)] p-2.5 rounded-xl glass-subtle border border-amber-500/30 bg-amber-500/5">
                  <strong className="text-amber-400">نکات مربی:</strong> {wp.coachNotes}
                </div>
              )}
            </GlassCard>
          ))}
        </div>
      )}

      {/* Diet Plans Content */}
      {activeTab === 'diet' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {dietPlans.map((dp) => (
            <GlassCard
              key={dp.id}
              variant="regular"
              className="p-5 space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <GlassBadge variant="success" size="sm">
                    ورزشکار: {dp.studentName}
                  </GlassBadge>
                  <h3 className="text-base font-bold text-[var(--gym-text,#fff)] mt-1">
                    {dp.title}
                  </h3>
                  <div className="text-xs text-[var(--gym-text-muted)] mt-1 flex items-center gap-2">
                    <span>مربی: {dp.coachName}</span>
                    <span>•</span>
                    <span className="font-mono font-bold text-emerald-400">{dp.dailyCaloriesTarget} kcal</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setSelectedPlanForPrint(dp);
                      setTimeout(() => window.print(), 200);
                    }}
                    className="p-1.5 rounded-lg text-[var(--gym-text-muted)] hover:text-[var(--gym-text)] hover:bg-[var(--gym-surface-glass)] cursor-pointer transition-colors"
                    title="چاپ رژیم"
                  >
                    <Printer className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteDietPlan(dp.id)}
                    className="p-1.5 rounded-lg text-[var(--gym-text-muted)] hover:text-rose-400 hover:bg-rose-500/15 cursor-pointer transition-colors"
                    title="حذف"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Meals List */}
              <div className="space-y-2 pt-2">
                {dp.meals.map((m) => (
                  <div key={m.id} className="p-3 rounded-xl glass-subtle border border-[var(--gym-border)] text-xs">
                    <div className="flex justify-between font-bold text-[var(--gym-text,#fff)] mb-1">
                      <span>{m.mealName}</span>
                      <span className="font-mono text-emerald-400 font-bold">{m.caloriesEstimate} kcal</span>
                    </div>
                    <p className="text-[var(--gym-text-secondary)] text-[11px] leading-relaxed">
                      {m.items}
                    </p>
                  </div>
                ))}
              </div>

              <div className="text-xs text-[var(--gym-text-secondary)] p-2.5 rounded-xl glass-subtle border border-emerald-500/30 bg-emerald-500/5">
                <div><strong className="text-emerald-400">مصرف آب روزانه:</strong> {dp.waterIntakeLiters} لیتر</div>
                {dp.supplementsNotes && <div className="mt-1"><strong className="text-emerald-400">مکمل‌ها:</strong> {dp.supplementsNotes}</div>}
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* New Workout Modal */}
      {isWorkoutModalOpen && (
        <GlassModal
          isOpen={isWorkoutModalOpen}
          onClose={() => setIsWorkoutModalOpen(false)}
          title={t.createWorkoutPlan}
          subtitle="طراحی برنامه تمرینی اختصاصی و سیستم ست‌ها"
          icon={<Dumbbell className="w-5 h-5 text-[var(--gym-brand,#10b981)]" />}
        >
          <form onSubmit={handleCreateWorkoutPlan} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-[var(--gym-text-secondary)] mb-1">انتخاب شاگرد *</label>
              <select
                value={wpStudentId}
                onChange={(e) => setWpStudentId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl glass-subtle border border-[var(--gym-border)] text-sm text-[var(--gym-text)] bg-[var(--gym-surface)]"
              >
                {students.map(s => (
                  <option key={s.id} value={s.id} className="bg-stone-900 text-white">{s.fullName} ({s.goal || 'بدون هدف'})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[var(--gym-text-secondary)] mb-1">عنوان برنامه</label>
              <input
                type="text"
                value={wpTitle}
                onChange={(e) => setWpTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl glass-subtle border border-[var(--gym-border)] text-sm text-[var(--gym-text)] focus:border-[var(--gym-brand,#10b981)] outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[var(--gym-text-secondary)] mb-1">هدف برنامه</label>
                <input
                  type="text"
                  value={wpGoal}
                  onChange={(e) => setWpGoal(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-subtle border border-[var(--gym-border)] text-sm text-[var(--gym-text)]"
                />
              </div>
              <div>
                <label className="block font-semibold text-[var(--gym-text-secondary)] mb-1">تعداد جلسات در هفته</label>
                <input
                  type="text"
                  defaultValue="۳ الی ۴ روز"
                  className="w-full px-3 py-2 rounded-xl glass-subtle border border-[var(--gym-border)] text-sm text-[var(--gym-text)]"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[var(--gym-text-secondary)] mb-1">توضیحات و نکات مربی</label>
              <textarea
                rows={2}
                value={wpNotes}
                onChange={(e) => setWpNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl glass-subtle border border-[var(--gym-border)] text-sm text-[var(--gym-text)]"
              />
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-[var(--gym-border)]">
              <GlassButton
                variant="ghost"
                size="sm"
                onClick={() => setIsWorkoutModalOpen(false)}
              >
                انصراف
              </GlassButton>
              <GlassButton
                variant="neon"
                size="sm"
                type="submit"
              >
                تولید و ثبت برنامه تمرینی
              </GlassButton>
            </div>
          </form>
        </GlassModal>
      )}

      {/* New Diet Modal */}
      {isDietModalOpen && (
        <GlassModal
          isOpen={isDietModalOpen}
          onClose={() => setIsDietModalOpen(false)}
          title={t.createDietPlan}
          subtitle="محاسبه کالری روزانه، رژیم غذایی و مکمل‌های ورزشی"
          icon={<Apple className="w-5 h-5 text-emerald-400" />}
        >
          <form onSubmit={handleCreateDietPlan} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-[var(--gym-text-secondary)] mb-1">انتخاب شاگرد *</label>
              <select
                value={dpStudentId}
                onChange={(e) => setDpStudentId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl glass-subtle border border-[var(--gym-border)] text-sm text-[var(--gym-text)] bg-[var(--gym-surface)]"
              >
                {students.map(s => (
                  <option key={s.id} value={s.id} className="bg-stone-900 text-white">{s.fullName} ({s.goal || 'عمومی'})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[var(--gym-text-secondary)] mb-1">عنوان رژیم</label>
              <input
                type="text"
                value={dpTitle}
                onChange={(e) => setDpTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl glass-subtle border border-[var(--gym-border)] text-sm text-[var(--gym-text)] focus:border-[var(--gym-brand,#10b981)] outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[var(--gym-text-secondary)] mb-1">هدف کالری روزانه (kcal)</label>
                <input
                  type="number"
                  value={dpCalories || ''}
                  onChange={(e) => setDpCalories(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl glass-subtle border border-[var(--gym-border)] font-mono text-sm text-emerald-400 font-bold"
                />
              </div>
              <div>
                <label className="block font-semibold text-[var(--gym-text-secondary)] mb-1">مصرف آب روزانه (لیتر)</label>
                <input
                  type="number"
                  step="0.5"
                  value={dpWater || ''}
                  onChange={(e) => setDpWater(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl glass-subtle border border-[var(--gym-border)] font-mono text-sm text-blue-400 font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[var(--gym-text-secondary)] mb-1">مکمل‌های پیشنهادی</label>
              <input
                type="text"
                value={dpSupplements}
                onChange={(e) => setDpSupplements(e.target.value)}
                placeholder="پروتئین وی، کراتین، مولتی ویتامین..."
                className="w-full px-3 py-2 rounded-xl glass-subtle border border-[var(--gym-border)] text-sm text-[var(--gym-text)]"
              />
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-[var(--gym-border)]">
              <GlassButton
                variant="ghost"
                size="sm"
                onClick={() => setIsDietModalOpen(false)}
              >
                انصراف
              </GlassButton>
              <GlassButton
                variant="secondary"
                size="sm"
                className="!bg-emerald-600 hover:!bg-emerald-500 !text-white"
                type="submit"
              >
                ثبت رژیم غذایی
              </GlassButton>
            </div>
          </form>
        </GlassModal>
      )}

    </div>
  );
};
