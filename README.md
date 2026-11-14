# OSHRM — Open Source Human Resource Management

> **Nền tảng Quản trị Nhân sự Doanh nghiệp Mã nguồn mở toàn diện** — Chuẩn hóa quy trình từ Tuyển dụng, Hợp đồng Lao động đến Chấm công & Tiền lương.

**`License: MIT`** • **`React 19`** • **`TypeScript 5`** • **`Tailwind CSS 4`** • **`Microsoft SQL Server`**

[Tính năng cốt lõi](#tính-năng-cốt-lõi) • [Kiến trúc & Bảo mật](#kiến-trúc--bảo-mật) • [Cài đặt nhanh](#hướng-dẫn-cài-đặt--khởi-chạy) • [Tài khoản Demo](#tài-khoản-trải-nghiệm-nhanh-demo)

---

## Tổng quan Dự án

**OSHRM** được xây dựng nhằm giải quyết bài toán số hóa quản trị nguồn nhân lực cho các doanh nghiệp vừa và nhỏ tại Việt Nam. Hệ thống kết hợp trải nghiệm giao diện **SPA (Single Page Application)** mượt mà, cơ chế tùy biến thương hiệu **White-label** linh hoạt cùng thiết kế cơ sở dữ liệu quan hệ chuẩn mực trên **Microsoft SQL Server (MSSQL)**.

* **Điểm nhấn Open Source:** Bất kỳ doanh nghiệp nào cũng có thể tải mã nguồn về, tùy chỉnh **Tên công ty, Logo, Mã số thuế, Người đại diện và Màu chủ đạo** ngay trên giao diện quản trị để xuất ra các văn bản hành chính (Hợp đồng lao động, Phiếu lương) mang nhận diện riêng mà không cần chỉnh sửa code.

---

## Tính năng Cốt lõi

| Phân hệ | Mô tả chức năng chính |
| :--- | :--- |
| **Tùy biến Thương hiệu (White-label)** | Đổi tên doanh nghiệp, logo, mã số thuế, màu chủ đạo động; hỗ trợ xuất/nhập tệp cấu hình `.JSON`. |
| **Hồ sơ Nhân sự 360° (Core HR)** | Quản lý lý lịch, thông tin định danh pháp lý (CCCD, ngày cấp, nơi cấp, địa chỉ thường trú) và trạng thái nhân sự. |
| **Hợp đồng Lao động Pháp lý** | Quản lý vòng đời hợp đồng, cảnh báo sắp hết hạn; xem và in **Hợp đồng lao động chuẩn Bộ luật Lao động 2019**. |
| **Tuyển dụng (ATS)** | Đăng tin tuyển dụng, quản lý phễu ứng viên và tự động chuyển đổi ứng viên trúng tuyển thành nhân viên kèm hợp đồng thử việc. |
| **Chấm công & Nghỉ phép** | Check-in/Check-out trực tuyến, gửi và phê duyệt đơn nghỉ phép/tăng ca (OT), tự động cập nhật quỹ phép năm. |
| **Tính lương & Bảo hiểm (Payroll)** | Tự động tính lương thực nhận (Lương cứng + Phụ cấp + OT - 10.5% Bảo hiểm - Thuế TNCN), xuất Phiếu lương (Payslip). |
| **Đánh giá Hiệu suất (KPI)** | Giao mục tiêu theo chu kỳ và chấm điểm mức độ hoàn thành của từng nhân viên. |

---

## Kiến trúc & Bảo mật

Hệ thống được thiết kế với tư duy tách lớp rõ ràng và cơ chế bảo mật **2 tầng (Defense in Depth)**:

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND SPA (React + TypeScript)                │
│  ┌──────────────┐    ┌──────────────┐    ┌───────────────────────────┐  │
│  │ Starter Page │ ─► │  Login Page  │ ─► │    Role-Based UI Guard    │  │
│  └──────────────┘    └──────────────┘    └──────┬─────────────┬──────┘  │
│                                                 │             │         │
│                                        [Admin Workspace]  [ESS Portal]  │
└─────────────────────────────────────────────────┼─────────────┼─────────┘
                                                  ▼             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                   DATABASE LAYER (Microsoft SQL Server)                 │
│  • Hệ thống bảng chuẩn hóa & Ràng buộc toàn vẹn dữ liệu                 │
│  • Application RBAC: Users ─► UserRoles ─► Roles ─► RolePermissions     │
│  • Stored Procedure xác thực bảo mật: dbo.sp_AuthenticateUser           │
└─────────────────────────────────────────────────────────────────────────┘
```

### Cấu trúc Thư mục Dự án

```text
OSHRM/
├── database/
│   └── OSHRM_Database.sql      # Kịch bản T-SQL khởi tạo CSDL, dữ liệu mẫu & phân quyền RBAC
├── src/
│   ├── components/             # Giao diện Starter, Login, Layout và 9 phân hệ chức năng
│   ├── data/                   # Bộ dữ liệu mẫu (Seed Data) chuẩn nghiệp vụ Việt Nam
│   ├── store/                  # Quản lý trạng thái tập trung & lưu trữ cục bộ (Offline-first)
│   ├── types/                  # Định nghĩa kiểu dữ liệu TypeScript toàn hệ thống
│   └── utils/                  # Logic tính lương, thuế TNCN, bảo hiểm & Unit Tests
├── index.html
├── package.json
├── vite.config.ts
└── LICENSE                     # Giấy phép mã nguồn mở MIT
```

---

## Hướng dẫn Cài đặt & Khởi chạy

### 1. Chạy Ứng dụng Web (Frontend SPA)

```bash
# 1. Clone kho lưu trữ về máy cá nhân
git clone https://github.com<username-cua-ban>/OSHRM.git
cd OSHRM

# 2. Cài đặt các gói thư viện phụ thuộc
npm install --legacy-peer-deps

# 3. Khởi chạy máy chủ phát triển
npm run dev
```

> Mở trình duyệt và truy cập địa chỉ: **`http://localhost:3000`**

### 2. Khởi tạo Cơ sở dữ liệu trên Microsoft SQL Server (Tùy chọn)

1. Mở **SQL Server Management Studio (SSMS)** và kết nối tới SQL Server instance cục bộ.
2. Mở tệp [`database/OSHRM_Database.sql`](./database/OSHRM_Database.sql).
3. Nhấn **F5 (Execute)** để khởi tạo cơ sở dữ liệu `OSHRM_DB`, hệ thống bảng, dữ liệu mẫu và thủ tục xác thực phân quyền.

---

## Tài khoản Trải nghiệm Nhanh (Demo)

Hệ thống tích hợp sẵn các nút điền nhanh tài khoản trải nghiệm ngay tại trang Đăng nhập (Mật khẩu mặc định: `123456`):

| Vai trò | Mã nhân viên | Email đăng nhập | Phạm vi quyền hạn |
| :--- | :---: | :--- | :--- |
| **Quản trị viên HR (Admin)** | `NV-006` | `anh.nguyen@oshrm.vn` | Toàn quyền quản trị nhân sự, hợp đồng, bảng lương & cài đặt White-label |
| **Nhân viên (ESS)** | `NV-002` | `bao.tran@oshrm.vn` | Không gian cá nhân: xem hồ sơ, hợp đồng, chấm công, xin nghỉ phép & phiếu lương |

---

Phát hành dưới giấy phép mã nguồn mở **[MIT License](./LICENSE)** • Xây dựng dành cho cộng đồng Quản trị Nhân sự Việt Nam.
