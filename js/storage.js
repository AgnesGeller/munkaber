(function () {
  const KEY = "diszkertek-munkaber-v1";
  window.PayrollStorage = {
    load() { try { return JSON.parse(localStorage.getItem(KEY)); } catch (_) { return null; } },
    save(data) { localStorage.setItem(KEY, JSON.stringify(data)); },
    key: KEY
  };
}());
