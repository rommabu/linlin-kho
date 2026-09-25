const path = require('path');
const express = require('express');
const cors = require('cors');

require('./db'); // đảm bảo schema được khởi tạo trước khi mount routes

const projectsRouter = require('./routes/projects');
const charactersRouter = require('./routes/characters');
const scenesRouter = require('./routes/scenes');
const shotsRouter = require('./routes/shots');
const promptsRouter = require('./routes/prompts');
const assetsRouter = require('./routes/assets');
const continuityRouter = require('./routes/continuity');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.use('/api/projects', projectsRouter);
app.use('/api', charactersRouter);
app.use('/api', scenesRouter);
app.use('/api', shotsRouter);
app.use('/api', promptsRouter);
app.use('/api', assetsRouter);
app.use('/api', continuityRouter);

app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
});

app.listen(PORT, () => {
  console.log(`AI Film Studio đang chạy tại http://localhost:${PORT}`);
});
