(function () {
  'use strict';

  const DOB_INPUT_SELECTOR = '[data-phase12a63-dob], input[name="dob"], input[name="DOB"], input[data-field="dob"], input[data-field="DOB"]';

  function isClientPortal() {
    return /client-portal|client-login/i.test(window.location.pathname || '');
  }

  function pad2(value) {
    return String(value).padStart(2, '0');
  }

  function validDateParts(month, day, year) {
    const m = Number(month);
    const d = Number(day);
    const y = Number(year);
    if (!Number.isInteger(m) || !Number.isInteger(d) || !Number.isInteger(y)) return false;
    if (y < 1900 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return false;
    const check = new Date(Date.UTC(y, m - 1, d));
    return check.getUTCFullYear() === y && check.getUTCMonth() === m - 1 && check.getUTCDate() === d;
  }

  function formatDob(value) {
    const raw = String(value == null ? '' : value).trim();
    if (!raw) return '';

    let match = raw.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:[T\s].*)?$/);
    if (match && validDateParts(match[2], match[3], match[1])) {
      return `${pad2(match[2])}/${pad2(match[3])}/${match[1]}`;
    }

    match = raw.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
    if (match && validDateParts(match[1], match[2], match[3])) {
      return `${pad2(match[1])}/${pad2(match[2])}/${match[3]}`;
    }

    const digits = raw.replace(/\D/g, '');
    if (digits.length === 8) {
      const firstFour = Number(digits.slice(0, 4));
      if (firstFour >= 1900 && firstFour <= 2100) {
        const year = digits.slice(0, 4);
        const month = digits.slice(4, 6);
        const day = digits.slice(6, 8);
        if (validDateParts(month, day, year)) return `${month}/${day}/${year}`;
      }

      const month = digits.slice(0, 2);
      const day = digits.slice(2, 4);
      const year = digits.slice(4, 8);
      if (validDateParts(month, day, year)) return `${month}/${day}/${year}`;
    }

    return raw;
  }

  function formatInput(input) {
    if (!input || input.dataset.phase12a148DobBound === '1') return;
    input.dataset.phase12a148DobBound = '1';
    input.placeholder = 'MM/DD/YYYY';
    input.setAttribute('inputmode', 'numeric');
    input.autocomplete = 'bday';

    const apply = function () {
      const next = formatDob(input.value);
      if (next !== input.value) {
        input.value = next;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    };

    input.addEventListener('blur', apply);
    input.addEventListener('change', function () {
      const next = formatDob(input.value);
      if (next !== input.value) input.value = next;
    });

    const initial = formatDob(input.value);
    if (initial !== input.value) input.value = initial;
  }

  function normalizedHeaderText(cell) {
    return String(cell && cell.textContent ? cell.textContent : '')
      .replace(/[↕↑↓▲▼]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  function formatDobColumns() {
    document.querySelectorAll('table').forEach(function (table) {
      const headers = Array.from(table.querySelectorAll('thead th')).map(normalizedHeaderText);
      const dobIndexes = [];
      headers.forEach(function (header, index) {
        if (header === 'dob' || header === 'date of birth' || header.includes('date of birth')) dobIndexes.push(index);
      });
      if (!dobIndexes.length) return;

      table.querySelectorAll('tbody tr').forEach(function (row) {
        dobIndexes.forEach(function (index) {
          const cell = row.children[index];
          if (!cell) return;
          const input = cell.querySelector('input');
          if (input) {
            formatInput(input);
            return;
          }

          if (cell.dataset.phase12a148DobFormatted === '1') return;
          const current = String(cell.textContent || '').trim();
          const next = formatDob(current);
          if (current && next !== current) cell.textContent = next;
          cell.dataset.phase12a148DobFormatted = '1';
        });
      });
    });
  }

  function formatKnownInputs() {
    document.querySelectorAll(DOB_INPUT_SELECTOR).forEach(formatInput);
  }

  function formatBeforeSave(event) {
    const button = event.target && event.target.closest ? event.target.closest('button') : null;
    if (!button) return;
    const label = String(button.textContent || '').trim().toLowerCase();
    if (!label.includes('save dob') && !button.hasAttribute('data-phase12a63-save-dob')) return;

    const row = button.closest('tr');
    const input = row ? row.querySelector(DOB_INPUT_SELECTOR) : null;
    if (input) input.value = formatDob(input.value);
  }

  function applyAll() {
    if (isClientPortal()) return;
    formatKnownInputs();
    formatDobColumns();
  }

  function boot() {
    if (isClientPortal()) return;
    document.addEventListener('click', formatBeforeSave, true);
    applyAll();

    const observer = new MutationObserver(function () {
      window.clearTimeout(observer.__phase12a148Timer);
      observer.__phase12a148Timer = window.setTimeout(applyAll, 40);
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
