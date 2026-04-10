import React, { createRef } from 'react';
import { createRoot } from 'react-dom/client';
import DOMPurify from 'dompurify';
import { MarketPanel } from '@nearai/market-react';
import css from '@nearai/market-react/styles.css?inline';

// Inject CSS into <head> on load.
const style = document.createElement('style');
style.textContent = css;
document.head.appendChild(style);

let root = null;
let panelRef = createRef();
let currentConfig = {};

// Wrap a plain-JS renderResult function (returns HTML string) into a React component.
// If the function already returns JSX (React element), pass it through.
function wrapRenderer(fn) {
  if (!fn) return undefined;
  return (result, status) => {
    const output = fn(result, status);
    // If it's a React element, return as-is.
    if (output && typeof output === 'object' && output.$$typeof) return output;
    // If it's a string, render as HTML.
    if (typeof output === 'string') {
      return <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(output) }} />;
    }
    return null;
  };
}

function EmbedWrapper({ config }) {
  return (
    <MarketPanel
      ref={panelRef}
      apiBase={config.apiBase || '/api/nearai'}
      title={config.title || 'Agent Marketplace'}
      icon={config.icon || '🤖'}
      renderResult={wrapRenderer(config.renderResult)}
      renderMessage={config.renderMessage || undefined}
      placeholder={config.placeholder || undefined}
      onClose={config.onClose || undefined}
    />
  );
}

const NearMarket = {
  /**
   * Initialize the widget. Mounts into the target element.
   *
   * @param {Object} config
   * @param {string} config.el — CSS selector or DOM element to mount into
   * @param {string} config.apiBase — middleware URL (default: "/api/nearai")
   * @param {string} [config.title] — panel header title
   * @param {string} [config.icon] — panel header icon
   * @param {string} [config.placeholder] — input placeholder
   * @param {Function} [config.renderResult] — custom result renderer (receives result, status)
   * @param {Function} [config.renderMessage] — custom message renderer
   * @param {Function} [config.onClose] — close button handler
   * @param {string} [config.jobId] — auto-load a job on init
   */
  init(config = {}) {
    const container = typeof config.el === 'string'
      ? document.querySelector(config.el)
      : config.el;

    if (!container) {
      console.error('[NearMarket] Element not found:', config.el);
      return;
    }

    currentConfig = config;
    panelRef = createRef();
    root = createRoot(container);
    root.render(<EmbedWrapper config={config} />);

    // If a jobId was passed, load it after mount.
    if (config.jobId) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          NearMarket.loadJob(config.jobId);
        });
      });
    }
  },

  /**
   * Create a new job and show it in the widget.
   *
   * @param {Object} opts
   * @param {string} opts.title
   * @param {string} opts.description
   * @param {Object} opts.budget — { amount: string, token: string }
   * @param {string} [opts.serviceId]
   * @param {string} [opts.category]
   * @param {string[]} [opts.tags]
   * @param {number} [opts.deadlineSeconds]
   * @returns {Promise<string>} jobId
   */
  async submit(opts) {
    const waitForRef = (attempts = 0) => new Promise((resolve, reject) => {
      if (panelRef.current) return resolve();
      if (attempts >= 50) return reject(new Error('[NearMarket] Widget did not mount in time.'));
      setTimeout(() => waitForRef(attempts + 1).then(resolve, reject), 50);
    });
    await waitForRef();
    return panelRef.current.submit(opts);
  },

  /**
   * Load an existing job into the widget.
   * Waits for React to mount if called immediately after init().
   *
   * @param {string} jobId
   */
  loadJob(jobId) {
    const tryLoad = (attempts = 0) => {
      if (panelRef.current) {
        panelRef.current.loadJob(jobId);
      } else if (attempts < 50) {
        setTimeout(() => tryLoad(attempts + 1), 50);
      } else {
        console.error('[NearMarket] Widget did not mount in time.');
      }
    };
    tryLoad();
  },

  /**
   * Destroy the widget and clean up.
   */
  destroy() {
    if (root) {
      root.unmount();
      root = null;
    }
    panelRef = createRef();
  },
};

// Expose globally.
window.NearMarket = NearMarket;

export default NearMarket;
