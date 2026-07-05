/* ============================================
   Firebase Service
   Firestore integration for leaderboard data.
   ============================================ */

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCB7ohsGNx4YrxfZaDVYpeB3olK08RdgRE",
  authDomain: "benchmarkcp-ea72d.firebaseapp.com",
  projectId: "benchmarkcp-ea72d",
  storageBucket: "benchmarkcp-ea72d.firebasestorage.app",
  messagingSenderId: "98263729404",
  appId: "1:98263729404:web:6962aa617529996ec4c379"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Collection name
const COLLECTION = 'benchmark_results';

/**
 * Generate a simple hash string from input.
 * Used for fingerprinting / deduplication.
 */
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  // Convert to positive hex string
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Generate a fingerprint for deduplication.
 * Same user + same hardware + same benchmark + similar result = same fingerprint.
 */
function generateFingerprint(benchmarkId, hwInfo) {
  const parts = [
    benchmarkId,
    hwInfo.browser,
    hwInfo.browserVersion,
    hwInfo.os,
    hwInfo.cores,
    hwInfo.ram,
    hwInfo.gpu,
  ].join('|');
  return simpleHash(parts);
}

/**
 * Submit a benchmark result to Firestore.
 * Uses fingerprint as document ID — automatically deduplicates.
 * If same hardware + same benchmark exists, it updates with latest result.
 * 
 * @param {Object} result - Benchmark result { id, name, icon, stats }
 * @param {Object} hwInfo - Hardware info from hardwareDetector
 */
export async function submitResult(result, hwInfo) {
  try {
    const fingerprint = generateFingerprint(result.id, hwInfo);
    const docId = `${result.id}_${fingerprint}`;

    const data = {
      // Benchmark info
      benchmarkId: result.id,
      benchmarkName: result.name,
      benchmarkIcon: result.icon || '⚡',

      // Performance metrics
      medianMs: Math.round(result.stats.median * 100) / 100,
      meanMs: Math.round(result.stats.mean * 100) / 100,
      minMs: Math.round(result.stats.min * 100) / 100,
      maxMs: Math.round(result.stats.max * 100) / 100,
      stdDevMs: Math.round(result.stats.stdDev * 100) / 100,
      opsPerSec: Math.round(result.stats.opsPerSec * 10) / 10,
      iterations: result.stats.count,

      // Hardware info
      cpuCores: hwInfo.cores,
      ram: hwInfo.ram,
      gpu: hwInfo.gpu,
      browser: hwInfo.browser,
      browserVersion: hwInfo.browserVersion,
      os: hwInfo.os,

      // Metadata
      timestamp: new Date().toISOString(),
      fingerprint,
    };

    // setDoc with merge: if doc exists, updates it; if not, creates it
    await setDoc(doc(db, COLLECTION, docId), data);
    
    console.log(`[Firebase] Submitted: ${result.name} → ${data.medianMs}ms`);
    return true;
  } catch (err) {
    console.error('[Firebase] Submit failed:', err);
    return false;
  }
}

/**
 * Submit multiple benchmark results.
 */
export async function submitResults(results, hwInfo) {
  const promises = results.map(r => submitResult(r, hwInfo));
  const outcomes = await Promise.allSettled(promises);
  const succeeded = outcomes.filter(o => o.status === 'fulfilled' && o.value === true).length;
  console.log(`[Firebase] Submitted ${succeeded}/${results.length} results`);
  return succeeded;
}

/**
 * Fetch leaderboard entries for a specific benchmark.
 * Returns top entries sorted by fastest median time.
 * 
 * @param {string} benchmarkId - ID of the benchmark (e.g., 'quick-sort')
 * @param {number} maxEntries - Max number of entries to fetch (default 20)
 * @param {boolean} isGlobal - If true, sorts by globalScore descending instead of medianMs ascending
 */
export async function getLeaderboard(benchmarkId, maxEntries = 20, isGlobal = false) {
  try {
    const q = isGlobal 
      ? query(
          collection(db, COLLECTION),
          where('benchmarkId', '==', benchmarkId),
          orderBy('globalScore', 'desc'),
          limit(maxEntries)
        )
      : query(
          collection(db, COLLECTION),
          where('benchmarkId', '==', benchmarkId),
          orderBy('medianMs', 'asc'),
          limit(maxEntries)
        );

    const snapshot = await getDocs(q);
    const entries = [];
    snapshot.forEach(docSnap => {
      entries.push({ id: docSnap.id, ...docSnap.data() });
    });

    return entries;
  } catch (err) {
    console.error('[Firebase] Leaderboard fetch failed:', err);
    // If index not created yet, Firestore throws an error with a link to create it
    if (err.message && err.message.includes('index')) {
      console.warn('[Firebase] Composite index needed. Check console for the creation link.');
    }
    return [];
  }
}

/**
 * Fetch all leaderboard entries (all benchmarks), sorted by timestamp.
 */
export async function getAllResults(maxEntries = 50) {
  try {
    const q = query(
      collection(db, COLLECTION),
      orderBy('timestamp', 'desc'),
      limit(maxEntries)
    );

    const snapshot = await getDocs(q);
    const entries = [];
    snapshot.forEach(docSnap => {
      entries.push({ id: docSnap.id, ...docSnap.data() });
    });

    return entries;
  } catch (err) {
    console.error('[Firebase] All results fetch failed:', err);
    return [];
  }
}

/**
 * Submit the official Global Score.
 */
export async function submitGlobalScore(score, hwInfo) {
  try {
    const benchmarkId = 'global_benchmark_suite';
    const fingerprint = generateFingerprint(benchmarkId, hwInfo);
    const docId = `${benchmarkId}_${fingerprint}`;

    const data = {
      benchmarkId,
      benchmarkName: 'Global Suite',
      globalScore: score,
      cpuCores: hwInfo.cores,
      ram: hwInfo.ram,
      gpu: hwInfo.gpu,
      browser: hwInfo.browser,
      browserVersion: hwInfo.browserVersion,
      os: hwInfo.os,
      timestamp: new Date().toISOString(),
      fingerprint,
    };

    await setDoc(doc(db, COLLECTION, docId), data);
    console.log(`[Firebase] Submitted Global Score: ${score}`);
    return true;
  } catch (err) {
    console.error('[Firebase] Global Score submit failed:', err);
    return false;
  }
}
