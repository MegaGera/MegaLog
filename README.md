# MegaLog

**MegaLog** is a service within [**Mega microservices architecture**](https://github.com/MegaGera/Mega).

*MegaLog* is a centralized logging service that collects, processes, and visualizes user action logs from all *Mega* applications and services. It provides real-time log processing, storage, and a web interface for log analysis and monitoring.

## Table of Contents

- [Service Description](#service-description)
  - [Log Processing](#log-processing)
  - [Web Interface](#web-interface)
  - [API Endpoints](#api-endpoints)
- [Part of Mega](#part-of-mega)
- [Architecture](#architecture)
- [Dependencies](#dependencies)
- [Environment Variables](#environment-variables)
- [Development Server](#development-server)
- [Build & Deploy](#build--deploy)
- [License](#license)
- [Contact & Collaborate](#contact--collaborate)

## Service Description

This service is divided into **log processing**, **web interface**, and **REST API** components.

### Log Processing

*MegaLog* consumes user action logs from **MegaQueue** (RabbitMQ) and stores them in **MongoDB**. The service processes logs in real-time, extracting relevant information and maintaining data integrity.

**Log data structure** includes:
- **Timestamp**: When the action occurred
- **Service**: Which Mega service generated the log
- **Username**: User who performed the action
- **Action**: Type of action performed (LOGIN, LOGOUT, CREATE, UPDATE, etc.)
- **Details**: Additional context and metadata
- **Metadata**: IP address, user agent, and other request information

The logs are processed using a **LogProcessor** class that handles message consumption from RabbitMQ queues and stores them efficiently in MongoDB with proper indexing.

### Web Interface

The **WebApp** is built with **React** and **TypeScript**, providing a modern and responsive interface for log visualization and analysis.

**Key features:**
- **Dashboard**: Overview of all services with statistics
- **Service-specific views**: Detailed logs for each service
- **Real-time filtering**: Filter by service, user, action, and date range
- **Charts and analytics**: Visual representation of log data
- **Responsive design**: Works on desktop and mobile devices

The interface uses **Tailwind CSS** for styling and **Chart.js** for data visualization.

### API Endpoints

The **Server** component provides RESTful API endpoints for log retrieval and statistics:

- `GET /api/logs` - Retrieve logs with pagination and filtering
- `GET /api/logs/filters` - Get available filter options
- `GET /api/logs/service/:service` - Get logs for a specific service
- `GET /api/stats` - Get general statistics
- `GET /api/stats/services` - Get service-specific statistics
- `GET /api/health` - Health check endpoint

## Part of Mega

MegaLog is part of the larger [**Mega**](https://github.com/MegaGera/Mega) project, a collection of web applications built with a **microservices architecture**.

[**Mega**](https://github.com/MegaGera/Mega) includes other services such as a [Proxy (*MegaProxy*)](https://github.com/MegaGera/MegaProxy), an [Authentication service (*MegaAuth*)](https://github.com/MegaGera/MegaAuth), a [Football App (*MegaGoal*)](https://github.com/MegaGera/MegaGoal), and other Web Applications ([*MegaMedia*](https://github.com/MegaGera/MegaMedia), [*MegaHome*](https://github.com/MegaGera/MegaHome), [*MegaDocu*](https://docusaurus.io/))

## Architecture

MegaLog consists of three main components:

### Server (Node.js + Express)
- **LogProcessor**: Handles message consumption from RabbitMQ
- **MongoDB Integration**: Stores and retrieves log data
- **REST API**: Provides endpoints for log access
- **Authentication**: Integrates with MegaAuth for security

### WebApp (React + TypeScript)
- **Dashboard**: Service overview and statistics
- **Service Views**: Detailed log analysis per service
- **Real-time Updates**: Live data refresh capabilities
- **Responsive Design**: Mobile-friendly interface

### Database (MongoDB)
- **Log Storage**: Efficient storage with proper indexing
- **Query Optimization**: Fast retrieval for large datasets
- **Data Integrity**: Ensures log data consistency

## Dependencies

### Server Dependencies
- **express**: Web framework
- **mongoose**: MongoDB object modeling
- **amqplib**: RabbitMQ client
- **cors**: Cross-origin resource sharing
- **cookie-parser**: Cookie parsing middleware

### WebApp Dependencies
- **react**: UI library
- **typescript**: Type safety
- **axios**: HTTP client
- **chart.js**: Data visualization
- **tailwindcss**: CSS framework
- **lucide-react**: Icon library

## Environment Variables

### Server Environment Variables
```javascript
# Database
MONGODB_URI=string
DB_NAME=string

# RabbitMQ
RABBITMQ_URL=string
QUEUE_NAME=string

# Server
PORT=number
NODE_ENV=string

# Authentication (Production)
VALIDATE_URI=string
CORS_ORIGIN=string
```

### WebApp Environment Variables
```javascript
# API Configuration
VITE_API_URL=string
```

## Development Server

### Server
Run `npm run start:dev` for a development server. The application will automatically reload if it detects any changes in the source files.

### WebApp
Run `npm run dev` for a development server. The application will be available at `http://localhost:5173` with hot reload.

## Build & Deploy

### Server
[`Dockerfile`](Server/Dockerfile) file builds the app for production and generates the Docker container.

[`docker-compose.yml`](Server/docker-compose.yml) file manages the image and handles it easily within the *Mega* network.

### WebApp
[`Dockerfile`](WebApp/Dockerfile) file builds the React app for production and generates the Docker container.

[`docker-compose.yml`](WebApp/docker-compose.yml) file manages the image and handles it easily within the *Mega* network.

The WebApp is served using **Nginx** in production.

## License

This project is licensed under the GPL-3.0 License. See the LICENSE file for details.

## Contact & Collaborate

Contact with me to collaborate :)

- gera1397@gmail.com
- GitHub: [MegaGera](https://github.com/MegaGera)
