# OrbitMessenger

**A quieter kind of connection.**

OrbitMessenger is a full-stack, real-time messaging application built with React and Spring Boot. It provides a focused space to discover people, start one-to-one conversations, and exchange messages with live updates.

> OrbitMessenger is an independent messaging project. It uses familiar messaging patterns while building its own visual identity and experience.

## Features

Based on the current implementation:

- **User registration** with username, display name, and password.
- **Session-based authentication** using Spring Security.
- **Current-user profile** retrieval.
- **User discovery** by username prefix.
- **Conversation inbox** with recent-message previews.
- **Persistent one-to-one and group messaging** backed by MySQL.
- **Group management** with creator/admin roles, member lists, and group details.
- **Message history** with a 50-message retrieval window and a `before` cursor parameter.
- **Live direct and group message delivery** over an authenticated WebSocket connection.
- **CSRF protection** for state-changing HTTP requests.
- **Responsive React interface** with a dark, muted visual direction.

File attachments, voice/video calls, end-to-end encryption, and message editing/deletion are not currently implemented.

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React 19, Vite 8, JavaScript |
| Backend | Java 21, Spring Boot 4.2 |
| Security | Spring Security, session cookies, CSRF protection, BCrypt |
| Persistence | Spring Data JPA, Hibernate |
| Database | MySQL |
| Real-time communication | Native WebSockets |
| Build tools | npm, Maven |

## Project Structure

```text
OrbitMessenger/
├── backend/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/chat/backend/
│   │   │   │   ├── config/       # Security and WebSocket configuration
│   │   │   │   ├── controller/   # REST API endpoints
│   │   │   │   ├── dto/          # Request and response objects
│   │   │   │   ├── entity/       # JPA entities
│   │   │   │   ├── exception/    # API error handling
│   │   │   │   ├── repo/         # Spring Data repositories
│   │   │   │   ├── service/      # Messaging and account logic
│   │   │   │   └── websocket/    # Live message delivery
│   │   │   └── resources/
│   │   └── test/
│   ├── pom.xml
│   └── mvnw
│
└── frontend/
    ├── public/
    ├── src/
    │   ├── assets/
    │   ├── components/
    │   │   ├── auth/
    │   │   ├── chat/
    │   │   ├── common/
    │   │   ├── conversations/
    │   │   └── layout/
    │   ├── services/
    │   ├── App.jsx
    │   ├── api.js
    │   └── main.jsx
    ├── package.json
    └── vite.config.js
```

## Getting Started

### Prerequisites

Install the following before running the application:

- Java 21
- Node.js and npm
- MySQL
- Git

### 1. Clone the repository

```bash
git clone https://github.com/atharva9282/OrbitMessenger.git
cd OrbitMessenger
```

### 2. Configure MySQL

Create a MySQL user/database or use an existing local MySQL installation.

The backend's default datasource URL is:

```text
jdbc:mysql://localhost:3306/chatMessenger?createDatabaseIfNotExist=true
```

Configure database credentials using environment variables:

| Variable | Description | Default |
|---|---|---|
| `DB_USER` | MySQL username | `root` |
| `DB_PASSWORD` | MySQL password | No default; set explicitly |

For example, set these in the shell before starting the backend:

```bash
export DB_USER=your_mysql_username
export DB_PASSWORD=your_mysql_password
```

The application is configured with Hibernate `ddl-auto=update`, so JPA manages schema updates at startup. Use a dedicated development database and review schema changes before using production data.

### 3. Run the backend

Open a terminal:

```bash
cd backend
./mvnw spring-boot:run
```

On Windows, use:

```powershell
.\mvnw.cmd spring-boot:run
```

The backend uses Spring Boot's configured server port (8080 by default).

### 4. Run the frontend

Open a second terminal from the repository root:

```bash
cd frontend
npm install
npm run dev
```

The Vite development server uses `http://localhost:3000`.

The Vite development server proxies `/api` and `/ws` to the local Spring Boot server at `http://localhost:8080`, so leave `VITE_API_BASE_URL` unset for the default local setup. Set `DB_USER` and `DB_PASSWORD` in the shell before starting the backend; no database password is committed as a default.

## API Overview

The REST API is rooted at `/api`.

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/api/csrf` | Obtain a CSRF token and header name | Public |
| POST | `/api/register` | Register an account | Public |
| POST | `/api/login` | Sign in and establish a session | Public |
| POST | `/api/logout` | End the current session | Authenticated |
| GET | `/api/me` | Get the signed-in user | Authenticated |
| GET | `/api/users?q={query}` | Search users by username prefix | Authenticated |
| GET | `/api/conversations` | Get the current user's recent conversations | Authenticated |
| GET | `/api/message/{peer}?before={id}` | Retrieve message history with a user | Authenticated |
| POST | `/api/message` | Send a direct message | Authenticated |
| GET | `/api/groups` | List the signed-in user's groups | Authenticated |
| POST | `/api/groups` | Create a group | Authenticated |
| GET | `/api/groups/{groupId}` | Get group details | Authenticated |
| GET | `/api/groups/{groupId}/members` | List group members | Authenticated |
| GET | `/api/groups/{groupId}/messages?before={id}` | Retrieve group message history | Authenticated |
| POST | `/api/groups/{groupId}/messages` | Send a group message | Authenticated |

### Send a message

`POST /api/message`

Request body:

```json
{
  "recipient": "username",
  "body": "Hello from OrbitMessenger!"
}
```

The response contains the saved message entity, including its generated identifier and timestamp.

### Message history

`GET /api/message/{peer}?before={id}`

The endpoint returns up to 50 messages older than the supplied message ID. The application can use the last-loaded message ID as the cursor when implementing older-message pagination.

## Real-Time Messaging

The backend exposes a native WebSocket endpoint:

```text
/ws
```

The connection is associated with the authenticated HTTP session. When a direct or group message is saved, the backend publishes its JSON representation to eligible authenticated member sessions.

Use the same host as the backend and preserve the session cookie during the WebSocket handshake. For local development, this is typically:

```text
ws://localhost:8080/ws
```

For HTTPS deployments, use `wss://`.

## Security Notes

- Passwords are encoded using BCrypt.
- Authentication is session-based; the application does not use JWT bearer tokens.
- Session cookies are configured as HttpOnly and SameSite Strict.
- Mutating HTTP requests require a CSRF token.
- Authenticated endpoints and the WebSocket connection require a valid session.
- Do not commit real database passwords, production secrets, or environment files.
- Use HTTPS/WSS and secure cookie settings in production.

## Available Scripts

From the `frontend/` directory:

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite development server |
| `npm run build` | Create a production frontend build |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run Oxlint |

From the `backend/` directory:

| Command | Description |
|---|---|
| `./mvnw spring-boot:run` | Run the Spring Boot application |
| `./mvnw test` | Run backend tests |
| `./mvnw package` | Package the backend application |

## Current Scope

OrbitMessenger implements authenticated direct and group messaging with persistent history and WebSocket-based live delivery. Potential future directions include media sharing, richer delivery/read states, and expanded profile controls.

See [DEPLOYMENT.md](DEPLOYMENT.md) for the Railway deployment architecture and production environment variables.

## Contributing

Contributions and suggestions are welcome.

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/your-feature`.
3. Commit your changes: `git commit -m "Add your feature"`.
4. Push the branch and open a pull request.

Please include a clear description of the change and steps to verify it.

## License

No license is currently specified in this repository. Unless a license is added, the project remains under its default copyright; check with the repository owner before reusing or distributing the code.

---

<p align="center">
  Built with care for conversations that matter.
</p>
