# AI Film Studio

Web app quản lý dự án làm phim bằng AI: kịch bản & nhân vật, phân cảnh & shot list,
soạn/lưu/export prompt Seedance theo SEQ, và theo dõi continuity & tài sản (assets)
xuyên suốt dự án.

## Kiến trúc

- **Backend:** Node.js + Express, lưu dữ liệu trong SQLite (`better-sqlite3`),
  REST API dưới `/api`.
- **Frontend:** SPA thuần HTML/CSS/JS (không framework), điều hướng bằng
  `location.hash`, gọi API qua `fetch`.
- **Database:** file SQLite tại `data/studio.db`, tự tạo khi chạy lần đầu.

## Cài đặt & chạy

```bash
npm install
npm start
```

Mặc định chạy tại `http://localhost:3000` (đổi bằng biến môi trường `PORT`).

## Cấu trúc dữ liệu

- **Project**: tên, logline, synopsis, style bible, trạng thái.
- **Character**: want / need / contradiction / visual DNA (theo tinh thần character-logic).
- **Scene (SEQ)**: số thứ tự, bối cảnh, thời điểm, tóm tắt.
- **Shot**: cỡ cảnh, camera, mô tả hành động, cảm xúc Inner/Mask/Leak, ghi chú B-roll,
  thời lượng (giây).
- **Prompt**: nội dung prompt Seedance cho từng shot, có versioning, đếm ký tự
  (cảnh báo khi vượt 20.000 ký tự), đánh dấu bản cuối (`is_final`).
- **Asset**: nhân vật / prop / bối cảnh, trạng thái, lần xuất hiện đầu tiên.
- **Continuity note**: setup / payoff / issue, gắn với 1 cảnh, trạng thái đã xử lý
  hay chưa.

## Tính năng chính

1. **Quản lý dự án & kịch bản** — tạo nhiều dự án, mỗi dự án có logline, synopsis,
   style bible và danh sách nhân vật.
2. **Phân cảnh & shot list** — chia kịch bản thành SEQ → shot, gắn camera, cảm xúc,
   và ghi chú B-roll cần thiết ngay trong từng shot để giảm việc bổ sung hậu kỳ.
3. **Trình soạn prompt Seedance** — soạn prompt cho từng shot với bộ đếm ký tự
   (giới hạn 20.000 ký tự/khoảng trắng/xuống dòng), lưu nhiều phiên bản, và nút
   "Ghép prompt cả SEQ" để nối các shot liên tiếp thành 1 prompt liền mạch dán
   thẳng vào Seedance UI.
4. **Continuity & Assets** — theo dõi tài sản (nhân vật/prop/bối cảnh) và ghi chú
   setup/payoff để phát hiện thiếu sót trước khi sản xuất.

## API tóm tắt

Tất cả endpoint nằm dưới `/api`. Xem chi tiết trong `server/routes/`:

- `projects.js` — CRUD dự án + `/summary`
- `characters.js` — CRUD nhân vật theo dự án
- `scenes.js` — CRUD SEQ/cảnh theo dự án
- `shots.js` — CRUD shot theo SEQ
- `prompts.js` — CRUD prompt theo shot + `/scenes/:id/export-prompt`
- `assets.js` — CRUD tài sản theo dự án
- `continuity.js` — CRUD ghi chú continuity theo dự án
