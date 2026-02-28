# Quick Start Guide

## 🚀 Setup in 5 Minutes

### Step 1: Install Dependencies
```bash
cd Care_Worker_Bachend
npm install
```

### Step 2: Configure Database
1. Update `.env` file with your MySQL credentials:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=care_worker_db
JWT_SECRET=your_secret_key_here
```

### Step 3: Create Database
```bash
mysql -u root -p
```
Then run:
```sql
CREATE DATABASE care_worker_db;
EXIT;
```

### Step 4: Run Schema
```bash
mysql -u root -p care_worker_db < database/schema.sql
```

### Step 5: Create Admin User
```bash
node scripts/setupAdmin.js
```

### Step 6: Start Server
```bash
npm run dev
```

Server will start on `http://localhost:5000`

### Step 7: Test Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"info@kiaantechnology.com","password":"password"}'
```

## ✅ You're Ready!

- **Admin Login:** info@kiaantechnology.com / password
- **API Base URL:** http://localhost:5000/api
- **Health Check:** http://localhost:5000/api/health

## 📚 Next Steps

1. Check `API_DOCUMENTATION.md` for all endpoints
2. Update frontend API base URL to `http://localhost:5000/api`
3. Test API endpoints using Postman or curl

## 🔧 Common Issues

**Port 5000 already in use?**
- Change PORT in `.env` file

**Database connection error?**
- Check MySQL is running
- Verify credentials in `.env`
- Ensure database exists

**Module not found?**
- Run `npm install` again

