const express = require('express');
const db = require('../db');

const router = express.Router();
const MAX_CHARS = 20000;

router.get('/shots/:shotId/prompts', (req, res) => {
  const rows = db
    .prepare('SELECT * FROM prompts WHERE shot_id = ? ORDER BY version DESC')
    .all(req.params.shotId);
  res.json(rows);
});

router.post('/shots/:shotId/prompts', (req, res) => {
  const shot = db.prepare('SELECT id FROM shots WHERE id = ?').get(req.params.shotId);
  if (!shot) return res.status(404).json({ error: 'Không tìm thấy shot' });
  const { content = '', prompt_type = 'seedance' } = req.body;
  const charCount = content.length;
  const maxVersion = db
    .prepare('SELECT COALESCE(MAX(version), 0) m FROM prompts WHERE shot_id = ?')
    .get(req.params.shotId).m;
  const info = db
    .prepare(
      `INSERT INTO prompts (shot_id, version, prompt_type, content, char_count) VALUES (?, ?, ?, ?, ?)`
    )
    .run(req.params.shotId, maxVersion + 1, prompt_type, content, charCount);
  const row = db.prepare('SELECT * FROM prompts WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ ...row, over_limit: charCount > MAX_CHARS, max_chars: MAX_CHARS });
});

router.put('/prompts/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM prompts WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Không tìm thấy prompt' });
  const content = req.body.content ?? existing.content;
  const is_final = req.body.is_final ?? existing.is_final;
  const charCount = content.length;
  db.prepare('UPDATE prompts SET content=?, char_count=?, is_final=? WHERE id=?').run(
    content,
    charCount,
    is_final ? 1 : 0,
    req.params.id
  );
  const row = db.prepare('SELECT * FROM prompts WHERE id = ?').get(req.params.id);
  res.json({ ...row, over_limit: charCount > MAX_CHARS, max_chars: MAX_CHARS });
});

router.delete('/prompts/:id', (req, res) => {
  const info = db.prepare('DELETE FROM prompts WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Không tìm thấy prompt' });
  res.status(204).end();
});

// Ghép prompt cuối cùng (is_final, hoặc version mới nhất) của mọi shot trong 1 SEQ
// thành 1 prompt liền mạch, để dán thẳng vào Seedance UI.
router.get('/scenes/:sceneId/export-prompt', (req, res) => {
  const scene = db.prepare('SELECT * FROM scenes WHERE id = ?').get(req.params.sceneId);
  if (!scene) return res.status(404).json({ error: 'Không tìm thấy cảnh' });

  const shots = db
    .prepare('SELECT * FROM shots WHERE scene_id = ? ORDER BY sort_order ASC, shot_number ASC')
    .all(req.params.sceneId);

  const parts = [];
  const missing = [];
  for (const shot of shots) {
    const finalPrompt = db
      .prepare(
        `SELECT * FROM prompts WHERE shot_id = ? ORDER BY is_final DESC, version DESC LIMIT 1`
      )
      .get(shot.id);
    if (finalPrompt && finalPrompt.content.trim()) {
      parts.push(finalPrompt.content.trim());
    } else {
      missing.push(shot.shot_number);
    }
  }

  const combined = parts.join('\n\n');
  res.json({
    scene_id: scene.id,
    scene_title: scene.title,
    combined_prompt: combined,
    char_count: combined.length,
    max_chars: MAX_CHARS,
    over_limit: combined.length > MAX_CHARS,
    shots_missing_prompt: missing,
  });
});

module.exports = router;
