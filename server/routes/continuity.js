const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/projects/:projectId/continuity', (req, res) => {
  const rows = db
    .prepare(
      `SELECT cn.*, s.title AS scene_title
       FROM continuity_notes cn
       LEFT JOIN scenes s ON cn.related_scene_id = s.id
       WHERE cn.project_id = ?
       ORDER BY cn.resolved ASC, cn.id DESC`
    )
    .all(req.params.projectId);
  res.json(rows);
});

router.post('/projects/:projectId/continuity', (req, res) => {
  const project = db.prepare('SELECT id FROM projects WHERE id = ?').get(req.params.projectId);
  if (!project) return res.status(404).json({ error: 'Không tìm thấy dự án' });
  const { note_type = 'setup', description, related_scene_id = null } = req.body;
  if (!description || !description.trim()) return res.status(400).json({ error: 'Mô tả là bắt buộc' });
  const info = db
    .prepare(
      `INSERT INTO continuity_notes (project_id, note_type, description, related_scene_id) VALUES (?, ?, ?, ?)`
    )
    .run(req.params.projectId, note_type, description.trim(), related_scene_id);
  const row = db.prepare('SELECT * FROM continuity_notes WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(row);
});

router.put('/continuity/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM continuity_notes WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Không tìm thấy ghi chú' });
  const next = { ...existing, ...req.body };
  db.prepare(
    `UPDATE continuity_notes SET note_type=?, description=?, related_scene_id=?, resolved=? WHERE id=?`
  ).run(next.note_type, next.description, next.related_scene_id, next.resolved ? 1 : 0, req.params.id);
  const row = db.prepare('SELECT * FROM continuity_notes WHERE id = ?').get(req.params.id);
  res.json(row);
});

router.delete('/continuity/:id', (req, res) => {
  const info = db.prepare('DELETE FROM continuity_notes WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Không tìm thấy ghi chú' });
  res.status(204).end();
});

module.exports = router;
