const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/scenes/:sceneId/shots', (req, res) => {
  const rows = db
    .prepare('SELECT * FROM shots WHERE scene_id = ? ORDER BY sort_order ASC, shot_number ASC')
    .all(req.params.sceneId);
  res.json(rows);
});

router.get('/shots/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM shots WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Không tìm thấy shot' });
  res.json(row);
});

router.post('/scenes/:sceneId/shots', (req, res) => {
  const scene = db.prepare('SELECT id FROM scenes WHERE id = ?').get(req.params.sceneId);
  if (!scene) return res.status(404).json({ error: 'Không tìm thấy cảnh' });
  const {
    shot_number = 1,
    shot_size = '',
    camera = '',
    description = '',
    emotion_inner = '',
    emotion_mask = '',
    emotion_leak = '',
    broll_notes = '',
    duration_sec = 0,
  } = req.body;
  const maxOrder = db
    .prepare('SELECT COALESCE(MAX(sort_order), -1) m FROM shots WHERE scene_id = ?')
    .get(req.params.sceneId).m;
  const info = db
    .prepare(
      `INSERT INTO shots (scene_id, shot_number, shot_size, camera, description, emotion_inner, emotion_mask, emotion_leak, broll_notes, duration_sec, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      req.params.sceneId,
      shot_number,
      shot_size,
      camera,
      description,
      emotion_inner,
      emotion_mask,
      emotion_leak,
      broll_notes,
      duration_sec,
      maxOrder + 1
    );
  const row = db.prepare('SELECT * FROM shots WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(row);
});

router.put('/shots/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM shots WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Không tìm thấy shot' });
  const fields = [
    'shot_number',
    'shot_size',
    'camera',
    'description',
    'emotion_inner',
    'emotion_mask',
    'emotion_leak',
    'broll_notes',
    'duration_sec',
    'sort_order',
  ];
  const next = { ...existing, ...req.body };
  db.prepare(
    `UPDATE shots SET shot_number=?, shot_size=?, camera=?, description=?, emotion_inner=?, emotion_mask=?, emotion_leak=?, broll_notes=?, duration_sec=?, sort_order=? WHERE id=?`
  ).run(...fields.map((f) => next[f]), req.params.id);
  const row = db.prepare('SELECT * FROM shots WHERE id = ?').get(req.params.id);
  res.json(row);
});

router.delete('/shots/:id', (req, res) => {
  const info = db.prepare('DELETE FROM shots WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Không tìm thấy shot' });
  res.status(204).end();
});

module.exports = router;
