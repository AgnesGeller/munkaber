(function () {
  const KEY = "diszkertek-munkaber-v1";
  const CLOUD_LOADED = "diszkertek-munkaber-cloud-loaded-v1";
  const DIRTY = "diszkertek-munkaber-cloud-pending-v1";
  const config = window.MUNKABER_SUPABASE || {};
  let saveTimer;
  let lastCloudState = "";
  let refreshPromise;

  function setStatus(text, type = "") {
    const element = document.getElementById("syncStatus");
    if (!element) return;
    element.textContent = text;
    element.dataset.status = type;
  }

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)); }
    catch (_) { return null; }
  }

  function authStorageKey() { return `sb-${config.projectRef}-auth-token`; }
  function storedSession() {
    try { return JSON.parse(localStorage.getItem(authStorageKey())); }
    catch (_) { return null; }
  }
  function tokenExpiry(session) {
    if (session?.expires_at) return Number(session.expires_at);
    try { return JSON.parse(atob(session.access_token.split(".")[1])).exp || 0; }
    catch (_) { return 0; }
  }
  async function validSession() {
    const session = storedSession();
    if (!session?.access_token) return null;
    if (tokenExpiry(session) > Date.now() / 1000 + 60) return session;
    if (!session.refresh_token) return null;
    if (!refreshPromise) {
      refreshPromise = fetch(`${config.url}/auth/v1/token?grant_type=refresh_token`, {
        method: "POST",
        headers: { apikey: config.publishableKey, "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: session.refresh_token })
      }).then(async response => {
        if (!response.ok) throw new Error("A bejelentkezés frissítése sikertelen.");
        const renewed = await response.json();
        renewed.expires_at = Math.floor(Date.now() / 1000) + Number(renewed.expires_in || 3600);
        localStorage.setItem(authStorageKey(), JSON.stringify(renewed));
        return renewed;
      }).finally(() => { refreshPromise = null; });
    }
    return refreshPromise;
  }
  async function cloudRequest(path, options = {}) {
    const session = await validSession();
    if (!session) throw new Error("A felhőmentéshez előbb be kell jelentkezni a Kassza alkalmazásban.");
    const response = await fetch(`${config.url}/rest/v1/${path}`, {
      ...options,
      headers: { apikey: config.publishableKey, Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json", ...(options.headers || {}) }
    });
    if (!response.ok) throw new Error(`Felhőmentési hiba (${response.status}).`);
    return response.status === 204 ? null : response.json();
  }
  async function pushToCloud(data) {
    const serialized = JSON.stringify(data);
    if (serialized === lastCloudState) return;
    setStatus("Mentés…", "saving");
    const session = await validSession();
    await cloudRequest("munkaber_app_state?on_conflict=id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({ id: "main", data, updated_by: session.user.id })
    });
    lastCloudState = serialized;
    localStorage.removeItem(DIRTY);
    setStatus("Felhőbe mentve", "online");
  }
  function save(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
    localStorage.setItem(DIRTY, "1");
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => pushToCloud(data).catch(error => {
      console.warn(error.message);
      setStatus("Helyben mentve", "offline");
    }), 900);
  }
  async function startSync(onRemoteLoaded) {
    if (!config.url || !config.publishableKey || !storedSession()?.access_token) {
      setStatus("Helyi mentés", "offline");
      return;
    }
    setStatus("Szinkronizálás…", "saving");
    try {
      const rows = await cloudRequest("munkaber_app_state?id=eq.main&select=data,version,updated_at");
      const remote = rows?.[0]?.data;
      const local = load();
      if (local && localStorage.getItem(DIRTY)) {
        await pushToCloud(local);
        sessionStorage.setItem(CLOUD_LOADED, "1");
        return;
      }
      if (remote && !sessionStorage.getItem(CLOUD_LOADED)) {
        localStorage.setItem(KEY, JSON.stringify(remote));
        lastCloudState = JSON.stringify(remote);
        sessionStorage.setItem(CLOUD_LOADED, "1");
        setStatus("Felhőből betöltve", "online");
        onRemoteLoaded?.();
        return;
      }
      if (!remote && local) await pushToCloud(local);
      else {
        lastCloudState = remote ? JSON.stringify(remote) : "";
        setStatus("Felhőhöz kapcsolódva", "online");
      }
    } catch (error) {
      console.warn(error.message);
      setStatus("Helyi mentés", "offline");
    }
  }
  window.PayrollStorage = { load, save, startSync, key: KEY };
}());
