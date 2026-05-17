const db = require('../config/db');

// GET /api/monitors  — return all monitors for the logged-in user
exports.getMonitors = async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT id, title, target, status, last_latency AS latency FROM monitors WHERE user_id = ? ORDER BY id DESC',
      [req.user.id]
    );
    // uptime is not stored in DB — default to 100 on the JS side
    res.json(rows.map(r => ({ ...r, uptime: 100 })));
  } catch (error) {
    console.error('❌ getMonitors error:', error.message);
    res.status(500).json({ message: 'Failed to fetch monitors', error: error.message });
  }
};

// POST /api/monitors  — create a new monitor
exports.createMonitor = async (req, res) => {
  const { title, target } = req.body;

  if (!title || !target) {
    return res.status(400).json({ message: 'title and target are required' });
  }

  try {
    const [result] = await db.execute(
      'INSERT INTO monitors (user_id, title, target, status, last_latency) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, title.trim(), target.trim(), 'pending', 0]
    );
    const [rows] = await db.execute(
      'SELECT id, title, target, status, last_latency AS latency FROM monitors WHERE id = ?',
      [result.insertId]
    );
    res.status(201).json({ ...rows[0], uptime: 100 });
  } catch (error) {
    console.error('❌ createMonitor error:', error.message);
    res.status(500).json({ message: 'Failed to create monitor', error: error.message });
  }
};

// DELETE /api/monitors/:id  — remove a monitor
exports.deleteMonitor = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.execute(
      'DELETE FROM monitors WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Monitor not found or not authorized' });
    }
    res.json({ message: 'Monitor deleted successfully' });
  } catch (error) {
    console.error('❌ deleteMonitor error:', error.message);
    res.status(500).json({ message: 'Failed to delete monitor', error: error.message });
  }
};
