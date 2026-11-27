# Build the React frontend.
FROM node:22-bookworm-slim AS frontend-build
WORKDIR /workspace/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./
# Keep VITE_API_BASE_URL unset: the deployed UI and API share one origin.
RUN npm run build

# Build Spring Boot and embed the Vite output as static resources.
FROM maven:3.9-eclipse-temurin-21 AS backend-build
WORKDIR /workspace/backend

COPY backend/pom.xml ./
COPY backend/src ./src
COPY --from=frontend-build /workspace/frontend/dist ./src/main/resources/static

RUN mvn -B -DskipTests package

# Run the packaged application on Railway's injected PORT.
FROM eclipse-temurin:21-jre
WORKDIR /app

COPY --from=backend-build /workspace/backend/target/backend-0.0.1-SNAPSHOT.jar ./app.jar

EXPOSE 8080
USER 10001:10001
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
