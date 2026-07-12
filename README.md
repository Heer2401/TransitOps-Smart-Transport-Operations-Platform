# TransitOps - Smart Transport Operations Platform

TransitOps is a fleet management and smart transport operations platform built using the MERN stack (MongoDB, Express, React, Node.js). It features a robust dashboard to manage vehicles, drivers, trips, fuel logs, maintenance schedules, and expenses.

---

## Project Structure

```
├── client/          # Frontend React + Vite application
└── server/          # Backend Node.js + Express API
```

---

## Prerequisites

Before running this project, ensure you have the following installed:
1. **Node.js** (v16.x or higher recommended)
2. **MongoDB** (running locally or a MongoDB Atlas URI)

---

## Getting Started

### 1. Database Setup & Configuration

1. Navigate to the `server/` directory:
   ```bash
   cd server
   ```
2. Copy the example environment file to create your `.env` file:
   ```bash
   copy .env.example .env
   # or on macOS/Linux: cp .env.example .env
   ```
3. Open the `.env` file and configure your settings:
   - **`PORT`**: The backend server port (defaults to `5000`).
   - **`MONGO_URI`**: The connection string for your MongoDB database (e.g., `mongodb://localhost:27017/transitops`).
   - **`JWT_SECRET`**: A secret key used to sign JSON Web Tokens (e.g., `supersecretjwtkey`).

---

### 2. Install Dependencies & Seed Data

#### Backend Setup
1. Inside the `server/` directory, install the required dependencies:
   ```bash
   npm install
   ```
2. (Optional but highly recommended) Run the seed script to populate your database with dummy users, vehicles, drivers, trips, fuel logs, maintenance reports, and expense data:
   ```bash
   node seed.js
   ```

#### Frontend Setup
1. Open a new terminal and navigate to the `client/` directory:
   ```bash
   cd client
   ```
2. Install the frontend dependencies:
   ```bash
   npm install
   ```

---

### 3. Running the Applications

#### Start the Backend Server
From the `server/` directory, run:
- **Development Mode** (with hot-reloading via `nodemon`):
  ```bash
  npm run dev
  ```
- **Production Mode**:
  ```bash
  npm start
  ```
The server will start running at `http://localhost:5000`.

#### Start the Frontend Client
From the `client/` directory, run:
- **Development Server**:
  ```bash
  npm run dev
  ```
The Vite development server will start, typically at `http://localhost:5173`. 
The frontend is pre-configured to proxy API requests to `http://localhost:5000`.

---

## Seed Users / Logins
When the database is seeded using `node seed.js`, the password for all users is set to **`password123`**. You can log in using any of the following accounts:

| Name | Email | Role |
| :--- | :--- | :--- |
| Alice Smith | `manager@transitops.com` | Fleet Manager |
| Bob Jones | `dispatcher@transitops.com` | Dispatcher |
| Charlie Safety | `safety@transitops.com` | Safety Officer |
| Diana Penny | `finance@transitops.com` | Financial Analyst |
