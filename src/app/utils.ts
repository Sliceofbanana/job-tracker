import { JobEntry, Stats } from './types';

export const calculateStats = (jobs: JobEntry[]): Stats => {
  const total = jobs.length;
  const applied = jobs.filter(job => job.status === "Applied").length;
  const interviewing = jobs.filter(job => job.status === "Interviewing").length;
  const offers = jobs.filter(job => job.status === "Offer").length;
  const rejected = jobs.filter(job => job.status === "Rejected").length;
  
  const salaryJobs = jobs.filter(job => job.salary && !isNaN(Number(job.salary)));
  const avgSalary = salaryJobs.length > 0 
    ? salaryJobs.reduce((sum, job) => sum + Number(job.salary), 0) / salaryJobs.length 
    : 0;

  const responseRate = total > 0 ? ((interviewing + offers + rejected) / total) * 100 : 0;
  
  // Calculate average days to response
  const responseDays = jobs
    .filter(job => job.applicationDate && job.responseDate)
    .map(job => {
      const appDate = new Date(job.applicationDate!);
      const respDate = new Date(job.responseDate!);
      return Math.abs(respDate.getTime() - appDate.getTime()) / (1000 * 60 * 60 * 24);
    });
  
  const avgDaysToResponse = responseDays.length > 0 
    ? responseDays.reduce((sum, days) => sum + days, 0) / responseDays.length 
    : 0;

  // Weekly goal tracking (hardcoded for now, could be user setting)
  const weeklyGoal = 10;
  const currentWeek = getWeekJobs(jobs);
  const weeklyProgress = currentWeek.length;

  const successRate = total > 0 ? (offers / total) * 100 : 0;

  return {
    total,
    applied,
    interviewing,
    offers,
    rejected,
    avgSalary,
    responseRate,
    avgDaysToResponse,
    weeklyGoal,
    weeklyProgress,
    successRate
  };
};

export const getWeekJobs = (jobs: JobEntry[]): JobEntry[] => {
  const now = new Date();
  const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
  
  return jobs.filter(job => {
    if (!job.createdAt) return false;
    const jobDate = job.createdAt.toDate();
    return jobDate >= weekStart;
  });
};

export const getMonthJobs = (jobs: JobEntry[]): JobEntry[] => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  
  return jobs.filter(job => {
    if (!job.createdAt) return false;
    const jobDate = job.createdAt.toDate();
    return jobDate >= monthStart;
  });
};

export const getJobsByDateRange = (jobs: JobEntry[], startDate: Date, endDate: Date): JobEntry[] => {
  return jobs.filter(job => {
    if (!job.createdAt) return false;
    const jobDate = job.createdAt.toDate();
    return jobDate >= startDate && jobDate <= endDate;
  });
};

export const filterJobs = (
  jobs: JobEntry[], 
  searchQuery: string, 
  filterStatus: string,
  selectedTags: string[] = [],
  priority?: string,
  isRemote?: boolean,
  isFavorite?: boolean
): JobEntry[] => {
  return jobs.filter(job => {
    const matchesSearch = searchQuery === "" || 
      job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.industry?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || job.status === filterStatus;
    
    const matchesTags = selectedTags.length === 0 || 
      (job.tags && selectedTags.some(tag => job.tags!.includes(tag)));
    
    const matchesPriority = !priority || job.priority === priority;
    
    const matchesRemote = isRemote === undefined || job.isRemote === isRemote;
    
    const matchesFavorite = isFavorite === undefined || job.isFavorite === isFavorite;
    
    return matchesSearch && matchesStatus && matchesTags && matchesPriority && matchesRemote && matchesFavorite;
  });
};
