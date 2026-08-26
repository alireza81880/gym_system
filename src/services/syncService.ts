import { SyncJob, SyncState } from '../types';

export class SyncEngine {
  private static queue: SyncJob[] = [];
  private static state: SyncState = 'ONLINE';

  static getQueue(): SyncJob[] {
    return this.queue;
  }

  static getState(): SyncState {
    return this.state;
  }

  static setState(newState: SyncState) {
    this.state = newState;
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
    return job;
  }

  static async processQueue(): Promise<{ processedCount: number; failedCount: number }> {
    if (this.queue.length === 0) {
      this.state = 'ONLINE';
      return { processedCount: 0, failedCount: 0 };
    }

    this.state = 'SYNCING';
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
    return { processedCount: processed, failedCount: failed };
  }
}
