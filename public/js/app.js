/* AI Film Studio — SPA điều hướng bằng location.hash, không dùng framework. */

const viewRoot = document.getElementById('view-root');
const tabsBar = document.getElementById('project-tabs');
const toastEl = document.getElementById('toast');

const TABS = [
  { key: 'overview', label: 'Tổng quan' },
  { key: 'script', label: 'Kịch bản & Nhân vật' },
  { key: 'scenes', label: 'Phân cảnh & Shot' },
  { key: 'prompts', label: 'Prompt Seedance' },
  { key: 'assets', label: 'Continuity & Assets' },
];

const MAX_PROMPT_CHARS = 20000;

function esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function toast(msg, isError) {
  toastEl.textContent = msg;
  toastEl.className = 'toast' + (isError ? ' error' : '');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => (toastEl.className = 'toast hidden'), 3200);
}

async function safe(fn) {
  try {
    return await fn();
  } catch (err) {
    toast(err.message || 'Đã xảy ra lỗi', true);
    throw err;
  }
}

document.querySelector('.brand').addEventListener('click', () => {
  location.hash = '#/';
});

function parseHash() {
  const parts = location.hash.replace(/^#\//, '').split('/').filter(Boolean);
  if (parts[0] === 'project' && parts[1]) {
    return { view: 'project', projectId: parts[1], tab: parts[2] || 'overview' };
  }
  return { view: 'projects' };
}

window.addEventListener('hashchange', render);
window.addEventListener('DOMContentLoaded', render);

function render() {
  const route = parseHash();
  if (route.view === 'projects') {
    tabsBar.classList.add('hidden');
    renderProjectsView();
  } else {
    renderProjectWorkspace(route.projectId, route.tab);
  }
}

/* ---------------- Generic modal ---------------- */

function openModal(title, bodyHtml, { okLabel = 'Lưu', onOk } = {}) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <h2>${esc(title)}</h2>
      <div class="modal-body">${bodyHtml}</div>
      <div class="modal-actions">
        <button class="btn" data-act="cancel">Huỷ</button>
        <button class="btn btn-primary" data-act="ok">${esc(okLabel)}</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  overlay.querySelector('[data-act="cancel"]').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  overlay.querySelector('[data-act="ok"]').addEventListener('click', async () => {
    const ok = await onOk?.(overlay);
    if (ok !== false) close();
  });
  return overlay;
}

/* ---------------- Projects list ---------------- */

async function renderProjectsView() {
  viewRoot.innerHTML = `
    <div class="toolbar">
      <h1>Dự án làm phim bằng AI</h1>
      <button class="btn btn-primary" id="btn-new-project">+ Dự án mới</button>
    </div>
    <div id="projects-grid" class="grid"></div>
  `;
  document.getElementById('btn-new-project').addEventListener('click', openProjectFormModal);

  const grid = document.getElementById('projects-grid');
  const projects = await safe(() => API.listProjects());
  if (!projects.length) {
    grid.innerHTML = `<div class="empty-state">Chưa có dự án nào. Bấm "+ Dự án mới" để bắt đầu.</div>`;
    return;
  }
  grid.innerHTML = '';
  for (const p of projects) {
    const tpl = document.getElementById('tpl-project-card').content.cloneNode(true);
    tpl.querySelector('.p-name').textContent = p.name;
    tpl.querySelector('.p-logline').textContent = p.logline || 'Chưa có logline.';
    tpl.querySelector('.p-status').textContent = p.status;
    tpl.querySelector('.p-updated').textContent = 'Cập nhật: ' + p.updated_at;
    tpl.querySelector('.btn-open').addEventListener('click', () => {
      location.hash = `#/project/${p.id}/overview`;
    });
    tpl.querySelector('.btn-delete').addEventListener('click', async (e) => {
      e.stopPropagation();
      if (!confirm(`Xoá dự án "${p.name}"? Toàn bộ kịch bản, cảnh, prompt sẽ bị xoá.`)) return;
      await safe(() => API.deleteProject(p.id));
      renderProjectsView();
    });
    grid.appendChild(tpl);
  }
}

function openProjectFormModal(project) {
  const isEdit = !!project;
  const body = `
    <div class="field"><label>Tên dự án</label><input id="f-name" value="${esc(project?.name || '')}" /></div>
    <div class="field"><label>Logline</label><input id="f-logline" value="${esc(project?.logline || '')}" /></div>
    <div class="field"><label>Tóm tắt / Synopsis</label><textarea id="f-synopsis">${esc(project?.synopsis || '')}</textarea></div>
    <div class="field"><label>Style Bible (phong cách hình ảnh chung)</label><textarea id="f-style">${esc(project?.style_bible || '')}</textarea></div>
    <div class="field"><label>Trạng thái</label>
      <select id="f-status">
        ${['dang_phat_trien', 'dang_san_xuat', 'hau_ky', 'hoan_thanh'].map(
          (s) => `<option value="${s}" ${project?.status === s ? 'selected' : ''}>${s}</option>`
        ).join('')}
      </select>
    </div>`;
  openModal(isEdit ? 'Sửa dự án' : 'Dự án mới', body, {
    okLabel: isEdit ? 'Lưu' : 'Tạo',
    onOk: async (overlay) => {
      const data = {
        name: overlay.querySelector('#f-name').value.trim(),
        logline: overlay.querySelector('#f-logline').value,
        synopsis: overlay.querySelector('#f-synopsis').value,
        style_bible: overlay.querySelector('#f-style').value,
        status: overlay.querySelector('#f-status').value,
      };
      if (!data.name) { toast('Tên dự án là bắt buộc', true); return false; }
      if (isEdit) {
        await safe(() => API.updateProject(project.id, data));
        render();
      } else {
        const created = await safe(() => API.createProject(data));
        location.hash = `#/project/${created.id}/overview`;
      }
    },
  });
}

/* ---------------- Project workspace ---------------- */

async function renderProjectWorkspace(projectId, tab) {
  const project = await safe(() => API.getProject(projectId));

  tabsBar.classList.remove('hidden');
  tabsBar.innerHTML = TABS.map(
    (t) => `<button class="tab-btn ${t.key === tab ? 'active' : ''}" data-tab="${t.key}">${t.label}</button>`
  ).join('');
  tabsBar.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      location.hash = `#/project/${projectId}/${btn.dataset.tab}`;
    });
  });

  viewRoot.innerHTML = `<div id="workspace-body"></div>`;
  const body = document.getElementById('workspace-body');

  switch (tab) {
    case 'overview': return renderOverviewTab(body, project);
    case 'script': return renderScriptTab(body, project);
    case 'scenes': return renderScenesTab(body, project);
    case 'prompts': return renderPromptsTab(body, project);
    case 'assets': return renderAssetsTab(body, project);
    default: return renderOverviewTab(body, project);
  }
}

/* ---- Tab: Tổng quan ---- */

async function renderOverviewTab(body, project) {
  const summary = await safe(() => API.getSummary(project.id));
  body.innerHTML = `
    <div class="toolbar">
      <div>
        <h1>${esc(project.name)}</h1>
        <p class="muted">${esc(project.logline || 'Chưa có logline')}</p>
      </div>
      <div style="display:flex; gap:8px;">
        <button class="btn" id="btn-edit-project">Sửa dự án</button>
        <button class="btn btn-danger" id="btn-delete-project">Xoá dự án</button>
      </div>
    </div>
    <div class="stat-row">
      <div class="stat-box"><div class="num">${summary.characterCount}</div><div class="label">Nhân vật</div></div>
      <div class="stat-box"><div class="num">${summary.sceneCount}</div><div class="label">SEQ / Cảnh</div></div>
      <div class="stat-box"><div class="num">${summary.shotCount}</div><div class="label">Shot</div></div>
      <div class="stat-box"><div class="num">${summary.promptCount}</div><div class="label">Prompt đã viết</div></div>
      <div class="stat-box"><div class="num">${summary.assetCount}</div><div class="label">Tài sản</div></div>
      <div class="stat-box"><div class="num">${summary.openContinuity}</div><div class="label">Continuity chưa xử lý</div></div>
    </div>
    <div class="card">
      <h3>Tóm tắt / Synopsis</h3>
      <p class="muted" style="white-space:pre-wrap">${esc(project.synopsis || 'Chưa có nội dung.')}</p>
    </div>
    <div class="card" style="margin-top:14px">
      <h3>Style Bible</h3>
      <p class="muted" style="white-space:pre-wrap">${esc(project.style_bible || 'Chưa thiết lập phong cách hình ảnh.')}</p>
    </div>
  `;
  document.getElementById('btn-edit-project').addEventListener('click', () => openProjectFormModal(project));
  document.getElementById('btn-delete-project').addEventListener('click', async () => {
    if (!confirm(`Xoá dự án "${project.name}"?`)) return;
    await safe(() => API.deleteProject(project.id));
    location.hash = '#/';
  });
}

/* ---- Tab: Kịch bản & Nhân vật ---- */

async function renderScriptTab(body, project) {
  const characters = await safe(() => API.listCharacters(project.id));
  body.innerHTML = `
    <div class="section-title"><h2>Nhân vật</h2><button class="btn btn-primary btn-sm" id="btn-add-char">+ Thêm nhân vật</button></div>
    <div id="char-list" class="grid"></div>
  `;
  document.getElementById('btn-add-char').addEventListener('click', () => openCharacterModal(project.id));

  const list = document.getElementById('char-list');
  if (!characters.length) {
    list.innerHTML = `<div class="empty-state">Chưa có nhân vật nào.</div>`;
  } else {
    list.innerHTML = '';
    for (const c of characters) {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <h3>${esc(c.name)} ${c.role ? `<span class="badge">${esc(c.role)}</span>` : ''}</h3>
        <p class="muted"><strong>Want:</strong> ${esc(c.want) || '—'}</p>
        <p class="muted"><strong>Need:</strong> ${esc(c.need) || '—'}</p>
        <p class="muted"><strong>Contradiction:</strong> ${esc(c.contradiction) || '—'}</p>
        <p class="muted"><strong>Visual DNA:</strong> ${esc(c.visual_dna) || '—'}</p>
        <div class="card-actions">
          <button class="btn btn-sm btn-edit">Sửa</button>
          <button class="btn btn-sm btn-danger btn-del">Xoá</button>
        </div>`;
      card.querySelector('.btn-edit').addEventListener('click', () => openCharacterModal(project.id, c));
      card.querySelector('.btn-del').addEventListener('click', async () => {
        if (!confirm(`Xoá nhân vật "${c.name}"?`)) return;
        await safe(() => API.deleteCharacter(c.id));
        renderScriptTab(body, project);
      });
      list.appendChild(card);
    }
  }
}

function openCharacterModal(projectId, character) {
  const isEdit = !!character;
  const body = `
    <div class="field"><label>Tên nhân vật</label><input id="f-name" value="${esc(character?.name || '')}" /></div>
    <div class="field"><label>Vai trò (chính/phụ/phản diện...)</label><input id="f-role" value="${esc(character?.role || '')}" /></div>
    <div class="field"><label>Want (điều nhân vật muốn)</label><textarea id="f-want">${esc(character?.want || '')}</textarea></div>
    <div class="field"><label>Need (điều nhân vật thực sự cần)</label><textarea id="f-need">${esc(character?.need || '')}</textarea></div>
    <div class="field"><label>Contradiction</label><textarea id="f-contra">${esc(character?.contradiction || '')}</textarea></div>
    <div class="field"><label>Visual DNA</label><textarea id="f-visual">${esc(character?.visual_dna || '')}</textarea></div>
    <div class="field"><label>Ghi chú khác</label><textarea id="f-notes">${esc(character?.notes || '')}</textarea></div>
  `;
  openModal(isEdit ? 'Sửa nhân vật' : 'Nhân vật mới', body, {
    okLabel: isEdit ? 'Lưu' : 'Tạo',
    onOk: async (overlay) => {
      const data = {
        name: overlay.querySelector('#f-name').value.trim(),
        role: overlay.querySelector('#f-role').value,
        want: overlay.querySelector('#f-want').value,
        need: overlay.querySelector('#f-need').value,
        contradiction: overlay.querySelector('#f-contra').value,
        visual_dna: overlay.querySelector('#f-visual').value,
        notes: overlay.querySelector('#f-notes').value,
      };
      if (!data.name) { toast('Tên nhân vật là bắt buộc', true); return false; }
      if (isEdit) await safe(() => API.updateCharacter(character.id, data));
      else await safe(() => API.createCharacter(projectId, data));
      render();
    },
  });
}

/* ---- Tab: Phân cảnh & Shot ---- */

async function renderScenesTab(body, project) {
  const scenes = await safe(() => API.listScenes(project.id));
  body.innerHTML = `
    <div class="section-title"><h2>Phân cảnh (SEQ) & Shot list</h2><button class="btn btn-primary btn-sm" id="btn-add-scene">+ Thêm SEQ</button></div>
    <div id="scene-list"></div>
  `;
  document.getElementById('btn-add-scene').addEventListener('click', () => openSceneModal(project.id, null, body, project));

  const list = document.getElementById('scene-list');
  if (!scenes.length) {
    list.innerHTML = `<div class="empty-state">Chưa có SEQ/cảnh nào.</div>`;
    return;
  }
  list.innerHTML = '';
  for (const scene of scenes) {
    const block = document.createElement('div');
    block.className = 'scene-block';
    block.innerHTML = `
      <div class="scene-header">
        <div>
          <span class="title">SEQ ${esc(scene.seq_number)} — ${esc(scene.title)}</span><br/>
          <span class="sub">${esc(scene.location)} ${scene.time_of_day ? '· ' + esc(scene.time_of_day) : ''}</span>
        </div>
        <div style="display:flex; gap:6px; align-items:center;">
          <button class="btn btn-sm btn-edit-scene">Sửa</button>
          <button class="btn btn-sm btn-danger btn-del-scene">Xoá</button>
          <span class="chevron">▾</span>
        </div>
      </div>
      <div class="scene-body">
        <p class="muted" style="white-space:pre-wrap">${esc(scene.synopsis || '')}</p>
        <div class="section-title"><h3>Shot list</h3><button class="btn btn-sm btn-primary btn-add-shot">+ Thêm shot</button></div>
        <div class="shot-list"></div>
      </div>`;

    const header = block.querySelector('.scene-header');
    const bodyEl = block.querySelector('.scene-body');
    const shotListEl = block.querySelector('.shot-list');
    let loaded = false;

    header.addEventListener('click', async (e) => {
      if (e.target.closest('button')) return;
      bodyEl.classList.toggle('open');
      if (bodyEl.classList.contains('open') && !loaded) {
        loaded = true;
        await loadShots(shotListEl, scene);
      }
    });
    block.querySelector('.btn-edit-scene').addEventListener('click', () => openSceneModal(project.id, scene, body, project));
    block.querySelector('.btn-del-scene').addEventListener('click', async () => {
      if (!confirm(`Xoá SEQ "${scene.title}" và toàn bộ shot bên trong?`)) return;
      await safe(() => API.deleteScene(scene.id));
      renderScenesTab(body, project);
    });
    block.querySelector('.btn-add-shot').addEventListener('click', () => openShotModal(scene, null, shotListEl));

    list.appendChild(block);
  }
}

async function loadShots(container, scene) {
  const shots = await safe(() => API.listShots(scene.id));
  container.innerHTML = '';
  if (!shots.length) {
    container.innerHTML = `<div class="empty-state">Chưa có shot nào trong SEQ này.</div>`;
    return;
  }
  for (const shot of shots) {
    container.appendChild(renderShotRow(shot, scene, container));
  }
}

function renderShotRow(shot, scene, container) {
  const row = document.createElement('div');
  row.className = 'shot-row';
  row.innerHTML = `
    <div class="shot-row-head">
      <span class="tag">Shot ${esc(shot.shot_number)} ${shot.shot_size ? '· ' + esc(shot.shot_size) : ''}</span>
      <div style="display:flex; gap:6px;">
        <button class="btn btn-sm btn-edit-shot">Sửa</button>
        <button class="btn btn-sm btn-danger btn-del-shot">Xoá</button>
      </div>
    </div>
    <div class="shot-grid">
      <div class="full"><div class="label">Mô tả hành động</div>${esc(shot.description) || '—'}</div>
      <div><div class="label">Camera</div>${esc(shot.camera) || '—'}</div>
      <div><div class="label">Thời lượng (giây)</div>${esc(shot.duration_sec) || '—'}</div>
      <div><div class="label">Inner</div>${esc(shot.emotion_inner) || '—'}</div>
      <div><div class="label">Mask</div>${esc(shot.emotion_mask) || '—'}</div>
      <div><div class="label">Leak</div>${esc(shot.emotion_leak) || '—'}</div>
      <div class="full"><div class="label">B-roll cần thiết</div>${esc(shot.broll_notes) || '—'}</div>
    </div>`;
  row.querySelector('.btn-edit-shot').addEventListener('click', () => openShotModal(scene, shot, container));
  row.querySelector('.btn-del-shot').addEventListener('click', async () => {
    if (!confirm(`Xoá shot ${shot.shot_number}?`)) return;
    await safe(() => API.deleteShot(shot.id));
    loadShots(container, scene);
  });
  return row;
}

function openSceneModal(projectId, scene, body, project) {
  const isEdit = !!scene;
  const modalBody = `
    <div class="field"><label>Số SEQ</label><input id="f-seq" type="number" value="${scene?.seq_number ?? 1}" /></div>
    <div class="field"><label>Tên SEQ / Cảnh</label><input id="f-title" value="${esc(scene?.title || '')}" /></div>
    <div class="field"><label>Bối cảnh</label><input id="f-location" value="${esc(scene?.location || '')}" /></div>
    <div class="field"><label>Thời điểm (ngày/đêm...)</label><input id="f-tod" value="${esc(scene?.time_of_day || '')}" /></div>
    <div class="field"><label>Tóm tắt cảnh</label><textarea id="f-synopsis">${esc(scene?.synopsis || '')}</textarea></div>
  `;
  openModal(isEdit ? 'Sửa SEQ' : 'SEQ mới', modalBody, {
    okLabel: isEdit ? 'Lưu' : 'Tạo',
    onOk: async (overlay) => {
      const data = {
        seq_number: Number(overlay.querySelector('#f-seq').value) || 1,
        title: overlay.querySelector('#f-title').value.trim(),
        location: overlay.querySelector('#f-location').value,
        time_of_day: overlay.querySelector('#f-tod').value,
        synopsis: overlay.querySelector('#f-synopsis').value,
      };
      if (!data.title) { toast('Tên SEQ là bắt buộc', true); return false; }
      if (isEdit) await safe(() => API.updateScene(scene.id, data));
      else await safe(() => API.createScene(projectId, data));
      renderScenesTab(body, project);
    },
  });
}

function openShotModal(scene, shot, container) {
  const isEdit = !!shot;
  const modalBody = `
    <div class="field"><label>Số thứ tự shot</label><input id="f-num" type="number" value="${shot?.shot_number ?? 1}" /></div>
    <div class="field"><label>Cỡ cảnh (Close-up, Wide...)</label><input id="f-size" value="${esc(shot?.shot_size || '')}" /></div>
    <div class="field"><label>Camera (góc/chuyển động/lens)</label><input id="f-camera" value="${esc(shot?.camera || '')}" /></div>
    <div class="field"><label>Mô tả hành động</label><textarea id="f-desc">${esc(shot?.description || '')}</textarea></div>
    <div class="field"><label>Thời lượng (giây)</label><input id="f-dur" type="number" step="0.1" value="${shot?.duration_sec ?? 0}" /></div>
    <div class="field"><label>Inner (cảm xúc thật bên trong)</label><input id="f-inner" value="${esc(shot?.emotion_inner || '')}" /></div>
    <div class="field"><label>Mask (vẻ ngoài che giấu)</label><input id="f-mask" value="${esc(shot?.emotion_mask || '')}" /></div>
    <div class="field"><label>Leak (chi tiết rò rỉ cảm xúc thật)</label><input id="f-leak" value="${esc(shot?.emotion_leak || '')}" /></div>
    <div class="field"><label>B-roll cần thiết (nếu có)</label><textarea id="f-broll" placeholder="VD: cận cảnh tay run, đồng hồ treo tường, mưa ngoài cửa sổ...">${esc(shot?.broll_notes || '')}</textarea></div>
  `;
  openModal(isEdit ? 'Sửa shot' : 'Shot mới', modalBody, {
    okLabel: isEdit ? 'Lưu' : 'Tạo',
    onOk: async (overlay) => {
      const data = {
        shot_number: Number(overlay.querySelector('#f-num').value) || 1,
        shot_size: overlay.querySelector('#f-size').value,
        camera: overlay.querySelector('#f-camera').value,
        description: overlay.querySelector('#f-desc').value,
        duration_sec: Number(overlay.querySelector('#f-dur').value) || 0,
        emotion_inner: overlay.querySelector('#f-inner').value,
        emotion_mask: overlay.querySelector('#f-mask').value,
        emotion_leak: overlay.querySelector('#f-leak').value,
        broll_notes: overlay.querySelector('#f-broll').value,
      };
      if (isEdit) await safe(() => API.updateShot(shot.id, data));
      else await safe(() => API.createShot(scene.id, data));
      loadShots(container, scene);
    },
  });
}

/* ---- Tab: Prompt Seedance ---- */

async function renderPromptsTab(body, project) {
  const scenes = await safe(() => API.listScenes(project.id));
  body.innerHTML = `
    <div class="section-title">
      <h2>Trình soạn prompt Seedance</h2>
    </div>
    <div class="field">
      <label>Chọn SEQ để soạn prompt (viết hết một lượt, xử lý từng shot, các SEQ nối tiếp cần logic nối cảnh hợp lý)</label>
      <select id="scene-select">
        <option value="">— Chọn SEQ —</option>
        ${scenes.map((s) => `<option value="${s.id}">SEQ ${esc(s.seq_number)} — ${esc(s.title)}</option>`).join('')}
      </select>
    </div>
    <div id="prompt-scene-body"></div>
  `;
  const sel = document.getElementById('scene-select');
  sel.addEventListener('change', () => renderPromptSceneBody(sel.value, project));
  if (scenes.length === 1) {
    sel.value = scenes[0].id;
    renderPromptSceneBody(scenes[0].id, project);
  }
}

async function renderPromptSceneBody(sceneId, project) {
  const container = document.getElementById('prompt-scene-body');
  if (!sceneId) { container.innerHTML = ''; return; }

  const shots = await safe(() => API.listShots(sceneId));
  container.innerHTML = `
    <div class="section-title">
      <h3>Shot trong SEQ này (${shots.length})</h3>
      <button class="btn btn-sm" id="btn-export-scene">Ghép prompt cả SEQ</button>
    </div>
    <div id="prompt-shot-list"></div>
  `;
  const list = document.getElementById('prompt-shot-list');
  if (!shots.length) {
    list.innerHTML = `<div class="empty-state">SEQ này chưa có shot. Thêm shot ở tab "Phân cảnh & Shot" trước.</div>`;
  } else {
    for (const shot of shots) {
      list.appendChild(await renderPromptShotBlock(shot));
    }
  }
  document.getElementById('btn-export-scene').addEventListener('click', () => exportScenePrompt(sceneId));
}

async function renderPromptShotBlock(shot) {
  const prompts = await safe(() => API.listPrompts(shot.id));
  const latest = prompts[0]; // đã ORDER BY version DESC
  const block = document.createElement('div');
  block.className = 'card';
  block.style.marginBottom = '14px';
  block.innerHTML = `
    <div class="shot-row-head">
      <strong>Shot ${esc(shot.shot_number)} ${shot.shot_size ? '· ' + esc(shot.shot_size) : ''}</strong>
      <span class="muted">${shot.duration_sec ? shot.duration_sec + 's' : ''}</span>
    </div>
    <p class="muted" style="font-size:13px">${esc(shot.description) || 'Chưa có mô tả hành động cho shot này.'}</p>
    ${shot.broll_notes ? `<p class="muted" style="font-size:12px"><strong>B-roll:</strong> ${esc(shot.broll_notes)}</p>` : ''}
    <div class="prompt-editor">
      <textarea id="prompt-text-${shot.id}" placeholder="Dán / viết prompt Seedance cho shot này...">${esc(latest?.content || '')}</textarea>
      <div class="char-counter" id="counter-${shot.id}"></div>
    </div>
    <div class="card-actions" style="margin-top:10px">
      <label style="display:flex; align-items:center; gap:6px; font-size:13px;">
        <input type="checkbox" id="final-${shot.id}" ${latest?.is_final ? 'checked' : ''}/> Đánh dấu bản cuối
      </label>
      <button class="btn btn-primary btn-sm" id="save-${shot.id}">Lưu phiên bản mới</button>
    </div>
  `;

  const textarea = block.querySelector(`#prompt-text-${shot.id}`);
  const counter = block.querySelector(`#counter-${shot.id}`);
  const updateCounter = () => {
    const len = textarea.value.length;
    counter.textContent = `${len.toLocaleString('vi-VN')} / ${MAX_PROMPT_CHARS.toLocaleString('vi-VN')} ký tự`;
    counter.className = 'char-counter' + (len > MAX_PROMPT_CHARS ? ' over' : '');
  };
  textarea.addEventListener('input', updateCounter);
  updateCounter();

  block.querySelector(`#save-${shot.id}`).addEventListener('click', async () => {
    const content = textarea.value;
    const is_final = block.querySelector(`#final-${shot.id}`).checked;
    const created = await safe(() => API.createPrompt(shot.id, { content, prompt_type: 'seedance' }));
    if (is_final) await safe(() => API.updatePrompt(created.id, { is_final: true }));
    toast(created.over_limit ? `Đã lưu — CẢNH BÁO: vượt quá ${MAX_PROMPT_CHARS.toLocaleString('vi-VN')} ký tự` : 'Đã lưu prompt');
  });

  return block;
}

async function exportScenePrompt(sceneId) {
  const result = await safe(() => API.exportScenePrompt(sceneId));
  const warning = result.over_limit
    ? `<p style="color:#e5484d"><strong>Cảnh báo:</strong> tổng ${result.char_count.toLocaleString('vi-VN')} ký tự, vượt giới hạn ${MAX_PROMPT_CHARS.toLocaleString('vi-VN')}. Nên tách bớt shot sang prompt kế tiếp.</p>`
    : '';
  const missing = result.shots_missing_prompt.length
    ? `<p class="muted">Shot chưa có prompt: ${result.shots_missing_prompt.join(', ')}</p>`
    : '';
  const body = `
    ${warning}
    ${missing}
    <div class="field">
      <label>Prompt ghép của SEQ "${esc(result.scene_title)}" — ${result.char_count.toLocaleString('vi-VN')} ký tự</label>
      <textarea id="combined" style="min-height:320px; font-family:monospace; font-size:12px;">${esc(result.combined_prompt)}</textarea>
    </div>`;
  const overlay = openModal('Xuất prompt Seedance cho cả SEQ', body, {
    okLabel: 'Sao chép',
    onOk: async (ov) => {
      const text = ov.querySelector('#combined').value;
      try {
        await navigator.clipboard.writeText(text);
        toast('Đã sao chép prompt vào clipboard');
      } catch {
        toast('Không thể tự sao chép — hãy chọn và copy thủ công', true);
      }
      return false; // giữ modal mở để người dùng xem lại
    },
  });
}

/* ---- Tab: Continuity & Assets ---- */

async function renderAssetsTab(body, project) {
  const [assets, notes] = await Promise.all([
    safe(() => API.listAssets(project.id)),
    safe(() => API.listContinuity(project.id)),
  ]);

  body.innerHTML = `
    <div class="section-title"><h2>Tài sản (nhân vật / prop / bối cảnh)</h2><button class="btn btn-primary btn-sm" id="btn-add-asset">+ Thêm tài sản</button></div>
    <table class="data-table">
      <thead><tr><th>Loại</th><th>Tên</th><th>Mô tả</th><th>Xuất hiện lần đầu</th><th>Trạng thái</th><th></th></tr></thead>
      <tbody id="asset-body"></tbody>
    </table>

    <div class="section-title"><h2>Continuity — Setup / Payoff</h2><button class="btn btn-primary btn-sm" id="btn-add-note">+ Thêm ghi chú</button></div>
    <table class="data-table">
      <thead><tr><th>Loại</th><th>Mô tả</th><th>Cảnh liên quan</th><th>Trạng thái</th><th></th></tr></thead>
      <tbody id="note-body"></tbody>
    </table>
  `;

  const assetBody = document.getElementById('asset-body');
  assetBody.innerHTML = assets.length ? '' : `<tr><td colspan="6" class="muted">Chưa có tài sản nào.</td></tr>`;
  for (const a of assets) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><span class="pill">${esc(a.asset_type)}</span></td>
      <td>${esc(a.name)}</td>
      <td class="muted">${esc(a.description) || '—'}</td>
      <td class="muted">${esc(a.first_appearance) || '—'}</td>
      <td>${esc(a.status)}</td>
      <td><button class="btn btn-sm btn-edit">Sửa</button> <button class="btn btn-sm btn-danger btn-del">Xoá</button></td>`;
    tr.querySelector('.btn-edit').addEventListener('click', () => openAssetModal(project.id, a, body, project));
    tr.querySelector('.btn-del').addEventListener('click', async () => {
      if (!confirm(`Xoá tài sản "${a.name}"?`)) return;
      await safe(() => API.deleteAsset(a.id));
      renderAssetsTab(body, project);
    });
    assetBody.appendChild(tr);
  }

  const noteBody = document.getElementById('note-body');
  noteBody.innerHTML = notes.length ? '' : `<tr><td colspan="5" class="muted">Chưa có ghi chú continuity nào.</td></tr>`;
  for (const n of notes) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><span class="pill">${esc(n.note_type)}</span></td>
      <td>${esc(n.description)}</td>
      <td class="muted">${esc(n.scene_title) || '—'}</td>
      <td><span class="pill ${n.resolved ? 'resolved' : 'open'}">${n.resolved ? 'Đã xử lý' : 'Chưa xử lý'}</span></td>
      <td>
        <button class="btn btn-sm btn-toggle">${n.resolved ? 'Mở lại' : 'Đánh dấu xong'}</button>
        <button class="btn btn-sm btn-danger btn-del">Xoá</button>
      </td>`;
    tr.querySelector('.btn-toggle').addEventListener('click', async () => {
      await safe(() => API.updateContinuity(n.id, { resolved: n.resolved ? 0 : 1 }));
      renderAssetsTab(body, project);
    });
    tr.querySelector('.btn-del').addEventListener('click', async () => {
      if (!confirm('Xoá ghi chú này?')) return;
      await safe(() => API.deleteContinuity(n.id));
      renderAssetsTab(body, project);
    });
    noteBody.appendChild(tr);
  }

  document.getElementById('btn-add-asset').addEventListener('click', () => openAssetModal(project.id, null, body, project));
  document.getElementById('btn-add-note').addEventListener('click', () => openContinuityModal(project, body));
}

function openAssetModal(projectId, asset, body, project) {
  const isEdit = !!asset;
  const modalBody = `
    <div class="field"><label>Loại</label>
      <select id="f-type">
        ${['character', 'prop', 'location'].map((t) => `<option value="${t}" ${asset?.asset_type === t ? 'selected' : ''}>${t}</option>`).join('')}
      </select>
    </div>
    <div class="field"><label>Tên</label><input id="f-name" value="${esc(asset?.name || '')}" /></div>
    <div class="field"><label>Mô tả</label><textarea id="f-desc">${esc(asset?.description || '')}</textarea></div>
    <div class="field"><label>Xuất hiện lần đầu (SEQ/Shot)</label><input id="f-first" value="${esc(asset?.first_appearance || '')}" /></div>
    <div class="field"><label>Trạng thái</label>
      <select id="f-status">
        ${['active', 'lost', 'destroyed', 'retired'].map((s) => `<option value="${s}" ${asset?.status === s ? 'selected' : ''}>${s}</option>`).join('')}
      </select>
    </div>`;
  openModal(isEdit ? 'Sửa tài sản' : 'Tài sản mới', modalBody, {
    okLabel: isEdit ? 'Lưu' : 'Tạo',
    onOk: async (overlay) => {
      const data = {
        asset_type: overlay.querySelector('#f-type').value,
        name: overlay.querySelector('#f-name').value.trim(),
        description: overlay.querySelector('#f-desc').value,
        first_appearance: overlay.querySelector('#f-first').value,
        status: overlay.querySelector('#f-status').value,
      };
      if (!data.name) { toast('Tên tài sản là bắt buộc', true); return false; }
      if (isEdit) await safe(() => API.updateAsset(asset.id, data));
      else await safe(() => API.createAsset(projectId, data));
      renderAssetsTab(body, project);
    },
  });
}

async function openContinuityModal(project, body) {
  const scenes = await safe(() => API.listScenes(project.id));
  const modalBody = `
    <div class="field"><label>Loại</label>
      <select id="f-type">
        <option value="setup">setup</option>
        <option value="payoff">payoff</option>
        <option value="issue">issue / plot hole</option>
      </select>
    </div>
    <div class="field"><label>Mô tả</label><textarea id="f-desc" placeholder="VD: khẩu súng được giới thiệu ở SEQ 2 cần được dùng lại sau"></textarea></div>
    <div class="field"><label>Cảnh liên quan</label>
      <select id="f-scene">
        <option value="">— Không chọn —</option>
        ${scenes.map((s) => `<option value="${s.id}">SEQ ${esc(s.seq_number)} — ${esc(s.title)}</option>`).join('')}
      </select>
    </div>`;
  openModal('Ghi chú continuity mới', modalBody, {
    okLabel: 'Tạo',
    onOk: async (overlay) => {
      const data = {
        note_type: overlay.querySelector('#f-type').value,
        description: overlay.querySelector('#f-desc').value.trim(),
        related_scene_id: overlay.querySelector('#f-scene').value || null,
      };
      if (!data.description) { toast('Mô tả là bắt buộc', true); return false; }
      await safe(() => API.createContinuity(project.id, data));
      renderAssetsTab(body, project);
    },
  });
}
