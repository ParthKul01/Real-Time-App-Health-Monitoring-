// backend/services/monitorEngine.js
const ping = require('ping');
const axios = require('axios');

// Common browser-like headers to prevent bot-blocking by servers
const HTTP_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (compatible; HealthMonitor/1.0; +https://devops-monitor.app)',
    'Accept': 'text/html,application/json,*/*',
    'Cache-Control': 'no-cache',
};

/**
 * Executes a network health check against a target.
 * Supports both HTTP/HTTPS URLs and raw IP addresses/Domain names.
 * @param {string} target - The IP address, Domain, or full URL to monitor
 * @returns {Promise<{status: string, latency: number}>}
 */
async function checkTargetHealth(target) {
    const startTime = Date.now();

    // Clean up target string (remove leading/trailing spaces)
    const cleanTarget = target.trim();

    // ==========================================================
    // CASE 1: Target is an HTTP/HTTPS Web URL
    // ==========================================================
    if (cleanTarget.startsWith('http://') || cleanTarget.startsWith('https://')) {
        // --- Step 1: Try HEAD request (fastest, minimal data) ---
        try {
            const response = await axios.head(cleanTarget, {
                timeout: 10000,           // 10s timeout for slow servers
                headers: HTTP_HEADERS,
                validateStatus: false,    // Don't throw on 4xx/5xx, we handle manually
                maxRedirects: 5,          // Follow redirects (e.g. HTTP → HTTPS)
            });

            const latency = Date.now() - startTime;

            // 405 = server is UP but doesn't allow HEAD — fall through to GET
            if (response.status === 405 || response.status === 501) {
                throw new Error(`HEAD not allowed (${response.status}), falling back to GET`);
            }

            // 2xx / 3xx = operational
            if (response.status >= 200 && response.status < 400) {
                const status = latency > 500 ? 'degraded' : 'up';
                return { status, latency };
            }

            // 4xx/5xx = server is reachable but returning errors → degraded
            if (response.status >= 400) {
                return { status: 'degraded', latency };
            }

            return { status: 'down', latency: 0 };

        } catch (headError) {
            // --- Step 2: Fallback to GET request ---
            try {
                const response = await axios.get(cleanTarget, {
                    timeout: 10000,
                    headers: HTTP_HEADERS,
                    validateStatus: false,
                    maxRedirects: 5,
                    // Stream response to avoid downloading large bodies
                    responseType: 'stream',
                });

                // Immediately destroy stream — we only care about headers
                if (response.data && response.data.destroy) response.data.destroy();

                const latency = Date.now() - startTime;

                if (response.status >= 200 && response.status < 400) {
                    const status = latency > 500 ? 'degraded' : 'up';
                    return { status, latency };
                }

                if (response.status >= 400) {
                    return { status: 'degraded', latency };
                }

                return { status: 'down', latency: 0 };

            } catch (getError) {
                console.error(`[ENGINE] HTTP check failed for ${cleanTarget}:`, getError.message);
                return { status: 'down', latency: 0 };
            }
        }
    }

    // ==========================================================
    // CASE 2: Target is a Raw IP Address or Domain Name (e.g., 8.8.8.8 or google.com)
    // ==========================================================
    else {
        try {
            const config = {
                timeout: 5,
                extra: process.platform === 'win32' ? ['-n', '1'] : ['-c', '1'],
            };

            const res = await ping.promise.probe(cleanTarget, config);

            let status = 'down';
            let latency = 0;

            if (res.alive) {
                latency = res.time !== 'unknown' ? Math.round(parseFloat(res.time)) : (Date.now() - startTime);
                status = latency > 150 ? 'degraded' : 'up';
            }

            return { status, latency };
        } catch (error) {
            console.error(`[ENGINE ERROR] Failed ping on ${cleanTarget}:`, error.message);
            return { status: 'down', latency: 0 };
        }
    }
}

/**
 * Boots up the persistent background loop that checks targets periodically.
 * * @param {object} dbPool - Configured mysql2 pool connection instance linking to AWS RDS
 * @param {number} intervalMs - The time delay between engine sweeps (default: 15 seconds)
 */
function startMonitoringEngine(dbPool, intervalMs = 15000) {
    console.log(`📡 DevOps Engine: Background network worker active. Running checks every ${intervalMs / 1000}s.`);

    // Execute an immediate baseline run on initialization
    runMonitoringCycle(dbPool);

    // Set up the recurring interval loop
    setInterval(() => {
        runMonitoringCycle(dbPool);
    }, intervalMs);
}

/**
 * Performs a single complete cycle sweep across all registered targets in the DB
 */
async function runMonitoringCycle(dbPool) {
    try {
        // 1. Fetch all live targets registered in AWS RDS monitors table
        const [monitors] = await dbPool.execute(
            'SELECT id, title, target, status FROM monitors'
        );

        if (monitors.length === 0) {
            console.log('[ENGINE] No target monitors registered in RDS yet. Awaiting configuration...');
            return;
        }

        console.log(`[ENGINE] Starting monitoring loop for ${monitors.length} targets...`);

        // 2. Loop through targets and process them concurrently/asynchronously
        const monitoringPromises = monitors.map(async (monitor) => {
            // Run the network health analysis
            const { status, latency } = await checkTargetHealth(monitor.target);

            // 3. Commit fresh metrics back to AWS RDS
            await dbPool.execute(
                'UPDATE monitors SET status = ?, last_latency = ? WHERE id = ?',
                [status, latency, monitor.id]
            );

            console.log(`📊 [MONITOR] "${monitor.title}" (${monitor.target}) -> Status: ${status.toUpperCase()} | Latency: ${latency}ms`);
        });

        // Await resolution for all targets in this batch
        await Promise.all(monitoringPromises);
        console.log(`✔ [ENGINE] Completed monitoring cycle pass at: ${new Date().toLocaleTimeString()}`);

    } catch (error) {
        console.error('❌ [ENGINE FATAL ERROR] Failed to complete cycle pass:', error.message);
    }
}

module.exports = { startMonitoringEngine };