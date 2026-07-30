/**
 * Binds #contactForm on contact.html to Ivy Forms API.
 * Keeps existing validation UI; replaces mailto with fetch.
 */
(function () {
  'use strict';

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    var form = document.getElementById('contactForm');
    if (!form || !window.IvyForms) return;

    // Ensure honeypot exists (no visual change)
    if (!form.querySelector('[name="website_url"]')) {
      var hp = document.createElement('div');
      hp.setAttribute('aria-hidden', 'true');
      hp.style.cssText = 'position:absolute;left:-9999px;height:0;overflow:hidden;opacity:0;';
      hp.innerHTML =
        '<label>Website<input type="text" name="website_url" tabindex="-1" autocomplete="off"></label>';
      form.appendChild(hp);
    }

    // Error region
    var successEl = document.getElementById('formSuccess');
    var errorEl = document.getElementById('formError');
    if (!errorEl && successEl) {
      errorEl = document.createElement('div');
      errorEl.id = 'formError';
      errorEl.setAttribute('role', 'alert');
      errorEl.style.cssText =
        'display:none;background:rgba(220,38,38,0.1);border:1px solid rgba(220,38,38,0.3);border-radius:12px;padding:16px 20px;color:#DC2626;font-size:0.95rem;font-weight:500;margin-bottom:8px;';
      successEl.parentNode.insertBefore(errorEl, successEl.nextSibling);
    }

    function showErrorField(id, show) {
      var input = document.getElementById(id);
      var err = document.getElementById('err-' + id);
      if (input) input.classList.toggle('error', show);
      if (err) err.classList.toggle('show', show);
    }

    function isValidEmail(v) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    }

    // Clone form to drop previous mailto submit listener from inline script
    var clone = form.cloneNode(true);
    form.parentNode.replaceChild(clone, form);
    form = clone;

    // Re-query after clone
    successEl = document.getElementById('formSuccess');
    errorEl = document.getElementById('formError');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      e.stopImmediatePropagation();

      var valid = true;
      var fullName = (document.getElementById('fullName') || {}).value || '';
      fullName = fullName.trim();
      var email = ((document.getElementById('email') || {}).value || '').trim();
      var department = (document.getElementById('department') || {}).value || '';
      var subject = ((document.getElementById('subject') || {}).value || '').trim();
      var message = ((document.getElementById('message') || {}).value || '').trim();
      var privacy = (document.getElementById('privacy') || {}).checked;

      showErrorField('fullName', !fullName);
      if (!fullName) valid = false;
      showErrorField('email', !email || !isValidEmail(email));
      if (!email || !isValidEmail(email)) valid = false;
      showErrorField('department', !department);
      if (!department) valid = false;
      showErrorField('subject', !subject);
      if (!subject) valid = false;
      showErrorField('message', !message);
      if (!message) valid = false;

      var privacyErr = document.getElementById('err-privacy');
      if (privacyErr) {
        if (!privacy) {
          privacyErr.classList.add('show');
          valid = false;
        } else privacyErr.classList.remove('show');
      }

      if (!valid) return;

      if (successEl) {
        successEl.classList.remove('show');
        successEl.textContent = '';
      }
      if (errorEl) {
        errorEl.style.display = 'none';
        errorEl.textContent = '';
      }

      var btn = form.querySelector('[type="submit"]');
      var prev = btn ? btn.textContent : '';
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Sending…';
        btn.setAttribute('aria-busy', 'true');
      }

      var payload = {
        full_name: fullName,
        email: email,
        phone: ((document.getElementById('phone') || {}).value || '').trim(),
        company: ((document.getElementById('company') || {}).value || '').trim(),
        country: ((document.getElementById('country') || {}).value || '').trim(),
        department: department,
        subject: subject,
        message: message,
        privacy_accepted: !!privacy,
        website_url: ((form.querySelector('[name="website_url"]') || {}).value || '').trim(),
        source_page: location.href,
      };

      IvyForms.submit('contact', payload)
        .then(function (data) {
          if (successEl) {
            successEl.textContent =
              data.message ||
              'Your message has been received. Our team will respond as soon as possible.';
            successEl.classList.add('show');
          }
          form.reset();
        })
        .catch(function (err) {
          var msg =
            (err.data && err.data.message) ||
            err.message ||
            'Unable to send. Please email team@ivynetwork.co.uk or try again.';
          if (errorEl) {
            errorEl.textContent = msg;
            errorEl.style.display = 'block';
          } else if (successEl) {
            successEl.textContent = msg;
            successEl.classList.add('show');
          }
        })
        .finally(function () {
          if (btn) {
            btn.disabled = false;
            btn.textContent = prev || 'Send Message';
            btn.removeAttribute('aria-busy');
          }
        });
    });

    var clearBtn = document.getElementById('clearForm');
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        if (successEl) successEl.classList.remove('show');
        if (errorEl) {
          errorEl.style.display = 'none';
          errorEl.textContent = '';
        }
        ['fullName', 'email', 'department', 'subject', 'message'].forEach(function (id) {
          showErrorField(id, false);
        });
        var pe = document.getElementById('err-privacy');
        if (pe) pe.classList.remove('show');
      });
    }
  });
})();
