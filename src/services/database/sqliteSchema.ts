/**
 * Real SQLite Relational Database Schema Definitions
 * Version: 3
 * Contains standard ANSI SQLite DDL, typed columns, relational keys, and performance indexes.
 */

export interface SQLiteTableDefinition {
  name: string;
  createSql: string;
  indexes: string[];
}

export class SQLiteSchema {
  static readonly SCHEMA_VERSION = 3;

  /**
   * List of all domain relational tables in SQLite
   */
  static readonly TABLES: SQLiteTableDefinition[] = [
    {
      name: 'schema_version',
      createSql: `
        CREATE TABLE IF NOT EXISTS schema_version (
          version INTEGER PRIMARY KEY,
          applied_at TEXT NOT NULL,
          migration_notes TEXT
        );
      `,
      indexes: [],
    },
    {
      name: 'members',
      createSql: `
        CREATE TABLE IF NOT EXISTS members (
          id TEXT PRIMARY KEY,
          fullName TEXT NOT NULL,
          phone TEXT,
          nationalCode TEXT,
          gender TEXT,
          status TEXT NOT NULL DEFAULT 'active',
          birthDate TEXT,
          registrationDate TEXT NOT NULL,
          expireDate TEXT NOT NULL,
          packageType TEXT,
          sessionsTotal INTEGER DEFAULT 0,
          sessionsUsed INTEGER DEFAULT 0,
          sessionsRemaining INTEGER DEFAULT 0,
          totalFee REAL DEFAULT 0,
          paidAmount REAL DEFAULT 0,
          remainingDebt REAL DEFAULT 0,
          financialStatus TEXT DEFAULT 'settled',
          coachId TEXT,
          lockerNumber INTEGER,
          rfidCardNumber TEXT,
          fingerprintId TEXT,
          barcode TEXT,
          emergencyPhone TEXT,
          medicalNotes TEXT,
          notes TEXT,
          branchId TEXT,
          tenantId TEXT,
          avatarUrl TEXT,
          createdAt TEXT,
          updatedAt TEXT,
          metadata TEXT
        );
      `,
      indexes: [
        'CREATE INDEX IF NOT EXISTS idx_members_phone ON members (phone);',
        'CREATE INDEX IF NOT EXISTS idx_members_nationalCode ON members (nationalCode);',
        'CREATE INDEX IF NOT EXISTS idx_members_status ON members (status);',
        'CREATE INDEX IF NOT EXISTS idx_members_rfid ON members (rfidCardNumber);',
        'CREATE INDEX IF NOT EXISTS idx_members_barcode ON members (barcode);',
        'CREATE INDEX IF NOT EXISTS idx_members_expireDate ON members (expireDate);',
      ],
    },
    {
      name: 'memberships',
      createSql: `
        CREATE TABLE IF NOT EXISTS memberships (
          id TEXT PRIMARY KEY,
          memberId TEXT NOT NULL,
          packageId TEXT,
          packageType TEXT NOT NULL,
          packageNameSnapshot TEXT NOT NULL,
          packageSnapshot TEXT,
          startDate TEXT NOT NULL,
          expireDate TEXT NOT NULL,
          durationDays INTEGER NOT NULL,
          sessionsTotal INTEGER NOT NULL,
          sessionsUsed INTEGER DEFAULT 0,
          status TEXT NOT NULL DEFAULT 'active',
          basePrice REAL NOT NULL,
          discountAmount REAL DEFAULT 0,
          finalPrice REAL NOT NULL,
          paidAmount REAL DEFAULT 0,
          remainingDebt REAL DEFAULT 0,
          coachId TEXT,
          branchId TEXT,
          tenantId TEXT,
          createdAt TEXT NOT NULL,
          updatedAt TEXT,
          FOREIGN KEY (memberId) REFERENCES members(id) ON DELETE CASCADE
        );
      `,
      indexes: [
        'CREATE INDEX IF NOT EXISTS idx_memberships_memberId ON memberships (memberId);',
        'CREATE INDEX IF NOT EXISTS idx_memberships_status ON memberships (status);',
        'CREATE INDEX IF NOT EXISTS idx_memberships_expireDate ON memberships (expireDate);',
      ],
    },
    {
      name: 'charges',
      createSql: `
        CREATE TABLE IF NOT EXISTS charges (
          id TEXT PRIMARY KEY,
          chargeNumber TEXT NOT NULL,
          memberId TEXT NOT NULL,
          memberName TEXT NOT NULL,
          packageType TEXT,
          packageName TEXT NOT NULL,
          packageSnapshot TEXT,
          chargeDate TEXT NOT NULL,
          dueDate TEXT,
          basePrice REAL NOT NULL,
          discountAmount REAL DEFAULT 0,
          discountReason TEXT,
          taxAmount REAL DEFAULT 0,
          finalAmount REAL NOT NULL,
          paidAmount REAL DEFAULT 0,
          remainingAmount REAL NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          relatedMembershipId TEXT,
          notes TEXT,
          branchId TEXT,
          tenantId TEXT,
          createdAt TEXT NOT NULL,
          updatedAt TEXT,
          FOREIGN KEY (memberId) REFERENCES members(id) ON DELETE CASCADE
        );
      `,
      indexes: [
        'CREATE INDEX IF NOT EXISTS idx_charges_memberId ON charges (memberId);',
        'CREATE INDEX IF NOT EXISTS idx_charges_status ON charges (status);',
        'CREATE INDEX IF NOT EXISTS idx_charges_chargeDate ON charges (chargeDate);',
      ],
    },
    {
      name: 'payments',
      createSql: `
        CREATE TABLE IF NOT EXISTS payments (
          id TEXT PRIMARY KEY,
          receiptNumber TEXT NOT NULL,
          memberId TEXT NOT NULL,
          memberName TEXT NOT NULL,
          chargeId TEXT,
          amount REAL NOT NULL,
          paymentDate TEXT NOT NULL,
          method TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'completed',
          description TEXT,
          referenceCode TEXT,
          terminalNumber TEXT,
          posResponse TEXT,
          branchId TEXT,
          tenantId TEXT,
          recordedBy TEXT,
          createdAt TEXT NOT NULL,
          FOREIGN KEY (memberId) REFERENCES members(id) ON DELETE CASCADE
        );
      `,
      indexes: [
        'CREATE INDEX IF NOT EXISTS idx_payments_memberId ON payments (memberId);',
        'CREATE INDEX IF NOT EXISTS idx_payments_chargeId ON payments (chargeId);',
        'CREATE INDEX IF NOT EXISTS idx_payments_paymentDate ON payments (paymentDate);',
        'CREATE INDEX IF NOT EXISTS idx_payments_status ON payments (status);',
      ],
    },
    {
      name: 'attendance',
      createSql: `
        CREATE TABLE IF NOT EXISTS attendance (
          id TEXT PRIMARY KEY,
          memberId TEXT NOT NULL,
          memberName TEXT NOT NULL,
          date TEXT NOT NULL,
          entryTime TEXT NOT NULL,
          exitTime TEXT,
          method TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'present',
          assignedLockerNumber INTEGER,
          notes TEXT,
          gateNumber TEXT,
          branchId TEXT,
          tenantId TEXT,
          createdAt TEXT NOT NULL,
          FOREIGN KEY (memberId) REFERENCES members(id) ON DELETE CASCADE
        );
      `,
      indexes: [
        'CREATE INDEX IF NOT EXISTS idx_attendance_memberId ON attendance (memberId);',
        'CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance (date);',
        'CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance (status);',
      ],
    },
    {
      name: 'lockers',
      createSql: `
        CREATE TABLE IF NOT EXISTS lockers (
          number INTEGER PRIMARY KEY,
          status TEXT NOT NULL DEFAULT 'available',
          type TEXT NOT NULL DEFAULT 'regular',
          isVip INTEGER DEFAULT 0,
          assignedMemberId TEXT,
          assignedMemberName TEXT,
          assignedAt TEXT,
          hardwareRelayChannel INTEGER,
          notes TEXT,
          branchId TEXT,
          tenantId TEXT
        );
      `,
      indexes: [
        'CREATE INDEX IF NOT EXISTS idx_lockers_status ON lockers (status);',
        'CREATE INDEX IF NOT EXISTS idx_lockers_assignedMember ON lockers (assignedMemberId);',
      ],
    },
    {
      name: 'packages',
      createSql: `
        CREATE TABLE IF NOT EXISTS packages (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          nameEn TEXT,
          type TEXT NOT NULL,
          price REAL NOT NULL,
          durationDays INTEGER NOT NULL,
          durationMonths INTEGER,
          sessionsCount INTEGER NOT NULL,
          includesLocker INTEGER DEFAULT 0,
          includesCoach INTEGER DEFAULT 0,
          includesWorkoutPlan INTEGER DEFAULT 0,
          isVip INTEGER DEFAULT 0,
          isActive INTEGER DEFAULT 1,
          isArchived INTEGER DEFAULT 0,
          archivedAt TEXT,
          color TEXT,
          branchId TEXT,
          tenantId TEXT
        );
      `,
      indexes: [
        'CREATE INDEX IF NOT EXISTS idx_packages_type ON packages (type);',
        'CREATE INDEX IF NOT EXISTS idx_packages_active ON packages (isActive, isArchived);',
      ],
    },
    {
      name: 'coaches',
      createSql: `
        CREATE TABLE IF NOT EXISTS coaches (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          phone TEXT,
          specialty TEXT,
          sharePercentage REAL DEFAULT 0,
          salaryType TEXT DEFAULT 'percentage',
          fixedSalary REAL DEFAULT 0,
          isActive INTEGER DEFAULT 1,
          branchId TEXT,
          tenantId TEXT
        );
      `,
      indexes: [],
    },
    {
      name: 'audit_logs',
      createSql: `
        CREATE TABLE IF NOT EXISTS audit_logs (
          id TEXT PRIMARY KEY,
          timestamp TEXT NOT NULL,
          userId TEXT NOT NULL,
          userName TEXT NOT NULL,
          userRole TEXT NOT NULL,
          action TEXT NOT NULL,
          entityType TEXT NOT NULL,
          entityId TEXT,
          description TEXT NOT NULL,
          previousState TEXT,
          newState TEXT,
          severity TEXT NOT NULL DEFAULT 'INFO',
          branchId TEXT,
          tenantId TEXT
        );
      `,
      indexes: [
        'CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs (timestamp);',
        'CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs (entityType, entityId);',
        'CREATE INDEX IF NOT EXISTS idx_audit_userId ON audit_logs (userId);',
      ],
    },
    {
      name: 'hardware_devices',
      createSql: `
        CREATE TABLE IF NOT EXISTS hardware_devices (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          brand TEXT,
          model TEXT,
          connectionType TEXT NOT NULL,
          ipAddress TEXT,
          port INTEGER,
          comPort TEXT,
          baudRate INTEGER,
          status TEXT NOT NULL DEFAULT 'disconnected',
          enabled INTEGER DEFAULT 1,
          lastSeen TEXT,
          config TEXT,
          branchId TEXT,
          tenantId TEXT
        );
      `,
      indexes: [],
    },
    {
      name: 'hardware_events',
      createSql: `
        CREATE TABLE IF NOT EXISTS hardware_events (
          id TEXT PRIMARY KEY,
          deviceId TEXT NOT NULL,
          eventType TEXT NOT NULL,
          identifierType TEXT NOT NULL,
          identifierValue TEXT NOT NULL,
          timestamp TEXT NOT NULL,
          success INTEGER NOT NULL,
          memberId TEXT,
          memberName TEXT,
          rejectionReason TEXT,
          rawPayload TEXT,
          FOREIGN KEY (deviceId) REFERENCES hardware_devices(id) ON DELETE CASCADE
        );
      `,
      indexes: [
        'CREATE INDEX IF NOT EXISTS idx_hw_events_timestamp ON hardware_events (timestamp);',
        'CREATE INDEX IF NOT EXISTS idx_hw_events_identifier ON hardware_events (identifierValue);',
      ],
    },
    {
      name: 'settings',
      createSql: `
        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        );
      `,
      indexes: [],
    },
  ];

  /**
   * Generates initialization SQL script
   */
  static getInitScript(): string {
    const scripts: string[] = [
      'PRAGMA journal_mode = WAL;',
      'PRAGMA foreign_keys = ON;',
      'PRAGMA synchronous = NORMAL;',
    ];

    for (const table of this.TABLES) {
      scripts.push(table.createSql);
      for (const idx of table.indexes) {
        scripts.push(idx);
      }
    }

    return scripts.join('\n');
  }
}
