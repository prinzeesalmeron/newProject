#!/usr/bin/env node

/**
 * Load Testing Script for Real Estate Platform
 *
 * Usage:
 *   node scripts/load-test.js --endpoint=<url> --users=<count> --duration=<seconds>
 *
 * Examples:
 *   node scripts/load-test.js --endpoint=http://localhost:5173 --users=100 --duration=60
 *   node scripts/load-test.js --endpoint=https://your-app.com --users=1000 --duration=300
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

// Parse command line arguments
const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, value] = arg.replace('--', '').split('=');
  acc[key] = value;
  return acc;
}, {});

const config = {
  endpoint: args.endpoint || 'http://localhost:5173',
  users: parseInt(args.users) || 100,
  duration: parseInt(args.duration) || 60,
  rampUp: parseInt(args.rampup) || 10, // seconds to ramp up to full load
  thinkTime: parseInt(args.thinktime) || 1000, // ms between requests
};

console.log('Load Test Configuration:');
console.log(JSON.stringify(config, null, 2));
console.log('\nStarting load test...\n');

// Test scenarios
const scenarios = [
  {
    name: 'View Homepage',
    weight: 30,
    request: () => makeRequest('GET', '/'),
  },
  {
    name: 'View Marketplace',
    weight: 25,
    request: () => makeRequest('GET', '/marketplace'),
  },
  {
    name: 'View Property Details',
    weight: 20,
    request: () => makeRequest('GET', `/property/${Math.floor(Math.random() * 100)}`),
  },
  {
    name: 'Search Properties',
    weight: 15,
    request: () => makeRequest('GET', '/api/properties?search=apartment'),
  },
  {
    name: 'Health Check',
    weight: 10,
    request: () => makeRequest('GET', '/health-check'),
  },
];

// Metrics
const metrics = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  totalResponseTime: 0,
  minResponseTime: Infinity,
  maxResponseTime: 0,
  responseTimeDistribution: {
    '<100ms': 0,
    '100-500ms': 0,
    '500ms-1s': 0,
    '1s-3s': 0,
    '>3s': 0,
  },
  errorTypes: {},
  statusCodes: {},
  activeUsers: 0,
};

// Make HTTP request
function makeRequest(method, path) {
  return new Promise((resolve) => {
    const url = new URL(path, config.endpoint);
    const client = url.protocol === 'https:' ? https : http;

    const startTime = Date.now();

    const req = client.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method,
        headers: {
          'User-Agent': 'LoadTest/1.0',
          'Accept': 'text/html,application/json',
        },
        timeout: 30000,
      },
      (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          const responseTime = Date.now() - startTime;
          resolve({
            success: res.statusCode >= 200 && res.statusCode < 400,
            statusCode: res.statusCode,
            responseTime,
          });
        });
      }
    );

    req.on('error', (error) => {
      const responseTime = Date.now() - startTime;
      resolve({
        success: false,
        error: error.message,
        responseTime,
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        success: false,
        error: 'Timeout',
        responseTime: 30000,
      });
    });

    req.end();
  });
}

// Select random scenario based on weights
function selectScenario() {
  const totalWeight = scenarios.reduce((sum, s) => sum + s.weight, 0);
  let random = Math.random() * totalWeight;

  for (const scenario of scenarios) {
    random -= scenario.weight;
    if (random <= 0) {
      return scenario;
    }
  }

  return scenarios[0];
}

// Update metrics
function updateMetrics(result, scenarioName) {
  metrics.totalRequests++;

  if (result.success) {
    metrics.successfulRequests++;
  } else {
    metrics.failedRequests++;
    metrics.errorTypes[result.error] = (metrics.errorTypes[result.error] || 0) + 1;
  }

  metrics.totalResponseTime += result.responseTime;
  metrics.minResponseTime = Math.min(metrics.minResponseTime, result.responseTime);
  metrics.maxResponseTime = Math.max(metrics.maxResponseTime, result.responseTime);

  // Response time distribution
  if (result.responseTime < 100) {
    metrics.responseTimeDistribution['<100ms']++;
  } else if (result.responseTime < 500) {
    metrics.responseTimeDistribution['100-500ms']++;
  } else if (result.responseTime < 1000) {
    metrics.responseTimeDistribution['500ms-1s']++;
  } else if (result.responseTime < 3000) {
    metrics.responseTimeDistribution['1s-3s']++;
  } else {
    metrics.responseTimeDistribution['>3s']++;
  }

  // Status codes
  if (result.statusCode) {
    metrics.statusCodes[result.statusCode] = (metrics.statusCodes[result.statusCode] || 0) + 1;
  }
}

// Simulate single user
async function simulateUser(userId, duration) {
  const endTime = Date.now() + duration * 1000;
  metrics.activeUsers++;

  try {
    while (Date.now() < endTime) {
      const scenario = selectScenario();
      const result = await scenario.request();
      updateMetrics(result, scenario.name);

      // Think time between requests
      if (Date.now() < endTime) {
        await new Promise((resolve) => setTimeout(resolve, config.thinkTime));
      }
    }
  } finally {
    metrics.activeUsers--;
  }
}

// Print progress
function printProgress() {
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
  const avgResponseTime = metrics.totalRequests > 0
    ? (metrics.totalResponseTime / metrics.totalRequests).toFixed(0)
    : 0;
  const successRate = metrics.totalRequests > 0
    ? ((metrics.successfulRequests / metrics.totalRequests) * 100).toFixed(1)
    : 0;
  const requestsPerSecond = (metrics.totalRequests / elapsed).toFixed(1);

  process.stdout.write(
    `\rElapsed: ${elapsed}s | ` +
    `Active Users: ${metrics.activeUsers} | ` +
    `Requests: ${metrics.totalRequests} | ` +
    `RPS: ${requestsPerSecond} | ` +
    `Avg RT: ${avgResponseTime}ms | ` +
    `Success: ${successRate}%`
  );
}

// Print final results
function printResults() {
  console.log('\n\n=== Load Test Results ===\n');

  const totalTime = (Date.now() - startTime) / 1000;
  const avgResponseTime = metrics.totalResponseTime / metrics.totalRequests;
  const successRate = (metrics.successfulRequests / metrics.totalRequests) * 100;
  const requestsPerSecond = metrics.totalRequests / totalTime;

  console.log('Summary:');
  console.log(`  Total Duration: ${totalTime.toFixed(2)}s`);
  console.log(`  Total Requests: ${metrics.totalRequests}`);
  console.log(`  Successful: ${metrics.successfulRequests} (${successRate.toFixed(2)}%)`);
  console.log(`  Failed: ${metrics.failedRequests}`);
  console.log(`  Requests/Second: ${requestsPerSecond.toFixed(2)}`);
  console.log();

  console.log('Response Times:');
  console.log(`  Average: ${avgResponseTime.toFixed(2)}ms`);
  console.log(`  Min: ${metrics.minResponseTime}ms`);
  console.log(`  Max: ${metrics.maxResponseTime}ms`);
  console.log();

  console.log('Response Time Distribution:');
  Object.entries(metrics.responseTimeDistribution).forEach(([range, count]) => {
    const percentage = ((count / metrics.totalRequests) * 100).toFixed(1);
    console.log(`  ${range}: ${count} (${percentage}%)`);
  });
  console.log();

  console.log('Status Codes:');
  Object.entries(metrics.statusCodes)
    .sort(([a], [b]) => parseInt(a) - parseInt(b))
    .forEach(([code, count]) => {
      const percentage = ((count / metrics.totalRequests) * 100).toFixed(1);
      console.log(`  ${code}: ${count} (${percentage}%)`);
    });

  if (Object.keys(metrics.errorTypes).length > 0) {
    console.log();
    console.log('Errors:');
    Object.entries(metrics.errorTypes).forEach(([error, count]) => {
      console.log(`  ${error}: ${count}`);
    });
  }

  // Performance assessment
  console.log();
  console.log('Performance Assessment:');
  if (successRate >= 99.9) {
    console.log('  ✓ Excellent success rate');
  } else if (successRate >= 95) {
    console.log('  ⚠ Good success rate, but room for improvement');
  } else {
    console.log('  ✗ Poor success rate, investigation needed');
  }

  if (avgResponseTime < 200) {
    console.log('  ✓ Excellent response times');
  } else if (avgResponseTime < 1000) {
    console.log('  ⚠ Acceptable response times');
  } else {
    console.log('  ✗ Slow response times, optimization needed');
  }

  if (requestsPerSecond > 100) {
    console.log('  ✓ High throughput');
  } else if (requestsPerSecond > 10) {
    console.log('  ⚠ Moderate throughput');
  } else {
    console.log('  ✗ Low throughput');
  }
}

// Main execution
let startTime;
let progressInterval;

async function run() {
  startTime = Date.now();

  // Start progress printing
  progressInterval = setInterval(printProgress, 1000);

  // Ramp up users gradually
  const usersPerSecond = config.users / config.rampUp;
  const users = [];

  for (let i = 0; i < config.users; i++) {
    const delay = (i / usersPerSecond) * 1000;
    setTimeout(() => {
      users.push(simulateUser(i, config.duration));
    }, delay);
  }

  // Wait for all users to complete
  await new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      if (metrics.activeUsers === 0) {
        clearInterval(checkInterval);
        resolve();
      }
    }, 100);
  });

  clearInterval(progressInterval);
  printResults();
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('\nUnhandled error:', error);
  process.exit(1);
});

// Run the load test
run().catch((error) => {
  console.error('Load test failed:', error);
  process.exit(1);
});
