//expressを使う
const express = require("express");
const session = require("express-session");
const app = express();

app.use(express.urlencoded({ extended: true }));

//使用するポート番号
const port = 3665;

const cors = require("cors");
app.use(cors({
  origin: 'http://localhost',
  credentials: true
}));

const { Pool } = require("pg");
const pool = new Pool({
  user: "user_3665",
  host: "db",
  database: "crm_3665", 
  password: "pass_3665", 
  port: 5432,
});

//サーバー立ち上げ
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

app.use(express.json());
app.use(session({
  secret: 'java-marathon',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false, 
    httpOnly: true,
  }
}));

//一覧表示
app.get("/customers", async (req, res) => {
  try {
    const customerData = await pool.query("SELECT * FROM customers");
    res.send(customerData.rows);
  } catch (err) {
    console.error(err);
    res.send("Error " + err);
  }
});

//クリックした会社名を取得
app.post("/company", async (req, res) => {
  const companyName = req.body.companyName;
  req.session.companyName = companyName;
  
  res.json({ success: true });
});

//詳細表示
app.post("/detail", async (req, res) => {
  const companyName = req.session.companyName;

  try {
    const companyData = await pool.query(
      "SELECT * FROM customers WHERE company_name = $1",
      [companyName]
    );
    res.json({ success: true, companyData: companyData.rows[0] });
  } catch (err) {
    console.error(err);
    res.send("Error " + err);
  }
});

//顧客編集
app.post('/edit-customer', async (req, res) => {
  const previousCompanyName = req.session.companyName;
  const formData = req.body;

  try {
    const { companyName, industry, contact, location } = formData;
    await pool.query(
      "UPDATE customers SET company_name = $1, industry = $2, contact = $3, location = $4, updated_date = CURRENT_TIMESTAMP WHERE company_name = $5",
      [companyName, industry, contact, location, previousCompanyName]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.send('Error ' + err);
  }
});

//顧客削除
app.post('/delete-customer', async (req, res) => {
  const companyName = req.session.companyName;

  try {
    await pool.query(
      "DELETE FROM customers WHERE company_name = $1",
      [companyName]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.send('Error ' + err);
  }

  delete req.session.companyName;
});

//データ追加前の確認画面
app.post("/confirm", async (req, res) => {
  const formData = req.body;
  req.session.formData = formData;

  res.json({ success: true });
});

//データ追加
app.post("/add-customer", async (req, res) => {
  const formData = req.session.formData;

  try {
    const { companyName, industry, contact, location } = formData;
    const newCustomer = await pool.query(
      "INSERT INTO customers (company_name, industry, contact, location) VALUES ($1, $2, $3, $4) RETURNING *",
      [companyName, industry, contact, location]
    );
    res.json({ success: true, customer: newCustomer.rows[0] });
  } catch (err) {
    console.error(err);
    res.json({ success: false });
  }

  delete req.session.formData;
});

app.use(express.static("public"));
