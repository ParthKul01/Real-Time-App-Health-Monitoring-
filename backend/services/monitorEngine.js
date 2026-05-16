// backend/services/monitorEngine.js
const ping = require('ping');
const axios = require('axios');

/**
 * Executes a network health check against a target.
 * Supports both HTTP/HTTPS URLs and raw IP addresses/Domain names.
 * * @param {string} target - The IP address, Domain, or full URL to monitor
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
        try {
            // Use a fast HEAD request instead of GET to minimize bandwidth
            const response = await axios.head(cleanTarget, {
                timeout: 5000,
                validateStatus: false // Prevents 4xx/5xx errors from throwing immediate exceptions
            });

            const latency = Date.now() - startTime;

            // Determine status based on standard HTTP codes
            let status = 'down';
            if (response.status >= 200 && response.status < 400) {
                status = latency > 300 ? 'degraded' : 'up'; // Degraded if web server takes > 300ms
            } else if (response.status >= 400) {
                status = 'degraded'; // Operational but returning an error code
            }

            return { status, latency };
        } catch (error) {
            // Fallback to GET if web server blocks HEAD requests
            try {
                const response = await axios.get(cleanTarget, { timeout: 5000 });
                const latency = Date.now() - startTime;
                return {
                    status: latency > 300 ? 'degraded' : 'up',
                    latency
                };
            } catch (nestedError) {
                return { status: 'down', latency: 0 };
            }
        }
    }

    // ==========================================================
    // CASE 2: Target is a Raw IP Address or Domain Name (e.g., 13.233.10.2 or google.com)
    // ==========================================================
    else {
        try {
            // Run system-level native ping (ICMP Echo Request)
            const config = {
                timeout: 5, // 5 seconds timeout limit
                extra: process.platform === 'win32' ? ['-n', '1'] : ['-c', '1'] // Handles cross-platform differences
            };

            const res = await ping.promise.probe(cleanTarget, config);

            let status = 'down';
            let latency = 0;

            if (res.alive) {
                // Parse time out of response and round it to an integer milliseconds value
                latency = res.time !== 'unknown' ? Math.round(parseFloat(res.time)) : (Date.now() - startTime);

                // Infrastructure baseline triggers degraded mode if ping spikes past 150ms
                status = latency > 150 ? 'degraded' : 'up';
            }

            return { status, latency };
        } catch (error) {
            console.error(`[ENGINE ERROR] Failed ping execution on ${cleanTarget}:`, error.message);
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
        // 1. Fetch current live targets registered from the AWS RDS monitors table
        const [monitors] = await dbPool.execute('SELECT id, title, target FROM monitors');

        if (monitors.length === 0) {
            console.log('[ENGINE] No target monitors registered in RDS yet. Awaiting configuration...');
            return;
        }

        console.log(`[ENGINE] Starting monitoring loop for ${monitors.length} targets...`);

        // 2. Loop through targets and process them concurrently/asynchronously
        const monitoringPromises = monitors.map(async (monitor) => {
            // Run the network health analysis
            const { status, latency } = await checkTargetHealth(monitor.target);

            // 3. Immediately commit the fresh metrics right back to AWS RDS MySQL database
            await dbPool.execute(
                'UPDATE monitors SET status = ?, last_latency = ? WHERE id = ?',
                [status, latency, monitor.id]
            );

            console.log(`📊 [MONITOR] "${monitor.title}" (${monitor.target}) -> Status: ${status.toUpperCase()} | Latency: ${latency}ms`);
        });

        // Await execution resolution for all targets in this batch
        await Promise.all(monitoringPromises);
        console.log(`✔ [ENGINE] Completed monitoring cycle pass at: ${new Date().toLocaleTimeString()}`);

    } catch (error) {
        console.error('❌ [ENGINE FATAL ERROR] Failed to complete cycle pass:', error.message);
    }
}

module.exports = { startMonitoringEngine };