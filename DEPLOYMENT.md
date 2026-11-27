# OrbitMessenger deployment (Railway)

This repository is prepared to deploy as one Spring Boot service. The React/Vite build is copied into Spring Boot static resources, so the UI, REST API, session cookie, and WebSocket use the same HTTPS origin.

## Architecture

- Railway web service: builds the Vite frontend and Spring Boot backend from the root Dockerfile.
- Railway MySQL service: stores accounts, conversations, group memberships, and messages.
- One public Railway domain: serves the UI and API and carries the authenticated WebSocket connection.

Keeping the browser UI and API on the same origin is intentional. OrbitMessenger uses Spring Security HTTP sessions and a session-authenticated WebSocket; do not split the frontend and backend across unrelated domains without redesigning cookie and CORS configuration.

## 1. Create the Railway project

1. Create a Railway project.
2. Add a MySQL database service and name it exactly MySQL.
3. Add a service from the GitHub repository atharva9282/OrbitMessenger.
4. Use the deployment/railway branch while reviewing this deployment preparation, or merge the pull request and deploy main.
5. Keep the service root directory at the repository root (/). Railway detects the root Dockerfile.

Railway's MySQL service exposes MYSQLHOST, MYSQLPORT, MYSQLUSER, MYSQLPASSWORD, and MYSQLDATABASE.

## 2. Configure the web service variables

In the Spring Boot service Variables tab, add these reference variables (the MySQL service must be named MySQL):

```env
MYSQLHOST=${{MySQL.MYSQLHOST}}
MYSQLPORT=${{MySQL.MYSQLPORT}}
MYSQLUSER=${{MySQL.MYSQLUSER}}
MYSQLPASSWORD=${{MySQL.MYSQLPASSWORD}}
MYSQLDATABASE=${{MySQL.MYSQLDATABASE}}
APP_FRONTEND_ORIGINS=https://${{RAILWAY_PUBLIC_DOMAIN}}
COOKIE_SECURE=true
COOKIE_SAME_SITE=strict
```

Railway injects PORT; the application listens on that port. Do not set VITE_API_BASE_URL in this deployment: leaving it empty makes REST and WebSocket requests use the same public origin as the frontend.

Do not commit real credentials or .env files. The database password previously present in the repository should be treated as exposed and rotated before using this database in production. The updated application properties no longer contain a password fallback.

## 3. Deploy and generate the domain

1. Deploy the web service.
2. In the web service Settings → Networking, generate a public domain.
3. The APP_FRONTEND_ORIGINS reference above resolves to that service's public HTTPS domain; apply/redeploy the variables after the domain is available.
4. Set the Railway healthcheck path to /. The public login page is served at this path and is permitted by Spring Security.
5. Open the generated HTTPS domain.

The WebSocket origin must match the public site origin exactly. If you later use a custom domain, update APP_FRONTEND_ORIGINS to that exact origin, including https://.

## 4. Verify production behaviour

- The unauthenticated site loads the login/registration UI.
- Registration and login work.
- Refreshing the browser preserves the authenticated session.
- Direct messages and group messages persist after refresh.
- Group Details shows the creator and member identities.
- Group message sender names and left/right alignment remain correct after refresh.
- WebSocket live messaging works over wss://.
- Logging out invalidates the session.

## 5. Important operating constraints

- Keep one backend replica initially. Spring Security sessions and the current WebSocket session registry are held in application memory. Horizontal scaling requires a shared session store and a distributed live-message strategy.
- Enable Railway's MySQL backups before relying on production data.
- spring.jpa.hibernate.ddl-auto=update remains enabled for the initial deployment. For a production release with valuable data, move schema evolution to reviewed migrations.
- The Railway MySQL database should remain private; the backend connects over Railway's internal service network.
