/**
 * Ivy Network PLC — shared forms client
 * Posts JSON to Cloudflare Worker API. Does not change page design.
 *
 * Usage:
 *   IvyForms.submit('contact', payload)
 *   IvyForms.bindForm(formElement, { type: 'contact', onSuccess, onError })
 *
 * Set window.IVY_FORMS_API before this script if the Worker URL differs.
 */
(function (global) {
  'use strict';

  var DEFAULT_API = 'https://ivy-forms-api.ivynetworkplc.workers.dev';
  // After custom domain routing, prefer:
  // var DEFAULT_API = 'https://ivynetwork.co.uk';

  function apiBase() {
    return (global.IVY_FORMS_API || DEFAULT_API).replace(/\/$/, '');
  }

  function submit(formType, payload) {
    var url = apiBase() + '/api/' + encodeURIComponent(formType);
    var body = Object.assign({}, payload, {
      source_page: payload.source_page || global.location.href,
    });

    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
      credentials: 'omit',
      mode: 'cors',
    }).then(function (res) {
      return res.json().then(function (data) {
        data._httpStatus = res.status;
        if (!res.ok || !data.success) {
          var err = new Error(data.message || 'Request failed');
          err.data = data;
          err.status = res.status;
          throw err;
        }
        return data;
      });
    });
  }

  function setLoading(btn, loading) {
    if (!btn) return;
    if (loading) {
      btn.dataset._label = btn.textContent;
      btn.disabled = true;
      btn.setAttribute('aria-busy', 'true');
      btn.textContent = btn.dataset.loadingText || 'Sending…';
    } else {
      btn.disabled = false;
      btn.removeAttribute('aria-busy');
      if (btn.dataset._label) btn.textContent = btn.dataset._label;
    }
  }

  function bindForm(form, options) {
    options = options || {};
    var type = options.type || form.getAttribute('data-form-type') || 'contact';
    var successEl = options.successEl || form.querySelector('[data-form-success]') || document.getElementById('formSuccess');
    var errorEl = options.errorEl || form.querySelector('[data-form-error]');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var submitBtn = form.querySelector('[type="submit"]');
      setLoading(submitBtn, true);
      if (successEl) successEl.classList.remove('show');
      if (errorEl) {
        errorEl.classList.remove('show');
        errorEl.textContent = '';
      }

      var fd = new FormData(form);
      var payload = {};
      fd.forEach(function (value, key) {
        payload[key] = typeof value === 'string' ? value.trim() : value;
      });

      // Normalise common field names
      if (payload.fullName && !payload.full_name) payload.full_name = payload.fullName;
      if (payload.privacy) payload.privacy_accepted = true;

      // Honeypot must stay empty
      if (!payload.website_url) payload.website_url = '';

      submit(type, payload)
        .then(function (data) {
          if (successEl) {
            successEl.textContent = data.message || 'Submitted successfully.';
            successEl.classList.add('show');
            successEl.setAttribute('role', 'status');
          }
          form.reset();
          if (typeof options.onSuccess === 'function') options.onSuccess(data);
        })
        .catch(function (err) {
          var msg = (err.data && err.data.message) || err.message || 'Something went wrong. Please try again.';
          if (errorEl) {
            errorEl.textContent = msg;
            errorEl.classList.add('show');
          } else if (successEl) {
            successEl.textContent = msg;
            successEl.classList.add('show');
          } else {
            alert(msg);
          }
          if (typeof options.onError === 'function') options.onError(err);
        })
        .finally(function () {
          setLoading(submitBtn, false);
        });
    });
  }

  global.IvyForms = {
    submit: submit,
    bindForm: bindForm,
    apiBase: apiBase,
  };
})(typeof window !== 'undefined' ? window : this);
