/**
 * REAL-TIME PROGRESS TRACKING SYSTEM
 * 
 * Job-based progress tracking with real metrics (no simulated timers)
 * Supports WebSocket, SSE, or polling for progress updates
 */

import { v4 as uuidv4 } from 'uuid';

export type ImportPhase = 
  | 'uploading' 
  | 'parsing' 
  | 'mapping_validating' 
  | 'preview_ready' 
  | 'importing_batches' 
  | 'finalizing' 
  | 'completed' 
  | 'failed' 
  | 'canceled';

export interface ProgressMetrics {
  // Upload phase
  bytesUploaded?: number;
  totalBytes?: number;
  
  // Parsing phase
  rowsParsed?: number;
  totalRowsEstimated?: number;
  nodesProcessed?: number;
  nodesTotal?: number;
  
  // Mapping/Validation phase
  recordsMapped?: number;
  recordsWithMissingRequired?: number;
  dedupCandidates?: number;
  
  // Preview phase
  previewCalculationTime?: number;
  statusDistribution?: Record<string, number>;
  sampleRecords?: number;
  
  // Import phase
  batchesCompleted?: number;
  totalBatches?: number;
  recordsInserted?: number;
  recordsSkipped?: number;
  lastBatchDurationMs?: number;
  
  // Finalization phase
  totalTimeMs?: number;
  recordsPerSecond?: number;
  topErrors?: string[];
  unmappedFieldsPercent?: number;
}

export interface ProgressUpdate {
  jobId: string;
  phase: ImportPhase;
  progressPercent: number; // 0-100
  phaseProgress: number; // 0-100 for current phase
  metrics: ProgressMetrics;
  timestamp: number;
  message?: string;
  error?: string;
}

export interface JobInfo {
  jobId: string;
  status: ImportPhase;
  createdAt: number;
  lastUpdate: number;
  totalProgress: number;
  currentPhase: ImportPhase;
  metrics: ProgressMetrics;
  errors: string[];
  canCancel: boolean;
}

// Phase weights for calculating overall progress percentage
const PHASE_WEIGHTS: Record<ImportPhase, number> = {
  uploading: 10,
  parsing: 20,
  mapping_validating: 10,
  preview_ready: 10,
  importing_batches: 45,
  finalizing: 5,
  completed: 0,
  failed: 0,
  canceled: 0
};

/**
 * In-memory progress store with TTL
 * TODO: Replace with Redis in production for better reliability
 */
class ProgressStore {
  private jobs = new Map<string, JobInfo>();
  private readonly TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

  set(jobId: string, info: JobInfo): void {
    this.jobs.set(jobId, info);
    
    // Auto-cleanup after TTL
    setTimeout(() => {
      this.jobs.delete(jobId);
    }, this.TTL_MS);
  }

  get(jobId: string): JobInfo | null {
    return this.jobs.get(jobId) || null;
  }

  update(jobId: string, updates: Partial<JobInfo>): JobInfo | null {
    const existing = this.jobs.get(jobId);
    if (!existing) return null;

    const updated = {
      ...existing,
      ...updates,
      lastUpdate: Date.now()
    };

    this.jobs.set(jobId, updated);
    return updated;
  }

  delete(jobId: string): boolean {
    return this.jobs.delete(jobId);
  }

  getAll(): JobInfo[] {
    return Array.from(this.jobs.values());
  }
}

const progressStore = new ProgressStore();

/**
 * Progress Tracker - Core class for managing import job progress
 */
export class ProgressTracker {
  private jobId: string;
  private startTime: number;
  private currentPhase: ImportPhase = 'uploading';
  private subscribers: Set<(update: ProgressUpdate) => void> = new Set();

  constructor(jobId?: string) {
    this.jobId = jobId || uuidv4();
    this.startTime = Date.now();
    
    // Initialize job in store
    progressStore.set(this.jobId, {
      jobId: this.jobId,
      status: 'uploading',
      createdAt: this.startTime,
      lastUpdate: this.startTime,
      totalProgress: 0,
      currentPhase: 'uploading',
      metrics: {},
      errors: [],
      canCancel: true
    });
  }

  getJobId(): string {
    return this.jobId;
  }

  /**
   * Update progress for the current phase
   */
  updateProgress(
    phase: ImportPhase, 
    phaseProgress: number, 
    metrics: Partial<ProgressMetrics> = {},
    message?: string
  ): void {
    this.currentPhase = phase;
    
    // Calculate overall progress using phase weights
    const totalProgress = this.calculateTotalProgress(phase, phaseProgress);
    
    const update: ProgressUpdate = {
      jobId: this.jobId,
      phase,
      progressPercent: totalProgress,
      phaseProgress,
      metrics: metrics as ProgressMetrics,
      timestamp: Date.now(),
      message
    };

    // Update store
    progressStore.update(this.jobId, {
      status: phase,
      totalProgress,
      currentPhase: phase,
      metrics: { ...progressStore.get(this.jobId)?.metrics, ...metrics }
    });

    // Notify subscribers
    this.notifySubscribers(update);
  }

  /**
   * Mark job as completed with final metrics
   */
  complete(finalMetrics: Partial<ProgressMetrics> = {}): void {
    const totalTime = Date.now() - this.startTime;
    
    const completionMetrics: ProgressMetrics = {
      ...finalMetrics,
      totalTimeMs: totalTime,
      recordsPerSecond: finalMetrics.recordsInserted 
        ? Math.round((finalMetrics.recordsInserted * 1000) / totalTime)
        : 0
    };

    this.updateProgress('completed', 100, completionMetrics, 'Import completed successfully');
    
    progressStore.update(this.jobId, {
      canCancel: false
    });
  }

  /**
   * Mark job as failed with error
   */
  fail(error: string, finalMetrics: Partial<ProgressMetrics> = {}): void {
    const totalTime = Date.now() - this.startTime;
    
    const update: ProgressUpdate = {
      jobId: this.jobId,
      phase: 'failed',
      progressPercent: progressStore.get(this.jobId)?.totalProgress || 0,
      phaseProgress: 0,
      metrics: { ...finalMetrics, totalTimeMs: totalTime },
      timestamp: Date.now(),
      error
    };

    progressStore.update(this.jobId, {
      status: 'failed',
      errors: [...(progressStore.get(this.jobId)?.errors || []), error],
      canCancel: false
    });

    this.notifySubscribers(update);
  }

  /**
   * Cancel the job
   */
  cancel(): void {
    this.updateProgress('canceled', 0, {}, 'Import canceled by user');
    
    progressStore.update(this.jobId, {
      canCancel: false
    });
  }

  /**
   * Subscribe to progress updates
   */
  subscribe(callback: (update: ProgressUpdate) => void): () => void {
    this.subscribers.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Calculate total progress based on phase weights
   */
  private calculateTotalProgress(phase: ImportPhase, phaseProgress: number): number {
    const phaseOrder: ImportPhase[] = [
      'uploading', 
      'parsing', 
      'mapping_validating', 
      'preview_ready', 
      'importing_batches', 
      'finalizing'
    ];

    const currentPhaseIndex = phaseOrder.indexOf(phase);
    if (currentPhaseIndex === -1) return phase === 'completed' ? 100 : 0;

    // Sum weights of completed phases
    let completedWeight = 0;
    for (let i = 0; i < currentPhaseIndex; i++) {
      completedWeight += PHASE_WEIGHTS[phaseOrder[i]];
    }

    // Add partial progress of current phase
    const currentPhaseWeight = PHASE_WEIGHTS[phase];
    const currentPhaseContribution = (phaseProgress / 100) * currentPhaseWeight;

    return Math.min(completedWeight + currentPhaseContribution, 100);
  }

  /**
   * Notify all subscribers of progress update
   */
  private notifySubscribers(update: ProgressUpdate): void {
    this.subscribers.forEach(callback => {
      try {
        callback(update);
      } catch (error) {
        console.error('Error in progress subscriber:', error);
      }
    });
  }
}

/**
 * Static methods for managing jobs globally
 */
export class ProgressManager {
  /**
   * Create a new progress tracker
   */
  static createJob(): ProgressTracker {
    return new ProgressTracker();
  }

  /**
   * Get job information
   */
  static getJob(jobId: string): JobInfo | null {
    return progressStore.get(jobId);
  }

  /**
   * Get all active jobs
   */
  static getAllJobs(): JobInfo[] {
    return progressStore.getAll();
  }

  /**
   * Cancel a job
   */
  static cancelJob(jobId: string): boolean {
    const job = progressStore.get(jobId);
    if (!job || !job.canCancel) return false;

    progressStore.update(jobId, {
      status: 'canceled',
      canCancel: false
    });

    return true;
  }

  /**
   * Clean up completed jobs older than specified time
   */
  static cleanup(olderThanMs: number = 60 * 60 * 1000): number {
    const jobs = progressStore.getAll();
    const cutoff = Date.now() - olderThanMs;
    let cleaned = 0;

    jobs.forEach(job => {
      if (job.lastUpdate < cutoff && ['completed', 'failed', 'canceled'].includes(job.status)) {
        progressStore.delete(job.jobId);
        cleaned++;
      }
    });

    return cleaned;
  }
}

/**
 * Upload Progress Helper - for tracking file upload progress
 */
export class UploadProgressHelper {
  static createXHRWithProgress(
    url: string,
    data: FormData,
    onProgress: (percent: number, uploaded: number, total: number) => void
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = (event.loaded / event.total) * 100;
          onProgress(percent, event.loaded, event.total);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(xhr.responseText);
        } else {
          reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
        }
      };

      xhr.onerror = () => {
        reject(new Error('Upload failed: Network error'));
      };

      xhr.open('POST', url);
      xhr.send(data);
    });
  }
}

/**
 * Helper to create progress-aware file reader
 */
export class ProgressiveFileReader {
  static readAsText(
    file: File,
    onProgress: (percent: number, loaded: number, total: number) => void
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = (event.loaded / event.total) * 100;
          onProgress(percent, event.loaded, event.total);
        }
      };

      reader.onload = (event) => {
        resolve(event.target?.result as string);
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsText(file, 'UTF-8');
    });
  }

  static readAsArrayBuffer(
    file: File,
    onProgress: (percent: number, loaded: number, total: number) => void
  ): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = (event.loaded / event.total) * 100;
          onProgress(percent, event.loaded, event.total);
        }
      };

      reader.onload = (event) => {
        resolve(event.target?.result as ArrayBuffer);
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsArrayBuffer(file);
    });
  }
}