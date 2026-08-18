/*
Copyright 2026 Jacopo Enrico Marinaccio
Licensed under the Apache License, Version 2.0
You may obtain a copy at: http://www.apache.org/licenses/LICENSE-2.0
*/
export class ApiClient {
  constructor(request, baseURL = '') {
    this.request = request;
    this.baseURL = (baseURL || '').replace(/\/$/, '');
    this.token = null;
    this._authHeader = null;
  }

  _url(path) {
    if (!path) return this.baseURL || '/';
    const p = String(path);
    // If an absolute URL is provided (http/https), return it as-is
    if (/^https?:\/\//i.test(p)) return p;
    return p.startsWith('/') ? `${this.baseURL}${p}` : `${this.baseURL}/${p}`;
  }

  async rawRequest(method, path, { body = null, headers = {} } = {}) {
    const opts = { headers: { ...headers } };
    if (body !== null && body !== undefined) opts.data = body;
    const m = method.toLowerCase();
    if (typeof this.request[m] !== 'function') {
      throw new Error(`Unsupported request method: ${method}`);
    }
    const res = await this.request[m](this._url(path), opts);
    const status = res.status();
    let json = null;
    try {
      json = await res.json();
    } catch (e) {
      // ignore non-JSON
    }
    return { status, ok: res.ok(), json, headers: res.headers() };
  }

  async get(path, opts = {}) {
    return this.rawRequest('GET', path, opts);
  }

  async post(path, body, opts = {}) {
    return this.rawRequest('POST', path, { ...opts, body });
  }

  async put(path, body, opts = {}) {
    return this.rawRequest('PUT', path, { ...opts, body });
  }

  async patch(path, body, opts = {}) {
    return this.rawRequest('PATCH', path, { ...opts, body });
  }

  async delete(path, opts = {}) {
    return this.rawRequest('DELETE', path, opts);
  }

  async authenticate(path, credentials = {}, tokenField = 'token') {
    const res = await this.post(path, credentials);
    if (res.ok && res.json && res.json[tokenField]) {
      this.token = res.json[tokenField];
      this._authHeader = { Authorization: `Bearer ${this.token}` };
    }
    return res;
  }

  async getAuthed(path, opts = {}) {
    const headers = { ...(opts.headers || {}), ...(this._authHeader || {}) };
    return this.get(path, { ...opts, headers });
  }
}

export default ApiClient;
