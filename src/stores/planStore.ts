import { createStore, useStore } from './createStore';
import { WorkoutPlan, DietPlan } from '../types';
import { initialWorkoutPlans, initialDietPlans } from '../data/initialData';
import { PersistenceManager } from '../services/repositories/persistenceManager';

export interface PlanState {
  workoutPlans: WorkoutPlan[];
  dietPlans: DietPlan[];
}

export const planStore = createStore<PlanState>({
  workoutPlans: PersistenceManager.get<WorkoutPlan[]>('workout_plans', initialWorkoutPlans),
  dietPlans: PersistenceManager.get<DietPlan[]>('diet_plans', initialDietPlans),
});

export const planActions = {
  saveWorkoutPlan(plan: WorkoutPlan): void {
    const current = planStore.getState().workoutPlans;
    const idx = current.findIndex(p => p.id === plan.id);
    const copy = idx >= 0 ? [...current] : [plan, ...current];
    if (idx >= 0) copy[idx] = plan;
    planStore.setState({ workoutPlans: copy });
    PersistenceManager.setBatched('workout_plans', copy);
  },

  deleteWorkoutPlan(id: string): void {
    const current = planStore.getState().workoutPlans;
    const next = current.filter(p => p.id !== id);
    planStore.setState({ workoutPlans: next });
    PersistenceManager.setBatched('workout_plans', next);
  },

  saveDietPlan(plan: DietPlan): void {
    const current = planStore.getState().dietPlans;
    const idx = current.findIndex(p => p.id === plan.id);
    const copy = idx >= 0 ? [...current] : [plan, ...current];
    if (idx >= 0) copy[idx] = plan;
    planStore.setState({ dietPlans: copy });
    PersistenceManager.setBatched('diet_plans', copy);
  },

  deleteDietPlan(id: string): void {
    const current = planStore.getState().dietPlans;
    const next = current.filter(p => p.id !== id);
    planStore.setState({ dietPlans: next });
    PersistenceManager.setBatched('diet_plans', next);
  },

  batchSet(workoutPlans: WorkoutPlan[], dietPlans: DietPlan[]): void {
    planStore.setState({ workoutPlans, dietPlans });
    PersistenceManager.setBatched('workout_plans', workoutPlans);
    PersistenceManager.setBatched('diet_plans', dietPlans);
  }
};

export function usePlanStore<S = PlanState>(selector?: (state: PlanState) => S): S {
  return useStore(planStore, selector);
}

export function usePlans() {
  const state = useStore(planStore);
  return {
    ...state,
    ...planActions,
  };
}
