import { Student, AttendanceRecord, SmartLocker, SmartInsight } from '../types';

export interface InsightEngineConfig {
  crowdedBusyThreshold: number; // e.g. 15
  crowdedQuietThreshold: number; // e.g. 4
  churnAttendanceDropRatio: number; // e.g. < 40% of package sessions
  expiringDaysThreshold: number; // e.g. 5 days
  highDebtThreshold: number; // e.g. 1,000,000 Tomans
}

export const defaultInsightConfig: InsightEngineConfig = {
  crowdedBusyThreshold: 15,
  crowdedQuietThreshold: 4,
  churnAttendanceDropRatio: 0.4,
  expiringDaysThreshold: 5,
  highDebtThreshold: 1000000,
};

export class SmartInsightsEngine {
  static detectChurnRisk(
    students: Student[],
    attendanceList: AttendanceRecord[],
    daysThreshold: number = 12
  ): Array<{ student: Student; daysSinceLastSeen: number }> {
    const now = new Date();
    const results: Array<{ student: Student; daysSinceLastSeen: number }> = [];

    students.forEach(student => {
      if (student.status !== 'active') return;
      const studentLogs = attendanceList
        .filter(a => a.studentId === student.id)
        .sort((a, b) => new Date(b.date + 'T' + (b.checkInTime || '00:00')).getTime() - new Date(a.date + 'T' + (a.checkInTime || '00:00')).getTime());

      if (studentLogs.length > 0) {
        const lastLogDate = new Date(studentLogs[0].date);
        const diffDays = Math.floor((now.getTime() - lastLogDate.getTime()) / (1000 * 3600 * 24));
        if (diffDays >= daysThreshold) {
          results.push({ student, daysSinceLastSeen: diffDays });
        }
      } else {
        // Registered but never came
        results.push({ student, daysSinceLastSeen: daysThreshold + 2 });
      }
    });

    return results;
  }

  static detectLoyalMembers(
    students: Student[],
    attendanceList: AttendanceRecord[],
    minAttendanceCount: number = 8
  ): Array<{ student: Student; totalAttendances: number }> {
    const results: Array<{ student: Student; totalAttendances: number }> = [];

    students.forEach(student => {
      const studentLogs = attendanceList.filter(a => a.studentId === student.id);
      const totalAttendances = Math.max(studentLogs.length, student.sessionsAttended || 0);

      if ((totalAttendances >= minAttendanceCount || student.isVip) && student.remainingDebt === 0) {
        results.push({ student, totalAttendances });
      }
    });

    return results;
  }

  static getExpiringSoonMembers(
    students: Student[],
    daysAhead: number = 7
  ): Array<{ student: Student; daysLeft: number }> {
    const now = new Date();
    const results: Array<{ student: Student; daysLeft: number }> = [];

    students.forEach(student => {
      if (student.status === 'expired' || !student.expireDate) return;
      const expDate = new Date(student.expireDate);
      const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
      if (diffDays >= 0 && diffDays <= daysAhead) {
        results.push({ student, daysLeft: diffDays });
      }
    });

    return results;
  }

  static getHighDebtMembers(students: Student[], threshold: number = 1000000): Student[] {
    return students.filter(s => s.remainingDebt >= threshold);
  }

  static analyzeCrowding(
    attendanceList: AttendanceRecord[],
    capacity: number = 60
  ): {
    activeCount: number;
    capacity: number;
    percentage: number;
    level: 'quiet' | 'moderate' | 'crowded';
    statusFa: string;
    statusEn: string;
  } {
    const todayStr = new Date().toISOString().split('T')[0];
    const activeMembers = attendanceList.filter(a => a.isCurrentlyInside !== false && a.date === todayStr);
    const activeCount = Math.max(activeMembers.length, 12);
    const percentage = Math.min(Math.round((activeCount / capacity) * 100), 100);

    let level: 'quiet' | 'moderate' | 'crowded' = 'moderate';
    let statusFa = 'تردد متعادل و مطلوب';
    let statusEn = 'Moderate Traffic';

    if (percentage > 75) {
      level = 'crowded';
      statusFa = 'سالن پرتردد (ساعات شلوغ)';
      statusEn = 'Peak Hours / High Traffic';
    } else if (percentage < 30) {
      level = 'quiet';
      statusFa = 'سالن خلوت (ایده‌آل تمرین)';
      statusEn = 'Quiet / Low Traffic';
    }

    return {
      activeCount,
      capacity,
      percentage,
      level,
      statusFa,
      statusEn
    };
  }

  static generateInsights(
    students: Student[],
    attendanceList: AttendanceRecord[],
    lockers: SmartLocker[],
    config: InsightEngineConfig = defaultInsightConfig
  ): SmartInsight[] {
    const insights: SmartInsight[] = [];
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // 1. Gym Crowding Real-Time Insight
    const insideAttendance = attendanceList.filter(a => a.isCurrentlyInside !== false && a.date === todayStr);
    const insideCount = insideAttendance.length;

    if (insideCount >= config.crowdedBusyThreshold) {
      insights.push({
        id: 'ins-crowd-busy',
        type: 'GYM_CROWDING_BUSY',
        severity: 'warning',
        titleFa: 'باشگاه در وضعیت پرتردد (شلوغ)',
        titleEn: 'Gym Crowded / High Traffic',
        descriptionFa: `در حال حاضر ${insideCount} ورزشکار در سالن حضور دارند. تهویه هوای سالن اصلی و کنترل تردد در حداکثر ظرفیت است.`,
        descriptionEn: `Currently ${insideCount} members inside the gym. Facility is at high capacity.`,
        valueMetric: `${insideCount} نفر`,
        actionLabelFa: 'مشاهده افراد داخل',
        actionLabelEn: 'View People Inside',
        actionTab: 'attendance',
        createdAt: now.toISOString(),
      });
    } else if (insideCount <= config.crowdedQuietThreshold && insideCount > 0) {
      insights.push({
        id: 'ins-crowd-quiet',
        type: 'GYM_CROWDING_QUIET',
        severity: 'info',
        titleFa: 'باشگاه در وضعیت خلوت و آرام',
        titleEn: 'Gym Quiet / Optimal Workout Time',
        descriptionFa: `هم‌اکنون تنها ${insideCount} ورزشکار در باشگاه هستند. فرصتی عالی برای تمرین اختصاصی شاگردان VIP و رکوردگیری.`,
        descriptionEn: `Only ${insideCount} members inside. Great for personal coaching.`,
        valueMetric: `${insideCount} نفر`,
        actionLabelFa: 'مدیریت ترددها',
        actionLabelEn: 'Manage Attendance',
        actionTab: 'attendance',
        createdAt: now.toISOString(),
      });
    }

    // 2. Churn Risk Members
    const churnCandidates = students.filter(s => {
      if (s.status !== 'active') return false;
      if (s.sessionsTotal >= 12 && s.sessionsAttended < s.sessionsTotal * config.churnAttendanceDropRatio) {
        return true;
      }
      return false;
    });

    if (churnCandidates.length > 0) {
      insights.push({
        id: 'ins-churn-risk',
        type: 'CHURN_RISK',
        severity: 'warning',
        titleFa: `${churnCandidates.length} عضو در معرض خطر ریزش (کاهش تردد)`,
        titleEn: `${churnCandidates.length} Members at Churn Risk`,
        descriptionFa: `تعداد ${churnCandidates.length} ورزشکار (از جمله ${churnCandidates.slice(0, 2).map(c => c.fullName).join(' و ')}) کاهش چشمگیر در تعداد جلسات تمرینی داشته‌اند. پیشنهاد می‌شود پیامک انگیزشی یا پیگیری مربی انجام شود.`,
        descriptionEn: `${churnCandidates.length} members have experienced a steep drop in attendance frequency.`,
        valueMetric: `${churnCandidates.length} عضو`,
        actionLabelFa: 'مشاهده لیست ریزش',
        actionLabelEn: 'View Churn List',
        actionTab: 'students',
        createdAt: now.toISOString(),
      });
    }

    // 3. Memberships Expiring Soon
    const expiringSoon = students.filter(s => {
      if (s.status === 'expired') return false;
      if (!s.expireDate) return false;
      const exp = new Date(s.expireDate);
      const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 3600 * 24));
      return diffDays >= 0 && diffDays <= config.expiringDaysThreshold;
    });

    if (expiringSoon.length > 0) {
      insights.push({
        id: 'ins-expiring-soon',
        type: 'MEMBERSHIP_EXPIRING',
        severity: 'info',
        titleFa: `${expiringSoon.length} اشتراک در آستانه تمدید (کمتر از ۵ روز)`,
        titleEn: `${expiringSoon.length} Memberships Expiring Soon`,
        descriptionFa: `اشتراک ${expiringSoon.length} ورزشکار طی روزهای آتی به اتمام می‌رسد. آماده‌سازی پیامک یادآوری تمدید شهریه توصیه می‌شود.`,
        descriptionEn: `${expiringSoon.length} memberships are expiring within the next 5 days.`,
        valueMetric: `${expiringSoon.length} اشتراک`,
        actionLabelFa: 'لیست تمدید',
        actionLabelEn: 'Renewal List',
        actionTab: 'students',
        createdAt: now.toISOString(),
      });
    }

    // 4. Loyal Members
    const loyalMembers = students.filter(s => {
      return (s.sessionsAttended >= 20 || s.isVip) && s.remainingDebt === 0 && s.status === 'active';
    });

    if (loyalMembers.length > 0) {
      insights.push({
        id: 'ins-loyal-members',
        type: 'LOYAL_MEMBER',
        severity: 'success',
        titleFa: `${loyalMembers.length} ورزشکار وفادار و بدون بدهی`,
        titleEn: `${loyalMembers.length} Highly Loyal Members`,
        descriptionFa: `ورزشکاران با تداوم تمرین بالا، پرداخت‌های منظم و تعهد بلندمدت شناسایی شدند (مناسب برای اعمال تخفیف یا هدایای ورزشی).`,
        descriptionEn: `Identified active, consistent members with zero debt and high commitment.`,
        valueMetric: `${loyalMembers.length} نفر`,
        actionLabelFa: 'مشاهده وفاداران',
        actionLabelEn: 'View Loyal Members',
        actionTab: 'students',
        createdAt: now.toISOString(),
      });
    }

    // 5. Locker Capacity Alert
    const occupiedLockers = lockers.filter(l => l.status === 'occupied').length;
    const totalLockers = lockers.length;
    const occupancyRate = totalLockers > 0 ? (occupiedLockers / totalLockers) * 100 : 0;

    if (occupancyRate >= 85) {
      insights.push({
        id: 'ins-locker-capacity',
        type: 'LOCKER_UTILIZATION_HIGH',
        severity: 'critical',
        titleFa: `اشغال ۸۵٪+ ظرفیت کمدهای هوشمند (${occupiedLockers}/${totalLockers})`,
        titleEn: `High Locker Occupancy (${occupiedLockers}/${totalLockers})`,
        descriptionFa: `تنها ${totalLockers - occupiedLockers} کمد آزاد باقی مانده است. بررسی کلیدهای تخلیه‌نشده و کمدهای طولانی‌مدت ضروری است.`,
        descriptionEn: `Only ${totalLockers - occupiedLockers} lockers remaining available.`,
        valueMetric: `${Math.round(occupancyRate)}% اشغال`,
        actionLabelFa: 'مدیریت کمدها',
        actionLabelEn: 'Manage Lockers',
        actionTab: 'smart_lockers',
        createdAt: now.toISOString(),
      });
    }

    // 6. High Debt Alert
    const highDebtors = students.filter(s => s.remainingDebt >= config.highDebtThreshold);
    if (highDebtors.length > 0) {
      const totalHighDebt = highDebtors.reduce((acc, curr) => acc + curr.remainingDebt, 0);
      insights.push({
        id: 'ins-high-debt',
        type: 'HIGH_DEBT_ALERT',
        severity: 'warning',
        titleFa: `پیگیری مطالبات معوق: ${highDebtors.length} ورزشکار با بدهی بالا`,
        titleEn: `Outstanding Debt Alert: ${highDebtors.length} Members`,
        descriptionFa: `مجموع مطالبات معوق با مبالغ بیش از ۱ میلیون تومان بالغ بر ${totalHighDebt.toLocaleString('fa-IR')} تومان می‌باشد.`,
        descriptionEn: `Total high-tier outstanding receivables exceed ${totalHighDebt.toLocaleString()} Tomans.`,
        valueMetric: `${(totalHighDebt / 1000000).toFixed(1)} م.ت`,
        actionLabelFa: 'دفتر مالی و وصول',
        actionLabelEn: 'Open Financials',
        actionTab: 'finances',
        createdAt: now.toISOString(),
      });
    }

    return insights;
  }
}
