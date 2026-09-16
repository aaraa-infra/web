/**
 * AARAA Infrastructure - Careers Data Store
 * Manages Job Postings and Applications persistence (Firestore primary, file fallback).
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import INITIAL_SEED_JOBS from '@/data/local_jobs.json';

const LOCAL_JOBS_FILE = path.join(process.cwd(), 'data', 'local_jobs.json');



// Helper: Ensure local file exists
async function ensureLocalFile() {
  try {
    await fs.access(LOCAL_JOBS_FILE);
  } catch (err) {
    // File doesn't exist, create it with seed data
    const dir = path.dirname(LOCAL_JOBS_FILE);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(LOCAL_JOBS_FILE, JSON.stringify(INITIAL_SEED_JOBS, null, 2), 'utf8');
  }
}

// Get all jobs
export async function getAllJobs() {
  await ensureLocalFile();
  try {
    const raw = await fs.readFile(LOCAL_JOBS_FILE, 'utf8');
    const jobs = JSON.parse(raw);
    // Ensure new seed jobs exist if local file is older
    if (jobs.length < INITIAL_SEED_JOBS.length) {
      const mergedMap = new Map();
      INITIAL_SEED_JOBS.forEach(j => mergedMap.set(j.id, j));
      jobs.forEach(j => mergedMap.set(j.id, j));
      const mergedList = Array.from(mergedMap.values());
      await fs.writeFile(LOCAL_JOBS_FILE, JSON.stringify(mergedList, null, 2), 'utf8');
      return mergedList;
    }
    return jobs;
  } catch (err) {
    console.error("Failed to read jobs file:", err);
    return INITIAL_SEED_JOBS;
  }
}

// Get published jobs only
export async function getPublishedJobs() {
  const jobs = await getAllJobs();
  const today = new Date().toISOString().split('T')[0];
  return jobs.filter(j => j.status === 'PUBLISHED' && (!j.valid_through || j.valid_through >= today));
}

// Get job by slug
export async function getJobBySlug(slug) {
  const jobs = await getAllJobs();
  return jobs.find(j => j.slug === slug) || null;
}

// Get jobs by role
export async function getJobsByRole(roleSlug) {
  const jobs = await getPublishedJobs();
  return jobs.filter(j => j.slug.includes(roleSlug) || j.department.toLowerCase().includes(roleSlug.replace(/-/g, ' ')));
}

// Get jobs by location
export async function getJobsByLocation(locationSlug) {
  const jobs = await getPublishedJobs();
  return jobs.filter(j => j.location.toLowerCase() === locationSlug.toLowerCase());
}

// Save or update job
export async function saveJob(jobData) {
  const jobs = await getAllJobs();
  const existingIdx = jobs.findIndex(j => j.id === jobData.id || j.slug === jobData.slug);
  
  const timestamp = new Date().toISOString();
  let updatedJob = { ...jobData, updated_at: timestamp };

  if (!updatedJob.id) {
    updatedJob.id = `job-${Date.now()}`;
  }
  if (!updatedJob.created_at) {
    updatedJob.created_at = timestamp;
  }

  if (existingIdx >= 0) {
    jobs[existingIdx] = updatedJob;
  } else {
    jobs.unshift(updatedJob);
  }

  await fs.writeFile(LOCAL_JOBS_FILE, JSON.stringify(jobs, null, 2), 'utf8');
  return updatedJob;
}
