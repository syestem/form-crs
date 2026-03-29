function requestJson(config, path, options = {}) {
  const baseUrl = (config.api.baseUrl || "/api").replace(/\/$/, "");
  const url = `${baseUrl}${path}`;
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  return fetch(url, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  }).then(async response => {
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) {
      throw new Error(data.error || `Request failed: ${response.status}`);
    }
    return data;
  });
}

window.FormApi = {
  async fetchStats(config) {
    return requestJson(config, "/stats");
  },

  async submit(config, payload) {
    const result = await requestJson(config, "/submissions/upsert", {
      method: "POST",
      body: payload
    });

    return {
      ...result,
      source: "remote"
    };
  },

  async fetchSchema(config) {
    return requestJson(config, "/schema");
  },

  async loginAdmin(config, passcode) {
    return requestJson(config, "/admin/login", {
      method: "POST",
      body: { passcode }
    });
  },

  async saveSchema(config, schema, uiConfig, adminToken) {
    const result = await requestJson(config, "/schema", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`
      },
      body: { schema, uiConfig }
    });

    return {
      ...result,
      source: "remote"
    };
  },

  async fetchResponses(config, adminToken) {
    return requestJson(config, "/responses", {
      headers: {
        Authorization: `Bearer ${adminToken}`
      }
    });
  },

  async resetAllData(config, adminToken) {
    const result = await requestJson(config, "/admin/reset-all-data", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`
      }
    });

    return {
      ...result,
      source: "remote"
    };
  }
};
