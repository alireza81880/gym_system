import { createStore, useStore } from './createStore';
import { SmartLocker, LockerZone } from '../types';
import { LockerRepository } from '../services/repositories/lockerRepository';

export interface LockerState {
  version: number;
  availableCount: number;
  occupiedCount: number;
  totalCount: number;
  lockers: SmartLocker[];
}

export const lockerStore = createStore<LockerState>({
  version: 1,
  availableCount: LockerRepository.getAvailableCount(),
  occupiedCount: LockerRepository.getOccupiedCount(),
  totalCount: LockerRepository.getAll().length,
  lockers: LockerRepository.getAll(),
});

function notifyLockerChange(): void {
  lockerStore.setState({
    version: lockerStore.getState().version + 1,
    availableCount: LockerRepository.getAvailableCount(),
    occupiedCount: LockerRepository.getOccupiedCount(),
    totalCount: LockerRepository.getAll().length,
    lockers: LockerRepository.getAll(),
  });
}

export const lockerActions = {
  assignLocker(lockerNumber: number, studentId: string): boolean {
    const res = LockerRepository.assignLocker(lockerNumber, studentId);
    if (res) notifyLockerChange();
    return res;
  },

  releaseLocker(lockerNumber: number): boolean {
    const res = LockerRepository.releaseLocker(lockerNumber);
    if (res) notifyLockerChange();
    return res;
  },

  toggleMaintenance(lockerNumber: number): void {
    LockerRepository.toggleMaintenance(lockerNumber);
    notifyLockerChange();
  },

  setLockerCount(newCount: number, defaultZone?: LockerZone): { success: boolean; warning?: string } {
    const res = LockerRepository.setCount(newCount, defaultZone);
    notifyLockerChange();
    return res;
  },

  batchSet(lockers: SmartLocker[]): void {
    LockerRepository.batchSet(lockers);
    notifyLockerChange();
  }
};

export function useLockerStore<S = LockerState>(selector?: (state: LockerState) => S): S {
  return useStore(lockerStore, selector);
}
