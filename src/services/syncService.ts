import { SyncJob, SyncState } from '../types';

type SyncListener = (state: { syncState: SyncState; queue: SyncJob[] }) => void;

export class SyncEngine {
  private static queue: SyncJob[] = [];
  private static state: SyncState = 'ONLINE';
  private static listeners: Set<SyncListener> = new Set();

  static subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener({ syncState: this.state, queue: [...this.queue] });
    return () => {
      this.listeners.delete(listener);
    };
  }

  private static notify(): void {
    const payload = { syncState: this.state, queue: [...this.queue] };
    this.listeners.forEach(l => l(payload));
  }

  static getQueue(): SyncJob[] {
    return this.queue;
  }

  static getState(): SyncState {
    return this.state;
  }

  static setState(newState: SyncState) {
    this.state = newState;
    this.notify();
  }

  static enqueue(entityType: string, entityId: string, operation: 'INSERT' | 'UPDATE' | 'DELETE', payload: any): SyncJob {
    const job: SyncJob = {
      id: `sync-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      entityType,
      entityId,
      operation,
      payload: typeof payload === 'string' ? payload : JSON.stringify(payload),
      status: 'PENDING',
      retries: 0,
      createdAt: new Date().toISOString(),
    };
    this.queue.push(job);
    this.notify();
    return job;
  }

  static async syncNow(): Promise<{ processedCount: number; failedCount: number }> {
    return this.processQueue();
  }

  static async processQueue(): Promise<{ processedCount: number; failedCount: number }> {
    if (this.queue.length === 0) {
      this.state = 'ONLINE';
      this.notify();
      return { processedCount: 0, failedCount: 0 };
    }

    this.state = 'SYNCING';
    this.notify();
    let processed = 0;
    let failed = 0;

    // Simulate batch cloud sync with backoff
    for (const job of this.queue) {
      if (job.status === 'PENDING' || job.status === 'FAILED') {
        try {
          job.status = 'SYNCED';
          job.lastAttempt = new Date().toISOString();
          processed++;
        } catch {
          job.status = 'FAILED';
          job.retries += 1;
          failed++;
        }
      }
    }

    this.state = failed > 0 ? 'PARTIALLY_SYNCED' : 'ONLINE';
    // Clear completed jobs from queue
    this.queue = this.queue.filter(j => j.status !== 'SYNCED');
    this.notify();
    return { processedCount: processed, failedCount: failed };
  }
}

