<div align="center">

# OSHRM
### Open Source Human Resource Management

**Nền tảng Quản trị Nhân sự Doanh nghiệp Mã nguồn mở toàn diện — Chuẩn hóa quy trình từ Tuyển dụng, Hợp đồng Lao động đến Chấm công & Tiền lương**

[![License: MIT](https://shields.io)](./LICENSE)
[![React](https://shields.io)](https://react.dev)
[![TypeScript](https://shields.io)](https://typescriptlang.org)
[![Tailwind CSS](https://shields.io)](https://tailwindcss.com)
[![SQL Server](https://shields.io)](https://microsoft.com)

[Tính năng cốt lõi](#-tính-năng-cốt-lõi) • [Kiến trúc hệ thống](#-kiến-trúc--bảo-mật) • [Cài đặt nhanh](#-hướng-dẫn-cài-đặt--khởi-chạy) • [Tài khoản Demo](#-tài-khoản-trải-nghiệm-nhanh-demo)

</div>

---

## Tổng quan Dự án

**OSHRM** được xây dựng nhằm giải quyết bài toán số hóa quản trị nguồn nhân lực cho các doanh nghiệp vừa và nhỏ tại Việt Nam. Hệ thống kết hợp trải nghiệm giao diện **SPA (Single Page Application)** mượt mà, cơ chế tùy biến thương hiệu **White-label** linh hoạt cùng thiết kế cơ sở dữ liệu quan hệ chuẩn mực trên **Microsoft SQL Server (MSSQL)**.

> **Điểm nhấn Open Source:** Bất kỳ doanh nghiệp nào cũng có thể tải mã nguồn về, tùy chỉnh Tên công ty, Logo, Mã số thuế, Người đại diện và Màu chủ đạo ngay trên giao diện quản trị để xuất ra các văn bản hành chính (Hợp đồng lao động, Phiếu lương) mang nhận diện riêng mà không cần chỉnh sửa code.

---

## Tính năng Cốt lõi

<table>
  <tr>
    <td width="50%" valign="top">
      <h3>Quản trị Nhân sự & Pháp lý</h3>
      <ul>
        <li><b>Hồ sơ Nhân sự 360° (Core HR):</b> Quản lý lý lịch trích ngang, thông tin định danh pháp lý (CCCD, ngày cấp, nơi cấp, địa chỉ thường trú) và lịch sử công tác.</li>
        <li><b>Hợp đồng Lao động chuẩn Việt Nam:</b> Quản lý vòng đời hợp đồng, cảnh báo sắp hết hạn và <b>xem/in mẫu Hợp đồng lao động</b> tự động điền dữ liệu Bên A & Bên B theo Bộ luật Lao động 2019.</li>
        <li><b>Cơ cấu Tổ chức:</b> Thiết lập danh mục Chi nhánh, Phòng ban và Chức danh linh hoạt.</li>
      </ul>
    </td>
    <td width="50%" valign="top">
      <h3>Vận hành, Tuyển dụng & C&B</h3>
      <ul>
        <li><b>Tuyển dụng (ATS):</b> Quản lý tin tuyển dụng, theo dõi phễu ứng viên và tự động chuyển đổi ứng viên trúng tuyển thành nhân viên kèm hợp đồng thử việc.</li>
        <li><b>Chấm công & Nghỉ phép:</b> Check-in/Check-out trực tuyến, phê duyệt đơn nghỉ phép/tăng ca (OT) và tự động khấu trừ quỹ phép năm.</li>
        <li><b>Tính lương & KPI:</b> Tự động tính lương thực nhận (Lương cứng + Phụ cấp + OT - 10.5% Bảo hiểm - Thuế TNCN), xuất Phiếu lương (Payslip) và chấm điểm KPI.</li>
      </ul>
    </td>
  </tr>
</table>

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
│  • Hệ thống bảng chuẩn hóa (13+ Entities) & Ràng buộc toàn vẹn dữ liệu  │
│  • Application RBAC: Users ─► UserRoles ─► Roles ─► RolePermissions     │
│  • Stored Procedure xác thực bảo mật: dbo.sp_AuthenticateUser           │
└─────────────────────────────────────────────────────────────────────────┘
```

<details>
<summary><b>Xem chi tiết Cấu trúc Thư mục Dự án (Click để mở rộng)</b></summary>

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

</details>

---

## Hướng dẫn Cài đặt & Khởi chạy

### 1. Chạy Ứng dụng Web (Frontend SPA)

```bash
# 1. Clone kho lưu trữ về máy cá nhân
git clone https://github.com/AugustusLe2005/OSHRM.git
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

<div align="center">

Phát hành dưới giấy phép mã nguồn mở **[MIT License](./LICENSE)** • Xây dựng với đam mê dành cho cộng đồng Quản trị Nhân sự Việt Nam.

</div>
