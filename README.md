# Real-Time Infrastructure Health Monitoring 💓

A full-stack, real-time DevOps monitoring application that continuously tracks the availability and latency of web URLs, APIs, and network infrastructure (IPs/Domains). Built with a React frontend, a Node.js background engine, and an AWS RDS MySQL database.

## 🚀 Features

* **Real-Time Network Polling:** A persistent backend engine sweeps all registered targets every 15 seconds.
* **Smart Protocol Detection:**
  * **HTTP/HTTPS:** Performs fast `HEAD` requests (falling back to `GET` if blocked) to check web server statuses.
  * **IPs & Domains:** Performs system-level ICMP Echo (Ping) requests to test raw infrastructure latency.
* **Intelligent Statusing:** Automatically categorizes services as `Operational`, `Degraded` (high latency or 4xx errors), or `Offline` (unreachable or 5xx errors).
* **Latency History Charts:** Visualizes response times over the last 20 network sweeps using modern React charting.
* **Authentication System:** Secure JWT-based user registration and login (using bcrypt).
* **Starter Packs:** Automatically provisions a starter pack of services (GitHub, Google, Google DNS) for new users upon registration.

---

## 🏗 Architecture & Workflow

The system is decoupled into three main layers:

### 1. The Frontend (React + Vite + TailwindCSS)
* Provides a beautiful, dark-mode inspired UI for users to manage their monitors.
* Polls the backend API every 16 seconds to fetch the freshest status and latency metrics without requiring manual page refreshes.
* Built for static hosting (e.g., AWS S3) with environment variables (`VITE_API_BASE_URL`) dynamically routing traffic to the backend server.

### 2. The Backend API & Engine (Node.js + Express)
* **REST API:** Handles authentication (`/api/auth`) and CRUD operations for user-specific monitors (`/api/monitors`).
* **The DevOps Engine (`monitorEngine.js`):** A persistent loop that runs alongside the Express server. It:
  1. Pulls all active targets from the database.
  2. Runs concurrent network requests (Axios & Ping).
  3. Calculates response latency and determines the health status.
  4. Commits the fresh metrics back to the database.

### 3. The Database (AWS RDS - MySQL)
* A centralized cloud database storing user credentials securely and maintaining the real-time state and latency history of every monitor.

---

## 🛠 Tech Stack

* **Frontend:** React, Vite, Tailwind CSS, Recharts (for latency graphs), React Router
* **Backend:** Node.js, Express.js, Axios (HTTP checking), Ping (ICMP checking), jsonwebtoken, bcryptjs
* **Database:** MySQL (Hosted on AWS RDS)
* **Deployment:** AWS EC2 (Backend API & Engine), AWS S3 (Frontend), AWS RDS (Database)

---

## 💻 Local Development Setup

### Prerequisites
* Node.js (v16+)
* An AWS RDS MySQL instance (or local MySQL server)

### 1. Database Setup
Create two tables in your MySQL database:
```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE monitors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    target VARCHAR(255) NOT NULL,
    status ENUM('up', 'down', 'degraded', 'pending') DEFAULT 'pending',
    last_latency INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 2. Backend Setup
1. Navigate to the `backend` directory.
2. Install dependencies: `npm install`
3. Create a `.env` file with the following variables:
   ```env
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_HOST=your_rds_endpoint
   DB_NAME=your_db_name
   JWT_SECRET=your_super_secret_key
   PORT=5000
   ```
4. Start the server and monitoring engine: `npm run dev` or `node server.js`

### 3. Frontend Setup
1. Navigate to the `frontend` directory.
2. Install dependencies: `npm install`
3. Start the Vite development server: `npm run dev`
4. Visit `http://localhost:5173` in your browser.

---

## ☁️ Deployment Guide (AWS)

1. **Database:** Host your MySQL instance on **AWS RDS**. Make sure the Security Group allows inbound traffic on port 3306 from your EC2 instance.
2. **Backend Engine:** Deploy the `backend` folder to an **AWS EC2** instance. Ensure port 5000 is open to the internet. Run the server using a process manager like PM2 (`pm2 start server.js`).
3. **Frontend:** 
   * Create a `.env` file in the frontend folder: `VITE_API_BASE_URL=http://<YOUR_EC2_IP>:5000`
   * Build the frontend: `npm run build`
   * Upload the contents of the `dist` folder to an **AWS S3 Bucket** configured for Static Website Hosting.

---
*Built as a modern, self-hosted alternative to enterprise synthetic monitoring tools.*