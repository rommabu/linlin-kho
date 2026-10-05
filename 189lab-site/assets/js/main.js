/* 189 LAB — main.js (không cần sửa file này; nội dung nằm ở content.js) */
(function () {
  "use strict";
  var S = window.SITE || {};
  var D = window.I18N || { en: {}, vi: {} };
  var LANG_KEY = "189lab-lang";
  var lang = readLang();
  var filter = "all";
  var expanded = false;
  var scFilter = "all";
  var scExpanded = false;

  function readLang() {
    var l = null;
    try { l = localStorage.getItem(LANG_KEY); } catch (e) {}
    if (!l) {
      var q = new URLSearchParams(location.search).get("lang");
      l = q || S.defaultLang || "en";
    }
    return l === "vi" ? "vi" : "en";
  }
  function t(key) { return (D[lang] && D[lang][key] != null) ? D[lang][key] : (D.en[key] || ""); }
  function tx(v) { if (v == null) return ""; if (typeof v === "object") return v[lang] || v.en || ""; return String(v); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function isPh(v) { var x = tx(v); return !x || /\[[^\]]*\]/.test(x); } // trống hoặc còn [PLACEHOLDER]
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  /* ---------- Google Drive ---------- */
  function driveId(url) {
    if (!url || !/drive\.google\.com|docs\.google\.com/.test(url)) return null;
    var m = url.match(/\/file\/d\/([\w-]{10,})/) || url.match(/[?&]id=([\w-]{10,})/);
    return m ? m[1] : null;
  }
  // Link chia sẻ ảnh Drive → link ảnh hiển thị được trên web
  function img(url) {
    var id = driveId(url);
    return id ? "https://lh3.googleusercontent.com/d/" + id + "=w2000" : url;
  }

  function ytThumb(url) { var m = (url || "").match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/i); return m ? "https://img.youtube.com/vi/" + m[1] + "/hqdefault.jpg" : ""; }
  function showcaseThumb(sc) { if (sc.thumb) return img(sc.thumb); var y = ytThumb(sc.video); if (y) return y; if (driveId(sc.video)) return img(sc.video); return ""; }

  /* ---------- video url → embed ---------- */
  function parseVideo(url) {
    if (!url) return null;
    var m;
    if ((m = url.match(/vimeo\.com\/(?:video\/)?(\d+)(?:\/([a-z0-9]+))?/i))) {
      var h = m[2] ? "&h=" + m[2] : "";
      return { kind: "iframe", src: "https://player.vimeo.com/video/" + m[1] + "?autoplay=1&title=0&byline=0&portrait=0&dnt=1" + h };
    }
    if ((m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/i))) {
      return { kind: "iframe", src: "https://www.youtube-nocookie.com/embed/" + m[1] + "?autoplay=1&rel=0&modestbranding=1&playsinline=1" };
    }
    var did = driveId(url);
    if (did) return { kind: "iframe", src: "https://drive.google.com/file/d/" + did + "/preview" };
    if (/\.(mp4|webm|mov)(\?|$)/i.test(url)) return { kind: "video", src: url };
    return null;
  }
  function mediaEl(v, title) {
    if (v.kind === "video") {
      var vid = document.createElement("video");
      vid.src = v.src; vid.controls = true; vid.autoplay = true; vid.playsInline = true;
      return vid;
    }
    var f = document.createElement("iframe");
    f.src = v.src; f.title = title || "Video";
    f.allow = "autoplay; fullscreen; picture-in-picture; encrypted-media";
    f.allowFullscreen = true;
    return f;
  }

  // nền hero: video tự chạy, tắt tiếng, lặp
  function bgEl(url) {
    var m;
    if ((m = url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/i))) {
      var f = document.createElement("iframe"); var id = m[1];
      f.src = "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1&mute=1&loop=1&playlist=" + id + "&controls=0&showinfo=0&modestbranding=1&rel=0&playsinline=1&iv_load_policy=3&disablekb=1";
      f.allow = "autoplay; encrypted-media"; f.tabIndex = -1; f.setAttribute("aria-hidden", "true"); return f;
    }
    if ((m = url.match(/vimeo\.com\/(?:video\/)?(\d+)(?:\/([a-z0-9]+))?/i))) {
      var f2 = document.createElement("iframe"); var h = m[2] ? "&h=" + m[2] : "";
      f2.src = "https://player.vimeo.com/video/" + m[1] + "?background=1&autoplay=1&muted=1&loop=1&dnt=1" + h;
      f2.allow = "autoplay"; f2.tabIndex = -1; f2.setAttribute("aria-hidden", "true"); return f2;
    }
    if (/\.(mp4|webm|mov)(\?|$)/i.test(url)) {
      var vd = document.createElement("video"); vd.src = url;
      vd.autoplay = vd.muted = vd.loop = vd.playsInline = true; vd.setAttribute("muted", ""); vd.setAttribute("playsinline", ""); return vd;
    }
    return null;
  }

  /* ---------- i18n ---------- */
  function applyLang() {
    document.documentElement.lang = lang;
    document.title = t("meta.title");
    var md = $('meta[name="description"]'); if (md) md.setAttribute("content", t("meta.desc"));
    $$("[data-i18n]").forEach(function (el) { var v = t(el.dataset.i18n); if (v) el.textContent = v; });
    $$("[data-i18n-html]").forEach(function (el) { var v = t(el.dataset.i18nHtml); if (v) el.innerHTML = v; });
    $$("[data-i18n-aria]").forEach(function (el) { var v = t(el.dataset.i18nAria); if (v) el.setAttribute("aria-label", v); });
    $$("[data-lang]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.lang === lang)); });
    var fl = $("#form-lang"); if (fl) fl.value = lang;
    renderAll();
  }
  function setLang(l) {
    lang = l === "vi" ? "vi" : "en";
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}
    applyLang();
  }

  /* ---------- sections ---------- */
  function renderStills() {
    var box = $("#stills"); if (!box) return;
    var hasImg = (S.stills || []).some(function (x) { return x.image; });
    $("#frames").hidden = !hasImg;
    if (!hasImg) return;
    var list = (S.stills || []).slice(0, 8);
    while (list.length < 8) list.push({ image: "", project: "[PROJECT]" });
    // 4 cột, xen kẽ ô thấp/cao như bản thiết kế
    var shapes = [["s", "t"], ["t", "s"], ["s", "t"], ["t", "s"]];
    var html = "";
    for (var c = 0; c < 4; c++) {
      html += '<div class="m-col">';
      for (var r = 0; r < 2; r++) {
        var i = c * 2 + r, it = list[i] || {};
        var label = "FRAME " + String(i + 1).padStart(2, "0") + " · " + esc(tx(it.project));
        html += '<figure class="tile ' + shapes[c][r] + '" style="margin:0">' +
          (it.image ? '<img src="' + esc(img(it.image)) + '" referrerpolicy="no-referrer" alt="' + esc(tx(it.project)) + '" loading="lazy">' : "<span>" + label + "</span>") +
          "</figure>";
      }
      html += "</div>";
    }
    box.innerHTML = html;
  }

  function renderStats() {
    var box = $("#stats"); if (!box) return;
    var st = (S.stats || []).filter(function (x) { return !isPh(x.value); });
    box.hidden = !st.length;
    box.innerHTML = st.map(function (s) {
      return '<div class="stat"><b>' + esc(tx(s.value)) + "</b><span>" + esc(tx(s.label)) + "</span></div>";
    }).join("");
  }

  var CATS = ["all", "film", "tvc", "original", "solution"];
  function renderFilters() {
    var box = $("#filters"); if (!box) return;
    box.innerHTML = CATS.map(function (c) {
      return '<button type="button" data-cat="' + c + '" aria-pressed="' + (c === filter) + '">' + esc(t("f." + c)) + "</button>";
    }).join("");
  }

  function renderWork() {
    var grid = $("#work-grid"); if (!grid) return;
    var all = S.projects || [];
    var real = all.filter(function (p) { return !isPh(p.title) || p.thumb || p.video; });
    var showWork = real.length > 0;
    $("#work").hidden = !showWork;
    $$("[data-nav-work]").forEach(function (a) { a.hidden = !showWork; });
    all = real;
    var list = filter === "all" ? all : all.filter(function (p) { return p.category === filter; });
    var per = S.projectsPerPage || 6;
    var shown = expanded ? list : list.slice(0, per);
    grid.innerHTML = shown.map(function (p) {
      var idx = (S.projects || []).indexOf(p);
      var v = parseVideo(p.video);
      var tag = t("tag." + p.category) || "";
      var media = p.thumb
        ? '<img src="' + esc(img(p.thumb)) + '" alt="" loading="lazy" referrerpolicy="no-referrer">'
        : "<span>" + esc(t("work.thumb")) + "</span>";
      var play = v ? '<span class="card-play" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 2l8 5-8 5z"/></svg></span>' : "";
      var inner =
        '<div class="card-media">' + (tag ? '<span class="card-tag">' + esc(tag) + "</span>" : "") + media + play + "</div>" +
        '<div class="card-meta"><div><div class="card-title">' + esc(tx(p.title)) + '</div><div class="card-sub">' +
        [tx(p.client), tx(p.format)].filter(Boolean).map(esc).join(" · ") + '</div></div><div class="card-year">' + esc(tx(p.year)) + "</div></div>";
      if (v) return '<button class="card" type="button" data-idx="' + idx + '" aria-label="' + esc(t("work.play") + ": " + tx(p.title)) + '">' + inner + "</button>";
      if (p.link) return '<a class="card" href="' + esc(p.link) + '" target="_blank" rel="noopener">' + inner + "</a>";
      return '<div class="card">' + inner + "</div>";
    }).join("");
    $("#work-empty").hidden = list.length > 0;
    var more = $("#work-more");
    more.hidden = list.length <= per;
    $("#work-more-label").textContent = t(expanded ? "work.less" : "work.more");
  }

  function renderClients() {
    var sec = $("#clients"), box = $("#logo-grid"); if (!sec || !box) return;
    var cl = (S.clients || []).filter(function (c) { return c.logo || tx(c.name); });
    var few = cl.length < 6;
    $("#clients-logos").hidden = !cl.length;
    $("#clients-title").textContent = t(few ? "clients.titleFew" : "clients.title");
    $("#clients-sub").textContent = t(few ? "clients.subFew" : "clients.sub");
    box.className = "logo-grid" + (few ? " few" : "");
    box.innerHTML = cl.map(function (c) {
      var name = '<span class="logo-name">' + esc(tx(c.name)) + "</span>";
      return '<div class="logo">' + (c.logo ? '<img src="' + esc(img(c.logo)) + '" referrerpolicy="no-referrer" alt="' + esc(tx(c.name)) + '" loading="lazy">' : "") + name + "</div>";
    }).join("");
    // file logo chưa có / link hỏng → ẩn ảnh, hiện tên đối tác
    box.querySelectorAll(".logo img").forEach(function (im) {
      var ok = function () { im.parentNode.classList.add("has-img"); };
      var bad = function () { im.remove(); };
      if (im.complete) { im.naturalWidth ? ok() : bad(); } else { im.addEventListener("load", ok); im.addEventListener("error", bad); }
    });
    var q = S.testimonial || {}, qt = tx(q.quote);
    $("#quote").hidden = !qt;
    if (qt) {
      $("#quote-text").textContent = qt;
      var by = [tx(q.title), tx(q.company)].filter(Boolean).map(esc).join(", ");
      $("#quote-by").innerHTML = (q.name ? "<b>" + esc(tx(q.name)) + "</b>" : "") + (q.name && by ? " — " : "") + by;
    }
    sec.hidden = !cl.length && !qt;
  }

  function renderTeam() {
    var sec = $("#team"), box = $("#team-grid"); if (!sec || !box) return;
    var list = (S.team || []).filter(function (m) { return tx(m.name) || m.handle; });
    sec.hidden = !list.length;
    box.innerHTML = list.map(function (m) {
      var name = tx(m.name) || m.handle;
      var initial = name.replace(/^@/, "").charAt(0).toUpperCase();
      var av = m.photo ? '<img src="' + esc(img(m.photo)) + '" alt="" referrerpolicy="no-referrer" loading="lazy">' : esc(initial);
      var tags = String(tx(m.tags) || "").split(",").map(function (x) { return x.trim(); }).filter(Boolean);
      var hls = String(tx(m.highlights) || "").split("\n").map(function (x) { return x.trim(); }).filter(Boolean);
      var fb = /facebook\.com/.test(m.link || "") ? "FACEBOOK" : "PROFILE";
      return '<article class="member">' +
        '<div class="member-top"><div class="avatar" aria-hidden="true">' + av + '</div><div>' +
        '<h3 class="member-name">' + esc(name) + "</h3>" +
        (m.handle && tx(m.name) ? '<p class="member-handle">@' + esc(m.handle) + "</p>" : "") + "</div></div>" +
        (tx(m.role) ? '<p class="member-role">' + esc(tx(m.role)) + "</p>" : "") +
        (tags.length ? '<ul class="tags">' + tags.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>" : "") +
        (hls.length ? '<ul class="hl">' + hls.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>" : "") +
        (m.link ? '<a class="member-link" href="' + esc(m.link) + '" target="_blank" rel="noopener">' + fb +
          ' <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M3 9l6-6M4 3h5v5"/></svg></a>' : "") +
        "</article>";
    }).join("");
  }

  function renderShowcase() {
    var sec = $("#showcase"), box = $("#showcase-grid"); if (!sec || !box) return;
    var all = (S.showcases || []).filter(function (x) { return x.video || !isPh(x.title); });
    sec.hidden = !all.length;
    if (!all.length) return;

    // bộ lọc theo loại — chỉ hiện khi có từ 2 loại trở lên
    var cats = [];
    all.forEach(function (x) { if (x.category && cats.indexOf(x.category) < 0) cats.push(x.category); });
    var fbox = $("#sc-filters");
    if (cats.length >= 2) {
      var order = ["all"].concat(["film", "tvc", "original", "solution"].filter(function (c) { return cats.indexOf(c) >= 0; }));
      fbox.hidden = false;
      fbox.innerHTML = order.map(function (c) {
        return '<button type="button" data-sccat="' + c + '" aria-pressed="' + (c === scFilter) + '">' + esc(t("f." + c)) + "</button>";
      }).join("");
    } else { fbox.hidden = true; scFilter = "all"; }

    var list = scFilter === "all" ? all : all.filter(function (x) { return x.category === scFilter; });
    var per = S.showcasePerPage || 9;
    var shown = scExpanded ? list : list.slice(0, per);
    box.innerHTML = shown.map(function (sc) {
      var idx = (S.showcases || []).indexOf(sc);
      var v = parseVideo(sc.video);
      var th = showcaseThumb(sc);
      var media = th ? '<img src="' + esc(th) + '" alt="" loading="lazy" referrerpolicy="no-referrer">' : "<span>" + esc(t("showcase.thumb")) + "</span>";
      var play = v ? '<span class="card-play" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 2l8 5-8 5z"/></svg></span>' : "";
      var tag = (sc.category && cats.length >= 2) ? '<span class="card-tag">' + esc(t("tag." + sc.category)) + "</span>" : "";
      var credit = tx(sc.by) ? (t("by.short") ? t("by.short") + " " : "") + tx(sc.by) : "";
      var sub = [tx(sc.note), credit].filter(Boolean).map(esc).join(" · ");
      var title = tx(sc.title) && !isPh(sc.title) ? '<div class="card-title">' + esc(tx(sc.title)) + "</div>" : "";
      var inner = '<div class="card-media">' + tag + media + play + "</div>" +
        (title || sub ? '<div class="card-meta"><div>' + title + (sub ? '<div class="card-sub">' + sub + "</div>" : "") + "</div></div>" : "");
      if (v) return '<button class="card" type="button" data-sc="' + idx + '" aria-label="' + esc(t("showcase.play") + ": " + (title ? tx(sc.title) : "#" + (idx + 1))) + '">' + inner + "</button>";
      return '<div class="card">' + inner + "</div>";
    }).join("");

    var more = $("#sc-more");
    more.hidden = list.length <= per;
    $("#sc-more-label").textContent = t(scExpanded ? "showcase.less" : "showcase.more");
  }

  function renderCredentials() {
    var sec = $("#credentials"); if (!sec) return;
    var c = S.credentials || {};
    var roles = (c.roles || []).filter(function (r) { return tx(r.title); });
    var parts = (c.partners || []).filter(function (p) { return tx(p.name); });
    sec.hidden = !roles.length && !parts.length;
    var list = $("#roles"); list.hidden = !roles.length;
    list.innerHTML = roles.map(function (r) {
      var prize = esc(tx(r.role) || tx(r.title));
      var prizeHtml = r.link
        ? '<a class="award-prize" href="' + esc(r.link) + '" target="_blank" rel="noopener">' + prize + "</a>"
        : '<span class="award-prize">' + prize + "</span>";
      var where = [tx(r.title), tx(r.with)].filter(Boolean).map(esc).join(" · ");
      var yr = (tx(r.year) && where.indexOf(tx(r.year)) < 0) ? ' <span class="award-yr">· ' + esc(tx(r.year)) + "</span>" : "";
      var by = tx(r.by) ? '<span class="award-by">' + esc(tx(r.by)) + "</span>" : "";
      return '<li class="award"><span class="award-l">' + prizeHtml +
        (where || yr ? '<span class="award-where">' + where + yr + "</span>" : "") + "</span>" + by + "</li>";
    }).join("");
    var pw = $("#partners-wrap"); pw.hidden = !parts.length;
    $("#partners").innerHTML = parts.map(function (p) {
      var nm = esc(tx(p.name));
      return p.link ? '<a class="p" href="' + esc(p.link) + '" target="_blank" rel="noopener">' + nm + "</a>" : '<span class="p">' + nm + "</span>";
    }).join('<span class="sep">·</span>');
  }

  function renderContact() {
    var c = S.contact || {};
    var em = $("#ct-email"), ph = $("#ct-phone"), ad = $("#ct-address");
    if (em) { em.textContent = tx(c.email); em.hidden = isPh(c.email); if (/@/.test(c.email) && !/\[/.test(c.email)) em.href = "mailto:" + c.email; else em.removeAttribute("href"); }
    if (ph) { ph.textContent = tx(c.phone); ph.hidden = isPh(c.phone); if (c.phone && !/\[/.test(c.phone)) ph.href = "tel:" + String(c.phone).replace(/[^\d+]/g, ""); else ph.removeAttribute("href"); }
    if (ad) { ad.textContent = tx(c.address); ad.hidden = isPh(c.address); }
    var so = $("#socials");
    if (so) {
      var list = (S.socials || []).filter(function (s) { return s.url; });
      so.hidden = !list.length;
      so.innerHTML = list.map(function (s) { return '<a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.name) + "</a>"; }).join("");
    }
  }

  function renderHero() {
    var r = S.showreel || {};
    var hero = $("#top"); if (!hero) return;
    var media = $("#hv-media");
    var v = parseVideo(r.url);
    hero.classList.toggle("no-video", !v && !r.poster);
    $("#hero-play").hidden = !v;
    $("#hero-start").className = "btn " + (v ? "btn-line" : "btn-solid");
    media.style.backgroundImage = r.poster ? 'url("' + img(r.poster) + '")' : "";
    media.innerHTML = "";
    if (v && r.autoplayBg !== false) { var el = bgEl(r.url); if (el) media.appendChild(el); }
  }

  function renderAll() {
    renderStills(); renderStats(); renderFilters(); renderWork(); renderShowcase(); renderCredentials(); renderTeam(); renderClients(); renderContact(); renderHero();
  }

  /* ---------- lightbox ---------- */
  var lb = $("#lightbox"), lbMedia = $("#lb-media"), lastFocus = null;
  function openVideo(url, caption) {
    var v = parseVideo(url); if (!v) return;
    lastFocus = document.activeElement;
    lbMedia.innerHTML = ""; lbMedia.appendChild(mediaEl(v, caption));
    $("#lb-caption").textContent = caption || "";
    if (lb.showModal) lb.showModal(); else lb.setAttribute("open", "");
    document.body.style.overflow = "hidden";
  }
  function closeVideo() {
    lbMedia.innerHTML = "";
    if (lb.open) lb.close();
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  }
  lb.addEventListener("close", function () { lbMedia.innerHTML = ""; document.body.style.overflow = ""; });
  lb.addEventListener("click", function (e) { if (e.target === lb) closeVideo(); });
  $("#lb-close").addEventListener("click", closeVideo);

  /* ---------- events ---------- */
  document.addEventListener("click", function (e) {
    var b;
    if ((b = e.target.closest("[data-lang]"))) { setLang(b.dataset.lang); return; }
    if ((b = e.target.closest("#filters button"))) { filter = b.dataset.cat; expanded = false; renderFilters(); renderWork(); return; }
    if ((b = e.target.closest("#sc-filters button"))) { scFilter = b.dataset.sccat; scExpanded = false; renderShowcase(); return; }
    if ((b = e.target.closest("[data-filter-link]"))) { filter = b.dataset.filterLink; expanded = false; renderFilters(); renderWork(); }
    if ((b = e.target.closest(".card[data-sc]"))) {
      var sc = (S.showcases || [])[+b.dataset.sc];
      if (sc) openVideo(sc.video, tx(sc.title));
      return;
    }
    if ((b = e.target.closest(".card[data-idx]"))) {
      var p = (S.projects || [])[+b.dataset.idx];
      if (p) openVideo(p.video, tx(p.title) + (p.client ? " — " + tx(p.client) : ""));
      return;
    }
  });
  $("#work-more").addEventListener("click", function () { expanded = !expanded; renderWork(); });
  var scMore = $("#sc-more"); if (scMore) scMore.addEventListener("click", function () { scExpanded = !scExpanded; renderShowcase(); });

  var heroPlay = $("#hero-play");
  if (heroPlay) heroPlay.addEventListener("click", function () {
    var url = (S.showreel || {}).url; if (parseVideo(url)) openVideo(url, "189 LAB Showreel");
  });

  // mobile menu
  var menuBtn = $(".menu-btn"), mnav = $("#mobile-nav");
  function setMenu(open) {
    mnav.hidden = !open;
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", t(open ? "nav.close" : "nav.menu"));
    menuBtn.innerHTML = open
      ? '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 4l10 10M14 4L4 14"/></svg>'
      : '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M2 6h14M2 12h14"/></svg>';
    document.body.style.overflow = open ? "hidden" : "";
  }
  menuBtn.addEventListener("click", function () { setMenu(mnav.hidden); });
  mnav.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !mnav.hidden) { setMenu(false); menuBtn.focus(); } });
  window.addEventListener("resize", function () { if (window.innerWidth > 860 && !mnav.hidden) setMenu(false); });

  /* ---------- live preview từ editor.html ---------- */
  if (window.parent && window.parent !== window) {
    window.addEventListener("message", function (e) {
      var d = e.data;
      if (e.source !== window.parent || !d || d.type !== "189lab-preview") return;
      if (d.site) S = d.site;
      if (d.i18n) D = d.i18n;
      if (d.lang) lang = d.lang === "vi" ? "vi" : "en";
      applyLang();
      if (d.scrollTo) {
        var el = document.getElementById(d.scrollTo);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
    window.parent.postMessage({ type: "189lab-ready" }, "*");
  }

  /* ---------- init ---------- */
  var y = $("#year"); if (y) y.textContent = new Date().getFullYear();
  applyLang();
  requestAnimationFrame(function () { requestAnimationFrame(function () { document.body.classList.add("is-loaded"); }); });
})();
