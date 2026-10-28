# AWDF Practical 7: Containerized MERN Task Manager & Portfolio

A full-stack containerized web application built with React (Vite), Express.js, MongoDB, and Docker Compose.

---

## 🚀 Quick Start with Docker

### 1. Run Everything via Docker Compose

In the root directory, simply run:

```bash
docker compose up -d --build
```

This starts all three services in connected containers:
- **Frontend (Vite Preview)**: [http://localhost:5173](http://localhost:5173)
- **Backend API (Express.js)**: [http://localhost:5001](http://localhost:5001)
- **Database (MongoDB 7.0)**: `localhost:27017`

### 2. Open in Your Browser

Navigate to:
```
http://localhost:5173
```

---

## 🔑 Login & Authentication

To access the JWT-protected **Todo App** and view **Backend Task Data** under Projects:

- Click **"Sign Up"** at the bottom of the auth card to register with your own username, email, and password.
- Once registered, you will be automatically signed in, or you can log in with your email/username and password.

---

## 🛠️ Architecture & Port Mapping

| Service | Container Port | Host Port | Description | Healthcheck |
| :--- | :--- | :--- | :--- | :--- |
| **frontend** | `5173` | `5173` | Production preview with API reverse proxy | Dependent on backend |
| **backend** | `5001` | `5001` | Express REST API with JWT Auth & caching | `GET /health` |
| **mongodb** | `27017` | `27017` | MongoDB 7.0 document store | `adminCommand("ping")` |

---

## 🛑 Useful Docker Commands

- **Stop containers**:
  ```bash
  docker compose down
  ```
- **View live container logs**:
  ```bash
  docker compose logs -f
  ```
- **Check container status**:
  ```bash
  docker compose ps
  ```

