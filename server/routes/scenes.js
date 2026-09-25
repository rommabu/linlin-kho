const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/projects/:projectId/scenes', (req, res) => {
  const rows = db
    .prepare('SELECT * FROM scenes WHERE project_id = ? ORDER BY sort_order ASC, seq_number ASC')
    .all(req.params.projectId);
  res.json(rows);
});

router.get('/scenes/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM scenes WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Không tìm thấy cảnh' });
  res.json(row);
});

router.post('/projects/:projectId/scenes', (req, res) => {
  const project = db.prepare('SELECT id FROM projects WHERE id = ?').get(req.params.projectId);
  if (!project) return res.status(404).json({ error: 'Không tìm thấy dự án' });
  const { seq_number = 1, title, location = '', time_of_day = '', synopsis = '' } = req.body;
  if (!title || !title.trim()) return res.status(400).json({ error: 'Tên cảnh (SEQ) là bắt buộc' });
  const maxOrder = db
    .prepare('SELECT COALESCE(MAX(sort_order), -1) m FROM scenes WHERE project_id = ?')
    .get(req.params.projectId).m;
  const info = db
    .prepare(
      `INSERT INTO scenes (project_id, seq_number, title, location, time_of_day, synopsis, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(req.params.projectId, seq_number, title.trim(), location, time_of_day, synopsis, maxOrder + 1);
  const row = db.prepare('SELECT * FROM scenes WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(row);
});

router.put('/scenes/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM scenes WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Không tìm thấy cảnh' });
  const fields = ['seq_number', 'title', 'location', 'time_of_day', 'synopsis', 'sort_order'];
  const next = { ...existing, ...req.body };
  db.prepare(
    `UPDATE scenes SET seq_number=?, title=?, location=?, time_of_day=?, synopsis=?, sort_order=? WHERE id=?`
  ).run(...fields.map((f) => next[f]), req.params.id);
  const row = db.prepare('SELECT * FROM scenes WHERE id = ?').get(req.params.id);
  res.json(row);
});

router.delete('/scenes/:id', (req, res) => {
  const info = db.prepare('DELETE FROM scenes WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Không tìm thấy cảnh' });
  res.status(204).end();
});

module.exports = router;
