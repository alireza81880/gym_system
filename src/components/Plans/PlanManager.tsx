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
import { WorkoutPlan, DietPlan } from '../../types';

export const PlanManager: React.FC = () => {
  const { 
    workoutPlans, 
    dietPlans, 
    saveWorkoutPlan, 
    deleteWorkoutPlan, 
    saveDietPlan, 
    deleteDietPlan, 
    students, 
    coaches, 
    t, 
    lang 
  } = useApp();

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
      <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900 dark:text-white flex items-center gap-2">
            <FileText className="h-6 w-6 text-amber-500" />
            <span>{t.plansTitle}</span>
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            {t.plansDesc}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsWorkoutModalOpen(true)}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs"
          >
            <Dumbbell className="h-4 w-4" />
            <span>{t.createWorkoutPlan}</span>
          </button>

          <button
            onClick={() => setIsDietModalOpen(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs"
          >
            <Apple className="h-4 w-4" />
            <span>{t.createDietPlan}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-stone-200 dark:border-stone-800 pb-2">
        <button
          onClick={() => setActiveTab('workout')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'workout'
              ? 'bg-amber-500 text-stone-950'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
          }`}
        >
          <Dumbbell className="h-4 w-4" />
          <span>برنامه‌های تمرینی ({workoutPlans.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('diet')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'diet'
              ? 'bg-emerald-600 text-white'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
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
            <div
              key={wp.id}
              className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 shadow-xs space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase">
                    شاگرد: {wp.studentName}
                  </span>
                  <h3 className="text-base font-bold text-stone-900 dark:text-white mt-0.5">
                    {wp.title}
                  </h3>
                  <div className="text-xs text-stone-500 mt-1 flex items-center gap-2">
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
                    className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300"
                    title="چاپ برنامه"
                  >
                    <Printer className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteWorkoutPlan(wp.id)}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600"
                    title="حذف"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Days Accordion / Preview */}
              <div className="space-y-3 pt-2">
                {wp.days.map((day) => (
                  <div key={day.id} className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-800 text-xs">
                    <h4 className="font-bold text-stone-900 dark:text-white mb-2 text-xs">
                      {day.dayTitle}
                    </h4>
                    <div className="space-y-1.5">
                      {day.exercises.map((ex) => (
                        <div key={ex.id} className="flex justify-between items-center py-1 border-b border-stone-200 dark:border-stone-700/50 text-[11px]">
                          <span className="font-medium text-stone-800 dark:text-stone-200">{ex.name}</span>
                          <span className="font-mono text-stone-500">{ex.sets} ست × {ex.reps}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {wp.coachNotes && (
                <div className="text-xs text-stone-600 dark:text-stone-400 p-2.5 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/40">
                  <strong>نکات مربی:</strong> {wp.coachNotes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Diet Plans Content */}
      {activeTab === 'diet' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {dietPlans.map((dp) => (
            <div
              key={dp.id}
              className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 shadow-xs space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                    ورزشکار: {dp.studentName}
                  </span>
                  <h3 className="text-base font-bold text-stone-900 dark:text-white mt-0.5">
                    {dp.title}
                  </h3>
                  <div className="text-xs text-stone-500 mt-1 flex items-center gap-2">
                    <span>مربی: {dp.coachName}</span>
                    <span>•</span>
                    <span className="font-mono font-bold text-emerald-600">{dp.dailyCaloriesTarget} kcal</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setSelectedPlanForPrint(dp);
                      setTimeout(() => window.print(), 200);
                    }}
                    className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300"
                    title="چاپ رژیم"
                  >
                    <Printer className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteDietPlan(dp.id)}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600"
                    title="حذف"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Meals List */}
              <div className="space-y-2 pt-2">
                {dp.meals.map((m) => (
                  <div key={m.id} className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-800 text-xs">
                    <div className="flex justify-between font-bold text-stone-900 dark:text-white mb-1">
                      <span>{m.mealName}</span>
                      <span className="font-mono text-emerald-600">{m.caloriesEstimate} kcal</span>
                    </div>
                    <p className="text-stone-600 dark:text-stone-400 text-[11px] leading-relaxed">
                      {m.items}
                    </p>
                  </div>
                ))}
              </div>

              <div className="text-xs text-stone-600 dark:text-stone-400 p-2.5 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/40">
                <div><strong>مصرف آب روزانه:</strong> {dp.waterIntakeLiters} لیتر</div>
                {dp.supplementsNotes && <div className="mt-1"><strong>مکمل‌ها:</strong> {dp.supplementsNotes}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Workout Modal */}
      {isWorkoutModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-white dark:bg-stone-900 rounded-2xl shadow-xl border border-stone-200 dark:border-stone-800 p-6 space-y-4 text-xs">
            <h3 className="text-base font-bold text-stone-900 dark:text-white">
              {t.createWorkoutPlan}
            </h3>

            <form onSubmit={handleCreateWorkoutPlan} className="space-y-4">
              <div>
                <label className="block font-medium mb-1">انتخاب شاگرد *</label>
                <select
                  value={wpStudentId}
                  onChange={(e) => setWpStudentId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm"
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.fullName} ({s.goal || 'بدون هدف'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium mb-1">عنوان برنامه</label>
                <input
                  type="text"
                  value={wpTitle}
                  onChange={(e) => setWpTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">هدف برنامه</label>
                  <input
                    type="text"
                    value={wpGoal}
                    onChange={(e) => setWpGoal(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">تعداد جلسات در هفته</label>
                  <input
                    type="text"
                    defaultValue="۳ الی ۴ روز"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium mb-1">توضیحات و نکات مربی</label>
                <textarea
                  rows={2}
                  value={wpNotes}
                  onChange={(e) => setWpNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsWorkoutModalOpen(false)}
                  className="px-3 py-1.5 text-stone-600"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold rounded-lg"
                >
                  تولید و ثبت برنامه تمرینی
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Diet Modal */}
      {isDietModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-white dark:bg-stone-900 rounded-2xl shadow-xl border border-stone-200 dark:border-stone-800 p-6 space-y-4 text-xs">
            <h3 className="text-base font-bold text-stone-900 dark:text-white">
              {t.createDietPlan}
            </h3>

            <form onSubmit={handleCreateDietPlan} className="space-y-4">
              <div>
                <label className="block font-medium mb-1">انتخاب شاگرد *</label>
                <select
                  value={dpStudentId}
                  onChange={(e) => setDpStudentId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm"
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.fullName} ({s.goal || 'عمومی'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium mb-1">عنوان رژیم</label>
                <input
                  type="text"
                  value={dpTitle}
                  onChange={(e) => setDpTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">هدف کالری روزانه (kcal)</label>
                  <input
                    type="number"
                    value={dpCalories || ''}
                    onChange={(e) => setDpCalories(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">مصرف آب روزانه (لیتر)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={dpWater || ''}
                    onChange={(e) => setDpWater(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-mono text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium mb-1">مکمل‌های پیشنهادی</label>
                <input
                  type="text"
                  value={dpSupplements}
                  onChange={(e) => setDpSupplements(e.target.value)}
                  placeholder="پروتئین وی، کراتین، مولتی ویتامین..."
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDietModalOpen(false)}
                  className="px-3 py-1.5 text-stone-600"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg"
                >
                  ثبت رژیم غذایی
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
