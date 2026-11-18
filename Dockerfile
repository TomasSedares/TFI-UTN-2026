FROM node:24-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

FROM maven:3.9.6-eclipse-temurin-21 AS backend-build
WORKDIR /app/backend
COPY backend/pom.xml ./
RUN mvn dependency:go-offline -q
COPY backend/src ./src
COPY --from=frontend-build /app/frontend/dist/frontend/browser ./src/main/resources/static
RUN mvn package -DskipTests -q

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=backend-build /app/backend/target/*.jar app.jar
EXPOSE 8080
# Plan free de Render: 512 MB en total. Heap al 50% para dejar lugar a metaspace, code cache e hilos.
ENTRYPOINT ["java", "-XX:+UseSerialGC", "-XX:MaxRAMPercentage=50", "-Xss512k", "-XX:ReservedCodeCacheSize=64m", "-XX:TieredStopAtLevel=1", "-jar", "app.jar"]
