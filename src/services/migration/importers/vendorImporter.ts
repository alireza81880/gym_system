import { VendorConnectorMetadata } from '../migrationTypes';

export class VendorImporter {
  /**
   * Registry of known Iranian & international gym management / hardware vendors
   */
  static readonly VENDORS: VendorConnectorMetadata[] = [
    {
      id: 'vendor-zkteco',
      vendorName: 'zkteco',
      vendorTitleFa: 'سامانه‌های حضور و غیاب ZKTeco (BioSecurity / BioTime)',
      descriptionFa: 'اتصال مستقیم به پایگاه داده یا خروجی کاربران اکسل ZKTeco با پشتیبانی از کدهای RFID و الگوهای بیومتریک',
      status: 'supported',
      supportedVersions: ['BioTime 8.5+', 'BioSecurity 3.2+', 'ZKBio CVAccess'],
      supportedEntities: ['members', 'attendance'],
      defaultFields: {
        'User ID': 'memberNumber',
        'First Name': 'firstName',
        'Last Name': 'lastName',
        'Card No': 'rfidCardUid',
        'Mobile': 'phone',
        'Department': 'notes',
      },
    },
    {
      id: 'vendor-hesabras',
      vendorName: 'hesabras',
      vendorTitleFa: 'نرم‌افزار مدیریت باشگاه حساب‌رس (Hesabras)',
      descriptionFa: 'انتقال کامل اعضا، تاریخ انقضا، مانده بدهی و پکیج‌های ثبت شده از نرم‌افزار حساب‌رس',
      status: 'supported',
      supportedVersions: ['v4.x', 'v5.x', 'Cloud'],
      supportedEntities: ['members', 'memberships', 'payments'],
      defaultFields: {
        'شماره عضویت': 'memberNumber',
        'نام': 'firstName',
        'نام خانوادگی': 'lastName',
        'کد ملی': 'nationalId',
        'تلفن همراه': 'phone',
        'تاریخ انقضا': 'expireDate',
        'مانده بدهی': 'remainingDebt',
      },
    },
    {
      id: 'vendor-radin',
      vendorName: 'radin',
      vendorTitleFa: 'سامانه رادین / مکسس (Radin / Maxas)',
      descriptionFa: 'سازگار با خروجی‌های استاندارد اکسل و SQL پایگاه داده نرم‌افزارهای رادین و مکسس',
      status: 'supported',
      supportedVersions: ['2023+', '2024+'],
      supportedEntities: ['members', 'payments', 'attendance', 'lockers'],
      defaultFields: {
        'کد عضو': 'memberNumber',
        'نام و نام خانوادگی': 'fullName',
        'همراه': 'phone',
        'کارت تردد': 'rfidCardUid',
        'اعتبار تا': 'expireDate',
      },
    },
    {
      id: 'vendor-taradod',
      vendorName: 'taradod_general',
      vendorTitleFa: 'گیت‌های کنترل تردد پالیز افزار / علم و صنعت',
      descriptionFa: 'انتقال لاگ‌های تردد و کدهای تگ RFID اعضا از نرم‌افزارهای گیت تردد',
      status: 'requires_gateway',
      supportedVersions: ['REST API v1', 'Direct DB Sync'],
      supportedEntities: ['members', 'attendance'],
      defaultFields: {
        'PersonCode': 'memberNumber',
        'PersonName': 'fullName',
        'CardNumber': 'rfidCardUid',
      },
    },
    {
      id: 'vendor-spad',
      vendorName: 'spad',
      vendorTitleFa: 'سامانه ابری اسپاد (Spad Cloud Gym)',
      descriptionFa: 'اتصال مستقیم با API برای انتقال خودکار و مداوم پرونده‌های ورزشکاران',
      status: 'coming_soon',
      supportedVersions: ['API v2'],
      supportedEntities: ['members', 'memberships', 'payments'],
      defaultFields: {
        'member_id': 'memberNumber',
        'full_name': 'fullName',
        'mobile': 'phone',
      },
    },
  ];

  static getVendorById(id: string): VendorConnectorMetadata | undefined {
    return this.VENDORS.find(v => v.id === id || v.vendorName === id);
  }
}
