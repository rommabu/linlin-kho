/* =====================================================================
   189 LAB — NỘI DUNG WEBSITE
   ---------------------------------------------------------------------
   Đây là file DUY NHẤT anh em cần sửa để cập nhật website.
   - Chữ có 2 ngôn ngữ viết dạng { en: "...", vi: "..." }.
     Nếu chỉ viết 1 chuỗi "..." thì cả 2 ngôn ngữ dùng chung.
   - Video: dán thẳng link Vimeo / YouTube / Google Drive, hoặc đường dẫn
     file .mp4 (ví dụ "assets/video/showreel.mp4").
   - Ảnh: bỏ file vào thư mục assets/img/... rồi ghi đường dẫn,
     HOẶC dán link chia sẻ Google Drive của ảnh.
   - Link Google Drive: file phải để quyền "Bất kỳ ai có đường liên kết"
     (Anyone with the link) — nếu không web sẽ không hiện được.
   - Mục nào chưa có nội dung thật (còn trống hoặc còn [ ... ]) thì web tự ẩn.
   Sửa xong: kéo thả lại cả thư mục lên Netlify là web cập nhật.
   ===================================================================== */

window.SITE = {

  /* Ngôn ngữ mặc định khi khách mở web lần đầu: "en" hoặc "vi" */
  defaultLang: "en",

  /* ---------- SHOWREEL ---------- */
  showreel: {
    url: "https://youtu.be/AAd3YIZp6o0",                          // ví dụ: "https://vimeo.com/123456789"
    poster: "",                       // ảnh nền khung reel, ví dụ: "assets/img/stills/reel-poster.jpg"
    duration: "[DURATION]",           // ví dụ: "01:30"
    spec: "4K"
  },

  /* ---------- KHUNG HÌNH (8 ô ghép, thứ tự từ trái sang phải) ---------- */
  stills: [
    { image: "", project: "[PROJECT]" },
    { image: "", project: "[PROJECT]" },
    { image: "", project: "[PROJECT]" },
    { image: "", project: "[PROJECT]" },
    { image: "", project: "[PROJECT]" },
    { image: "", project: "[PROJECT]" },
    { image: "", project: "[PROJECT]" },
    { image: "", project: "[PROJECT]" }
  ],

  /* ---------- CON SỐ (để stats: [] nếu chưa muốn hiện) ---------- */
  stats: [
    { value: "[XX]", label: { en: "Projects delivered", vi: "Dự án đã bàn giao" } },
    { value: "[XX]", label: { en: "Brands served",      vi: "Thương hiệu đồng hành" } },
    { value: "[XX]", label: { en: "Countries reached",  vi: "Quốc gia tiếp cận" } }
  ],

  /* ---------- SHOWCASE (lưới video tự làm, bấm là xem) ----------
     video: link YouTube / Vimeo / Drive
     thumb: để trống sẽ tự lấy ảnh từ YouTube; muốn chọn khung đẹp hơn thì dán link ảnh
     note:  một dòng mô tả ngắn (tuỳ chọn)
     Thêm bao nhiêu cũng được. Video mạnh nhất nên để ở ô "Video đầu trang" (tab Chung). */
  showcases: [
    { title: "", video: "https://youtu.be/xK3JFTRSNA4", thumb: "", note: "", category: "original", by: "" },
    { title: "", video: "https://youtu.be/orRGVbIw9fk", thumb: "", note: "", category: "original", by: "" },
    { title: "", video: "https://youtu.be/WN9llzmsoAg", thumb: "", note: "", category: "original", by: "" },
    { title: "", video: "https://youtu.be/0RmttPM8CNA", thumb: "", note: "", category: "original", by: "" },
    { title: "", video: "https://youtu.be/S1oxZewyS1o", thumb: "", note: "", category: "original", by: "" },
    { title: "", video: "https://youtu.be/zPJnix80rmc", thumb: "", note: "", category: "original", by: "" },
    { title: "", video: "https://youtu.be/Jn1BXNqZA9k", thumb: "", note: "", category: "original", by: "" },
    { title: "", video: "https://youtu.be/M8O3K-ba3Zg", thumb: "", note: "", category: "original", by: "" }
  ],
  /* Số video hiện trước khi bấm "Xem thêm" */
  showcasePerPage: 9,

  /* ---------- DỰ ÁN ----------
     category: "film" | "tvc" | "original" | "solution"
     thumb:    ảnh bìa 16:9, ví dụ "assets/img/work/ten-du-an.jpg"
     video:    link Vimeo / YouTube / .mp4 — bấm vào card sẽ mở video
     link:     (tuỳ chọn) link ngoài nếu không có video
     Dự án mới nhất đặt LÊN ĐẦU danh sách.                         */
  projects: [
    { category: "tvc",      title: "[PROJECT TITLE]", client: "[CLIENT]",               format: "TVC · 30s",            year: "2026", thumb: "", video: "" },
    { category: "film",     title: "[PROJECT TITLE]", client: "[FESTIVAL / PLATFORM]",  format: { en: "Short film", vi: "Phim ngắn" }, year: "2026", thumb: "", video: "" },
    { category: "original", title: "[PROJECT TITLE]", client: "189 LAB Original",       format: "Series",               year: "2026", thumb: "", video: "" },
    { category: "tvc",      title: "[PROJECT TITLE]", client: "[CLIENT]",               format: { en: "Product film · 15s", vi: "Phim sản phẩm · 15s" }, year: "2026", thumb: "", video: "" },
    { category: "solution", title: "[PROJECT TITLE]", client: "[CLIENT]",               format: { en: "Pipeline & training", vi: "Pipeline & đào tạo" }, year: "2026", thumb: "", video: "" },
    { category: "film",     title: "[PROJECT TITLE]", client: "[FESTIVAL / PLATFORM]",  format: { en: "Theatrical", vi: "Chiếu rạp" }, year: "[YEAR]", thumb: "", video: "" }
  ],

  /* Số dự án hiện ở trang chủ trước khi bấm "Tất cả dự án" */
  projectsPerPage: 6,

  /* ---------- THÀNH TÍCH ĐỘI NGŨ (hiện chữ lớn dưới đầu trang) ---------- */
  credentials: {
    roles: [
      { role: { en: "Best Creative Idea", vi: "Ý tưởng sáng tạo xuất sắc nhất" }, title: "JAECOO J5: AI Film Challenge", with: "Tam Thập Tứ Tuyệt Việt Nam 2026", by: "Nguyễn Hoàng Giang", year: "2026", link: "" },
      { role: { en: "Best AI Technique", vi: "Kỹ thuật AI xuất sắc nhất" }, title: "JAECOO J5: AI Film Challenge", with: "Tam Thập Tứ Tuyệt Việt Nam 2026", by: "Huỳnh Quốc", year: "2026", link: "" },
      { role: { en: "6M views", vi: "6 triệu view" }, title: "WORLDS IN 20", with: { en: "on Instagram, in under a month", vi: "trên Instagram, chưa đầy 1 tháng" }, by: "Nguyễn Hoàng Giang", year: "2026", link: "https://www.instagram.com/worldsin20.studio/" },
      { role: { en: "Organizer", vi: "Đơn vị tổ chức" }, title: "VietFilm AI Talent", with: { en: "with CapCut", vi: "cùng CapCut" }, by: "Xị Zital", year: "2026", link: "" },
      { role: { en: "1st Prize", vi: "Giải Nhất" }, title: "Nguyễn Công PC", with: { en: "Season 1", vi: "Mùa 1" }, by: "Huỳnh Quốc", year: "", link: "" },
      { role: { en: "2nd Prize", vi: "Giải Nhì" }, title: "Nguyễn Công PC", with: { en: "Season 2", vi: "Mùa 2" }, by: "Huỳnh Quốc", year: "", link: "" },
      { role: { en: "Expert advisor", vi: "Cố vấn chuyên môn" }, title: "JAECOO J5: AI Film Challenge", with: "Tam Thập Tứ Tuyệt Việt Nam 2026", by: "Xị Zital", year: "2026", link: "" },
      { role: "KOL Leader", title: "Teammate", with: "", by: "Xị Zital", year: "2026", link: "" }
    ],
    /* Chương trình đối tác mà thành viên đang tham gia */
    partners: [
      { name: "CapCut",   program: "Creative Partner Program", link: "" },
      { name: "Topview",  program: "Creative Partner Program", link: "" },
      { name: "Teammate", program: "Creative Partner Program", link: "" }
    ]
  },

  /* ---------- ĐỘI NGŨ ----------
     name: tên hiển thị (để trống thì hiện handle)
     photo: ảnh đại diện vuông (link Drive hoặc assets/img/team/...)
     tags: danh hiệu ngắn, cách nhau bằng dấu phẩy
     highlights: mỗi dòng là một thành tích                                  */
  team: [
    { name: "Nguyễn Hoàng Giang", handle: "toiyeuVM", photo: "assets/img/team/giang.jpg", link: "https://www.facebook.com/toiyeuVM",
      role: { en: "Core team", vi: "Thành viên cốt cán" }, tags: "CapCut CPP, Topview CPP, Teammate CPP",
      highlights: { en: "Best Creative Idea, JAECOO J5: AI Film Challenge (Tam Thập Tứ Tuyệt Việt Nam 2026)\nGrew Instagram WORLDS IN 20 (@worldsin20.studio) to 6M views in under a month",
                    vi: "Giải Ý tưởng sáng tạo xuất sắc nhất, JAECOO J5: AI Film Challenge (Tam Thập Tứ Tuyệt Việt Nam 2026)\nKênh Instagram WORLDS IN 20 (@worldsin20.studio) đạt 6 triệu view trong chưa đầy 1 tháng" } },
    { name: "Xị Zital", handle: "xilamphimai", photo: "assets/img/team/xi.jpg", link: "https://www.facebook.com/xilamphimai",
      role: { en: "Core team", vi: "Thành viên cốt cán" }, tags: "CapCut CPP, Topview CPP, Teammate CPP, KOL Leader · Teammate",
      highlights: { en: "Organizer, VietFilm AI Talent with CapCut\nExpert advisor, JAECOO J5: AI Film Challenge\nKOL Leader, Teammate",
                    vi: "Tổ chức cuộc thi VietFilm AI Talent cùng CapCut\nCố vấn chuyên môn cuộc thi JAECOO J5: AI Film Challenge\nKOL Leader của Teammate" } },
    { name: "Huỳnh Quốc", handle: "Wolflucky", photo: "assets/img/team/quoc.jpg", link: "https://www.facebook.com/Wolflucky",
      role: { en: "Core team", vi: "Thành viên cốt cán" }, tags: "CapCut CPP, Topview CPP, Teammate CPP",
      highlights: { en: "1st Prize, Nguyễn Công PC, Season 1\n2nd Prize, Nguyễn Công PC, Season 2\nBest AI Technique, JAECOO J5: AI Film Challenge (Tam Thập Tứ Tuyệt Việt Nam 2026)",
                    vi: "Giải Nhất Nguyễn Công PC, Mùa 1\nGiải Nhì Nguyễn Công PC, Mùa 2\nGiải Kỹ thuật AI xuất sắc nhất, JAECOO J5: AI Film Challenge (Tam Thập Tứ Tuyệt Việt Nam 2026)" } },
    { name: "Trần Mạnh Cường", handle: "", photo: "assets/img/team/cuong.jpg", link: "",
      role: { en: "Core team · AI & Marketing", vi: "Thành viên cốt cán · AI & Marketing" },
      tags: { en: "Deputy Director · PIRO, AI & Marketing Lead", vi: "Phó Giám đốc · PIRO, Trưởng Ban AI & Marketing" },
      highlights: { en: "Deputy Director, PIRO Computer Co., Ltd.\nHead of AI & Marketing Projects\nBrings the business and marketing lens to every 189 LAB production",
                    vi: "Phó Giám đốc Công ty TNHH MTV Máy Tính PIRO\nTrưởng Ban Dự án AI & Marketing\nMang góc nhìn kinh doanh và marketing vào từng dự án của 189 LAB" } }
  ],

  /* ---------- NHẬN XÉT KHÁCH HÀNG (để quote rỗng thì ẩn) ---------- */
  testimonial: {
    quote: "",
    name: "",
    title: "",
    company: ""
  },

  /* ---------- KHÁCH HÀNG ----------
     Chỉ đưa logo khách ĐÃ ĐỒNG Ý công khai. Logo nên là PNG nền trong, màu trắng.
     0 logo: mục tự ẩn · 1–5 logo: 1 hàng lớn "Selected collaborations" · 6+ logo: lưới "Trusted by". */
  clients: [],

  /* ---------- LIÊN HỆ ---------- */
  contact: {
    email: "[hello@189lab.xxx]",
    phone: "[PHONE NUMBER]",
    address: { en: "[STREET ADDRESS], Ho Chi Minh City, Viet Nam", vi: "[ĐỊA CHỈ], TP. Hồ Chí Minh, Việt Nam" }
  },

  /* Để url "" thì mạng xã hội đó tự ẩn */
  socials: [
    { name: "VIMEO",     url: "" },
    { name: "YOUTUBE",   url: "" },
    { name: "INSTAGRAM", url: "" },
    { name: "LINKEDIN",  url: "" }
  ]
};
