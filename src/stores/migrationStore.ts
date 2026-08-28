import { createStore, useStore } from './createStore';
import { ImportMappingProfile, MigrationReport, MigrationSnapshot } from '../types';
import { MigrationService } from '../services/migrationService';
import { PersistenceManager } from '../services/repositories/persistenceManager';

export interface MigrationState {
  mappingProfiles: ImportMappingProfile[];
  migrationReports: MigrationReport[];
  migrationSnapshots: MigrationSnapshot[];
}

export const migrationStore = createStore<MigrationState>({
  mappingProfiles: PersistenceManager.get<ImportMappingProfile[]>('mapping_profiles', MigrationService.PRESET_PROFILES),
  migrationReports: PersistenceManager.get<MigrationReport[]>('migration_reports', []),
  migrationSnapshots: PersistenceManager.get<MigrationSnapshot[]>('migration_snapshots', []),
});

export const migrationActions = {
  saveMappingProfile(profile: ImportMappingProfile): void {
    const existing = migrationStore.getState().mappingProfiles;
    const idx = existing.findIndex(p => p.id === profile.id);
    let next: ImportMappingProfile[];
    if (idx !== -1) {
      next = [...existing];
      next[idx] = profile;
    } else {
      next = [profile, ...existing];
    }
    migrationStore.setState({ mappingProfiles: next });
    PersistenceManager.setBatched('mapping_profiles', next);
  },

  deleteMappingProfile(id: string): void {
    const next = migrationStore.getState().mappingProfiles.filter(p => p.id !== id);
    migrationStore.setState({ mappingProfiles: next });
    PersistenceManager.setBatched('mapping_profiles', next);
  },

  addReport(report: MigrationReport): void {
    const next = [report, ...migrationStore.getState().migrationReports];
    migrationStore.setState({ migrationReports: next });
    PersistenceManager.setBatched('migration_reports', next);
  },

  addSnapshot(snapshot: MigrationSnapshot): void {
    const next = [snapshot, ...migrationStore.getState().migrationSnapshots].slice(0, 10);
    migrationStore.setState({ migrationSnapshots: next });
    PersistenceManager.setBatched('migration_snapshots', next);
  },

  removeSnapshot(id: string): void {
    const next = migrationStore.getState().migrationSnapshots.filter(s => s.id !== id);
    migrationStore.setState({ migrationSnapshots: next });
    PersistenceManager.setBatched('migration_snapshots', next);
  }
};

export function useMigrationStore<S = MigrationState>(selector?: (state: MigrationState) => S): S {
  return useStore(migrationStore, selector);
}
