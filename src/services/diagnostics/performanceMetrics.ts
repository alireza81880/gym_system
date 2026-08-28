/**
 * Performance Diagnostics and Benchmarking Service
 * Tracks query latencies, startup time, and search performance.
 */

export interface LatencyMetric {
  name: string;
  durationMs: number;
  timestamp: string;
  metadata?: Record<string, any>;
}

export class PerformanceDiagnostics {
  private static metrics: LatencyMetric[] = [];
  private static isBenchmarking = false;

  static track(name: string, durationMs: number, metadata?: Record<string, any>): void {
    const metric: LatencyMetric = {
      name,
      durationMs: Math.round(durationMs * 100) / 100,
      timestamp: new Date().toISOString(),
      metadata,
    };
    this.metrics.unshift(metric);
    if (this.metrics.length > 200) {
      this.metrics.pop();
    }
  }

  static async measure<T>(name: string, operation: () => Promise<T> | T, metadata?: Record<string, any>): Promise<T> {
    const start = performance.now();
    try {
      const result = await operation();
      const durationMs = performance.now() - start;
      this.track(name, durationMs, metadata);
      return result;
    } catch (err) {
      const durationMs = performance.now() - start;
      this.track(`${name}_ERROR`, durationMs, { ...metadata, error: (err as Error).message });
      throw err;
    }
  }

  static getRecentMetrics(limit = 20): LatencyMetric[] {
    return this.metrics.slice(0, limit);
  }

  static getSummary(): Record<string, { count: number; avgMs: number; minMs: number; maxMs: number }> {
    const summary: Record<string, { count: number; total: number; minMs: number; maxMs: number }> = {};

    for (const m of this.metrics) {
      if (!summary[m.name]) {
        summary[m.name] = { count: 0, total: 0, minMs: m.durationMs, maxMs: m.durationMs };
      }
      summary[m.name].count++;
      summary[m.name].total += m.durationMs;
      summary[m.name].minMs = Math.min(summary[m.name].minMs, m.durationMs);
      summary[m.name].maxMs = Math.max(summary[m.name].maxMs, m.durationMs);
    }

    const result: Record<string, { count: number; avgMs: number; minMs: number; maxMs: number }> = {};
    for (const [name, stats] of Object.entries(summary)) {
      result[name] = {
        count: stats.count,
        avgMs: Math.round((stats.total / stats.count) * 100) / 100,
        minMs: stats.minMs,
        maxMs: stats.maxMs,
      };
    }

    return result;
  }
}
