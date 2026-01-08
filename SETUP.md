# Quick Setup Guide

## Prerequisites
- Node.js (v14+)
- PostgreSQL (v12+)
- npm or yarn

## Step 1: Install Dependencies
```bash
npm install
```

## Step 2: Set Up Database

### Create Database
```bash
createdb psychopoll
```

Or using psql:
```sql
CREATE DATABASE psychopoll;
```

### Run Schema
```bash
psql -d psychopoll -f sql/schema.sql
```

Or using psql:
```bash
psql -d psychopoll
\i sql/schema.sql
```

## Step 3: Configure Environment

Create `.env` file in root directory:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/psychopoll
PORT=3000
```

**Example for local PostgreSQL:**
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/psychopoll
PORT=3000
```

## Step 4: Test Database Connection
```bash
node db/test.js
```

Expected output: `✅ DB Connected: { now: '...' }`

## Step 5: Add Sample Questions (Optional)

```sql
INSERT INTO questions (question_text, option_a, option_b, option_c, option_d) VALUES
    ('What would you do if you found $100?', 'Keep it', 'Donate it', 'Find owner', 'Split with friends'),
    ('How do you spend free time?', 'Alone', 'With friends', 'At parties', 'Outdoors');
```

## Step 6: Start Server
```bash
npm start
```

Server will run on `http://localhost:3000` (or your configured PORT)

## Step 7: Access Application

- **Player Entry**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/admin.html
- **Game View**: http://localhost:3000/game.html
- **Results**: http://localhost:3000/result.html
- **Leaderboard**: http://localhost:3000/leaderboard.html

## Troubleshooting

### Database Connection Error
- Check PostgreSQL is running: `pg_isready`
- Verify DATABASE_URL in `.env` is correct
- Ensure database exists: `psql -l | grep psychopoll`

### Port Already in Use
- Change PORT in `.env` file
- Or kill process using port: `lsof -ti:3000 | xargs kill`

### Schema Errors
- Make sure you're using PostgreSQL 12+
- Check for existing tables: `\dt` in psql
- Drop and recreate if needed: `DROP DATABASE psychopoll; CREATE DATABASE psychopoll;`

## Quick Test Flow

1. Open admin panel: http://localhost:3000/admin.html
2. Start a round:
   - Round Number: 1
   - Question ID: 1 (must exist in questions table)
   - Points: 10
   - Scoring Type: LEAST
   - Click "Start Round"
3. Open player page: http://localhost:3000
4. Join as a player (enter name)
5. Vote on the question
6. In admin panel, click "End Round"
7. View results at: http://localhost:3000/result.html

