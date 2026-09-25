const API = (() => {
  async function req(method, url, body) {
    const res = await fetch(url, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.status === 204) return null;
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Lỗi ${res.status}`);
    return data;
  }

  return {
    // Projects
    listProjects: () => req('GET', '/api/projects'),
    getProject: (id) => req('GET', `/api/projects/${id}`),
    getSummary: (id) => req('GET', `/api/projects/${id}/summary`),
    createProject: (data) => req('POST', '/api/projects', data),
    updateProject: (id, data) => req('PUT', `/api/projects/${id}`, data),
    deleteProject: (id) => req('DELETE', `/api/projects/${id}`),

    // Characters
    listCharacters: (projectId) => req('GET', `/api/projects/${projectId}/characters`),
    createCharacter: (projectId, data) => req('POST', `/api/projects/${projectId}/characters`, data),
    updateCharacter: (id, data) => req('PUT', `/api/characters/${id}`, data),
    deleteCharacter: (id) => req('DELETE', `/api/characters/${id}`),

    // Scenes
    listScenes: (projectId) => req('GET', `/api/projects/${projectId}/scenes`),
    createScene: (projectId, data) => req('POST', `/api/projects/${projectId}/scenes`, data),
    updateScene: (id, data) => req('PUT', `/api/scenes/${id}`, data),
    deleteScene: (id) => req('DELETE', `/api/scenes/${id}`),

    // Shots
    listShots: (sceneId) => req('GET', `/api/scenes/${sceneId}/shots`),
    createShot: (sceneId, data) => req('POST', `/api/scenes/${sceneId}/shots`, data),
    updateShot: (id, data) => req('PUT', `/api/shots/${id}`, data),
    deleteShot: (id) => req('DELETE', `/api/shots/${id}`),

    // Prompts
    listPrompts: (shotId) => req('GET', `/api/shots/${shotId}/prompts`),
    createPrompt: (shotId, data) => req('POST', `/api/shots/${shotId}/prompts`, data),
    updatePrompt: (id, data) => req('PUT', `/api/prompts/${id}`, data),
    deletePrompt: (id) => req('DELETE', `/api/prompts/${id}`),
    exportScenePrompt: (sceneId) => req('GET', `/api/scenes/${sceneId}/export-prompt`),

    // Assets
    listAssets: (projectId) => req('GET', `/api/projects/${projectId}/assets`),
    createAsset: (projectId, data) => req('POST', `/api/projects/${projectId}/assets`, data),
    updateAsset: (id, data) => req('PUT', `/api/assets/${id}`, data),
    deleteAsset: (id) => req('DELETE', `/api/assets/${id}`),

    // Continuity
    listContinuity: (projectId) => req('GET', `/api/projects/${projectId}/continuity`),
    createContinuity: (projectId, data) => req('POST', `/api/projects/${projectId}/continuity`, data),
    updateContinuity: (id, data) => req('PUT', `/api/continuity/${id}`, data),
    deleteContinuity: (id) => req('DELETE', `/api/continuity/${id}`),
  };
})();
