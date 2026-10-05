/* Fácil — client-side tools. Everything runs locally in the browser. */
(function () {
  "use strict";

  /* ------------------------------------------------------------------ *
   * Theme
   * ------------------------------------------------------------------ */
  function initTheme() {
    var root = document.documentElement;
    var stored = null;
    try { stored = localStorage.getItem("facil-theme"); } catch (e) {}
    var mq = window.matchMedia("(prefers-color-scheme: dark)");
    var theme = stored || (mq.matches ? "dark" : "light");
    root.setAttribute("data-theme", theme);

    var btn = document.getElementById("themeToggle");
    if (btn) {
      btn.addEventListener("click", function () {
        var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
        root.setAttribute("data-theme", next);
        try { localStorage.setItem("facil-theme", next); } catch (e) {}
      });
    }
    mq.addEventListener && mq.addEventListener("change", function (e) {
      var s = null;
      try { s = localStorage.getItem("facil-theme"); } catch (er) {}
      if (!s) root.setAttribute("data-theme", e.matches ? "dark" : "light");
    });
  }

  /* ------------------------------------------------------------------ *
   * Small helpers
   * ------------------------------------------------------------------ */
  function formatBytes(bytes) {
    if (bytes === 0 || bytes == null) return "0 B";
    var k = 1024, units = ["B", "KB", "MB", "GB", "TB"];
    var i = Math.floor(Math.log(bytes) / Math.log(k));
    i = Math.min(i, units.length - 1);
    var v = bytes / Math.pow(k, i);
    return (i === 0 ? v : v.toFixed(v >= 100 ? 0 : v >= 10 ? 1 : 2)) + " " + units[i];
  }

  function formatDuration(sec) {
    if (!isFinite(sec) || sec <= 0) return "—";
    sec = Math.round(sec);
    var m = Math.floor(sec / 60), s = sec % 60;
    return (m < 10 ? "0" + m : m) + ":" + (s < 10 ? "0" + s : s);
  }

  function sanitizeFilename(name) {
    if (!name) return "file";
    var base = String(name).split(/[\\/]/).pop();
    base = base.replace(/[\u0000-\u001f<>:"/\\|?*]+/g, "_").trim();
    if (base.length > 120) base = base.slice(0, 120);
    return base || "file";
  }

  function baseName(name) {
    var n = sanitizeFilename(name);
    return n.replace(/\.[^.]+$/, "");
  }

  function extForMime(mime) {
    var map = {
      "video/mp4": "mp4", "video/webm": "webm", "video/quicktime": "mov",
      "video/x-m4v": "m4v", "image/jpeg": "jpg", "image/png": "png",
      "image/webp": "webp", "image/gif": "gif"
    };
    return map[mime] || (mime && mime.split("/")[1]) || "bin";
  }

  function createTextBlob(text, maxChars) {
    var source = String(text || "");
    var limit = Number(maxChars) || (12 * 1024 * 1024);
    if (!source) return new Blob([], { type: "text/plain;charset=utf-8" });
    if (source.length > limit) throw new Error("too-large");
    var parts = [];
    var chunkSize = 256 * 1024;
    for (var i = 0; i < source.length; i += chunkSize) {
      parts.push(source.slice(i, i + chunkSize));
    }
    return new Blob(parts, { type: "text/plain;charset=utf-8" });
  }

  function downloadBlob(blob, filename) {
    if (!blob) return;
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = sanitizeFilename(filename);
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      a.remove();
      URL.revokeObjectURL(url);
    }, 1000);
  }

  function showMsg(el, text, kind) {
    if (!el) return;
    el.textContent = text;
    el.className = "msg" + (kind ? " " + kind : "");
    el.hidden = false;
  }
  function hideMsg(el) { if (el) el.hidden = true; }

  function setProgress(wrap, bar, text, pct) {
    if (wrap) {
      wrap.hidden = false;
      var s = wrap.querySelector(".progress-status");
      if (s && text != null) s.textContent = text;
    }
    if (bar) bar.style.width = Math.max(0, Math.min(100, pct)) + "%";
  }
  function hideProgress(wrap) { if (wrap) wrap.hidden = true; }

  function toBlobPromise(canvas, type, quality) {
    return new Promise(function (resolve, reject) {
      try {
        canvas.toBlob(function (b) {
          if (b) resolve(b); else reject(new Error("encode-failed"));
        }, type, quality);
      } catch (e) { reject(e); }
    });
  }

  function copyText(text, btn) {
    var value = String(text || "");
    if (!value) return;
    if (value.length > 6 * 1024 * 1024) {
      if (btn) {
        var old = btn.textContent;
        btn.textContent = "Too large";
        setTimeout(function () { btn.textContent = old; }, 1800);
      }
      return;
    }

    function done() {
      if (!btn) return;
      var old = btn.textContent;
      btn.textContent = "Copied";
      setTimeout(function () { btn.textContent = old; }, 1500);
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(value).then(done).catch(function () {
        try {
          var ta = document.createElement("textarea");
          ta.value = value;
          ta.setAttribute("readonly", "");
          ta.style.position = "fixed";
          ta.style.opacity = "0";
          ta.style.left = "-9999px";
          document.body.appendChild(ta);
          ta.focus();
          ta.select();
          document.execCommand("copy");
          ta.remove();
          done();
        } catch (e) {
          if (btn) {
            var prev = btn.textContent;
            btn.textContent = "Copy failed";
            setTimeout(function () { btn.textContent = prev; }, 1800);
          }
        }
      });
      return;
    }

    try {
      var ta = document.createElement("textarea");
      ta.value = value;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand("copy");
      ta.remove();
      done();
    } catch (e) {
      if (btn) {
        var prev = btn.textContent;
        btn.textContent = "Copy failed";
        setTimeout(function () { btn.textContent = prev; }, 1800);
      }
    }
  }

  function readFileAsDataURL(file, onProgress) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () { resolve(reader.result); };
      reader.onerror = function () { reject(new Error("read-failed")); };
      if (onProgress) {
        reader.onprogress = function (e) {
          if (e.lengthComputable) onProgress(e.loaded / e.total);
        };
      }
      reader.readAsDataURL(file);
    });
  }

  function decodeBase64Input(raw, fallbackMime) {
    var text = (raw || "").trim();
    if (!text) throw new Error("empty");
    var mime = null, payload = text;
    var m = /^data:([^;,]+)?(;charset=[^;,]+)?;base64,(.*)$/is.exec(text);
    if (m) {
      mime = (m[1] || "").trim() || null;
      payload = m[3];
    } else if (/^data:/i.test(text)) {
      throw new Error("not-base64");
    }
    payload = payload.replace(/\s+/g, "");
    if (!payload) throw new Error("empty");
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(payload)) throw new Error("invalid");
    var bin;
    try { bin = atob(payload); } catch (e) { throw new Error("invalid"); }
    var len = bin.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
    if (!mime) mime = fallbackMime || null;
    return { bytes: bytes, mime: mime };
  }

  /* ------------------------------------------------------------------ *
   * Router (homepage tool views)
   * ------------------------------------------------------------------ */
  var TOOL_IDS = ["compress-video", "compress-image", "video-to-base64",
    "base64-to-video", "photo-to-base64", "base64-to-photo"];

  function initRouter() {
    var home = document.getElementById("homeView");
    if (!home) return;

    function route() {
      var h = (location.hash || "").replace(/^#/, "");
      var isTool = TOOL_IDS.indexOf(h) !== -1;
      home.hidden = isTool;
      TOOL_IDS.forEach(function (id) {
        var el = document.getElementById("tool-" + id);
        if (el) el.hidden = (id !== h);
      });
      if (isTool) window.scrollTo(0, 0);
    }

    Array.prototype.forEach.call(document.querySelectorAll(".tool-card"), function (card) {
      card.addEventListener("click", function () {
        location.hash = card.getAttribute("data-tool");
      });
    });

    window.addEventListener("hashchange", route);
    route();
  }

  /* ================================================================== *
   * IMAGE COMPRESSOR
   * ================================================================== */
  function initImageCompressor() {
    var file = document.getElementById("ic-file");
    if (!file) return;
    var info = document.getElementById("ic-info");
    var controls = document.getElementById("ic-controls");
    var errEl = document.getElementById("ic-error");
    var preview = document.getElementById("ic-preview");
    var quality = document.getElementById("ic-quality");
    var qVal = document.getElementById("ic-q-val");
    var fmtSel = document.getElementById("ic-format");
    var target = document.getElementById("ic-target");
    var runBtn = document.getElementById("ic-run");
    var result = document.getElementById("ic-result");
    var dlBtn = document.getElementById("ic-download");

    var state = { file: null, img: null, url: null, blob: null, name: "" };

    quality.addEventListener("input", function () { qVal.textContent = quality.value; });

    file.addEventListener("change", function () {
      hideMsg(errEl); result.hidden = true;
      var f = file.files && file.files[0];
      if (!f) return;
      if (!/^image\//.test(f.type)) {
        showMsg(errEl, "That doesn't look like an image file. Please choose a JPEG, PNG, or WebP image.", "error");
        return;
      }
      if (state.url) URL.revokeObjectURL(state.url);
      var url = URL.createObjectURL(f);
      var img = new Image();
      img.onload = function () {
        state.file = f; state.img = img; state.url = url; state.name = f.name;
        document.getElementById("ic-name").textContent = sanitizeFilename(f.name);
        document.getElementById("ic-size").textContent = formatBytes(f.size);
        document.getElementById("ic-dims").textContent = img.naturalWidth + " × " + img.naturalHeight;
        document.getElementById("ic-fmt").textContent = f.type || "unknown";
        preview.innerHTML = "";
        var p = document.createElement("img");
        p.src = url; p.alt = "Selected image preview";
        preview.appendChild(p);
        info.hidden = false; controls.hidden = false;
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        showMsg(errEl, "This image couldn't be read. It may be corrupted or in an unsupported format.", "error");
      };
      img.src = url;
    });

    async function encodeAtScale(scale, type, q) {
      var w = Math.max(1, Math.round(state.img.naturalWidth * scale));
      var h = Math.max(1, Math.round(state.img.naturalHeight * scale));
      var canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      var ctx = canvas.getContext("2d");
      if (type === "image/jpeg") { ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, w, h); }
      ctx.drawImage(state.img, 0, 0, w, h);
      return toBlobPromise(canvas, type, q);
    }

    runBtn.addEventListener("click", async function () {
      if (!state.img) return;
      hideMsg(errEl);
      runBtn.disabled = true;
      runBtn.textContent = "Compressing…";
      result.hidden = true;
      try {
        var type = fmtSel.value;
        var q = Math.min(0.98, Math.max(0.05, parseInt(quality.value, 10) / 100));
        var targetKB = target.value ? parseFloat(target.value) : null;
        var blob;

        if (type === "image/png" || !targetKB || !(targetKB > 0)) {
          blob = await encodeAtScale(1, type, q);
        } else {
          var targetBytes = targetKB * 1024;
          blob = null;
          var scales = [1, 0.85, 0.7, 0.55, 0.42, 0.32];
          for (var s = 0; s < scales.length && !blob; s++) {
            var lo = 0.05, hi = 0.98, best = null;
            for (var i = 0; i < 8; i++) {
              var mid = (lo + hi) / 2;
              var b = await encodeAtScale(scales[s], type, mid);
              if (b.size <= targetBytes) { best = b; lo = mid + 0.02; }
              else { hi = mid - 0.02; }
              if (hi < lo) break;
            }
            if (best) blob = best;
          }
          if (!blob) blob = await encodeAtScale(0.32, type, 0.4);
        }

        state.blob = blob;
        var orig = state.file.size, neu = blob.size;
        var saved = Math.max(0, orig - neu);
        var pct = orig > 0 ? (saved / orig) * 100 : 0;
        document.getElementById("ic-r-orig").textContent = formatBytes(orig);
        document.getElementById("ic-r-new").textContent = formatBytes(neu);
        document.getElementById("ic-r-saved").textContent = formatBytes(saved);
        document.getElementById("ic-r-pct").textContent = pct.toFixed(1) + "%";
        result.hidden = false;
        if (neu >= orig) {
          showMsg(errEl, "The compressed file isn't smaller than the original at these settings. Try a lower quality or a different format.", "warn");
        }
      } catch (e) {
        showMsg(errEl, "Something went wrong while compressing this image. Please try another file or a smaller image.", "error");
      } finally {
        runBtn.disabled = false;
        runBtn.textContent = "Compress Image";
      }
    });

    dlBtn.addEventListener("click", function () {
      if (!state.blob) return;
      var ext = extForMime(fmtSel.value);
      downloadBlob(state.blob, "image-compressed." + ext);
    });
  }

  /* ================================================================== *
   * PHOTO TO BASE64
   * ================================================================== */
  function initPhotoToBase64() {
    var file = document.getElementById("pb-file");
    if (!file) return;
    var info = document.getElementById("pb-info");
    var preview = document.getElementById("pb-preview");
    var out = document.getElementById("pb-output");
    var count = document.getElementById("pb-count");
    var copyBtn = document.getElementById("pb-copy");
    var dlBtn = document.getElementById("pb-download");
    var warn = document.getElementById("pb-warn");
    var errEl = document.getElementById("pb-error");
    var runBtn = document.getElementById("pb-run");

    var state = { file: null, url: null, dataUrl: "" };

    file.addEventListener("change", function () {
      hideMsg(errEl); hideMsg(warn); info.hidden = true; runBtn.hidden = true;
      out.value = ""; count.textContent = ""; copyBtn.disabled = true; dlBtn.disabled = true;
      var f = file.files && file.files[0];
      if (!f) return;
      if (!/^image\//.test(f.type)) {
        showMsg(errEl, "Please choose an image file.", "error");
        return;
      }
      if (state.url) URL.revokeObjectURL(state.url);
      var url = URL.createObjectURL(f);
      state.file = f; state.url = url;
      var img = new Image();
      img.onload = function () {
        preview.innerHTML = "";
        var p = document.createElement("img");
        p.src = url; p.alt = "Selected image preview";
        preview.appendChild(p);
        document.getElementById("pb-name").textContent = sanitizeFilename(f.name);
        document.getElementById("pb-size").textContent = formatBytes(f.size);
        document.getElementById("pb-format").textContent = f.type || "unknown";
        info.hidden = false; runBtn.hidden = false;
        if (f.size > 5 * 1024 * 1024) showMsg(warn, "Very large images produce very long Base64 strings. This may use significant memory.", "warn");
      };
      img.onerror = function () { showMsg(errEl, "This image couldn't be read.", "error"); };
      img.src = url;
    });

    runBtn.addEventListener("click", async function () {
      if (!state.file) return;
      hideMsg(errEl); runBtn.disabled = true; runBtn.textContent = "Converting…";
      try {
        var dataUrl = await readFileAsDataURL(state.file);
        state.dataUrl = dataUrl;
        out.value = dataUrl;
        count.textContent = dataUrl.length.toLocaleString() + " characters";
        copyBtn.disabled = false; dlBtn.disabled = false;
      } catch (e) {
        showMsg(errEl, "Something went wrong while reading this image. Please try another file.", "error");
      } finally {
        runBtn.disabled = false; runBtn.textContent = "Convert to Base64";
      }
    });

    copyBtn.addEventListener("click", function () { copyText(out.value, copyBtn); });
    dlBtn.addEventListener("click", function () {
      if (!state.dataUrl) return;
      try {
        var blob = createTextBlob(state.dataUrl, 12 * 1024 * 1024);
        downloadBlob(blob, "image-base64.txt");
      } catch (e) {
        showMsg(errEl, "This Base64 output is too large to download safely in this browser. Please use a smaller image.", "warn");
      }
    });
  }

  /* ================================================================== *
   * BASE64 TO PHOTO
   * ================================================================== */
  function initBase64ToPhoto() {
    var input = document.getElementById("bp-input");
    if (!input) return;
    var mimeSel = document.getElementById("bp-mime");
    var runBtn = document.getElementById("bp-run");
    var errEl = document.getElementById("bp-error");
    var info = document.getElementById("bp-info");
    var preview = document.getElementById("bp-preview");
    var dlBtn = document.getElementById("bp-download");

    var state = { blob: null, url: null, mime: null };

    runBtn.addEventListener("click", function () {
      hideMsg(errEl); info.hidden = true; dlBtn.disabled = true;
      var fallback = mimeSel.value || null;
      var decoded;
      try {
        decoded = decodeBase64Input(input.value, fallback);
      } catch (e) {
        var msg = "This Base64 string couldn't be decoded. Please check that you pasted the full value.";
        if (e.message === "empty") msg = "The input is empty. Paste a Base64 Data URL or raw Base64 first.";
        else if (e.message === "not-base64") msg = "This looks like a data URL that isn't Base64-encoded, which isn't supported here.";
        else if (e.message === "invalid") msg = "This isn't valid Base64. Check for missing characters or extra text.";
        showMsg(errEl, msg, "error");
        return;
      }
      var mime = decoded.mime;
      if (!mime || !/^image\//.test(mime)) {
        if (!mime) mime = "image/png";
      }
      var blob = new Blob([decoded.bytes], { type: mime });
      if (state.url) URL.revokeObjectURL(state.url);
      var url = URL.createObjectURL(blob);
      state.blob = blob; state.url = url; state.mime = mime;

      preview.innerHTML = "";
      var img = document.createElement("img");
      img.alt = "Decoded image preview";
      img.onload = function () {
        preview.appendChild(img);
        document.getElementById("bp-name").textContent = "converted-image." + extForMime(mime);
        document.getElementById("bp-format").textContent = mime;
        document.getElementById("bp-size").textContent = formatBytes(blob.size);
        info.hidden = false; dlBtn.disabled = false;
      };
      img.onerror = function () {
        showMsg(errEl, "The data decoded, but it doesn't appear to be a valid image. The MIME type may be wrong.", "error");
      };
      img.src = url;
    });

    dlBtn.addEventListener("click", function () {
      if (!state.blob) return;
      downloadBlob(state.blob, "converted-image." + extForMime(state.mime || "image/png"));
    });
  }

  /* ================================================================== *
   * VIDEO TO BASE64
   * ================================================================== */
  function initVideoToBase64() {
    var file = document.getElementById("vb-file");
    if (!file) return;
    var info = document.getElementById("vb-info");
    var runBtn = document.getElementById("vb-run");
    var out = document.getElementById("vb-output");
    var count = document.getElementById("vb-count");
    var copyBtn = document.getElementById("vb-copy");
    var dlBtn = document.getElementById("vb-download");
    var warn = document.getElementById("vb-warn");
    var errEl = document.getElementById("vb-error");
    var progWrap = document.getElementById("vb-progress");
    var bar = document.getElementById("vb-bar");
    var status = document.getElementById("vb-status");

    var state = { file: null, dataUrl: "" };

    file.addEventListener("change", function () {
      hideMsg(errEl); hideMsg(warn); hideProgress(progWrap);
      info.hidden = true; runBtn.hidden = true;
      out.value = ""; count.textContent = ""; copyBtn.disabled = true; dlBtn.disabled = true;
      var f = file.files && file.files[0];
      if (!f) return;
      if (!/^video\//.test(f.type)) {
        showMsg(errEl, "Please choose a video file.", "error");
        return;
      }
      state.file = f;
      document.getElementById("vb-name").textContent = sanitizeFilename(f.name);
      document.getElementById("vb-size").textContent = formatBytes(f.size);
      document.getElementById("vb-format").textContent = f.type || "unknown";
      info.hidden = false; runBtn.hidden = false;
      if (f.size > 8 * 1024 * 1024) {
        showMsg(warn, "Large videos can produce extremely large Base64 strings (roughly 33% bigger than the file itself). This may use significant memory and the text may be slow to copy.", "warn");
      }
    });

    runBtn.addEventListener("click", async function () {
      if (!state.file) return;
      hideMsg(errEl);
      runBtn.disabled = true; runBtn.textContent = "Converting…";
      setProgress(progWrap, bar, "Reading file…", 0);
      try {
        var dataUrl = await readFileAsDataURL(state.file, function (p) {
          setProgress(progWrap, bar, "Reading file… " + Math.round(p * 100) + "%", p * 100);
        });
        state.dataUrl = dataUrl;
        out.value = dataUrl;
        count.textContent = dataUrl.length.toLocaleString() + " characters";

        if (dataUrl.length > 12 * 1024 * 1024) {
          showMsg(warn, "This Base64 output is extremely large. Copying/downloading may be unreliable in this browser. Please use a smaller video or a desktop browser for large files.", "warn");
          copyBtn.disabled = true;
          dlBtn.disabled = true;
        } else {
          hideMsg(warn);
          copyBtn.disabled = false;
          dlBtn.disabled = false;
        }

        setProgress(progWrap, bar, "Done", 100);
        setTimeout(function () { hideProgress(progWrap); }, 600);
      } catch (e) {
        hideProgress(progWrap);
        showMsg(errEl, "Something went wrong while reading this video. It may be too large for your device's memory.", "error");
      } finally {
        runBtn.disabled = false; runBtn.textContent = "Convert to Base64";
      }
    });

    copyBtn.addEventListener("click", function () { copyText(out.value, copyBtn); });
    dlBtn.addEventListener("click", function () {
      if (!state.dataUrl) return;
      try {
        var blob = createTextBlob(state.dataUrl, 12 * 1024 * 1024);
        downloadBlob(blob, "video-base64.txt");
      } catch (e) {
        showMsg(errEl, "This Base64 output is too large to download safely in this browser. Please use a smaller video.", "warn");
      }
    });
  }

  /* ================================================================== *
   * BASE64 TO VIDEO
   * ================================================================== */
  function initBase64ToVideo() {
    var input = document.getElementById("bv-input");
    if (!input) return;
    var mimeSel = document.getElementById("bv-mime");
    var runBtn = document.getElementById("bv-run");
    var errEl = document.getElementById("bv-error");
    var info = document.getElementById("bv-info");
    var preview = document.getElementById("bv-preview");
    var dlBtn = document.getElementById("bv-download");

    var state = { blob: null, url: null, mime: null };

    runBtn.addEventListener("click", function () {
      hideMsg(errEl); info.hidden = true; dlBtn.disabled = true;
      var fallback = mimeSel.value || null;
      var decoded;
      try {
        decoded = decodeBase64Input(input.value, fallback);
      } catch (e) {
        var msg = "This Base64 string couldn't be decoded. Please check that you pasted the full value.";
        if (e.message === "empty") msg = "The input is empty. Paste a Base64 Data URL or raw Base64 first.";
        else if (e.message === "not-base64") msg = "This looks like a data URL that isn't Base64-encoded, which isn't supported here.";
        else if (e.message === "invalid") msg = "This isn't valid Base64. Check for missing characters or extra text.";
        showMsg(errEl, msg, "error");
        return;
      }
      var mime = decoded.mime || "video/mp4";
      var blob = new Blob([decoded.bytes], { type: mime });
      if (state.url) URL.revokeObjectURL(state.url);
      var url = URL.createObjectURL(blob);
      state.blob = blob; state.url = url; state.mime = mime;

      preview.innerHTML = "";
      var video = document.createElement("video");
      video.controls = true; video.playsInline = true;
      video.onloadedmetadata = function () {
        preview.appendChild(video);
        document.getElementById("bv-name").textContent = "converted-video." + extForMime(mime);
        document.getElementById("bv-format").textContent = mime;
        document.getElementById("bv-size").textContent = formatBytes(blob.size);
        info.hidden = false; dlBtn.disabled = false;
      };
      video.onerror = function () {
        showMsg(errEl, "The data decoded, but it doesn't play as a video. The MIME type may be wrong — try selecting one manually.", "error");
      };
      video.src = url;
    });

    dlBtn.addEventListener("click", function () {
      if (!state.blob) return;
      downloadBlob(state.blob, "converted-video." + extForMime(state.mime || "video/mp4"));
    });
  }

  /* ================================================================== *
   * VIDEO COMPRESSOR
   * ================================================================== */
  function initVideoCompressor() {
    var file = document.getElementById("vc-file");
    if (!file) return;
    var info = document.getElementById("vc-info");
    var controls = document.getElementById("vc-controls");
    var errEl = document.getElementById("vc-error");
    var preview = document.getElementById("vc-preview");
    var runBtn = document.getElementById("vc-run");
    var result = document.getElementById("vc-result");
    var dlBtn = document.getElementById("vc-download");
    var progWrap = document.getElementById("vc-progress");
    var bar = document.getElementById("vc-bar");
    var status = document.getElementById("vc-status");
    var customWrap = document.getElementById("vc-custom-wrap");
    var modeInputs = document.querySelectorAll('input[name="vc-mode"]');
    var qualitySlider = document.getElementById("vc-quality-slider");
    var qualityLabel = document.getElementById("vc-q-val");
    var vcFormat = document.getElementById("vc-format");

    var state = { file: null, url: null, video: null, blob: null, duration: 0 };

    function updateModeUI() {
      var selectedMode = document.querySelector('input[name="vc-mode"]:checked');
      var sizeMode = document.getElementById("vc-size-mode");
      var qualityMode = document.getElementById("vc-quality-mode");
      if (!selectedMode) return;
      var isQuality = selectedMode.value === "quality";
      sizeMode.hidden = isQuality;
      qualityMode.hidden = !isQuality;
    }

    if (qualitySlider) {
      qualitySlider.addEventListener("input", function () {
        qualityLabel.textContent = qualitySlider.value;
      });
    }

    Array.prototype.forEach.call(modeInputs, function (modeInput) {
      modeInput.addEventListener("change", updateModeUI);
    });

    var defaultRadio = document.querySelector('input[name="vc-target"][value="25"]');
    if (defaultRadio) defaultRadio.checked = true;

    Array.prototype.forEach.call(document.querySelectorAll('input[name="vc-target"]'), function (r) {
      r.addEventListener("change", function () {
        customWrap.hidden = (r.value !== "custom" || !r.checked);
      });
    });

    file.addEventListener("change", function () {
      hideMsg(errEl); hideProgress(progWrap); result.hidden = true;
      info.hidden = true; controls.hidden = true;
      var f = file.files && file.files[0];
      if (!f) return;
      if (!/^video\//.test(f.type)) {
        showMsg(errEl, "Please choose a video file.", "error");
        return;
      }
      if (state.url) URL.revokeObjectURL(state.url);
      var url = URL.createObjectURL(f);
      var video = document.createElement("video");
      video.preload = "metadata";
      video.muted = false;
      video.playsInline = true;
      video.onloadedmetadata = function () {
        state.file = f; state.url = url; state.video = video; state.duration = video.duration;
        document.getElementById("vc-name").textContent = sanitizeFilename(f.name);
        document.getElementById("vc-size").textContent = formatBytes(f.size);
        document.getElementById("vc-duration").textContent = formatDuration(video.duration);
        document.getElementById("vc-res").textContent =
          video.videoWidth ? (video.videoWidth + " × " + video.videoHeight) : "unavailable";
        document.getElementById("vc-format").textContent = f.type || "unknown";
        preview.innerHTML = "";
        var pv = document.createElement("video");
        pv.src = url; pv.controls = true; pv.playsInline = true;
        preview.appendChild(pv);
        info.hidden = false; controls.hidden = false;
      };
      video.onerror = function () {
        showMsg(errEl, "This video couldn't be read. It may be corrupted or in a format your browser can't decode.", "error");
      };
      video.src = url;
    });

    function pickMime(forceType) {
      if (forceType) {
        var candidateType = forceType.split(";")[0];
        if (candidateType === "video/mp4" && MediaRecorder && MediaRecorder.isTypeSupported) {
          return forceType;
        }
        return forceType;
      }

      var candidates = [
        "video/webm;codecs=vp9,opus",
        "video/webm;codecs=vp8,opus",
        "video/webm",
        "video/mp4"
      ];
      if (typeof MediaRecorder === "undefined" || !MediaRecorder.isTypeSupported) return null;
      for (var i = 0; i < candidates.length; i++) {
        if (MediaRecorder.isTypeSupported(candidates[i])) return candidates[i];
      }
      return null;
    }

    runBtn.addEventListener("click", async function () {
      if (!state.video) return;
      hideMsg(errEl); result.hidden = true;

      if (typeof MediaRecorder === "undefined" || !HTMLCanvasElement.prototype.captureStream) {
        showMsg(errEl, "Your browser doesn't support in-browser video encoding (MediaRecorder / canvas capture). Try a recent version of Chrome, Edge, Firefox, or Safari.", "error");
        return;
      }

      var mime = pickMime(vcFormat ? vcFormat.value : null);
      if (!mime) {
        showMsg(errEl, "Your browser doesn't support any video format we can encode. Please try a different browser.", "error");
        return;
      }

      var mode = document.querySelector('input[name="vc-mode"]:checked');
      var selectedMode = mode ? mode.value : "size";

      if (selectedMode === "size") {
        var sel = document.querySelector('input[name="vc-target"]:checked');
        if (!sel) { showMsg(errEl, "Choose a target size first.", "error"); return; }
        var targetMB = sel.value === "custom" ? parseFloat(document.getElementById("vc-custom").value) : parseFloat(sel.value);
        if (!(targetMB > 0)) { showMsg(errEl, "Enter a valid custom target size in MB.", "error"); return; }
      } else {
        var qualityValue = parseFloat(qualitySlider.value) / 100;
        if (!(qualityValue > 0 && qualityValue <= 1)) {
          showMsg(errEl, "Choose a valid video quality value.", "error");
          return;
        }
      }

      var duration = state.duration;
      if (!isFinite(duration) || duration <= 0) {
        showMsg(errEl, "This video's duration couldn't be determined, so a target size can't be calculated.", "error");
        return;
      }

      runBtn.disabled = true; runBtn.textContent = "Compressing…";
      setProgress(progWrap, bar, "Preparing video…", 0);

      var audioBits = 128000;
      var targetMB = selectedMode === "size"
        ? (document.querySelector('input[name="vc-target"]:checked').value === "custom"
            ? parseFloat(document.getElementById("vc-custom").value)
            : parseFloat(document.querySelector('input[name="vc-target"]:checked').value))
        : null;

      var videoBits = 0;
      if (selectedMode === "size") {
        var totalBits = targetMB * 1024 * 1024 * 8;
        videoBits = Math.round(totalBits / duration - audioBits);
        videoBits = Math.max(120000, videoBits);
      } else {
        var qualityRatio = parseFloat(qualitySlider.value) / 100;
        var baseBitrate = 1800000 * qualityRatio;
        videoBits = Math.max(180000, baseBitrate);
      }

      var srcW = state.video.videoWidth || 1280;
      var srcH = state.video.videoHeight || 720;
      var maxSide = 1920;
      var scale = Math.min(1, maxSide / Math.max(srcW, srcH));
      var outW = Math.max(2, Math.round(srcW * scale / 2) * 2);
      var outH = Math.max(2, Math.round(srcH * scale / 2) * 2);

      var canvas = document.createElement("canvas");
      canvas.width = outW; canvas.height = outH;
      var ctx = canvas.getContext("2d");

      var video = state.video;
      var stream = canvas.captureStream(30);

      var audioCtx = null;
      try {
        var vStream = video.captureStream ? video.captureStream() : (video.mozCaptureStream ? video.mozCaptureStream() : null);
        var added = 0;
        if (vStream && vStream.getAudioTracks) {
          vStream.getAudioTracks().forEach(function (t) { stream.addTrack(t); added++; });
        }
        if (added === 0 && (window.AudioContext || window.webkitAudioContext)) {
          var AC = window.AudioContext || window.webkitAudioContext;
          audioCtx = new AC();
          var srcNode = audioCtx.createMediaElementSource(video);
          var dest = audioCtx.createMediaStreamDestination();
          srcNode.connect(dest);
          if (dest.stream.getAudioTracks()[0]) stream.addTrack(dest.stream.getAudioTracks()[0]);
        }
      } catch (e) {}

      var chunks = [];
      var recorder;
      try {
        recorder = new MediaRecorder(stream, {
          mimeType: mime,
          videoBitsPerSecond: videoBits,
          audioBitsPerSecond: audioBits
        });
      } catch (e) {
        showMsg(errEl, "This browser rejected the encoding settings. Try a smaller target size or a different browser.", "error");
        runBtn.disabled = false; runBtn.textContent = "Compress Video";
        hideProgress(progWrap);
        return;
      }

      recorder.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };

      var finished = false;
      var rafId = 0;

      function drawLoop() {
        if (finished) return;
        if (video.ended || video.currentTime >= duration - 0.02) {
          drawLoopStop();
          return;
        }
        try { ctx.drawImage(video, 0, 0, outW, outH); } catch (e) {}
        var p = Math.min(99, (video.currentTime / duration) * 100);
        var label = p < 3 ? "Preparing video…" : p > 94 ? "Almost done…" : "Processing " + Math.round(p) + "%";
        setProgress(progWrap, bar, label, p);
        rafId = requestAnimationFrame(drawLoop);
      }

      function drawLoopStop() {
        cancelAnimationFrame(rafId);
        setProgress(progWrap, bar, "Finalizing…", 99);
        try { recorder.stop(); } catch (e) {}
      }

      recorder.onstop = function () {
        finished = true;
        cancelAnimationFrame(rafId);
        try { video.pause(); } catch (e) {}
        if (audioCtx && audioCtx.close) { try { audioCtx.close(); } catch (e) {} }
        stream.getTracks().forEach(function (t) { try { t.stop(); } catch (e) {} });

        var baseBlob = new Blob(chunks, { type: mime.split(";")[0] });
        if (!baseBlob.size) {
          hideProgress(progWrap);
          showMsg(errEl, "Something went wrong while processing this video. Please try another file or a smaller video.", "error");
          runBtn.disabled = false; runBtn.textContent = "Compress Video";
          return;
        }

        state.blob = baseBlob;
        var orig = state.file.size, neu = baseBlob.size;
        var saved = Math.max(0, orig - neu);
        var pct = orig > 0 ? (saved / orig) * 100 : 0;
        document.getElementById("vc-r-orig").textContent = formatBytes(orig);
        document.getElementById("vc-r-new").textContent = formatBytes(neu);
        document.getElementById("vc-r-saved").textContent = formatBytes(saved);
        document.getElementById("vc-r-pct").textContent = pct.toFixed(1) + "%";
        hideProgress(progWrap);
        result.hidden = false;
        runBtn.disabled = false; runBtn.textContent = "Compress Video";
        if (neu >= orig) {
          showMsg(errEl, "The re-encoded video isn't smaller than the original at this target. Try a smaller target size or lower quality.", "warn");
        }

        showMsg(errEl, "Note: Compressed video duration metadata may show as 00:00 in some file managers but will play correctly. Re-encoding tools don't preserve full metadata.", "warn");
      };

      recorder.onerror = function () {
        hideProgress(progWrap);
        showMsg(errEl, "Recording failed in this browser. Please try another browser or a smaller video.", "error");
        runBtn.disabled = false; runBtn.textContent = "Compress Video";
      };

      try {
        video.currentTime = 0;
        recorder.start(1000);
        await video.play();
        rafId = requestAnimationFrame(drawLoop);
      } catch (e) {
        hideProgress(progWrap);
        showMsg(errEl, "This video couldn't be played for processing. It may use a codec your browser can't decode.", "error");
        runBtn.disabled = false; runBtn.textContent = "Compress Video";
      }
    });

    dlBtn.addEventListener("click", function () {
      if (!state.blob) return;
      var type = state.blob.type || "video/webm";
      var ext = /mp4/.test(type) ? "mp4" : "webm";
      downloadBlob(state.blob, "video-compressed." + ext);
    });
  }

  /* ------------------------------------------------------------------ *
   * Boot
   * ------------------------------------------------------------------ */
  function boot() {
    initTheme();
    initRouter();
    initImageCompressor();
    initPhotoToBase64();
    initBase64ToPhoto();
    initVideoToBase64();
    initBase64ToVideo();
    initVideoCompressor();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
