/* 189 LAB — editor.js : trình soạn thảo trực quan, xem trước realtime */
(function () {
  "use strict";

  /* ================= state ================= */
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  var ORIG = { site: clone(window.SITE || {}), i18n: clone(window.I18N || { en: {}, vi: {} }) };
  ORIG.site.credentials = ORIG.site.credentials || { roles: [], partners: [] };
  ORIG.site.credentials.roles = ORIG.site.credentials.roles || [];
  ORIG.site.credentials.partners = ORIG.site.credentials.partners || [];
  ORIG.site.showcases = ORIG.site.showcases || [];
  ORIG.site.team = ORIG.site.team || [];
  ORIG.site.testimonial = ORIG.site.testimonial || { quote: "", name: "", title: "", company: "" };
  var state = clone(ORIG);
  var DRAFT_KEY = "189lab-editor-draft-v1";
  var ui = { tab: "general", device: "desktop", lang: (ORIG.site.defaultLang === "vi" ? "vi" : "en"), q: "", open: {} };

  var CATS = [
    { v: "tvc", l: "Quảng cáo / TVC" },
    { v: "film", l: "Phim" },
    { v: "original", l: "Original (tự sản xuất)" },
    { v: "solution", l: "Giải pháp AI" }
  ];
  var TABS = [
    { id: "general", l: "Chung", target: "reel" },
    { id: "creds", l: "Thành tích & đối tác", target: "credentials" },
    { id: "showcase", l: "Showcase", target: "showcase" },
    { id: "team", l: "Đội ngũ", target: "team" },
    { id: "stills", l: "Khung hình", target: "frames" },
    { id: "projects", l: "Dự án", target: "work" },
    { id: "about", l: "Giới thiệu", target: "about" },
    { id: "clients", l: "Khách hàng", target: "clients" },
    { id: "contact", l: "Liên hệ", target: "contact" },
    { id: "text", l: "Câu chữ EN/VI", target: "top" }
  ];

  /* ================= helpers ================= */
  function $(s, r) { return (r || document).querySelector(s); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function getPath(o, path) { return path.split(".").reduce(function (a, k) { return a == null ? a : a[k]; }, o); }
  function setPath(o, path, val) {
    var ks = path.split("."), last = ks.pop();
    var t = ks.reduce(function (a, k) { return a[k]; }, o);
    t[last] = val;
  }
  function biGet(v, l) {
    if (v && typeof v === "object") return v[l] || "";
    return l === "en" ? (v || "") : "";
  }
  function biSet(cur, l, val) {
    var o = (cur && typeof cur === "object") ? { en: cur.en || "", vi: cur.vi || "" } : { en: cur || "", vi: "" };
    o[l] = val;
    if (!o.vi || o.vi === o.en) return o.en;
    return o;
  }
  function driveId(url) {
    if (!url || !/drive\.google\.com|docs\.google\.com/.test(url)) return null;
    var m = url.match(/\/file\/d\/([\w-]{10,})/) || url.match(/[?&]id=([\w-]{10,})/);
    return m ? m[1] : null;
  }
  function imgSrc(url) { var id = driveId(url); return id ? "https://lh3.googleusercontent.com/d/" + id + "=w400" : url; }
  function videoKind(url) {
    if (!url) return null;
    if (/vimeo\.com\/(?:video\/)?\d+/i.test(url)) return "Vimeo";
    if (/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))[\w-]{11}/i.test(url)) return "YouTube";
    if (driveId(url)) return "Google Drive";
    if (/\.(mp4|webm|mov)(\?|$)/i.test(url)) return "File video";
    return "";
  }

  /* ================= field builders ================= */
  function fText(label, path, o) {
    o = o || {};
    var v = getPath(state.site, path);
    return '<label class="f"><span>' + label + "</span>" +
      '<input type="' + (o.type || "text") + '" data-path="' + path + '" value="' + esc(v) + '" placeholder="' + esc(o.ph || "") + '"' + (o.num ? ' data-num="1"' : "") + ">" +
      (o.hint ? '<span class="hint">' + o.hint + "</span>" : "") + "</label>";
  }
  function fBi(label, path, o) {
    o = o || {};
    var v = getPath(state.site, path);
    var en = biGet(v, "en"), vi = biGet(v, "vi");
    return '<div class="f"><span>' + label + '</span><div class="bi">' +
      '<label><small>EN</small><input type="text" data-path="' + path + '" data-bi="en" value="' + esc(en) + '" placeholder="' + esc(o.ph || "") + '"></label>' +
      '<label><small>VI</small><input type="text" data-path="' + path + '" data-bi="vi" value="' + esc(vi) + '" placeholder="' + esc(en ? "(dùng chung bản EN)" : "") + '"></label>' +
      "</div></div>";
  }
  function fBiArea(label, path) {
    var v = getPath(state.site, path);
    var en = biGet(v, "en"), vi = biGet(v, "vi");
    return '<div class="f"><span>' + label + '</span><div class="bi">' +
      '<label><small>EN</small><textarea rows="4" data-path="' + path + '" data-bi="en">' + esc(en) + "</textarea></label>" +
      '<label><small>VI</small><textarea rows="4" data-path="' + path + '" data-bi="vi" placeholder="' + esc(en ? "(dùng chung bản EN)" : "") + '">' + esc(vi) + "</textarea></label>" +
      "</div></div>";
  }
  function listBtns(list, i, len) {
    return '<span>' +
      '<button type="button" class="b-ghost sm" data-act="move" data-list="' + list + '" data-i="' + i + '" data-d="-1"' + (i === 0 ? " disabled" : "") + ">Lên</button>" +
      '<button type="button" class="b-ghost sm" data-act="move" data-list="' + list + '" data-i="' + i + '" data-d="1"' + (i === len - 1 ? " disabled" : "") + ">Xuống</button>" +
      '<button type="button" class="b-ghost sm b-danger" data-act="del" data-list="' + list + '" data-i="' + i + '">Xoá</button></span>';
  }
  function fSelect(label, path, opts) {
    var v = getPath(state.site, path);
    return '<label class="f"><span>' + label + '</span><select data-path="' + path + '">' +
      opts.map(function (x) { return '<option value="' + x.v + '"' + (x.v === v ? " selected" : "") + ">" + esc(x.l) + "</option>"; }).join("") +
      "</select></label>";
  }
  function fImage(label, path, hint) {
    var v = getPath(state.site, path) || "";
    return '<div class="f"><span>' + label + '</span><div class="media-row">' +
      '<input type="text" data-path="' + path + '" data-media="image" value="' + esc(v) + '" placeholder="Dán link Google Drive hoặc assets/img/...">' +
      '<div class="thumb" data-thumb="' + path + '">' + thumbInner(v) + "</div></div>" +
      '<span class="hint" data-mstatus="' + path + '">' + imageStatus(v) + "</span>" +
      (hint ? '<span class="hint">' + hint + "</span>" : "") + "</div>";
  }
  function thumbInner(v) { return v ? '<img src="' + esc(imgSrc(v)) + '" alt="" referrerpolicy="no-referrer" onerror="this.parentNode.textContent=\'Lỗi ảnh\'">' : "Chưa có"; }
  function imageStatus(v) {
    if (!v) return "";
    if (driveId(v)) return '<span class="status-line ok">Ảnh Google Drive. Nhớ để quyền "Bất kỳ ai có đường liên kết".</span>';
    if (/drive\.google\.com\/drive\/folders/.test(v)) return '<span class="status-line bad">Đây là link thư mục. Cần link của từng file ảnh.</span>';
    return "";
  }
  function fVideo(label, path) {
    var v = getPath(state.site, path) || "";
    return '<div class="f"><span>' + label + '</span>' +
      '<input type="text" data-path="' + path + '" data-media="video" value="' + esc(v) + '" placeholder="Dán link Vimeo, YouTube hoặc Google Drive">' +
      '<span data-mstatus="' + path + '">' + videoStatus(v) + "</span></div>";
  }
  function videoStatus(v) {
    if (!v) return "";
    var k = videoKind(v);
    if (!k) return '<span class="status-line bad">Không nhận ra link video. Dùng link Vimeo, YouTube, Google Drive hoặc file .mp4.</span>';
    if (k === "Google Drive") return '<span class="status-line warn">Video Google Drive: phát được, nhưng chất lượng thấp hơn và không tự chạy. File phải để quyền công khai.</span>';
    return '<span class="status-line ok">Đã nhận link ' + k + ".</span>";
  }

  /* ================= tab renders ================= */
  var R = {};

  R.general = function () {
    return '<p class="intro">Sửa ô nào, khung bên phải cập nhật ngay. Xong bấm <b>Lưu thay đổi</b> ở góc trên.</p>' +
      '<div class="group"><h3>Video đầu trang (showcase mạnh nhất)</h3><p class="hint" style="margin:-4px 0 12px">Video này chạy full màn hình ngay khi mở web, tự phát nền không tiếng. Khách bấm nút sẽ xem bản đầy đủ có tiếng. Dán link YouTube, Vimeo hoặc Drive.</p>' +
      fVideo("Link video đầu trang", "showreel.url") +
      fImage("Ảnh nền khung showreel (tuỳ chọn)", "showreel.poster") +
      '<div class="row">' + fText("Thời lượng", "showreel.duration", { ph: "01:30" }) + fText("Thông số", "showreel.spec", { ph: "4K" }) + "</div></div>" +
      '<div class="group"><h3>Cài đặt</h3>' +
      fSelect("Ngôn ngữ khi khách mở web lần đầu", "defaultLang", [{ v: "en", l: "Tiếng Anh" }, { v: "vi", l: "Tiếng Việt" }]) +
      fText("Số dự án hiện trước khi bấm “Tất cả dự án”", "projectsPerPage", { type: "number", num: true }) + "</div>";
  };

  R.creds = function () {
    var c = state.site.credentials, h = '<p class="intro">Hiện thành khu chữ lớn ngay dưới showreel. Ghi đúng vai trò thật của thành viên, vì khách và đối tác có thể kiểm chứng.</p>';
    h += '<div class="group"><h3>Vai trò & thành tích</h3><button type="button" class="add" data-act="add-role">+ Thêm thành tích</button>';
    c.roles.forEach(function (r, i) {
      h += '<div class="plain"><div class="plain-head">Dòng ' + (i + 1) + listBtns("credentials.roles", i, c.roles.length) + "</div>" +
        fBi("Vai trò (chữ nhỏ bên trái)", "credentials.roles." + i + ".role", { ph: "Organizer" }) +
        fText("Tên cuộc thi / tổ chức (chữ lớn)", "credentials.roles." + i + ".title") +
        fBi("Ghi chú cạnh tên (tuỳ chọn)", "credentials.roles." + i + ".with", { ph: "with CapCut" }) +
        fText("Thành viên thực hiện (tuỳ chọn, hiện “by …”)", "credentials.roles." + i + ".by", { ph: "Xị" }) +
        '<div class="row">' + fText("Năm", "credentials.roles." + i + ".year") + fText("Link (tuỳ chọn)", "credentials.roles." + i + ".link", { ph: "https://..." }) + "</div></div>";
    });
    h += '</div><div class="group"><h3>Chương trình đối tác (CPP…)</h3><button type="button" class="add" data-act="add-partner">+ Thêm đối tác</button>';
    c.partners.forEach(function (p, i) {
      h += '<div class="plain"><div class="plain-head">Đối tác ' + (i + 1) + listBtns("credentials.partners", i, c.partners.length) + "</div>" +
        fText("Tên nền tảng", "credentials.partners." + i + ".name", { ph: "CapCut" }) +
        fBi("Chương trình", "credentials.partners." + i + ".program", { ph: "Creative Partner Program" }) +
        fText("Link (tuỳ chọn)", "credentials.partners." + i + ".link", { ph: "https://..." }) + "</div>";
    });
    return h + "</div>";
  };

  R.showcase = function () {
    var list = state.site.showcases, h = '<p class="intro">Lưới video tự làm, khách bấm là xem. Chưa dán ảnh bìa thì web tự lấy ảnh từ YouTube. Thêm bao nhiêu cũng được; video mạnh nhất nên để ở tab Chung → Video đầu trang.</p>' +
      '<button type="button" class="add" data-act="add-showcase">+ Thêm showcase (lên đầu)</button>';
    list.forEach(function (sc, i) {
      var b = "showcases." + i;
      h += '<div class="plain"><div class="plain-head">' + esc(biGet(sc.title, "en") || "Showcase " + (i + 1)) + listBtns("showcases", i, list.length) + "</div>" +
        fText("Tên", b + ".title") +
        fVideo("Link video", b + ".video") +
        '<div class="row">' + fSelect("Loại", b + ".category", CATS) + fText("Người thực hiện (tuỳ chọn)", b + ".by", { ph: "Xị Zital" }) + "</div>" +
        fText("Mô tả ngắn (tuỳ chọn)", b + ".note") +
        fImage("Ảnh bìa (để trống = tự lấy từ YouTube)", b + ".thumb") + "</div>";
    });
    return h;
  };

  R.team = function () {
    var list = state.site.team, h = '<p class="intro">Mỗi thẻ là một thành viên. Chưa có ảnh thì web hiện chữ cái đầu tên. Ảnh đại diện nên vuông.</p>' +
      '<button type="button" class="add" data-act="add-member">+ Thêm thành viên</button>';
    list.forEach(function (m, i) {
      var b = "team." + i;
      h += '<div class="plain"><div class="plain-head">' + esc(biGet(m.name, "en") || m.handle || "Thành viên " + (i + 1)) + listBtns("team", i, list.length) + "</div>" +
        '<div class="row">' + fText("Tên hiển thị", b + ".name", { ph: "Để trống thì dùng handle" }) + fText("Handle", b + ".handle", { ph: "xilamphimai" }) + "</div>" +
        fImage("Ảnh đại diện", b + ".photo") +
        fText("Link Facebook / profile", b + ".link", { ph: "https://www.facebook.com/..." }) +
        fBi("Vai trò", b + ".role", { ph: "Core team" }) +
        fBi("Danh hiệu (cách nhau bằng dấu phẩy)", b + ".tags", { ph: "CapCut CPP, Topview CPP" }) +
        fBiArea("Thành tích (mỗi dòng một ý)", b + ".highlights") + "</div>";
    });
    return h;
  };

  R.stills = function () {
    var h = '<p class="intro">8 ô ảnh ghép dưới showreel, thứ tự từ cột trái sang phải, trên xuống dưới. Ô 1, 4, 5, 8 dáng ngang; ô 2, 3, 6, 7 dáng cao.</p>';
    (state.site.stills || []).forEach(function (s, i) {
      h += '<div class="plain"><div class="plain-head">Ô ' + (i + 1) + "</div>" +
        fImage("Ảnh", "stills." + i + ".image") + fText("Tên dự án (hiện khi chưa có ảnh, và làm mô tả ảnh)", "stills." + i + ".project") + "</div>";
    });
    return h;
  };

  R.projects = function () {
    var list = state.site.projects || [];
    var h = '<p class="intro">Dự án ở trên cùng hiện đầu tiên trên web. Bấm vào từng dự án để mở ra sửa.</p>' +
      '<button type="button" class="add" data-act="add-project">+ Thêm dự án mới (lên đầu danh sách)</button>';
    list.forEach(function (p, i) {
      var cat = (CATS.filter(function (c) { return c.v === p.category; })[0] || {}).l || p.category;
      var open = ui.open["p" + i] ? " open" : "";
      h += '<details class="item" data-key="p' + i + '"' + open + ">" +
        '<summary><span class="idx">' + String(i + 1).padStart(2, "0") + '</span><span class="ttl">' + esc(biGet(p.title, "en") || "(chưa có tên)") + '</span><span class="cat">' + esc(cat) + '</span><span class="chev">›</span></summary>' +
        '<div class="item-body">' +
        fSelect("Loại dự án", "projects." + i + ".category", CATS) +
        fText("Tên dự án", "projects." + i + ".title") +
        '<div class="row">' + fText("Khách hàng / nơi phát hành", "projects." + i + ".client") + fText("Năm", "projects." + i + ".year") + "</div>" +
        fBi("Định dạng", "projects." + i + ".format", { ph: "TVC · 30s" }) +
        fImage("Ảnh bìa (16:9)", "projects." + i + ".thumb") +
        fVideo("Video", "projects." + i + ".video") +
        fText("Link ngoài (tuỳ chọn, dùng khi không có video)", "projects." + i + ".link", { ph: "https://..." }) +
        '<div class="item-actions">' +
        '<button type="button" class="b-line sm" data-act="move" data-list="projects" data-i="' + i + '" data-d="-1"' + (i === 0 ? " disabled" : "") + ">Lên</button>" +
        '<button type="button" class="b-line sm" data-act="move" data-list="projects" data-i="' + i + '" data-d="1"' + (i === list.length - 1 ? " disabled" : "") + ">Xuống</button>" +
        '<button type="button" class="b-line sm" data-act="dup" data-i="' + i + '">Nhân bản</button>' +
        '<button type="button" class="b-line sm b-danger" data-act="del" data-list="projects" data-i="' + i + '">Xoá</button>' +
        "</div></div></details>";
    });
    return h;
  };

  R.about = function () {
    var h = '<p class="intro">Đoạn giới thiệu nằm ở tab <b>Câu chữ EN/VI</b>, nhóm “Giới thiệu”. Ở đây là các con số dưới đoạn giới thiệu. Xoá hết thì dòng số tự ẩn.</p>';
    (state.site.stats || []).forEach(function (s, i) {
      h += '<div class="plain"><div class="plain-head">Số ' + (i + 1) +
        ' <button type="button" class="b-ghost sm b-danger" data-act="del" data-list="stats" data-i="' + i + '">Xoá</button></div>' +
        fText("Con số", "stats." + i + ".value", { ph: "25+" }) + fBi("Nhãn", "stats." + i + ".label") + "</div>";
    });
    return h + '<button type="button" class="add" data-act="add-stat">+ Thêm con số</button>';
  };

  R.clients = function () {
    var h = '<p class="intro">Chỉ đưa logo khách đã đồng ý công khai (PNG nền trong suốt, màu trắng). Web tự chọn cách hiện: 0 logo thì ẩn, 1–5 logo hiện một hàng lớn “Selected collaborations”, từ 6 logo hiện lưới “Trusted by”.</p>' +
      '<div class="group"><h3>Nhận xét của khách (hiện dưới logo)</h3>' +
      fBiArea("Câu nhận xét", "testimonial.quote") +
      '<div class="row">' + fText("Tên người nói", "testimonial.name") + fText("Chức danh", "testimonial.title") + "</div>" +
      fText("Công ty", "testimonial.company") + "</div>" +
      '<div class="group"><h3>Logo khách hàng</h3><button type="button" class="add" data-act="add-client">+ Thêm khách hàng</button>';
    (state.site.clients || []).forEach(function (c, i) {
      h += '<div class="plain"><div class="plain-head">Khách ' + (i + 1) + '<span>' +
        '<button type="button" class="b-ghost sm" data-act="move" data-list="clients" data-i="' + i + '" data-d="-1">Lên</button>' +
        '<button type="button" class="b-ghost sm" data-act="move" data-list="clients" data-i="' + i + '" data-d="1">Xuống</button>' +
        '<button type="button" class="b-ghost sm b-danger" data-act="del" data-list="clients" data-i="' + i + '">Xoá</button></span></div>' +
        fText("Tên khách hàng", "clients." + i + ".name") + fImage("Logo", "clients." + i + ".logo") + "</div>";
    });
    if ((state.site.clients || []).length) h += '<button type="button" class="b-line sm b-danger" data-act="clear-clients">Xoá hết logo</button>';
    return h + "</div>";
  };

  R.contact = function () {
    var h = '<div class="group"><h3>Thông tin liên hệ</h3>' +
      fText("Email", "contact.email", { type: "email", ph: "hello@189lab.com" }) +
      fText("Số điện thoại", "contact.phone", { ph: "0909 123 456" }) +
      fBi("Địa chỉ", "contact.address") + "</div>" +
      '<div class="group"><h3>Mạng xã hội</h3><p class="hint" style="margin:-4px 0 12px">Để trống link thì mạng đó tự ẩn trên web.</p>';
    (state.site.socials || []).forEach(function (s, i) {
      h += '<div class="plain"><div class="plain-head">' + esc(s.name || "Mạng " + (i + 1)) +
        ' <button type="button" class="b-ghost sm b-danger" data-act="del" data-list="socials" data-i="' + i + '">Xoá</button></div>' +
        '<div class="row">' + fText("Tên hiển thị", "socials." + i + ".name") + fText("Link", "socials." + i + ".url", { ph: "https://..." }) + "</div></div>";
    });
    return h + '<button type="button" class="add" data-act="add-social">+ Thêm mạng xã hội</button></div>';
  };

  var GROUPS = [
    { p: /^hero\./, l: "Đầu trang (headline)", t: "top" },
    { p: /^about\./, l: "Giới thiệu", t: "about" },
    { p: /^(svc|svc\d)\./, l: "Năng lực / dịch vụ", t: "services" },
    { p: /^(work|f|tag)\./, l: "Dự án & bộ lọc", t: "work" },
    { p: /^(proc|p\d|step)/, l: "Quy trình", t: "process" },
    { p: /^clients\./, l: "Khách hàng", t: "clients" },
    { p: /^(ct|fm)\./, l: "Liên hệ & form", t: "contact" },
    { p: /^(stills|reel)\./, l: "Showreel & khung hình", t: "reel" },
    { p: /^nav\./, l: "Menu", t: "top" },
    { p: /^meta\./, l: "SEO: tiêu đề tab & mô tả trên Google", t: "top" },
    { p: /^(ok|nf)\./, l: "Trang cảm ơn & trang 404", t: "top" },
    { p: /./, l: "Khác", t: "top" }
  ];
  function isHtmlKey(k) { return /<br\s*\/?>/i.test(ORIG.i18n.en[k] || ""); }
  R.text = function () {
    var q = ui.q.trim().toLowerCase();
    var keys = Object.keys(state.i18n.en);
    var buckets = GROUPS.map(function () { return []; });
    keys.forEach(function (k) {
      var en = state.i18n.en[k] || "", vi = (state.i18n.vi || {})[k] || "";
      if (q && (k + " " + en + " " + vi).toLowerCase().indexOf(q) < 0) return;
      for (var g = 0; g < GROUPS.length; g++) if (GROUPS[g].p.test(k)) { buckets[g].push(k); break; }
    });
    var h = '<div class="search"><div class="f" style="margin:0"><input type="search" id="text-q" placeholder="Tìm câu chữ cần sửa…" value="' + esc(ui.q) + '"></div></div>' +
      '<p class="intro">Xuống dòng trong ô là xuống dòng trên web. Để trống bản VI thì web dùng bản EN.</p>';
    GROUPS.forEach(function (g, gi) {
      if (!buckets[gi].length) return;
      h += '<div class="group"><h3>' + g.l + "</h3>";
      buckets[gi].forEach(function (k) {
        var html = isHtmlKey(k);
        var en = state.i18n.en[k] || "", vi = (state.i18n.vi || {})[k] || "";
        if (html) { en = en.replace(/<br\s*\/?>/gi, "\n"); vi = vi.replace(/<br\s*\/?>/gi, "\n"); }
        var rows = Math.min(5, Math.max(1, Math.ceil(Math.max(en.length, vi.length) / 42), (en.match(/\n/g) || []).length + 1));
        h += '<div class="f" data-scroll="' + g.t + '"><span class="key">' + esc(k) + '</span><div class="bi">' +
          '<label><small>EN</small><textarea rows="' + rows + '" data-i18n-key="' + k + '" data-l="en"' + (html ? ' data-html="1"' : "") + ">" + esc(en) + "</textarea></label>" +
          '<label><small>VI</small><textarea rows="' + rows + '" data-i18n-key="' + k + '" data-l="vi"' + (html ? ' data-html="1"' : "") + ">" + esc(vi) + "</textarea></label>" +
          "</div></div>";
      });
      h += "</div>";
    });
    return h;
  };

  /* ================= render ================= */
  var formEl = $("#form"), tabsEl = $("#tabs");
  function renderTabs() {
    tabsEl.innerHTML = TABS.map(function (t) {
      return '<button type="button" role="tab" data-act="tab" data-v="' + t.id + '" aria-selected="' + (t.id === ui.tab) + '">' + t.l + "</button>";
    }).join("");
  }
  function renderForm(keepScroll) {
    var st = formEl.scrollTop;
    formEl.innerHTML = R[ui.tab]();
    if (keepScroll) formEl.scrollTop = st;
  }

  /* ================= preview ================= */
  var frame = $("#preview"), box = $("#frame-box"), area = $("#preview-area");
  var pending = null, scrollTarget = null;
  function push(target) {
    if (target) scrollTarget = target;
    clearTimeout(pending);
    pending = setTimeout(function () {
      try {
        frame.contentWindow.postMessage({ type: "189lab-preview", site: state.site, i18n: state.i18n, lang: ui.lang, scrollTo: scrollTarget }, "*");
      } catch (e) {}
      scrollTarget = null;
    }, 60);
  }
  window.addEventListener("message", function (e) {
    if (e.source === frame.contentWindow && e.data && e.data.type === "189lab-ready") push();
  });
  frame.addEventListener("load", function () { push(); });

  function fit() {
    var W = area.clientWidth, H = area.clientHeight;
    if (ui.device === "desktop") {
      var base = 1440, s = Math.min(1, W / base);
      box.className = "frame-box";
      box.style.width = base + "px";
      box.style.height = (H / s) + "px";
      box.style.transform = "translateX(-50%) scale(" + s + ")";
    } else {
      var w = 390, h = 844, s2 = Math.min(1, (H - 48) / h);
      box.className = "frame-box mobile";
      box.style.width = w + "px";
      box.style.height = h + "px";
      box.style.transform = "translateX(-50%) scale(" + s2 + ")";
    }
  }
  window.addEventListener("resize", fit);

  /* ================= dirty / draft ================= */
  function isDirty() { return JSON.stringify(state) !== JSON.stringify(ORIG); }
  function whichDirty() {
    return {
      site: JSON.stringify(state.site) !== JSON.stringify(ORIG.site),
      i18n: JSON.stringify(state.i18n) !== JSON.stringify(ORIG.i18n)
    };
  }
  var statusEl = $("#status"), saveBtn = $("#save-btn");
  function refreshStatus(msg, cls) {
    var d = isDirty();
    saveBtn.disabled = !d;
    statusEl.className = "ed-status" + (cls ? " " + cls : d ? " dirty" : "");
    statusEl.textContent = msg || (d ? "Có thay đổi chưa lưu" : "Chưa có thay đổi");
  }
  function saveDraft() {
    try {
      if (isDirty()) localStorage.setItem(DRAFT_KEY, JSON.stringify({ at: Date.now(), state: state, base: ORIG }));
      else localStorage.removeItem(DRAFT_KEY);
    } catch (e) {}
  }
  function changed(target, rerender) {
    if (rerender) renderForm(true);
    push(target);
    refreshStatus();
    saveDraft();
  }

  /* ================= events ================= */
  function tabTarget() { return (TABS.filter(function (t) { return t.id === ui.tab; })[0] || {}).target; }

  formEl.addEventListener("input", function (e) {
    var el = e.target;
    if (el.id === "text-q") { ui.q = el.value; var pos = el.selectionStart; renderForm(true); var n = $("#text-q"); n.focus(); n.setSelectionRange(pos, pos); return; }
    if (el.dataset.i18nKey) {
      var v = el.value;
      if (el.dataset.html) v = v.replace(/\n/g, "<br>");
      state.i18n[el.dataset.l][el.dataset.i18nKey] = v;
      var sc = el.closest("[data-scroll]");
      changed(null);
      return;
    }
    var path = el.dataset.path; if (!path) return;
    var val = el.value;
    if (el.dataset.num) val = Math.max(1, parseInt(val, 10) || 1);
    if (el.dataset.bi) val = biSet(getPath(state.site, path), el.dataset.bi, val);
    setPath(state.site, path, val);
    if (el.dataset.media === "image") {
      var th = formEl.querySelector('[data-thumb="' + path + '"]'); if (th) th.innerHTML = thumbInner(el.value);
      var ms = formEl.querySelector('[data-mstatus="' + path + '"]'); if (ms) ms.innerHTML = imageStatus(el.value);
    }
    if (el.dataset.media === "video") {
      var vs = formEl.querySelector('[data-mstatus="' + path + '"]'); if (vs) vs.innerHTML = videoStatus(el.value);
    }
    if (/^projects\.\d+\.title$/.test(path)) {
      var sum = el.closest("details"); if (sum) sum.querySelector(".ttl").textContent = el.value || "(chưa có tên)";
    }
    changed(null);
  });
  formEl.addEventListener("change", function (e) {
    var el = e.target;
    if (el.tagName === "SELECT" && el.dataset.path) {
      setPath(state.site, el.dataset.path, el.value);
      changed(null, /category/.test(el.dataset.path));
    }
  });
  formEl.addEventListener("toggle", function (e) {
    var d = e.target; if (d.tagName !== "DETAILS") return;
    ui.open[d.dataset.key] = d.open;
    if (d.open) push("work");
  }, true);
  formEl.addEventListener("focusin", function (e) {
    var sc = e.target.closest && e.target.closest("[data-scroll]");
    if (sc && sc.dataset.scroll !== ui._lastScroll) { ui._lastScroll = sc.dataset.scroll; push(sc.dataset.scroll); }
  });

  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-act]"); if (!b || b.disabled) return;
    var act = b.dataset.act, list, i;
    switch (act) {
      case "tab": ui.tab = b.dataset.v; ui._lastScroll = null; renderTabs(); renderForm(); formEl.scrollTop = 0; push(tabTarget()); break;
      case "device":
        ui.device = b.dataset.v;
        document.querySelectorAll('[data-act="device"]').forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
        fit(); break;
      case "lang":
        ui.lang = b.dataset.v;
        document.querySelectorAll('[data-act="lang"]').forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
        push(); break;
      case "add-project":
        state.site.projects = state.site.projects || [];
        state.site.projects.unshift({ category: "tvc", title: "", client: "", format: "", year: String(new Date().getFullYear()), thumb: "", video: "", link: "" });
        shiftOpen(1); ui.open.p0 = true;
        changed("work", true);
        var first = formEl.querySelector('[data-path="projects.0.title"]'); if (first) first.focus();
        break;
      case "dup":
        i = +b.dataset.i;
        state.site.projects.splice(i + 1, 0, clone(state.site.projects[i]));
        ui.open = {}; ui.open["p" + (i + 1)] = true;
        changed("work", true); break;
      case "move":
        list = getPath(state.site, b.dataset.list); i = +b.dataset.i; var j = i + (+b.dataset.d);
        if (j < 0 || j >= list.length) break;
        var tmp = list[i]; list[i] = list[j]; list[j] = tmp;
        if (b.dataset.list === "projects") { var oi = ui.open["p" + i], oj = ui.open["p" + j]; ui.open["p" + i] = oj; ui.open["p" + j] = oi; }
        changed(tabTarget(), true); break;
      case "del":
        list = getPath(state.site, b.dataset.list); i = +b.dataset.i;
        var nm = b.dataset.list === "projects" ? "dự án “" + (biGet(list[i].title, "en") || "chưa có tên") + "”" : "mục này";
        if (!confirm("Xoá " + nm + "?")) break;
        list.splice(i, 1);
        if (b.dataset.list === "projects") ui.open = {};
        changed(tabTarget(), true); break;
      case "add-showcase": state.site.showcases.unshift({ title: "", video: "", thumb: "", note: "", category: "film", by: "" }); changed("showcase", true); break;
      case "add-member": state.site.team.push({ name: "", handle: "", photo: "", link: "", role: { en: "Core team", vi: "Thành viên cốt cán" }, tags: "", highlights: "" }); changed("team", true); break;
      case "add-role": state.site.credentials.roles.push({ role: "", title: "", with: "", by: "", year: String(new Date().getFullYear()), link: "" }); changed("credentials", true); break;
      case "add-partner": state.site.credentials.partners.push({ name: "", program: "Creative Partner Program", link: "" }); changed("credentials", true); break;
      case "add-stat": (state.site.stats = state.site.stats || []).push({ value: "", label: "" }); changed("about", true); break;
      case "add-client": (state.site.clients = state.site.clients || []).unshift({ name: "", logo: "" }); changed("clients", true); break;
      case "clear-clients": if (confirm("Xoá toàn bộ khách hàng? Mục Trusted by sẽ ẩn khỏi web.")) { state.site.clients = []; changed("clients", true); } break;
      case "add-social": (state.site.socials = state.site.socials || []).push({ name: "", url: "" }); changed("contact", true); break;
      case "reset":
        if (!isDirty() || !confirm("Huỷ mọi thay đổi chưa lưu và quay về nội dung trong file?")) break;
        state = clone(ORIG); ui.open = {}; renderForm(true); changed(null); break;
      case "save": save(); break;
      case "close-dialog": $("#done-dialog").close(); break;
      case "draft-restore": restoreDraft(true); break;
      case "draft-discard": restoreDraft(false); break;
    }
  });
  function shiftOpen(n) {
    var o = {}; Object.keys(ui.open).forEach(function (k) { o["p" + (+k.slice(1) + n)] = ui.open[k]; }); ui.open = o;
  }

  // Cmd+S / Ctrl+S để lưu
  document.addEventListener("keydown", function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") { e.preventDefault(); if (isDirty()) save(); }
  });
  window.addEventListener("beforeunload", function (e) { if (isDirty()) { e.preventDefault(); e.returnValue = ""; } });

  /* ================= save ================= */
  function stamp() {
    var d = new Date(); function p(n) { return String(n).padStart(2, "0"); }
    return p(d.getDate()) + "/" + p(d.getMonth() + 1) + "/" + d.getFullYear() + " " + p(d.getHours()) + ":" + p(d.getMinutes());
  }
  function buildContent() {
    return "/* =====================================================================\n" +
      "   189 LAB — NỘI DUNG WEBSITE\n" +
      "   Lưu từ editor.html lúc " + stamp() + "\n" +
      "   Cách sửa dễ nhất: nhấp đúp editor.html, sửa trong form, bấm Lưu thay đổi.\n" +
      "   ===================================================================== */\n\n" +
      "window.SITE = " + JSON.stringify(state.site, null, 2) + ";\n";
  }
  function buildI18n() {
    return "/* 189 LAB — chữ giao diện EN/VI. Lưu từ editor.html lúc " + stamp() + " */\n\n" +
      "window.I18N = " + JSON.stringify(state.i18n, null, 2) + ";\n";
  }
  function download(name, text) {
    var blob = new Blob([text], { type: "text/javascript;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }
  // Chrome/Edge: chọn thư mục assets/js một lần, các lần sau Cmd+S ghi đè thẳng.
  // Safari: tải file về thư mục Downloads.
  var dirHandle = null;
  async function getDir() {
    if (!window.showDirectoryPicker) return null;
    if (dirHandle) {
      try {
        var perm = await dirHandle.queryPermission({ mode: "readwrite" });
        if (perm === "granted" || (await dirHandle.requestPermission({ mode: "readwrite" })) === "granted") return dirHandle;
      } catch (e) {}
    }
    try {
      var h = await window.showDirectoryPicker({ id: "189lab-js", mode: "readwrite" });
      var ok = true;
      try { await h.getFileHandle("content.js"); } catch (e) { ok = false; }
      if (!ok && !confirm("Thư mục “" + h.name + "” không có sẵn file content.js. Đúng thư mục cần chọn là 189lab-site/assets/js. Vẫn lưu vào đây?")) return "cancel";
      dirHandle = h;
      return h;
    } catch (e) {
      if (e && e.name === "AbortError") return "cancel";
      return null;
    }
  }
  async function save() {
    var d = whichDirty(), files = [];
    if (d.site) files.push(["content.js", buildContent()]);
    if (d.i18n) files.push(["i18n.js", buildI18n()]);
    if (!files.length) return;
    var dir = await getDir(), direct = false;
    if (dir === "cancel") return;
    if (dir) {
      try {
        for (var k = 0; k < files.length; k++) {
          var fh = await dir.getFileHandle(files[k][0], { create: true });
          var w = await fh.createWritable(); await w.write(files[k][1]); await w.close();
        }
        direct = true;
      } catch (e) { dirHandle = null; }
    }
    if (!direct) files.forEach(function (f) { download(f[0], f[1]); });
    ORIG = clone(state);
    try { localStorage.removeItem(DRAFT_KEY); } catch (e) {}
    var names = files.map(function (f) { return f[0]; });
    refreshStatus("Đã lưu " + names.join(" và ") + " lúc " + stamp().slice(-5), "saved");
    var dlg = $("#done-dialog");
    dlg.querySelector("ol").hidden = false;
    if (direct) {
      $("#done-body").innerHTML = '<p>Đã ghi đè thẳng vào <code>' + esc(dir.name) + "/</code>: " + names.map(function (f) { return "<code>" + f + "</code>"; }).join(" ") +
        '</p><p>Chỉ còn một bước: vào Netlify → site 189 LAB → tab <b>Deploys</b>, kéo thả cả thư mục <code>189lab-site</code> vào ô cuối trang.</p>' +
        '<p class="muted">Các lần lưu sau (Cmd+S) sẽ ghi thẳng, không hỏi lại thư mục.</p>';
      dlg.querySelector("ol").hidden = true;
    } else {
      $("#done-body").innerHTML = '<p class="muted">Đã tải về thư mục Downloads:</p><div class="files">' + names.map(function (f) { return "<code>" + f + "</code>"; }).join("") + "</div>";
    }
    if (!dlg.open) dlg.showModal();
  }

  /* ================= draft restore ================= */
  var draft = null;
  try { draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null"); } catch (e) {}
  if (draft && draft.state && JSON.stringify(draft.state) !== JSON.stringify(ORIG)) $("#draft-banner").hidden = false;
  function restoreDraft(yes) {
    $("#draft-banner").hidden = true;
    if (yes && draft) { state = clone(draft.state); ui.open = {}; renderForm(); changed(tabTarget()); }
    else { try { localStorage.removeItem(DRAFT_KEY); } catch (e) {} }
    fit();
  }

  /* ================= init ================= */
  document.querySelectorAll('[data-act="lang"]').forEach(function (x) { x.setAttribute("aria-pressed", String(x.dataset.v === ui.lang)); });
  renderTabs(); renderForm(); fit(); refreshStatus();
})();
