/*
Copyright 2026 Jacopo Enrico Marinaccio
Licensed under the Apache License, Version 2.0
You may obtain a copy at: http://www.apache.org/licenses/LICENSE-2.0
*/
import { logger } from '../utils/logger.js';
/**
 * @module api/api.client
 * @description Small wrapper around Playwright `request` to normalize responses
 * and provide convenience methods for common HTTP verbs and authentication.
 */

/**
 * @typedef {Object} ApiResponse
 * @property {number} status
 * @property {boolean} ok
 * @property {any} json
 * @property {any} headers
 */

/**
 * @class ApiClient
 */
export class ApiClient {
  /**
   * @param {import('@playwright/test').APIRequestContext} request - Playwright request context
   * @param {string} [baseURL]
   */
  constructor(request, baseURL = '') {
    this.request = request;
    this.baseURL = (baseURL || '').replace(/\/$/, '');
    this.token = null;
    this._authHeader = null;
  }

  /**
   * Build an absolute URL using the client's baseURL. If `path` is already an
   * absolute URL it is returned as-is.
   * @private
   * @param {string} path
   * @returns {string}
   */
  _url(path) {
    if (!path) return this.baseURL || '/';
    const p = String(path);
    // If an absolute URL is provided (http/https), return it as-is
    if (/^https?:\/\//i.test(p)) return p;
    return p.startsWith('/') ? `${this.baseURL}${p}` : `${this.baseURL}/${p}`;
  }

  /**
   * Perform a raw HTTP request using the underlying Playwright request context
   * and normalize the returned shape.
   * @param {string} method
   * @param {string} path
   * @param {{body?: any, headers?: Object}} [opts]
   * @returns {Promise<ApiResponse>}
   */
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
    logger.info('Request: GET ' + this._url(path) + ' with options: ' + JSON.stringify(opts, null, 2));
    return this.rawRequest('GET', path, opts);
  }

  async post(path, body, opts = {}) {
    logger.info('Request: POST ' + this._url(path) + ' with options: ' + JSON.stringify({ ...opts, body }, null, 2));
    return this.rawRequest('POST', path, { ...opts, body });
  }

  async put(path, body, opts = {}) {
    logger.info('Request: PUT ' + this._url(path) + ' with options: ' + JSON.stringify({ ...opts, body }, null, 2));
    return this.rawRequest('PUT', path, { ...opts, body });
  }

  async patch(path, body, opts = {}) {
    logger.info('Request: PATCH ' + this._url(path) + ' with options: ' + JSON.stringify({ ...opts, body }, null, 2));
    return this.rawRequest('PATCH', path, { ...opts, body });
  }

  async delete(path, opts = {}) {
    logger.info('Request: DELETE ' + this._url(path) + ' with options: ' + JSON.stringify(opts, null, 2));
    return this.rawRequest('DELETE', path, opts);
  }

  /**
   * Authenticate against an endpoint that returns a token in the JSON body.
   * Stores `Authorization: Bearer <token>` for subsequent requests.
   * @param {string} path
   * @param {Object} [credentials]
   * @param {string} [tokenField]
   * @returns {Promise<ApiResponse>}
   */
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
