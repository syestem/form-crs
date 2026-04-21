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
      const error = new Error(data.error || `Request failed: ${response.status}`);
      error.status = response.status;
      error.payload = data;
      throw error;
    }
    return data;
  });
}

function getFormSlug(config) {
  const slug = config?.form?.slug;
  return typeof slug === "string" ? slug.trim() : "";
}

window.FormApi = {
  async listForms(config, adminToken) {
    return requestJson(config, "/admin/forms", {
      headers: {
        Authorization: `Bearer ${adminToken}`
      }
    });
  },

  async createForm(config, payload, adminToken) {
    return requestJson(config, "/admin/forms", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`
      },
      body: payload
    });
  },

  async updateForm(config, formId, payload, adminToken) {
    return requestJson(config, `/admin/forms/${encodeURIComponent(formId)}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${adminToken}`
      },
      body: payload
    });
  },

  async deleteForm(config, formId, adminToken) {
    return requestJson(config, `/admin/forms/${encodeURIComponent(formId)}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${adminToken}`
      }
    });
  },

  async fetchStats(config) {
    const slug = getFormSlug(config);
    if (slug) {
      return requestJson(config, `/public/forms/${encodeURIComponent(slug)}/stats`);
    }
    return requestJson(config, "/stats");
  },

  async submit(config, payload) {
    const slug = getFormSlug(config);
    const result = await requestJson(config, slug ? `/public/forms/${encodeURIComponent(slug)}/submissions` : "/submissions/upsert", {
      method: "POST",
      body: payload
    });

    return {
      ...result,
      source: "remote"
    };
  },

  async fetchSchema(config) {
    const slug = getFormSlug(config);
    if (slug) {
      const result = await requestJson(config, `/public/forms/${encodeURIComponent(slug)}`);
      return result.form
        ? {
            ok: true,
            title: result.form.title || "",
            slug: result.form.slug || slug,
            schema: result.form.schema || [],
            uiConfig: result.form.uiConfig || {}
          }
        : result;
    }
    return requestJson(config, "/schema");
  },

  async loginAdmin(config, passcode) {
    return requestJson(config, "/admin/login", {
      method: "POST",
      body: { passcode }
    });
  },

  async saveSchema(config, schema, uiConfig, adminToken, formMeta = null) {
    const slug = getFormSlug(config);
    const result = await requestJson(config, slug ? `/admin/forms/by-slug/${encodeURIComponent(slug)}` : "/schema", {
      method: slug ? "PATCH" : "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`
      },
      body: slug ? { schema, uiConfig, ...(formMeta || {}) } : { schema, uiConfig }
    });

    return {
      ...result,
      source: "remote"
    };
  },

  async fetchResponses(config, adminToken) {
    const slug = getFormSlug(config);
    return requestJson(config, slug ? `/admin/forms/by-slug/${encodeURIComponent(slug)}/responses` : "/responses", {
      headers: {
        Authorization: `Bearer ${adminToken}`
      }
    });
  },

  async deleteResponse(config, submissionKey, adminToken) {
    const slug = getFormSlug(config);
    return requestJson(config, slug ? `/admin/forms/by-slug/${encodeURIComponent(slug)}/submissions/${encodeURIComponent(submissionKey)}` : `/responses/${encodeURIComponent(submissionKey)}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${adminToken}`
      }
    });
  },

  async listMembers(config, adminToken) {
    const slug = getFormSlug(config);
    return requestJson(config, `/admin/forms/by-slug/${encodeURIComponent(slug)}/members`, {
      headers: {
        Authorization: `Bearer ${adminToken}`
      }
    });
  },

  async addMember(config, payload, adminToken) {
    const slug = getFormSlug(config);
    return requestJson(config, `/admin/forms/by-slug/${encodeURIComponent(slug)}/members`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`
      },
      body: payload
    });
  },

  async updateMember(config, userId, payload, adminToken) {
    const slug = getFormSlug(config);
    return requestJson(config, `/admin/forms/by-slug/${encodeURIComponent(slug)}/members/${encodeURIComponent(userId)}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${adminToken}`
      },
      body: payload
    });
  },

  async removeMember(config, userId, adminToken) {
    const slug = getFormSlug(config);
    return requestJson(config, `/admin/forms/by-slug/${encodeURIComponent(slug)}/members/${encodeURIComponent(userId)}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${adminToken}`
      }
    });
  },

  async resetAllData(config, adminToken) {
    const slug = getFormSlug(config);
    const result = await requestJson(config, slug ? `/admin/forms/by-slug/${encodeURIComponent(slug)}/reset-submissions` : "/admin/reset-all-data", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`
      },
      body: {}
    });

    return {
      ...result,
      source: "remote"
    };
  }
};
