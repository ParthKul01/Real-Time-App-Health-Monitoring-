// backend/scripts/seedMonitors.js
// Run with: node scripts/seedMonitors.js
// This adds popular test services to your monitors table for a specific user_id.

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('../config/db');

// ✏️  Change this to your actual user ID (the id from your `users` table)
const USER_ID = 1;

const TEST_MONITORS = [
    // ── Web Services ──────────────────────────────────────────────
    { title: 'GitHub',          target: 'https://github.com' },
    { title: 'Google',          target: 'https://www.google.com' },
    { title: 'Cloudflare',      target: 'https://www.cloudflare.com' },
    { title: 'NPM Registry',    target: 'https://registry.npmjs.org' },
    { title: 'AWS Console',     target: 'https://aws.amazon.com' },
    { title: 'Stack Overflow',  target: 'https://stackoverflow.com' },
    { title: 'Docker Hub',      target: 'https://hub.docker.com' },
    { title: 'GitLab',          target: 'https://gitlab.com' },

    // ── DNS / IP Ping Monitors ────────────────────────────────────
    { title: 'Google DNS (8.8.8.8)',      target: '8.8.8.8' },
    { title: 'Cloudflare DNS (1.1.1.1)',  target: '1.1.1.1' },
    { title: 'OpenDNS (208.67.222.222)',  target: '208.67.222.222' },
];

(async () => {
    try {
        const connection = await db.getConnection();
        console.log('✅ Connected to RDS. Seeding monitors...\n');

        for (const monitor of TEST_MONITORS) {
            // Skip if already exists for this user
            const [existing] = await connection.execute(
                'SELECT id FROM monitors WHERE user_id = ? AND target = ?',
                [USER_ID, monitor.target]
            );

            if (existing.length > 0) {
                console.log(`⏭  SKIP  "${monitor.title}" — already exists`);
                continue;
            }

            await connection.execute(
                'INSERT INTO monitors (user_id, title, target, status, last_latency) VALUES (?, ?, ?, ?, ?)',
                [USER_ID, monitor.title, monitor.target, 'pending', 0]
            );
            console.log(`✅ ADDED  "${monitor.title}" → ${monitor.target}`);
        }

        connection.release();
        console.log('\n🎉 Seed complete! Restart your backend to trigger the first monitoring cycle.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seed failed:', err.message);
        process.exit(1);
    }
})();
