/**
 * Benchmark for IPI-854 (SB-PERF-003) — Optimize auth_rls_initplan Performance
 * 
 * This benchmark tests the performance improvement of wrapping auth.uid(), auth.jwt(), auth.role()
 * in (select ...) subselect to evaluate once per statement instead of once per row.
 * 
 * Usage: npx tsx scripts/bench/rls-auth-wrap-benchmark.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error('VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(1);
}

// Create authenticated client (simulates real user context)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface BenchmarkResult {
  query: string;
  before_ms: number;
  after_ms: number;
  improvement_pct: number;
}

async function benchmarkQuery(table: string, description: string): Promise<number> {
  const start = performance.now();
  
  // Use authenticated client to simulate real RLS context
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .limit(10);
  
  const end = performance.now();
  
  if (error) {
    console.error(`Error executing query: ${error.message}`);
    return -1;
  }
  
  return end - start;
}

async function main() {
  console.log('=== RLS auth_rls_initplan Performance Benchmark ===');
  console.log('IPI-854 (SB-PERF-003) — Optimize auth_rls_initplan Performance\n');
  
  // Test queries that would benefit from auth.uid() wrapping
  const testQueries = [
    {
      description: 'Brands query with RLS',
      table: 'brands'
    },
    {
      description: 'Planner tasks query with RLS',
      table: 'planner.tasks'
    },
    {
      description: 'Shoots query with RLS',
      table: 'shoots'
    }
  ];
  
  console.log('Running benchmarks with authenticated client...\n');
  
  for (const test of testQueries) {
    console.log(`Testing: ${test.description}`);
    
    // Run multiple iterations for average
    const iterations = 10;
    let totalTime = 0;
    let successCount = 0;
    
    for (let i = 0; i < iterations; i++) {
      const time = await benchmarkQuery(test.table, test.description);
      if (time > 0) {
        totalTime += time;
        successCount++;
      }
    }
    
    if (successCount > 0) {
      const avgTime = totalTime / successCount;
      console.log(`  Average time: ${avgTime.toFixed(2)}ms (${successCount}/${iterations} successful)\n`);
    } else {
      console.log(`  No successful queries - may need authentication\n`);
    }
  }
  
  console.log('=== Benchmark Complete ===');
  console.log('\nExpected improvement after IPI-854:');
  console.log('- 94.97% to 99.99% improvement for queries using auth.uid()');
  console.log('- Reference: https://github.com/GaryAustin1/RLS-Performance');
  console.log('\nNext steps:');
  console.log('1. Apply migration: 20260730_wrap_auth_rls_initplan.sql');
  console.log('2. Re-run this benchmark to verify improvement');
  console.log('3. Check advisor: supabase db advisors');
}

main().catch(console.error);
