const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM projects ORDER BY updated_at DESC').all();
  res.json(rows);
});

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Không tìm thấy dự án' });
  res.json(row);
});

router.post('/', (req, res) => {
  const { name, logline = '', synopsis = '', style_bible = '', status = 'dang_phat_trien' } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Tên dự án là bắt buộc' });
  const info = db
    .prepare('INSERT INTO projects (name, logline, synopsis, style_bible, status) VALUES (?, ?, ?, ?, ?)')
    .run(name.trim(), logline, synopsis, style_bible, status);
  const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(row);
});

router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Không tìm thấy dự án' });
  const { name, logline, synopsis, style_bible, status } = req.body;
  db.prepare(
    `UPDATE projects SET name = ?, logline = ?, synopsis = ?, style_bible = ?, status = ?, updated_at = datetime('now') WHERE id = ?`
  ).run(
    name ?? existing.name,
    logline ?? existing.logline,
    synopsis ?? existing.synopsis,
    style_bible ?? existing.style_bible,
    status ?? existing.status,
    req.params.id
  );
  const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  res.json(row);
});

router.delete('/:id', (req, res) => {
  const info = db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Không tìm thấy dự án' });
  res.status(204).end();
});

// ---- Tổng quan dashboard cho 1 dự án ----
router.get('/:id/summary', (req, res) => {
  const projectId = req.params.id;
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
  if (!project) return res.status(404).json({ error: 'Không tìm thấy dự án' });

  const characterCount = db.prepare('SELECT COUNT(*) c FROM characters WHERE project_id = ?').get(projectId).c;
  const sceneCount = db.prepare('SELECT COUNT(*) c FROM scenes WHERE project_id = ?').get(projectId).c;
  const shotCount = db
    .prepare(
      `SELECT COUNT(*) c FROM shots s JOIN scenes sc ON s.scene_id = sc.id WHERE sc.project_id = ?`
    )
    .get(projectId).c;
  const promptCount = db
    .prepare(
      `SELECT COUNT(*) c FROM prompts p
       JOIN shots s ON p.shot_id = s.id
       JOIN scenes sc ON s.scene_id = sc.id
       WHERE sc.project_id = ?`
    )
    .get(projectId).c;
  const assetCount = db.prepare('SELECT COUNT(*) c FROM assets WHERE project_id = ?').get(projectId).c;
  const openContinuity = db
    .prepare('SELECT COUNT(*) c FROM continuity_notes WHERE project_id = ? AND resolved = 0')
    .get(projectId).c;

  res.json({
    project,
    characterCount,
    sceneCount,
    shotCount,
    promptCount,
    assetCount,
    openContinuity,
  });
});

module.exports = router;
