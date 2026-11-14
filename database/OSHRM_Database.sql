/* ============================================================================
   OSHRM - Open Source Human Resource Management
   File: OSHRM_Full_Database.sql
   Target DBMS: Microsoft SQL Server 2016+ (SSMS)
   Mật khẩu mặc định cho toàn bộ tài khoản Demo: 123456
   ============================================================================ */

IF DB_ID(N'OSHRM_DB') IS NULL
BEGIN
    CREATE DATABASE [OSHRM_DB];
END
GO

USE [OSHRM_DB];
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

/* ============================================================================
   0. DỌN DẸP OBJECT CŨ (CHO PHÉP CHẠY LẠI SCRIPT NHIỀU LẦN AN TOÀN)
   ============================================================================ */
IF OBJECT_ID(N'dbo.sp_AuthenticateUser', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_AuthenticateUser;
GO

IF OBJECT_ID(N'dbo.UserRoles', N'U')        IS NOT NULL DROP TABLE dbo.UserRoles;
IF OBJECT_ID(N'dbo.RolePermissions', N'U')  IS NOT NULL DROP TABLE dbo.RolePermissions;
IF OBJECT_ID(N'dbo.Permissions', N'U')      IS NOT NULL DROP TABLE dbo.Permissions;
IF OBJECT_ID(N'dbo.Roles', N'U')            IS NOT NULL DROP TABLE dbo.Roles;
IF OBJECT_ID(N'dbo.Users', N'U')            IS NOT NULL DROP TABLE dbo.Users;

IF OBJECT_ID(N'dbo.EmployeeKPIs', N'U')     IS NOT NULL DROP TABLE dbo.EmployeeKPIs;
IF OBJECT_ID(N'dbo.Payslips', N'U')         IS NOT NULL DROP TABLE dbo.Payslips;
IF OBJECT_ID(N'dbo.LeaveRequests', N'U')    IS NOT NULL DROP TABLE dbo.LeaveRequests;
IF OBJECT_ID(N'dbo.AttendanceLogs', N'U')   IS NOT NULL DROP TABLE dbo.AttendanceLogs;
IF OBJECT_ID(N'dbo.Candidates', N'U')       IS NOT NULL DROP TABLE dbo.Candidates;
IF OBJECT_ID(N'dbo.JobPostings', N'U')      IS NOT NULL DROP TABLE dbo.JobPostings;
IF OBJECT_ID(N'dbo.LaborContracts', N'U')   IS NOT NULL DROP TABLE dbo.LaborContracts;
IF OBJECT_ID(N'dbo.Employees', N'U')        IS NOT NULL DROP TABLE dbo.Employees;
IF OBJECT_ID(N'dbo.Positions', N'U')        IS NOT NULL DROP TABLE dbo.Positions;
IF OBJECT_ID(N'dbo.Departments', N'U')      IS NOT NULL DROP TABLE dbo.Departments;
IF OBJECT_ID(N'dbo.Branches', N'U')         IS NOT NULL DROP TABLE dbo.Branches;
IF OBJECT_ID(N'dbo.SystemSettings', N'U')   IS NOT NULL DROP TABLE dbo.SystemSettings;
GO

/* ============================================================================
   1. TẠO CÁC BẢNG CẤU HÌNH, CƠ CẤU TỔ CHỨC & NGHIỆP VỤ HRM
   ============================================================================ */

-- 1.1. SystemSettings (Cấu hình White-label Hệ thống)
CREATE TABLE dbo.SystemSettings (
    SettingId                 INT            NOT NULL IDENTITY(1,1),
    OrganizationName          NVARCHAR(120)  NOT NULL,
    Slogan                    NVARCHAR(200)  NOT NULL,
    TaxCode                   NVARCHAR(32)   NOT NULL,
    Address                   NVARCHAR(300)  NOT NULL,
    Phone                     NVARCHAR(32)   NOT NULL,
    LegalRepresentative       NVARCHAR(120)  NOT NULL,
    LegalRepresentativeTitle  NVARCHAR(120)  NOT NULL,
    ThemeColor                NVARCHAR(16)   NOT NULL CONSTRAINT DF_SystemSettings_ThemeColor DEFAULT (N'#2563eb'),
    LogoIcon                  NVARCHAR(32)   NOT NULL CONSTRAINT DF_SystemSettings_LogoIcon DEFAULT (N'building'),
    CustomLogoUrl             NVARCHAR(500)  NULL,
    UpdatedAt                 DATETIME2(0)   NOT NULL CONSTRAINT DF_SystemSettings_UpdatedAt DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT PK_SystemSettings PRIMARY KEY CLUSTERED (SettingId),
    CONSTRAINT CK_SystemSettings_LogoIcon CHECK (
        LogoIcon IN (N'building', N'layers', N'shield', N'globe', N'cpu', N'briefcase', N'compass', N'award')
    )
);
GO

-- 1.2. Branches (Chi nhánh / Trụ sở - Bảng cha liên kết Departments, Employees, ATS)
CREATE TABLE dbo.Branches (
    BranchId        NVARCHAR(32)   NOT NULL,
    Code            NVARCHAR(32)   NOT NULL,
    Name            NVARCHAR(150)  NOT NULL,
    Address         NVARCHAR(300)  NOT NULL,
    Phone           NVARCHAR(32)   NOT NULL,
    IsHeadquarters  BIT            NOT NULL CONSTRAINT DF_Branches_IsHQ DEFAULT (0),
    CONSTRAINT PK_Branches PRIMARY KEY CLUSTERED (BranchId),
    CONSTRAINT UQ_Branches_Code UNIQUE (Code)
);
GO

-- 1.3. Departments (Phòng ban)
CREATE TABLE dbo.Departments (
    DepartmentId  NVARCHAR(32)   NOT NULL,
    Code          NVARCHAR(32)   NOT NULL,
    Name          NVARCHAR(150)  NOT NULL,
    BranchId      NVARCHAR(32)   NOT NULL,
    ManagerName   NVARCHAR(120)  NOT NULL,
    Description   NVARCHAR(500)  NOT NULL,
    CONSTRAINT PK_Departments PRIMARY KEY CLUSTERED (DepartmentId),
    CONSTRAINT UQ_Departments_Code UNIQUE (Code),
    CONSTRAINT FK_Departments_Branches FOREIGN KEY (BranchId)
        REFERENCES dbo.Branches (BranchId) ON DELETE NO ACTION
);
GO

-- 1.4. Positions (Chức danh / Vị trí công việc)
CREATE TABLE dbo.Positions (
    PositionId    NVARCHAR(32)   NOT NULL,
    Code          NVARCHAR(32)   NOT NULL,
    Title         NVARCHAR(150)  NOT NULL,
    DepartmentId  NVARCHAR(32)   NOT NULL,
    Level         NVARCHAR(80)   NOT NULL,
    SalaryRange   NVARCHAR(120)  NOT NULL,
    CONSTRAINT PK_Positions PRIMARY KEY CLUSTERED (PositionId),
    CONSTRAINT UQ_Positions_Code UNIQUE (Code),
    CONSTRAINT FK_Positions_Departments FOREIGN KEY (DepartmentId)
        REFERENCES dbo.Departments (DepartmentId) ON DELETE NO ACTION
);
GO

-- 1.5. Employees (Hồ sơ nhân sự - Core HR)
CREATE TABLE dbo.Employees (
    EmployeeId            NVARCHAR(32)    NOT NULL,
    Code                  NVARCHAR(32)    NOT NULL,
    FullName              NVARCHAR(150)   NOT NULL,
    Email                 NVARCHAR(150)   NOT NULL,
    Phone                 NVARCHAR(32)    NOT NULL,
    Gender                NVARCHAR(10)    NOT NULL,
    DateOfBirth           DATE            NOT NULL,
    NationalId            NVARCHAR(32)    NOT NULL,
    NationalIdIssueDate   DATE            NOT NULL,
    NationalIdIssuePlace  NVARCHAR(200)   NOT NULL,
    Address               NVARCHAR(300)   NOT NULL,
    DepartmentId          NVARCHAR(32)    NOT NULL,
    PositionId            NVARCHAR(32)    NOT NULL,
    BranchId              NVARCHAR(32)    NOT NULL,
    JoinDate              DATE            NOT NULL,
    ContractType          NVARCHAR(80)    NOT NULL,
    ContractCode          NVARCHAR(50)    NOT NULL,
    ContractStartDate     DATE            NOT NULL,
    ContractEndDate       DATE            NULL, -- NULL = Không thời hạn
    BaseSalary            DECIMAL(18, 2)  NOT NULL,
    Allowance             DECIMAL(18, 2)  NOT NULL CONSTRAINT DF_Employees_Allowance DEFAULT (0),
    Dependents            INT             NOT NULL CONSTRAINT DF_Employees_Dependents DEFAULT (0),
    AnnualLeaveTotal      INT             NOT NULL CONSTRAINT DF_Employees_LeaveTotal DEFAULT (12),
    AnnualLeaveRemaining  INT             NOT NULL CONSTRAINT DF_Employees_LeaveRem DEFAULT (12),
    BankAccount           NVARCHAR(64)    NOT NULL,
    BankName              NVARCHAR(100)   NOT NULL,
    Status                NVARCHAR(40)    NOT NULL,
    CONSTRAINT PK_Employees PRIMARY KEY CLUSTERED (EmployeeId),
    CONSTRAINT UQ_Employees_Code UNIQUE (Code),
    CONSTRAINT UQ_Employees_Email UNIQUE (Email),
    CONSTRAINT UQ_Employees_NationalId UNIQUE (NationalId),
    CONSTRAINT FK_Employees_Departments FOREIGN KEY (DepartmentId)
        REFERENCES dbo.Departments (DepartmentId) ON DELETE NO ACTION,
    CONSTRAINT FK_Employees_Positions FOREIGN KEY (PositionId)
        REFERENCES dbo.Positions (PositionId) ON DELETE NO ACTION,
    CONSTRAINT FK_Employees_Branches FOREIGN KEY (BranchId)
        REFERENCES dbo.Branches (BranchId) ON DELETE NO ACTION,
    CONSTRAINT CK_Employees_Gender CHECK (Gender IN (N'Nam', N'Nữ')),
    CONSTRAINT CK_Employees_Status CHECK (Status IN (N'Đang làm việc', N'Thử việc', N'Nghỉ việc')),
    CONSTRAINT CK_Employees_ContractType CHECK (
        ContractType IN (
            N'HĐLĐ Không xác định thời hạn',
            N'HĐLĐ 24 tháng',
            N'HĐLĐ 12 tháng',
            N'Hợp đồng Thử việc 2 tháng'
        )
    ),
    CONSTRAINT CK_Employees_Salary CHECK (BaseSalary >= 0 AND Allowance >= 0)
);
GO

-- 1.6. LaborContracts (Hợp đồng lao động chuẩn hành chính VN)
CREATE TABLE dbo.LaborContracts (
    ContractId         NVARCHAR(32)    NOT NULL,
    ContractNumber     NVARCHAR(50)    NOT NULL,
    EmployeeId         NVARCHAR(32)    NOT NULL,
    ContractType       NVARCHAR(60)    NOT NULL,
    StartDate          DATE            NOT NULL,
    EndDate            DATE            NULL, -- NULL = Không thời hạn
    BaseSalary         DECIMAL(18, 2)  NOT NULL,
    Allowance          DECIMAL(18, 2)  NOT NULL CONSTRAINT DF_LaborContracts_Allowance DEFAULT (0),
    PaymentMethod      NVARCHAR(60)    NOT NULL,
    PayDay             INT             NOT NULL,
    WorkLocation       NVARCHAR(300)   NOT NULL,
    JobDuties          NVARCHAR(1000)  NULL,
    SignedDate         DATE            NOT NULL,
    StatusOverride     NVARCHAR(40)    NULL,
    TerminatedDate     DATE            NULL,
    TerminationReason  NVARCHAR(300)   NULL,
    CONSTRAINT PK_LaborContracts PRIMARY KEY CLUSTERED (ContractId),
    CONSTRAINT UQ_LaborContracts_Number UNIQUE (ContractNumber),
    CONSTRAINT FK_LaborContracts_Employees FOREIGN KEY (EmployeeId)
        REFERENCES dbo.Employees (EmployeeId) ON DELETE NO ACTION,
    CONSTRAINT CK_LaborContracts_Type CHECK (
        ContractType IN (
            N'Thử việc 2 tháng',
            N'Xác định thời hạn 12 tháng',
            N'Xác định thời hạn 24 tháng',
            N'Không xác định thời hạn'
        )
    ),
    CONSTRAINT CK_LaborContracts_PayMethod CHECK (
        PaymentMethod IN (N'Chuyển khoản ngân hàng', N'Tiền mặt')
    ),
    CONSTRAINT CK_LaborContracts_PayDay CHECK (PayDay BETWEEN 1 AND 31),
    CONSTRAINT CK_LaborContracts_StatusOverride CHECK (
        StatusOverride IS NULL OR StatusOverride IN (N'Đã thanh lý')
    )
);
GO

-- 1.7. JobPostings (Tin tuyển dụng - ATS)
CREATE TABLE dbo.JobPostings (
    JobPostingId  NVARCHAR(32)   NOT NULL,
    Code          NVARCHAR(40)   NOT NULL,
    PositionId    NVARCHAR(32)   NOT NULL,
    DepartmentId  NVARCHAR(32)   NOT NULL,
    BranchId      NVARCHAR(32)   NOT NULL,
    Headcount     INT            NOT NULL,
    SalaryRange   NVARCHAR(120)  NOT NULL,
    Deadline      DATE           NOT NULL,
    Status        NVARCHAR(30)   NOT NULL,
    Description   NVARCHAR(1000) NOT NULL,
    CreatedAt     DATE           NOT NULL,
    CONSTRAINT PK_JobPostings PRIMARY KEY CLUSTERED (JobPostingId),
    CONSTRAINT UQ_JobPostings_Code UNIQUE (Code),
    CONSTRAINT FK_JobPostings_Positions FOREIGN KEY (PositionId)
        REFERENCES dbo.Positions (PositionId) ON DELETE NO ACTION,
    CONSTRAINT FK_JobPostings_Departments FOREIGN KEY (DepartmentId)
        REFERENCES dbo.Departments (DepartmentId) ON DELETE NO ACTION,
    CONSTRAINT FK_JobPostings_Branches FOREIGN KEY (BranchId)
        REFERENCES dbo.Branches (BranchId) ON DELETE NO ACTION,
    CONSTRAINT CK_JobPostings_Status CHECK (Status IN (N'Đang tuyển', N'Tạm dừng', N'Đã đóng')),
    CONSTRAINT CK_JobPostings_Headcount CHECK (Headcount > 0)
);
GO

-- 1.8. Candidates (Hồ sơ ứng viên - ATS)
CREATE TABLE dbo.Candidates (
    CandidateId          NVARCHAR(32)    NOT NULL,
    JobPostingId         NVARCHAR(32)    NULL,
    FullName             NVARCHAR(150)   NOT NULL,
    Email                NVARCHAR(150)   NOT NULL,
    Phone                NVARCHAR(32)    NOT NULL,
    AppliedPositionId    NVARCHAR(32)    NOT NULL,
    AppliedDepartmentId  NVARCHAR(32)    NOT NULL,
    AppliedBranchId      NVARCHAR(32)    NOT NULL,
    Source               NVARCHAR(80)    NOT NULL,
    ExpectedSalary       DECIMAL(18, 2)  NOT NULL,
    AppliedDate          DATE            NOT NULL,
    InterviewDate        DATE            NULL,
    Notes                NVARCHAR(1000)  NOT NULL,
    Stage                NVARCHAR(40)    NOT NULL,
    ConvertedEmployeeId  NVARCHAR(32)    NULL,
    CONSTRAINT PK_Candidates PRIMARY KEY CLUSTERED (CandidateId),
    CONSTRAINT FK_Candidates_JobPostings FOREIGN KEY (JobPostingId)
        REFERENCES dbo.JobPostings (JobPostingId) ON DELETE NO ACTION,
    CONSTRAINT FK_Candidates_Positions FOREIGN KEY (AppliedPositionId)
        REFERENCES dbo.Positions (PositionId) ON DELETE NO ACTION,
    CONSTRAINT FK_Candidates_Departments FOREIGN KEY (AppliedDepartmentId)
        REFERENCES dbo.Departments (DepartmentId) ON DELETE NO ACTION,
    CONSTRAINT FK_Candidates_Branches FOREIGN KEY (AppliedBranchId)
        REFERENCES dbo.Branches (BranchId) ON DELETE NO ACTION,
    CONSTRAINT FK_Candidates_ConvertedEmployee FOREIGN KEY (ConvertedEmployeeId)
        REFERENCES dbo.Employees (EmployeeId) ON DELETE NO ACTION,
    CONSTRAINT CK_Candidates_Stage CHECK (Stage IN (N'Mới ứng tuyển', N'Phỏng vấn', N'Trúng tuyển'))
);
GO

-- 1.9. AttendanceLogs (Chấm công hàng ngày)
CREATE TABLE dbo.AttendanceLogs (
    AttendanceId    NVARCHAR(40)   NOT NULL,
    EmployeeId      NVARCHAR(32)   NOT NULL,
    AttendanceDate  DATE           NOT NULL,
    CheckInTime     TIME(0)        NULL,
    CheckOutTime    TIME(0)        NULL,
    WorkHours       DECIMAL(5, 2)  NOT NULL CONSTRAINT DF_AttendanceLogs_WorkHours DEFAULT (0),
    Status          NVARCHAR(30)   NOT NULL,
    Note            NVARCHAR(300)  NULL,
    CONSTRAINT PK_AttendanceLogs PRIMARY KEY CLUSTERED (AttendanceId),
    CONSTRAINT UQ_AttendanceLogs_EmpDate UNIQUE (EmployeeId, AttendanceDate),
    CONSTRAINT FK_AttendanceLogs_Employees FOREIGN KEY (EmployeeId)
        REFERENCES dbo.Employees (EmployeeId) ON DELETE NO ACTION,
    CONSTRAINT CK_AttendanceLogs_Status CHECK (Status IN (N'Đúng giờ', N'Đi muộn', N'Nghỉ phép'))
);
GO

-- 1.10. LeaveRequests (Đơn xin nghỉ phép & Tăng ca OT)
CREATE TABLE dbo.LeaveRequests (
    RequestId             NVARCHAR(32)   NOT NULL,
    EmployeeId            NVARCHAR(32)   NOT NULL,
    Type                  NVARCHAR(40)   NOT NULL,
    StartDate             DATE           NOT NULL,
    EndDate               DATE           NOT NULL,
    Days                  DECIMAL(4, 1)  NOT NULL CONSTRAINT DF_LeaveRequests_Days DEFAULT (0),
    OtHours               DECIMAL(5, 2)  NOT NULL CONSTRAINT DF_LeaveRequests_OtHours DEFAULT (0),
    Reason                NVARCHAR(500)  NOT NULL,
    Status                NVARCHAR(30)   NOT NULL CONSTRAINT DF_LeaveRequests_Status DEFAULT (N'Chờ duyệt'),
    CreatedAt             DATE           NOT NULL,
    ReviewedBy            NVARCHAR(150)  NULL,
    ReviewedByEmployeeId  NVARCHAR(32)   NULL,
    ReviewedAt            DATE           NULL,
    CONSTRAINT PK_LeaveRequests PRIMARY KEY CLUSTERED (RequestId),
    CONSTRAINT FK_LeaveRequests_Employees FOREIGN KEY (EmployeeId)
        REFERENCES dbo.Employees (EmployeeId) ON DELETE NO ACTION,
    CONSTRAINT FK_LeaveRequests_Reviewer FOREIGN KEY (ReviewedByEmployeeId)
        REFERENCES dbo.Employees (EmployeeId) ON DELETE NO ACTION,
    CONSTRAINT CK_LeaveRequests_Type CHECK (Type IN (N'Nghỉ phép năm', N'Nghỉ không lương', N'Tăng ca (OT)')),
    CONSTRAINT CK_LeaveRequests_Status CHECK (Status IN (N'Chờ duyệt', N'Đã duyệt', N'Từ chối'))
);
GO

-- 1.11. Payslips (Phiếu lương hàng tháng)
CREATE TABLE dbo.Payslips (
    PayslipId           NVARCHAR(40)    NOT NULL,
    EmployeeId          NVARCHAR(32)    NOT NULL,
    EmployeeCode        NVARCHAR(32)    NOT NULL,
    FullName            NVARCHAR(150)   NOT NULL,
    DepartmentName      NVARCHAR(150)   NOT NULL,
    PositionTitle       NVARCHAR(150)   NOT NULL,
    PayMonth            CHAR(7)         NOT NULL, -- Định dạng YYYY-MM
    StandardWorkDays    INT             NOT NULL CONSTRAINT DF_Payslips_StdDays DEFAULT (22),
    ActualWorkDays      INT             NOT NULL CONSTRAINT DF_Payslips_ActDays DEFAULT (22),
    BaseSalary          DECIMAL(18, 2)  NOT NULL,
    Allowance           DECIMAL(18, 2)  NOT NULL,
    ApprovedOtHours     DECIMAL(6, 2)   NOT NULL CONSTRAINT DF_Payslips_OtHours DEFAULT (0),
    OtPay               DECIMAL(18, 2)  NOT NULL CONSTRAINT DF_Payslips_OtPay DEFAULT (0),
    GrossSalary         DECIMAL(18, 2)  NOT NULL,
    InsuranceDeduction  DECIMAL(18, 2)  NOT NULL, -- 10.5% (8% BHXH + 1.5% BHYT + 1% BHTN)
    PersonalDeduction   DECIMAL(18, 2)  NOT NULL, -- 11,000,000 VND
    DependentDeduction  DECIMAL(18, 2)  NOT NULL, -- Dependents * 4,400,000 VND
    TaxableIncome       DECIMAL(18, 2)  NOT NULL,
    PersonalIncomeTax   DECIMAL(18, 2)  NOT NULL, -- Thuế TNCN lũy tiến 7 bậc
    NetSalary           DECIMAL(18, 2)  NOT NULL,
    CreatedAt           DATETIME2(0)    NOT NULL CONSTRAINT DF_Payslips_CreatedAt DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT PK_Payslips PRIMARY KEY CLUSTERED (PayslipId),
    CONSTRAINT UQ_Payslips_EmpMonth UNIQUE (EmployeeId, PayMonth),
    CONSTRAINT FK_Payslips_Employees FOREIGN KEY (EmployeeId)
        REFERENCES dbo.Employees (EmployeeId) ON DELETE NO ACTION
);
GO

-- 1.12. EmployeeKPIs (Đánh giá KPI nhân sự)
CREATE TABLE dbo.EmployeeKPIs (
    KpiId              NVARCHAR(32)    NOT NULL,
    EmployeeId         NVARCHAR(32)    NOT NULL,
    Quarter            NVARCHAR(20)    NOT NULL,
    Title              NVARCHAR(250)   NOT NULL,
    Category           NVARCHAR(100)   NOT NULL,
    TargetValue        DECIMAL(18, 2)  NOT NULL,
    ActualValue        DECIMAL(18, 2)  NOT NULL,
    Unit               NVARCHAR(40)    NOT NULL,
    Weight             INT             NOT NULL, -- %
    CompletionPercent  INT             NOT NULL, -- 0 - 150
    Deadline           DATE            NOT NULL,
    EvaluatorNote      NVARCHAR(500)   NOT NULL,
    CONSTRAINT PK_EmployeeKPIs PRIMARY KEY CLUSTERED (KpiId),
    CONSTRAINT FK_EmployeeKPIs_Employees FOREIGN KEY (EmployeeId)
        REFERENCES dbo.Employees (EmployeeId) ON DELETE NO ACTION,
    CONSTRAINT CK_EmployeeKPIs_Weight CHECK (Weight BETWEEN 0 AND 100),
    CONSTRAINT CK_EmployeeKPIs_Completion CHECK (CompletionPercent BETWEEN 0 AND 200)
);
GO

/* ============================================================================
   2. HỆ THỐNG XÁC THỰC & PHÂN QUYỀN RBAC
   ============================================================================ */

-- 2.1. Users (Tài khoản đăng nhập gắn 1-1 với nhân viên)
CREATE TABLE dbo.Users (
    UserId        NVARCHAR(32)      NOT NULL,
    EmployeeId    NVARCHAR(32)      NOT NULL,
    Username      NVARCHAR(150)     NOT NULL, -- Email công việc
    EmployeeCode  NVARCHAR(32)      NOT NULL, -- Mã nhân viên (hỗ trợ đăng nhập bằng Email hoặc Mã NV)
    PasswordSalt  UNIQUEIDENTIFIER  NOT NULL CONSTRAINT DF_Users_Salt DEFAULT (NEWID()),
    PasswordHash  VARBINARY(32)     NOT NULL, -- SHA2_256(Salt + ':' + Password)
    IsActive      BIT               NOT NULL CONSTRAINT DF_Users_IsActive DEFAULT (1),
    LastLoginAt   DATETIME2(0)      NULL,
    CreatedAt     DATETIME2(0)      NOT NULL CONSTRAINT DF_Users_CreatedAt DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT PK_Users PRIMARY KEY CLUSTERED (UserId),
    CONSTRAINT UQ_Users_EmployeeId UNIQUE (EmployeeId),
    CONSTRAINT UQ_Users_Username UNIQUE (Username),
    CONSTRAINT UQ_Users_EmployeeCode UNIQUE (EmployeeCode),
    CONSTRAINT FK_Users_Employees FOREIGN KEY (EmployeeId)
        REFERENCES dbo.Employees (EmployeeId) ON DELETE NO ACTION
);
GO

-- 2.2. Roles (Vai trò hệ thống: admin, ess)
CREATE TABLE dbo.Roles (
    RoleId       NVARCHAR(32)   NOT NULL,
    RoleCode     NVARCHAR(32)   NOT NULL,
    RoleName     NVARCHAR(100)  NOT NULL,
    Description  NVARCHAR(300)  NOT NULL,
    CONSTRAINT PK_Roles PRIMARY KEY CLUSTERED (RoleId),
    CONSTRAINT UQ_Roles_RoleCode UNIQUE (RoleCode)
);
GO

-- 2.3. Permissions (Danh mục phân hệ / quyền truy cập tương ứng NavSection)
CREATE TABLE dbo.Permissions (
    PermissionId  NVARCHAR(32)   NOT NULL,
    ModuleCode    NVARCHAR(32)   NOT NULL,
    ModuleName    NVARCHAR(120)  NOT NULL,
    IsAdminOnly   BIT            NOT NULL CONSTRAINT DF_Permissions_AdminOnly DEFAULT (0),
    Description   NVARCHAR(300)  NOT NULL,
    CONSTRAINT PK_Permissions PRIMARY KEY CLUSTERED (PermissionId),
    CONSTRAINT UQ_Permissions_ModuleCode UNIQUE (ModuleCode)
);
GO

-- 2.4. RolePermissions (Phân quyền Vai trò -> Phân hệ)
CREATE TABLE dbo.RolePermissions (
    RoleId        NVARCHAR(32)  NOT NULL,
    PermissionId  NVARCHAR(32)  NOT NULL,
    CONSTRAINT PK_RolePermissions PRIMARY KEY CLUSTERED (RoleId, PermissionId),
    CONSTRAINT FK_RolePermissions_Roles FOREIGN KEY (RoleId)
        REFERENCES dbo.Roles (RoleId) ON DELETE CASCADE,
    CONSTRAINT FK_RolePermissions_Permissions FOREIGN KEY (PermissionId)
        REFERENCES dbo.Permissions (PermissionId) ON DELETE CASCADE
);
GO

-- 2.5. UserRoles (Gán vai trò cho tài khoản người dùng)
CREATE TABLE dbo.UserRoles (
    UserId      NVARCHAR(32)  NOT NULL,
    RoleId      NVARCHAR(32)  NOT NULL,
    AssignedAt  DATETIME2(0)  NOT NULL CONSTRAINT DF_UserRoles_AssignedAt DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT PK_UserRoles PRIMARY KEY CLUSTERED (UserId, RoleId),
    CONSTRAINT FK_UserRoles_Users FOREIGN KEY (UserId)
        REFERENCES dbo.Users (UserId) ON DELETE CASCADE,
    CONSTRAINT FK_UserRoles_Roles FOREIGN KEY (RoleId)
        REFERENCES dbo.Roles (RoleId) ON DELETE CASCADE
);
GO

-- Index hỗ trợ tìm kiếm nhanh khi đăng nhập bằng Email hoặc Mã NV
CREATE NONCLUSTERED INDEX IX_Users_Username_Code ON dbo.Users (Username, EmployeeCode);
CREATE NONCLUSTERED INDEX IX_Employees_Dept_Status ON dbo.Employees (DepartmentId, Status);
CREATE NONCLUSTERED INDEX IX_LaborContracts_Emp_EndDate ON dbo.LaborContracts (EmployeeId, EndDate);
GO

/* ============================================================================
   3. STORED PROCEDURE ĐĂNG NHẬP & KIỂM TRA PHÂN QUYỀN: sp_AuthenticateUser
   ============================================================================ */
CREATE PROCEDURE dbo.sp_AuthenticateUser
    @Identifier NVARCHAR(150), -- Email công việc hoặc Mã nhân viên (VD: anh.nguyen@oshrm.vn hoặc NV-006)
    @Password   NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @CleanId NVARCHAR(150) = LOWER(LTRIM(RTRIM(ISNULL(@Identifier, N''))));

    IF @CleanId = N''
    BEGIN
        SELECT
            CAST(0 AS BIT) AS Success,
            N'Vui lòng nhập Email công việc hoặc Mã nhân viên.' AS ErrorMessage;
        RETURN;
    END

    IF @Password IS NULL OR @Password = N''
    BEGIN
        SELECT
            CAST(0 AS BIT) AS Success,
            N'Vui lòng nhập mật khẩu đăng nhập.' AS ErrorMessage;
        RETURN;
    END

    DECLARE
        @UserId       NVARCHAR(32),
        @EmployeeId   NVARCHAR(32),
        @EmployeeCode NVARCHAR(32),
        @FullName     NVARCHAR(150),
        @Email        NVARCHAR(150),
        @DepartmentId NVARCHAR(32),
        @EmpStatus    NVARCHAR(40),
        @IsActive     BIT,
        @Salt         UNIQUEIDENTIFIER,
        @StoredHash   VARBINARY(32),
        @InputHash    VARBINARY(32),
        @RoleId       NVARCHAR(32),
        @RoleName     NVARCHAR(100);

    SELECT TOP (1)
        @UserId       = u.UserId,
        @EmployeeId   = e.EmployeeId,
        @EmployeeCode = e.Code,
        @FullName     = e.FullName,
        @Email        = e.Email,
        @DepartmentId = e.DepartmentId,
        @EmpStatus    = e.Status,
        @IsActive     = u.IsActive,
        @Salt         = u.PasswordSalt,
        @StoredHash   = u.PasswordHash
    FROM dbo.Users u
    INNER JOIN dbo.Employees e ON e.EmployeeId = u.EmployeeId
    WHERE LOWER(u.Username) = @CleanId
       OR LOWER(u.EmployeeCode) = @CleanId;

    IF @UserId IS NULL
    BEGIN
        SELECT
            CAST(0 AS BIT) AS Success,
            N'Không tìm thấy tài khoản khớp với Email hoặc Mã nhân viên đã nhập.' AS ErrorMessage;
        RETURN;
    END

    IF @IsActive = 0 OR @EmpStatus = N'Nghỉ việc'
    BEGIN
        SELECT
            CAST(0 AS BIT) AS Success,
            N'Tài khoản này đã ngừng hoạt động do nhân sự đã nghỉ việc.' AS ErrorMessage;
        RETURN;
    END

    SET @InputHash = HASHBYTES(
        'SHA2_256',
        CONVERT(VARBINARY(MAX), CAST(CONCAT(CAST(@Salt AS NVARCHAR(36)), N':', @Password) AS NVARCHAR(200)))
    );

    IF @StoredHash <> @InputHash
    BEGIN
        SELECT
            CAST(0 AS BIT) AS Success,
            N'Mật khẩu không chính xác. Vui lòng kiểm tra lại (mật khẩu mặc định: 123456).' AS ErrorMessage;
        RETURN;
    END

    -- Cập nhật thời điểm đăng nhập gần nhất
    UPDATE dbo.Users
    SET LastLoginAt = SYSUTCDATETIME()
    WHERE UserId = @UserId;

    -- Lấy vai trò ưu tiên cao nhất của User (admin trước ess)
    SELECT TOP (1)
        @RoleId   = r.RoleId,
        @RoleName = r.RoleName
    FROM dbo.UserRoles ur
    INNER JOIN dbo.Roles r ON r.RoleId = ur.RoleId
    WHERE ur.UserId = @UserId
    ORDER BY CASE WHEN r.RoleId = N'admin' THEN 0 ELSE 1 END;

    -- Result Set 1: Thông tin phiên đăng nhập
    SELECT
        CAST(1 AS BIT) AS Success,
        @UserId        AS UserId,
        @EmployeeId    AS EmployeeId,
        @EmployeeCode  AS EmployeeCode,
        @FullName      AS FullName,
        @Email         AS Email,
        @DepartmentId  AS DepartmentId,
        @RoleId        AS RoleId,
        @RoleName      AS RoleName,
        NULL           AS ErrorMessage;

    -- Result Set 2: Danh sách phân hệ được phép truy cập theo RBAC
    SELECT
        p.PermissionId,
        p.ModuleCode,
        p.ModuleName,
        p.IsAdminOnly
    FROM dbo.UserRoles ur
    INNER JOIN dbo.RolePermissions rp ON rp.RoleId = ur.RoleId
    INNER JOIN dbo.Permissions p ON p.PermissionId = rp.PermissionId
    WHERE ur.UserId = @UserId
    ORDER BY p.IsAdminOnly DESC, p.PermissionId ASC;
END
GO

/* ============================================================================
   4. DỮ LIỆU MẪU (INSERT INTO SEED DATA - ĐỒNG BỘ 100% TỪ seedData.ts)
   ============================================================================ */

DECLARE @Today      DATE = CAST(GETDATE() AS DATE);
DECLARE @Emp4End    DATE = DATEADD(DAY, -12, @Today);     -- Hợp đồng đã hết hạn (12 ngày trước)
DECLARE @Emp4Start  DATE = DATEADD(MONTH, -24, @Emp4End);
DECLARE @Emp7End    DATE = DATEADD(DAY, 14, @Today);      -- Sắp hết hạn (trong 30 ngày tới)
DECLARE @Emp7Start  DATE = DATEADD(MONTH, -12, @Emp7End);
DECLARE @Emp8End    DATE = DATEADD(DAY, 25, @Today);      -- Sắp hết hạn (trong 30 ngày tới)
DECLARE @Emp8Start  DATE = DATEADD(MONTH, -12, @Emp8End);
DECLARE @Emp10Start DATE = DATEADD(DAY, -20, @Today);     -- Thử việc 2 tháng
DECLARE @Emp10End   DATE = DATEADD(MONTH, 2, @Emp10Start);

-- 4.1. SystemSettings
INSERT INTO dbo.SystemSettings (
    OrganizationName, Slogan, TaxCode, Address, Phone,
    LegalRepresentative, LegalRepresentativeTitle, ThemeColor, LogoIcon, CustomLogoUrl
)
VALUES (
    N'OSHRM',
    N'Open Source Human Resource Management',
    N'0108998877',
    N'Tầng 18, Keangnam Landmark, Phạm Hùng, Nam Từ Liêm, Hà Nội',
    N'024 7300 8866',
    N'Nguyễn Minh Anh',
    N'Giám đốc Nhân sự',
    N'#2563eb',
    N'building',
    NULL
);

-- 4.2. Branches
INSERT INTO dbo.Branches (BranchId, Code, Name, Address, Phone, IsHeadquarters)
VALUES
    (N'br-hn',  N'CN-HN',  N'Trụ sở chính Hà Nội',       N'Tầng 18, Keangnam Landmark, Phạm Hùng, Nam Từ Liêm, Hà Nội', N'024 7300 8866', 1),
    (N'br-hcm', N'CN-HCM', N'Chi nhánh TP. Hồ Chí Minh', N'Tầng 12, Saigon Centre Tower 2, Lê Lợi, Quận 1, TP. HCM',    N'028 7300 8899', 0);

-- 4.3. Departments
INSERT INTO dbo.Departments (DepartmentId, Code, Name, BranchId, ManagerName, Description)
VALUES
    (N'dept-tech',  N'PB-CNTT', N'Công nghệ & Sản phẩm',    N'br-hn',  N'Đặng Hoàng Long', N'Phát triển nền tảng sản phẩm, kiến trúc hệ thống, hạ tầng Cloud và kiểm thử chất lượng.'),
    (N'dept-sales', N'PB-KD',   N'Kinh doanh & Thị trường', N'br-hcm', N'Vũ Thị Thu Hà',   N'Tư vấn giải pháp B2B, phát triển khách hàng doanh nghiệp và chăm sóc đối tác.'),
    (N'dept-hr',    N'PB-NSHC', N'Nhân sự & Hành chính',    N'br-hn',  N'Nguyễn Minh Anh', N'Tuyển dụng nhân tài, quản trị C&B, đào tạo phát triển và vận hành văn phòng.'),
    (N'dept-fin',   N'PB-TCKT', N'Tài chính & Kế toán',     N'br-hn',  N'Phạm Đức Mạnh',   N'Quản trị ngân sách, kế toán thuế, kiểm soát chi phí và thanh toán lương.');

-- 4.4. Positions
INSERT INTO dbo.Positions (PositionId, Code, Title, DepartmentId, Level, SalaryRange)
VALUES
    (N'pos-cto',        N'CD-01', N'Giám đốc Công nghệ',         N'dept-tech',  N'Quản lý cấp cao', N'38.000.000 - 50.000.000 ₫'),
    (N'pos-sen-dev',    N'CD-02', N'Kỹ sư Phần mềm Cao cấp',     N'dept-tech',  N'Senior',          N'25.000.000 - 36.000.000 ₫'),
    (N'pos-uiux',       N'CD-03', N'Chuyên viên Thiết kế UI/UX', N'dept-tech',  N'Middle',          N'18.000.000 - 25.000.000 ₫'),
    (N'pos-qa',         N'CD-04', N'Chuyên viên Kiểm thử QA',    N'dept-tech',  N'Middle',          N'15.000.000 - 22.000.000 ₫'),
    (N'pos-sales-mgr',  N'CD-05', N'Trưởng phòng Kinh doanh',    N'dept-sales', N'Quản lý',         N'28.000.000 - 38.000.000 ₫'),
    (N'pos-sales-exec', N'CD-06', N'Chuyên viên Tư vấn Giải pháp', N'dept-sales', N'Executive',     N'14.000.000 - 22.000.000 ₫'),
    (N'pos-hr-mgr',     N'CD-07', N'Trưởng phòng Nhân sự',       N'dept-hr',    N'Quản lý',         N'26.000.000 - 34.000.000 ₫'),
    (N'pos-hr-spec',    N'CD-08', N'Chuyên viên Tuyển dụng & C&B', N'dept-hr',  N'Middle',          N'14.000.000 - 20.000.000 ₫'),
    (N'pos-chief-acc',  N'CD-09', N'Kế toán trưởng',             N'dept-fin',   N'Quản lý',         N'28.000.000 - 36.000.000 ₫'),
    (N'pos-acc',        N'CD-10', N'Chuyên viên Kế toán tổng hợp', N'dept-fin', N'Middle',          N'15.000.000 - 21.000.000 ₫');

-- 4.5. Employees (10 nhân viên mẫu)
INSERT INTO dbo.Employees (
    EmployeeId, Code, FullName, Email, Phone, Gender, DateOfBirth,
    NationalId, NationalIdIssueDate, NationalIdIssuePlace, Address,
    DepartmentId, PositionId, BranchId, JoinDate,
    ContractType, ContractCode, ContractStartDate, ContractEndDate,
    BaseSalary, Allowance, Dependents, AnnualLeaveTotal, AnnualLeaveRemaining,
    BankAccount, BankName, Status
)
VALUES
    (N'emp-1',  N'NV-001', N'Đặng Hoàng Long',  N'long.dang@oshrm.vn',   N'0912 345 601', N'Nam', '1988-08-19', N'001088002311', '2021-05-12', N'Cục Cảnh sát QLHC về TTXH', N'Số 24 Ngõ 165 Xuân Thủy, Dịch Vọng Hậu, Cầu Giấy, Hà Nội', N'dept-tech',  N'pos-cto',        N'br-hn',  '2021-03-01', N'HĐLĐ Không xác định thời hạn', N'2101/HĐLĐ', '2021-03-01', NULL,       42000000.00, 3500000.00, 2, 14, 11, N'19023489012345', N'Techcombank', N'Đang làm việc'),
    (N'emp-2',  N'NV-002', N'Trần Quốc Bảo',    N'bao.tran@oshrm.vn',    N'0908 451 202', N'Nam', '1994-11-05', N'001094015678', '2022-01-18', N'Cục Cảnh sát QLHC về TTXH', N'Số 108 Nguyễn Trãi, Thượng Đình, Thanh Xuân, Hà Nội',      N'dept-tech',  N'pos-sen-dev',    N'br-hn',  '2022-06-15', N'HĐLĐ Không xác định thời hạn', N'2202/HĐLĐ', '2022-06-15', NULL,       32000000.00, 2000000.00, 1, 12,  9, N'0451000428899',  N'Vietcombank', N'Đang làm việc'),
    (N'emp-3',  N'NV-003', N'Lê Thảo Vy',       N'vy.le@oshrm.vn',       N'0938 662 303', N'Nữ',  '1997-02-24', N'079197009123', '2021-09-25', N'Cục Cảnh sát QLHC về TTXH', N'45/12 Võ Văn Tần, Phường 6, Quận 3, TP. Hồ Chí Minh',      N'dept-tech',  N'pos-uiux',       N'br-hcm', '2023-04-10', N'HĐLĐ 24 tháng',                N'2508/HĐLĐ', '2025-04-10', '2027-04-10', 22000000.00, 1500000.00, 0, 12, 8, N'1019882776',     N'ACB',         N'Đang làm việc'),
    (N'emp-4',  N'NV-004', N'Phạm Gia Huy',     N'huy.pham@oshrm.vn',    N'0977 812 404', N'Nam', '1996-09-14', N'001096034112', '2021-11-08', N'Cục Cảnh sát QLHC về TTXH', N'Số 18 Thái Hà, Trung Liệt, Đống Đa, Hà Nội',               N'dept-tech',  N'pos-qa',         N'br-hn',  @Emp4Start,   N'HĐLĐ 24 tháng',                N'2404/HĐLĐ', @Emp4Start,   @Emp4End,    19000000.00, 1200000.00, 0, 12, 10, N'0321000991122',  N'TPBank',      N'Đang làm việc'),
    (N'emp-5',  N'NV-005', N'Vũ Thị Thu Hà',    N'ha.vu@oshrm.vn',       N'0909 551 505', N'Nữ',  '1990-07-03', N'079190004421', '2021-04-30', N'Cục Cảnh sát QLHC về TTXH', N'72 Phan Xích Long, Phường 2, Phú Nhuận, TP. Hồ Chí Minh',  N'dept-sales', N'pos-sales-mgr',  N'br-hcm', '2021-09-15', N'HĐLĐ Không xác định thời hạn', N'2105/HĐLĐ', '2021-09-15', NULL,       34000000.00, 3000000.00, 1, 13, 10, N'0071001223344',  N'Vietcombank', N'Đang làm việc'),
    (N'emp-6',  N'NV-006', N'Nguyễn Minh Anh',  N'anh.nguyen@oshrm.vn',  N'0918 773 606', N'Nữ',  '1991-03-22', N'001191008812', '2021-07-14', N'Cục Cảnh sát QLHC về TTXH', N'Số 36 Kim Mã, Ngọc Khánh, Ba Đình, Hà Nội',                N'dept-hr',    N'pos-hr-mgr',     N'br-hn',  '2021-05-01', N'HĐLĐ Không xác định thời hạn', N'2106/HĐLĐ', '2021-05-01', NULL,       30000000.00, 2500000.00, 1, 14, 11, N'19030099112233', N'Techcombank', N'Đang làm việc'),
    (N'emp-7',  N'NV-007', N'Bùi Quang Khải',   N'khai.bui@oshrm.vn',    N'0933 204 707', N'Nam', '1998-01-17', N'079098007654', '2022-03-10', N'Cục Cảnh sát QLHC về TTXH', N'214 Xô Viết Nghệ Tĩnh, Phường 21, Bình Thạnh, TP. Hồ Chí Minh', N'dept-sales', N'pos-sales-exec', N'br-hcm', @Emp7Start, N'HĐLĐ 12 tháng',                N'2507/HĐLĐ', @Emp7Start,   @Emp7End,    16500000.00, 2000000.00, 0, 12,  9, N'6688112233',     N'MB Bank',     N'Đang làm việc'),
    (N'emp-8',  N'NV-008', N'Hoàng Ngọc Diệp',  N'diep.hoang@oshrm.vn',  N'0965 391 808', N'Nữ',  '1997-10-29', N'001197023456', '2022-08-21', N'Cục Cảnh sát QLHC về TTXH', N'Số 52 Bà Triệu, Nguyễn Du, Hai Bà Trưng, Hà Nội',          N'dept-hr',    N'pos-hr-spec',    N'br-hn',  @Emp8Start,   N'HĐLĐ 12 tháng',                N'2509/HĐLĐ', @Emp8Start,   @Emp8End,    17500000.00, 1200000.00, 0, 12, 10, N'19036677889900', N'Techcombank', N'Đang làm việc'),
    (N'emp-9',  N'NV-009', N'Phạm Đức Mạnh',    N'manh.pham@oshrm.vn',   N'0915 908 909', N'Nam', '1987-12-08', N'001087001928', '2021-06-19', N'Cục Cảnh sát QLHC về TTXH', N'Số 142 Lạc Long Quân, Bưởi, Tây Hồ, Hà Nội',               N'dept-fin',   N'pos-chief-acc',  N'br-hn',  '2021-04-01', N'HĐLĐ Không xác định thời hạn', N'2109/HĐLĐ', '2021-04-01', NULL,       33000000.00, 2500000.00, 2, 14, 12, N'112233445566',   N'BIDV',        N'Đang làm việc'),
    (N'emp-10', N'NV-010', N'Đỗ Phương Linh',   N'linh.do@oshrm.vn',     N'0944 128 010', N'Nữ',  '1999-06-11', N'001199045612', '2023-02-05', N'Cục Cảnh sát QLHC về TTXH', N'Số 88 Mỹ Đình, Mỹ Đình 2, Nam Từ Liêm, Hà Nội',            N'dept-fin',   N'pos-acc',        N'br-hn',  @Emp10Start,  N'Hợp đồng Thử việc 2 tháng',    N'2610/HĐTV', @Emp10Start,  @Emp10End,   15000000.00, 1000000.00, 0, 12, 12, N'032199887766',   N'VietinBank',  N'Thử việc');

-- 4.6. LaborContracts (10 hợp đồng lao động)
INSERT INTO dbo.LaborContracts (
    ContractId, ContractNumber, EmployeeId, ContractType, StartDate, EndDate,
    BaseSalary, Allowance, PaymentMethod, PayDay, WorkLocation, JobDuties, SignedDate
)
VALUES
    (N'ctr-1',  N'2101/HĐLĐ', N'emp-1',  N'Không xác định thời hạn',    '2021-03-01', NULL,         42000000.00, 3500000.00, N'Chuyển khoản ngân hàng',  5, N'Tầng 18, Keangnam Landmark, Phạm Hùng, Nam Từ Liêm, Hà Nội', N'Hoạch định kiến trúc công nghệ, dẫn dắt đội ngũ kỹ thuật và phát triển sản phẩm lõi.', '2021-03-01'),
    (N'ctr-2',  N'2202/HĐLĐ', N'emp-2',  N'Không xác định thời hạn',    '2022-06-15', NULL,         32000000.00, 2000000.00, N'Chuyển khoản ngân hàng',  5, N'Tầng 18, Keangnam Landmark, Phạm Hùng, Nam Từ Liêm, Hà Nội', N'Phát triển tính năng phần mềm cao cấp, tối ưu hiệu năng API và review mã nguồn.',      '2022-06-15'),
    (N'ctr-3',  N'2508/HĐLĐ', N'emp-3',  N'Xác định thời hạn 24 tháng', '2025-04-10', '2027-04-10', 22000000.00, 1500000.00, N'Chuyển khoản ngân hàng', 10, N'Tầng 12, Saigon Centre Tower 2, Lê Lợi, Quận 1, TP. HCM',    N'Thiết kế giao diện UI/UX, xây dựng Design System và nguyên mẫu tương tác sản phẩm.',   '2025-04-10'),
    (N'ctr-4',  N'2404/HĐLĐ', N'emp-4',  N'Xác định thời hạn 24 tháng', @Emp4Start,   @Emp4End,     19000000.00, 1200000.00, N'Chuyển khoản ngân hàng', 10, N'Tầng 18, Keangnam Landmark, Phạm Hùng, Nam Từ Liêm, Hà Nội', N'Xây dựng kịch bản kiểm thử tự động, kiểm thử hồi quy và đảm bảo chất lượng phần mềm.', @Emp4Start),
    (N'ctr-5',  N'2105/HĐLĐ', N'emp-5',  N'Không xác định thời hạn',    '2021-09-15', NULL,         34000000.00, 3000000.00, N'Chuyển khoản ngân hàng',  5, N'Tầng 12, Saigon Centre Tower 2, Lê Lợi, Quận 1, TP. HCM',    N'Điều hành hoạt động kinh doanh B2B, phát triển đối tác chiến lược tại khu vực phía Nam.', '2021-09-15'),
    (N'ctr-6',  N'2106/HĐLĐ', N'emp-6',  N'Không xác định thời hạn',    '2021-05-01', NULL,         30000000.00, 2500000.00, N'Chuyển khoản ngân hàng',  5, N'Tầng 18, Keangnam Landmark, Phạm Hùng, Nam Từ Liêm, Hà Nội', N'Quản trị nguồn nhân lực, quan hệ lao động, chính sách đãi ngộ và tuân thủ pháp luật lao động.', '2021-05-01'),
    (N'ctr-7',  N'2507/HĐLĐ', N'emp-7',  N'Xác định thời hạn 12 tháng', @Emp7Start,   @Emp7End,     16500000.00, 2000000.00, N'Chuyển khoản ngân hàng', 10, N'Tầng 12, Saigon Centre Tower 2, Lê Lợi, Quận 1, TP. HCM',    N'Tư vấn giải pháp phần mềm cho khách hàng doanh nghiệp và chăm sóc khách hàng định kỳ.', @Emp7Start),
    (N'ctr-8',  N'2509/HĐLĐ', N'emp-8',  N'Xác định thời hạn 12 tháng', @Emp8Start,   @Emp8End,     17500000.00, 1200000.00, N'Chuyển khoản ngân hàng', 10, N'Tầng 18, Keangnam Landmark, Phạm Hùng, Nam Từ Liêm, Hà Nội', N'Thực hiện quy trình tuyển dụng, chấm công, tính lương và quản lý hồ sơ bảo hiểm xã hội.', @Emp8Start),
    (N'ctr-9',  N'2109/HĐLĐ', N'emp-9',  N'Không xác định thời hạn',    '2021-04-01', NULL,         33000000.00, 2500000.00, N'Chuyển khoản ngân hàng',  5, N'Tầng 18, Keangnam Landmark, Phạm Hùng, Nam Từ Liêm, Hà Nội', N'Tổ chức công tác kế toán tài chính, báo cáo thuế, kiểm soát ngân sách doanh nghiệp.',  '2021-04-01'),
    (N'ctr-10', N'2610/HĐTV', N'emp-10', N'Thử việc 2 tháng',           @Emp10Start,  @Emp10End,    15000000.00, 1000000.00, N'Chuyển khoản ngân hàng', 10, N'Tầng 18, Keangnam Landmark, Phạm Hùng, Nam Từ Liêm, Hà Nội', N'Hạch toán chứng từ kế toán tổng hợp, đối chiếu công nợ và hỗ trợ quyết toán thuế.',    @Emp10Start);

-- 4.7. JobPostings (4 tin tuyển dụng)
INSERT INTO dbo.JobPostings (
    JobPostingId, Code, PositionId, DepartmentId, BranchId, Headcount, SalaryRange, Deadline, Status, Description, CreatedAt
)
VALUES
    (N'job-1', N'TD-2026-01', N'pos-sen-dev',    N'dept-tech',  N'br-hn',  2, N'25.000.000 - 36.000.000 ₫', DATEADD(DAY, 30, @Today), N'Đang tuyển', N'Tham gia phát triển nền tảng quản trị nhân sự OSHRM với React, TypeScript và Node.js.', DATEADD(DAY, -15, @Today)),
    (N'job-2', N'TD-2026-02', N'pos-sales-exec', N'dept-sales', N'br-hcm', 2, N'14.000.000 - 22.000.000 ₫', DATEADD(DAY, 25, @Today), N'Đang tuyển', N'Tìm kiếm và tư vấn giải pháp chuyển đổi số nhân sự cho khối doanh nghiệp SME/Enterprise.', DATEADD(DAY, -12, @Today)),
    (N'job-3', N'TD-2026-03', N'pos-qa',         N'dept-tech',  N'br-hn',  1, N'15.000.000 - 22.000.000 ₫', DATEADD(DAY, 20, @Today), N'Đang tuyển', N'Kiểm thử chức năng, tự động hóa Playwright và đảm bảo chất lượng bản phát hành.', DATEADD(DAY, -10, @Today)),
    (N'job-4', N'TD-2026-04', N'pos-uiux',       N'dept-tech',  N'br-hcm', 1, N'18.000.000 - 25.000.000 ₫', DATEADD(DAY, 18, @Today), N'Đang tuyển', N'Thiết kế trải nghiệm người dùng cho ứng dụng web doanh nghiệp và tối ưu Design System.', DATEADD(DAY, -8, @Today));

-- 4.8. Candidates (6 ứng viên)
INSERT INTO dbo.Candidates (
    CandidateId, JobPostingId, FullName, Email, Phone, AppliedPositionId, AppliedDepartmentId,
    AppliedBranchId, Source, ExpectedSalary, AppliedDate, InterviewDate, Notes, Stage, ConvertedEmployeeId
)
VALUES
    (N'cand-1', N'job-1', N'Lê Hoàng Nam',            N'hoangnam.dev@gmail.com',    N'0988 412 901', N'pos-sen-dev',    N'dept-tech',  N'br-hn',  N'LinkedIn',          29000000.00, '2026-10-28', '2026-11-08', N'5 năm kinh nghiệm React/Node.js, đã vượt qua vòng Technical & Culture Fit.', N'Trúng tuyển',   NULL),
    (N'cand-2', N'job-2', N'Nguyễn Thị Khánh Huyền',  N'khanhhuyen.sales@gmail.com',N'0903 771 234', N'pos-sales-exec', N'dept-sales', N'br-hcm', N'TopCV',             17000000.00, '2026-11-02', '2026-11-10', N'Giao tiếp tốt, từng phụ trách khách hàng SaaS SMB tại TP. HCM.',            N'Trúng tuyển',   NULL),
    (N'cand-3', N'job-3', N'Trương Minh Tuấn',        N'minhtuan.qa@gmail.com',     N'0914 225 678', N'pos-qa',         N'dept-tech',  N'br-hn',  N'ITviec',            18500000.00, '2026-11-05', '2026-11-15', N'Thành thạo Playwright và API testing, hẹn phỏng vấn vòng 2 với CTO.',       N'Phỏng vấn',     NULL),
    (N'cand-4', N'job-4', N'Võ Ngọc Trâm',            N'ngoctram.ux@gmail.com',     N'0932 889 445', N'pos-uiux',       N'dept-tech',  N'br-hcm', N'Giới thiệu nội bộ', 21000000.00, '2026-11-07', '2026-11-16', N'Portfolio Design System rõ ràng, có kinh nghiệm sản phẩm HRM/ERP.',         N'Phỏng vấn',     NULL),
    (N'cand-5', NULL,     N'Ngô Văn Kiên',            N'vankien.acc@gmail.com',     N'0976 112 339', N'pos-acc',        N'dept-fin',   N'br-hn',  N'VietnamWorks',      16000000.00, '2026-11-11', NULL,         N'3 năm kế toán tổng hợp doanh nghiệp dịch vụ, mới tiếp nhận CV.',             N'Mới ứng tuyển', NULL),
    (N'cand-6', N'job-1', N'Phan Thanh Tùng',         N'thanhtung.fe@gmail.com',    N'0907 553 812', N'pos-sen-dev',    N'dept-tech',  N'br-hn',  N'ITviec',            27000000.00, '2026-11-12', NULL,         N'Ứng viên TypeScript/Next.js, chờ HR gọi sàng lọc.',                         N'Mới ứng tuyển', NULL);

-- 4.9. AttendanceLogs (11 bản ghi chấm công)
INSERT INTO dbo.AttendanceLogs (
    AttendanceId, EmployeeId, AttendanceDate, CheckInTime, CheckOutTime, WorkHours, Status, Note
)
VALUES
    (N'att-seed-1',  N'emp-1',  @Today,       '08:12:15', NULL,       0.00, N'Đúng giờ', N'Làm việc tại Trụ sở Hà Nội'),
    (N'att-seed-3',  N'emp-3',  @Today,       '08:22:40', NULL,       0.00, N'Đúng giờ', N'Làm việc tại Chi nhánh TP. HCM'),
    (N'att-seed-4',  N'emp-4',  @Today,       '08:41:09', NULL,       0.00, N'Đi muộn',  N'Check-in sau 08:30'),
    (N'att-seed-5',  N'emp-5',  @Today,       '08:05:30', NULL,       0.00, N'Đúng giờ', N'Đúng giờ quy định'),
    (N'att-seed-6',  N'emp-6',  @Today,       '08:18:04', NULL,       0.00, N'Đúng giờ', N'Đúng giờ quy định'),
    (N'att-seed-7',  N'emp-7',  @Today,       '08:29:51', NULL,       0.00, N'Đúng giờ', N'Đúng giờ quy định'),
    (N'att-seed-8',  N'emp-8',  @Today,       '08:15:22', NULL,       0.00, N'Đúng giờ', N'Đúng giờ quy định'),
    (N'att-seed-9',  N'emp-9',  @Today,       '08:09:45', NULL,       0.00, N'Đúng giờ', N'Đúng giờ quy định'),
    (N'att-seed-10', N'emp-10', @Today,       '08:26:11', NULL,       0.00, N'Đúng giờ', N'Đúng giờ quy định'),
    (N'att-hist-2',  N'emp-2',  '2026-11-13', '08:19:02', '17:45:10', 9.43, N'Đúng giờ', N'Hoàn thành ca làm việc'),
    (N'att-hist-2b', N'emp-2',  '2026-11-12', '08:14:33', '18:02:18', 9.80, N'Đúng giờ', N'Hoàn thành ca làm việc');

-- 4.10. LeaveRequests (5 đơn nghỉ phép & OT)
INSERT INTO dbo.LeaveRequests (
    RequestId, EmployeeId, Type, StartDate, EndDate, Days, OtHours, Reason, Status, CreatedAt, ReviewedBy, ReviewedByEmployeeId, ReviewedAt
)
VALUES
    (N'req-1', N'emp-2', N'Tăng ca (OT)',    '2026-11-10', '2026-11-10', 0.0, 6.00, N'Triển khai nâng cấp hệ thống Payroll Engine cuối tuần', N'Đã duyệt',  '2026-11-09', N'Nguyễn Minh Anh', N'emp-6', '2026-11-09'),
    (N'req-2', N'emp-3', N'Nghỉ phép năm',   '2026-11-18', '2026-11-19', 2.0, 0.00, N'Về quê giải quyết việc gia đình tại Đà Nẵng',           N'Chờ duyệt', '2026-11-13', NULL,               NULL,     NULL),
    (N'req-3', N'emp-7', N'Nghỉ phép năm',   '2026-11-22', '2026-11-22', 1.0, 0.00, N'Khám sức khỏe định kỳ',                                  N'Chờ duyệt', '2026-11-13', NULL,               NULL,     NULL),
    (N'req-4', N'emp-4', N'Tăng ca (OT)',    '2026-11-11', '2026-11-11', 0.0, 4.00, N'Kiểm thử hồi quy bản phát hành v2.4',                    N'Đã duyệt',  '2026-11-10', N'Nguyễn Minh Anh', N'emp-6', '2026-11-10'),
    (N'req-5', N'emp-8', N'Nghỉ không lương','2026-11-04', '2026-11-04', 1.0, 0.00, N'Làm thủ tục giấy tờ cá nhân',                            N'Từ chối',   '2026-11-02', N'Nguyễn Minh Anh', N'emp-6', '2026-11-03');

-- 4.11. Payslips (Phiếu lương kỳ 2026-11 tính chuẩn theo BHXH 10.5% + OT 150% + Thuế TNCN 7 bậc)
INSERT INTO dbo.Payslips (
    PayslipId, EmployeeId, EmployeeCode, FullName, DepartmentName, PositionTitle, PayMonth,
    StandardWorkDays, ActualWorkDays, BaseSalary, Allowance, ApprovedOtHours, OtPay,
    GrossSalary, InsuranceDeduction, PersonalDeduction, DependentDeduction,
    TaxableIncome, PersonalIncomeTax, NetSalary
)
VALUES
    (N'pay-202611-emp-1',  N'emp-1',  N'NV-001', N'Đặng Hoàng Long', N'Công nghệ & Sản phẩm',    N'Giám đốc Công nghệ',           '2026-11', 22, 22, 42000000.00, 3500000.00, 0.00,       0.00, 45500000.00, 4410000.00, 11000000.00, 8800000.00, 21290000.00, 2608000.00, 38482000.00),
    (N'pay-202611-emp-2',  N'emp-2',  N'NV-002', N'Trần Quốc Bảo',   N'Công nghệ & Sản phẩm',    N'Kỹ sư Phần mềm Cao cấp',       '2026-11', 22, 22, 32000000.00, 2000000.00, 6.00, 1636364.00, 35636364.00, 3360000.00, 11000000.00, 4400000.00, 16876364.00, 1781455.00, 30494909.00),
    (N'pay-202611-emp-3',  N'emp-3',  N'NV-003', N'Lê Thảo Vy',      N'Công nghệ & Sản phẩm',    N'Chuyên viên Thiết kế UI/UX',   '2026-11', 22, 22, 22000000.00, 1500000.00, 0.00,       0.00, 23500000.00, 2310000.00, 11000000.00,       0.00, 10190000.00,  778500.00, 20411500.00),
    (N'pay-202611-emp-4',  N'emp-4',  N'NV-004', N'Phạm Gia Huy',    N'Công nghệ & Sản phẩm',    N'Chuyên viên Kiểm thử QA',      '2026-11', 22, 22, 19000000.00, 1200000.00, 4.00,  647727.00, 20847727.00, 1995000.00, 11000000.00,       0.00,  7852727.00,  535273.00, 18317454.00),
    (N'pay-202611-emp-5',  N'emp-5',  N'NV-005', N'Vũ Thị Thu Hà',   N'Kinh doanh & Thị trường', N'Trưởng phòng Kinh doanh',      '2026-11', 22, 22, 34000000.00, 3000000.00, 0.00,       0.00, 37000000.00, 3570000.00, 11000000.00, 4400000.00, 18030000.00, 1956000.00, 31474000.00),
    (N'pay-202611-emp-6',  N'emp-6',  N'NV-006', N'Nguyễn Minh Anh', N'Nhân sự & Hành chính',    N'Trưởng phòng Nhân sự',         '2026-11', 22, 22, 30000000.00, 2500000.00, 0.00,       0.00, 32500000.00, 3150000.00, 11000000.00, 4400000.00, 13950000.00, 1342500.00, 28007500.00),
    (N'pay-202611-emp-7',  N'emp-7',  N'NV-007', N'Bùi Quang Khải',  N'Kinh doanh & Thị trường', N'Chuyên viên Tư vấn Giải pháp', '2026-11', 22, 22, 16500000.00, 2000000.00, 0.00,       0.00, 18500000.00, 1732500.00, 11000000.00,       0.00,  5767500.00,  326750.00, 16440750.00),
    (N'pay-202611-emp-8',  N'emp-8',  N'NV-008', N'Hoàng Ngọc Diệp', N'Nhân sự & Hành chính',    N'Chuyên viên Tuyển dụng & C&B', '2026-11', 22, 22, 17500000.00, 1200000.00, 0.00,       0.00, 18700000.00, 1837500.00, 11000000.00,       0.00,  5862500.00,  336250.00, 16526250.00),
    (N'pay-202611-emp-9',  N'emp-9',  N'NV-009', N'Phạm Đức Mạnh',   N'Tài chính & Kế toán',     N'Kế toán trưởng',               '2026-11', 22, 22, 33000000.00, 2500000.00, 0.00,       0.00, 35500000.00, 3465000.00, 11000000.00, 8800000.00, 12235000.00, 1085250.00, 30949750.00),
    (N'pay-202611-emp-10', N'emp-10', N'NV-010', N'Đỗ Phương Linh',  N'Tài chính & Kế toán',     N'Chuyên viên Kế toán tổng hợp', '2026-11', 22, 22, 15000000.00, 1000000.00, 0.00,       0.00, 16000000.00, 1575000.00, 11000000.00,       0.00,  3425000.00,  171250.00, 14253750.00);

-- 4.12. EmployeeKPIs (6 chỉ tiêu KPI Q4/2026)
INSERT INTO dbo.EmployeeKPIs (
    KpiId, EmployeeId, Quarter, Title, Category, TargetValue, ActualValue, Unit, Weight, CompletionPercent, Deadline, EvaluatorNote
)
VALUES
    (N'kpi-1', N'emp-2', N'Q4/2026', N'Hoàn thành đúng hạn các Sprint phát triển Core HRM',       N'Hiệu suất kỹ thuật', 100.00,   95.00, N'%',        50,  95, '2026-12-31', N'Đảm bảo tiến độ release, code review kỹ lưỡng.'),
    (N'kpi-2', N'emp-2', N'Q4/2026', N'Tối ưu hiệu năng API truy vấn bảng lương dưới 150ms',     N'Chất lượng hệ thống', 100.00, 100.00, N'%',        50, 100, '2026-12-15', N'Đạt mục tiêu tối ưu truy vấn sớm hơn kế hoạch.'),
    (N'kpi-3', N'emp-5', N'Q4/2026', N'Doanh số ký mới khách hàng doanh nghiệp Enterprise',       N'Doanh thu',          1200.00, 1080.00, N'Triệu ₫',  60,  90, '2026-12-31', N'Đang theo sát pipeline quý 4, triển vọng vượt chỉ tiêu.'),
    (N'kpi-4', N'emp-5', N'Q4/2026', N'Tỷ lệ gia hạn hợp đồng khách hàng hiện hữu',               N'Chăm sóc khách hàng',  95.00,   96.00, N'%',        40, 101, '2026-12-31', N'Vượt cam kết SLA gia hạn.'),
    (N'kpi-5', N'emp-6', N'Q4/2026', N'Tuyển dụng đủ chỉ tiêu nhân sự khối Công nghệ & Kinh doanh', N'Tuyển dụng',          8.00,    7.00, N'Nhân sự',  50,  88, '2026-12-20', N'Đã có 2 ứng viên trúng tuyển chuẩn bị nhận việc.'),
    (N'kpi-6', N'emp-7', N'Q4/2026', N'Số lượng hợp đồng SMB ký mới trong quý',                   N'Doanh số',             15.00,   12.00, N'Hợp đồng',100,  80, '2026-12-31', N'Tốc độ chuyển đổi khách hàng đang cải thiện tốt.');

-- 4.13. Seed RBAC: Roles, Permissions, RolePermissions
INSERT INTO dbo.Roles (RoleId, RoleCode, RoleName, Description)
VALUES
    (N'admin', N'ADMIN', N'Quản trị viên HR (Admin)', N'Toàn quyền điều hành hệ thống HRM, duyệt đơn, tính lương và cấu hình White-label.'),
    (N'ess',   N'ESS',   N'Nhân viên (ESS)',          N'Không gian tự phục vụ cá nhân: xem hồ sơ, hợp đồng, chấm công, phiếu lương và KPI cá nhân.');

INSERT INTO dbo.Permissions (PermissionId, ModuleCode, ModuleName, IsAdminOnly, Description)
VALUES
    (N'dashboard',    N'dashboard',    N'Tổng quan',              1, N'Dashboard thống kê tổng hợp toàn doanh nghiệp'),
    (N'organization', N'organization', N'Cơ cấu tổ chức',        1, N'Quản lý chi nhánh, phòng ban và chức danh'),
    (N'employees',    N'employees',    N'Hồ sơ nhân sự',         0, N'Quản lý hồ sơ nhân viên (ESS chỉ xem hồ sơ của mình)'),
    (N'contracts',    N'contracts',    N'Hợp đồng lao động',     0, N'Quản lý và in hợp đồng lao động (ESS chỉ xem hợp đồng của mình)'),
    (N'recruitment',  N'recruitment',  N'Tuyển dụng (ATS)',      1, N'Quản lý tin tuyển dụng và phễu ứng viên'),
    (N'attendance',   N'attendance',   N'Chấm công & Nghỉ phép', 0, N'Check-in/out và gửi đơn nghỉ phép/OT (Admin có quyền duyệt đơn)'),
    (N'payroll',      N'payroll',      N'Tính lương (Payroll)',  0, N'Bảng lương công ty và phiếu lương cá nhân'),
    (N'kpi',          N'kpi',          N'Đánh giá KPI',          0, N'Giao chỉ tiêu và theo dõi kết quả KPI'),
    (N'settings',     N'settings',     N'Cài đặt Hệ thống',      1, N'Tùy chỉnh White-label, xuất/nhập cấu hình JSON');

-- Admin được cấp đủ 9 phân hệ
INSERT INTO dbo.RolePermissions (RoleId, PermissionId)
SELECT N'admin', PermissionId FROM dbo.Permissions;

-- ESS chỉ được cấp 5 phân hệ cá nhân (khóa chặt dashboard, organization, recruitment, settings)
INSERT INTO dbo.RolePermissions (RoleId, PermissionId)
VALUES
    (N'ess', N'employees'),
    (N'ess', N'contracts'),
    (N'ess', N'attendance'),
    (N'ess', N'payroll'),
    (N'ess', N'kpi');

-- 4.14. Seed Users (Mật khẩu mặc định '123456' cho cả 10 nhân viên) & UserRoles
INSERT INTO dbo.Users (UserId, EmployeeId, Username, EmployeeCode, PasswordSalt, PasswordHash, IsActive)
SELECT
    CONCAT(N'usr-', EmployeeId),
    EmployeeId,
    Email,
    Code,
    NEWID(),
    0x00,
    CASE WHEN Status = N'Nghỉ việc' THEN 0 ELSE 1 END
FROM dbo.Employees;

-- Tính PasswordHash từ PasswordSalt đã lưu để khớp tuyệt đối với sp_AuthenticateUser
UPDATE dbo.Users
SET PasswordHash = HASHBYTES(
    'SHA2_256',
    CONVERT(VARBINARY(MAX), CAST(CONCAT(CAST(PasswordSalt AS NVARCHAR(36)), N':', N'123456') AS NVARCHAR(200)))
);

-- Gán Role tương ứng theo logic phân quyền (emp-6 hoặc phòng Nhân sự -> admin; còn lại -> ess)
INSERT INTO dbo.UserRoles (UserId, RoleId)
SELECT
    u.UserId,
    CASE
        WHEN e.EmployeeId = N'emp-6' OR e.DepartmentId = N'dept-hr' THEN N'admin'
        ELSE N'ess'
    END
FROM dbo.Users u
INNER JOIN dbo.Employees e ON e.EmployeeId = u.EmployeeId;
GO

/* ============================================================================
   5. KIỂM TRA NHANH SAU KHI CHẠY SCRIPT (TÙY CHỌN)
   ============================================================================ */
-- Test đăng nhập Quản trị viên HR bằng Email
EXEC dbo.sp_AuthenticateUser @Identifier = N'anh.nguyen@oshrm.vn', @Password = N'123456';

-- Test đăng nhập Nhân viên (ESS) bằng Mã nhân viên
EXEC dbo.sp_AuthenticateUser @Identifier = N'NV-002', @Password = N'123456';

-- Test sai mật khẩu
EXEC dbo.sp_AuthenticateUser @Identifier = N'NV-002', @Password = N'sai_mat_khau';
GO