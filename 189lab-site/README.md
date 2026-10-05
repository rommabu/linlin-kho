# 189 LAB — Website

Site tĩnh (HTML/CSS/JS thuần), không cần build. Chạy thẳng trên Netlify.

## 1. Đưa web lên Netlify (lần đầu, khoảng 3 phút)

1. Giải nén file zip, được thư mục `189lab-site`.
2. Vào https://app.netlify.com/drop và đăng nhập.
3. Kéo thả **cả thư mục `189lab-site`** vào ô "Drag and drop". Netlify sẽ trả về một link dạng `xxx.netlify.app`.
4. Vào **Site configuration → Site details → Change site name**, đặt tên, ví dụ `189lab`, để có link `189lab.netlify.app`.
5. Bật form liên hệ: vào **Forms → Enable form detection**, rồi kéo thả lại thư mục một lần nữa. Brief khách gửi sẽ hiện trong tab **Forms**. Muốn nhận brief qua email thì vào **Forms → Form notifications → Add notification → Email**.
6. Gắn tên miền riêng: vào **Domain management → Add a domain**. Netlify tự cấp HTTPS miễn phí.

## 2. Cập nhật nội dung (cách dễ nhất: trình soạn thảo)

1. Trong Finder, nhấp đúp **`editor.html`**. Trang mở trong Chrome hoặc Safari.
2. Bên trái là form, bên phải là web thật. Gõ đến đâu, web đổi đến đó.
   - Nút **Máy tính / Điện thoại** ở trên cùng để xem giao diện từng loại màn hình.
   - Nút **EN / VI** để xem bản tiếng Anh và tiếng Việt.
3. Sửa xong, bấm **Lưu thay đổi** (hoặc **Cmd+S**):
   - **Chrome:** lần đầu chọn thư mục `189lab-site/assets/js` và bấm "Cho phép sửa". Từ đó Cmd+S ghi đè thẳng, không hỏi lại.
   - **Safari:** file mới được tải về **Downloads**. Kéo nó vào `189lab-site/assets/js/` và chọn **Thay thế**.
4. Kéo thả cả thư mục `189lab-site` vào tab **Deploys** trên Netlify.

Lỡ đóng tab khi chưa lưu thì lần sau mở `editor.html` sẽ có nút **Mở lại bản nháp**.

## 2b. Sửa bằng tay (nâng cao)

Toàn bộ nội dung nằm trong **`assets/js/content.js`**. Mở bằng Notepad, TextEdit hoặc VS Code để sửa:

| Muốn đổi | Sửa ở đâu |
|---|---|
| Showreel | `showreel.url`: dán link Vimeo hoặc YouTube |
| 8 khung hình | `stills`: bỏ ảnh vào `assets/img/stills/`, rồi ghi đường dẫn vào `image` |
| Dự án | `projects`: mỗi dự án là 1 dòng; dự án mới đặt lên đầu |
| Logo khách | `clients`: bỏ PNG vào `assets/img/clients/` |
| Email, số điện thoại, địa chỉ, mạng xã hội | `contact`, `socials` |
| Câu chữ giao diện (EN/VI) | `assets/js/i18n.js` |

Ví dụ thêm một dự án:

```js
{ category: "tvc", title: "Oasis", client: "Brand X", format: "TVC · 30s", year: "2026",
  thumb: "assets/img/work/oasis.jpg", video: "https://vimeo.com/123456789" },
```

`category` nhận một trong bốn giá trị: `film`, `tvc`, `original`, `solution`.

Sửa xong thì kéo thả lại cả thư mục vào **Deploys** trên Netlify là web cập nhật.

## 3. Dùng link Google Drive

Mọi chỗ ghi ảnh hoặc video trong `content.js` đều nhận được link chia sẻ Google Drive. Cứ dán nguyên link, web tự chuyển đổi.

1. Trên Drive, bấm chuột phải vào file → **Chia sẻ** → **Quyền truy cập chung** → chọn **Bất kỳ ai có đường liên kết** (quyền Người xem).
2. Bấm **Sao chép đường liên kết**, rồi dán vào `content.js`, ví dụ:
   `video: "https://drive.google.com/file/d/1AbC.../view?usp=sharing"`

Hạn chế của Drive:
- **Video:** phát bằng trình phát của Google, không tự chạy và chất lượng thấp hơn Vimeo/YouTube. Khi lượt xem nhiều, Google có thể tạm chặn với thông báo "vượt quá hạn mức". Showreel chính vẫn nên để trên Vimeo hoặc YouTube (chế độ Không công khai).
- **Ảnh:** tải chậm hơn ảnh để trong thư mục web. Đây là cách hiển thị không chính thức của Google nên có thể thay đổi. Với 8 khung hình và ảnh bìa dự án, bỏ thẳng vào `assets/img/` vẫn là ổn định nhất.
- Không dùng link **thư mục** Drive, chỉ dùng link của **từng file**.

## 4. Lưu ý

- Ảnh nên xuất JPG hoặc WebP dưới 400KB để web tải nhanh.
- Showreel nên để trên Vimeo, không nên dùng file mp4 nặng: Netlify giới hạn băng thông ở gói miễn phí.
- Link chia sẻ Facebook/Zalo: khi đã có tên miền, sửa dòng `og:image` trong `index.html` thành link đầy đủ, ví dụ `https://189lab.com/assets/img/og-image.jpg`.
- Muốn xem thử trên máy trước khi đăng: mở `index.html` bằng trình duyệt là được. Riêng form chỉ hoạt động sau khi đã lên Netlify.

- `editor.html` cũng được đưa lên Netlify cùng web. Ai mở nó trên web thật cũng không sửa được site: mọi thay đổi chỉ nằm trên máy của người đó.
