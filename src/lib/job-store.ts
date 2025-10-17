// Shared job storage for testing (in production, use database)
interface Job {
  id: string;
  userId: string;
  targetUrl: string;
  payload: {
    name: string;
    email: string;
    message: string;
  };
  status: string;
  reason?: string;
  createdAt: string;
  updatedAt: string;
}

// Global job storage (in-memory for testing) - using globalThis to persist across hot reloads
declare global {
  var __jobStore:
    | {
        jobs: Job[];
        jobIdCounter: number;
      }
    | undefined;
}

if (!globalThis.__jobStore) {
  globalThis.__jobStore = {
    jobs: [],
    jobIdCounter: 1,
  };
}

// Access global job store directly

export const jobStore = {
  create: (jobData: Omit<Job, "id" | "createdAt" | "updatedAt">): Job => {
    const job: Job = {
      ...jobData,
      id: `job-${globalThis.__jobStore!.jobIdCounter++}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    globalThis.__jobStore!.jobs.push(job);
    return job;
  },

  findById: (id: string): Job | undefined => {
    return globalThis.__jobStore!.jobs.find((job) => job.id === id);
  },

  findByUserId: (userId: string): Job[] => {
    return globalThis.__jobStore!.jobs.filter((job) => job.userId === userId);
  },

  update: (id: string, updates: Partial<Job>): Job | null => {
    const index = globalThis.__jobStore!.jobs.findIndex((job) => job.id === id);
    if (index === -1) return null;

    globalThis.__jobStore!.jobs[index] = {
      ...globalThis.__jobStore!.jobs[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return globalThis.__jobStore!.jobs[index];
  },

  delete: (id: string): boolean => {
    const index = globalThis.__jobStore!.jobs.findIndex((job) => job.id === id);
    if (index === -1) return false;

    globalThis.__jobStore!.jobs.splice(index, 1);
    return true;
  },

  getAll: (): Job[] => {
    return [...globalThis.__jobStore!.jobs];
  },

  clear: (): void => {
    globalThis.__jobStore!.jobs = [];
    globalThis.__jobStore!.jobIdCounter = 1;
  },
};

export type { Job };
