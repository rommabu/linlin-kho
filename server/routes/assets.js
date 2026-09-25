const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/projects/:projectId/assets', (req, res) => {
  const rows = db
    .prepare('SELECT * FROM assets WHERE project_id = ? ORDER BY asset_type ASC, name ASC')
    .all(req.params.projectId);
  res.json(rows);
});

router.post('/projects/:projectId/assets', (req, res) => {
  const project = db.prepare('SELECT id FROM projects WHERE id = ?').get(req.params.projectId);
  if (!project) return res.status(404).json({ error: 'Không tìm thấy dự án' });
  const { asset_type = 'prop', name, description = '', first_appearance = '', status = 'active' } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Tên tài sản là bắt buộc' });
  const info = db
    .prepare(
      `INSERT INTO assets (project_id, asset_type, name, description, first_appearance, status)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(req.params.projectId, asset_type, name.trim(), description, first_appearance, status);
  const row = db.prepare('SELECT * FROM assets WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(row);
});

router.put('/assets/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM assets WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Không tìm thấy tài sản' });
  const fields = ['asset_type', 'name', 'description', 'first_appearance', 'status'];
  const next = { ...existing, ...req.body };
  db.prepare(`UPDATE assets SET asset_type=?, name=?, description=?, first_appearance=?, status=? WHERE id=?`).run(
    ...fields.map((f) => next[f]),
    req.params.id
  );
  const row = db.prepare('SELECT * FROM assets WHERE id = ?').get(req.params.id);
  res.json(row);
});

router.delete('/assets/:id', (req, res) => {
  const info = db.prepare('DELETE FROM assets WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Không tìm thấy tài sản' });
  res.status(204).end();
});

module.exports = router;
