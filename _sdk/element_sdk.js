/* /_sdk/data_sdk.js
   Tiny data helpers: eventId/sessionToken + basic POST helper.
*/

(function () {
  function randomId(prefix) {
    var buf = new Uint8Array(16);
    crypto.getRandomValues(buf);
    var hex = Array.prototype.map.call(buf, function (b) {
      return b.toString(16).padStart(2, "0");
    }).join("");
    return prefix + "_" + hex;
  }

  function getParam(name) {
    try {
      return new URL(location.href).searchParams.get(name);
    } catch (_) {
      return null;
    }
  }

  function getOrCreate(key, prefix) {
    var v = localStorage.getItem(key);
    if (v) return v;
    v = randomId(prefix);
    localStorage.setItem(key, v);
    return v;
  }

  function getSessionToken() {
    var qp = getParam("sessionToken");
    if (qp) {
      localStorage.setItem("tm_sessionToken", qp);
      return qp;
    }
    return getOrCreate("tm_sessionToken", "sess");
  }

  function getEventId() {
    return randomId("evt");
  }

  async function postJson(url, payload) {
    var res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload || {})
    });

    var text = await res.text();
    var data;
    try { data = text ? JSON.parse(text) : null; } catch (_) { data = text; }

    if (!res.ok) {
      var msg = (data && data.error) ? data.error : ("Request failed: " + res.status);
      throw new Error(msg);
    }

    return data;
  }

  window.tmData = Object.freeze({
    getEventId: getEventId,
    getSessionToken: getSessionToken,
    postJson: postJson
  });
})();