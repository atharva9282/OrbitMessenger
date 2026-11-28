# Build React frontend
FROM node:22-alpine AS frontend-build

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build


# Build Spring Boot backend
FROM maven:3.9-eclipse-temurin-21 AS backend-build

WORKDIR /app/backend

COPY backend/pom.xml ./
COPY backend/src ./src

# Include React production build in Spring Boot
COPY --from=frontend-build /app/frontend/dist ./src/main/resources/static

RUN mvn -B -DskipTests package


# Run application
FROM eclipse-temurin:21-jre

WORKDIR /app

COPY --from=backend-build \
    /app/backend/target/backend-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java -Dserver.port=${PORT:-8080} -jar app.jar"]