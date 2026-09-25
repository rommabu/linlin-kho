const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/projects/:projectId/characters', (req, res) => {
  const rows = db
    .prepare('SELECT * FROM characters WHERE project_id = ? ORDER BY id ASC')
    .all(req.params.projectId);
  res.json(rows);
});

router.post('/projects/:projectId/characters', (req, res) => {
  const project = db.prepare('SELECT id FROM projects WHERE id = ?').get(req.params.projectId);
  if (!project) return res.status(404).json({ error: 'Không tìm thấy dự án' });
  const { name, role = '', want = '', need = '', contradiction = '', visual_dna = '', notes = '' } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Tên nhân vật là bắt buộc' });
  const info = db
    .prepare(
      `INSERT INTO characters (project_id, name, role, want, need, contradiction, visual_dna, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(req.params.projectId, name.trim(), role, want, need, contradiction, visual_dna, notes);
  const row = db.prepare('SELECT * FROM characters WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(row);
});

router.put('/characters/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM characters WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Không tìm thấy nhân vật' });
  const fields = ['name', 'role', 'want', 'need', 'contradiction', 'visual_dna', 'notes'];
  const next = { ...existing, ...req.body };
  db.prepare(
    `UPDATE characters SET name=?, role=?, want=?, need=?, contradiction=?, visual_dna=?, notes=? WHERE id=?`
  ).run(...fields.map((f) => next[f]), req.params.id);
  const row = db.prepare('SELECT * FROM characters WHERE id = ?').get(req.params.id);
  res.json(row);
});

router.delete('/characters/:id', (req, res) => {
  const info = db.prepare('DELETE FROM characters WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Không tìm thấy nhân vật' });
  res.status(204).end();
});

module.exports = router;
