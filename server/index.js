const express = require('express');
const cors = require('cors');
const sql = require('mssql/msnodesqlv8');

const app = express();
app.use(cors());
app.use(express.json());

// Cấu hình kết nối trực tiếp tới (localdb)\MSSQLLocalDB
const dbConfig = {
  connectionString: 'Driver={ODBC Driver 17 for SQL Server};Server=(localdb)\\MSSQLLocalDB;Database=OSHRM_DB;Trusted_Connection=yes;',
};

// Kiểm tra kết nối Database khi khởi động
sql.connect(dbConfig)
  .then(() => console.log('✅ Đã kết nối thành công tới SQL Server: OSHRM_DB!'))
  .catch((err) => console.error('❌ Lỗi kết nối SQL Server:', err.message));

// API 1: Xác thực đăng nhập & Phân quyền qua Stored Procedure
app.post('/api/login', async (req, res) => {
  const { identifier, password } = req.body;
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('LoginIdentifier', sql.NVarChar(150), identifier)
      .input('PlainPassword', sql.NVarChar(100), password)
      .execute('dbo.sp_AuthenticateUser');

    const userInfo = result.recordsets?.[0]?.[0];
    const permissions = result.recordsets?.[1] || [];

    if (!userInfo || userInfo.Success === 0) {
      return res.status(401).json({
        success: false,
        message: userInfo?.Message || 'Tài khoản hoặc mật khẩu không chính xác trên CSDL!'
      });
    }

    res.json({
      success: true,
      user: userInfo,
      permissions: permissions
    });
  } catch (err) {
    console.error('Lỗi truy vấn:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// API 2: Lấy danh sách Nhân viên thật từ SQL Server
app.get('/api/employees', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query('SELECT * FROM dbo.Employees');
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 OSHRM Backend API đang chạy tại http://localhost:${PORT}`);
});
