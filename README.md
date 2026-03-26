# Truck Driver Help & Alert System

A mobile safety platform for truck drivers to report and receive real-time highway alerts.

---

## Project Structure

```
truck/
├── backend/          # Node.js + Express + MongoDB API
│   ├── models/
│   │   ├── Report.js
│   │   └── Driver.js
│   ├── routes/
│   │   ├── reports.js
│   │   └── drivers.js
│   ├── server.js
│   ├── .env
│   └── package.json
│
└── mobile/           # React Native (Expo) App
    ├── src/
    │   ├── screens/
    │   │   ├── LoginScreen.js
    │   │   ├── MapScreen.js
    │   │   ├── ReportScreen.js
    │   │   ├── HistoryScreen.js
    │   │   ├── EmergencyScreen.js
    │   │   └── ProfileScreen.js
    │   ├── components/
    │   │   ├── AppNavigator.js
    │   │   └── AlertBanner.js
    │   └── services/
    │       ├── api.js
    │       ├── socket.js
    │       └── DriverContext.js
    ├── App.js
    ├── app.json
    └── package.json
```

---

## Setup & Run

### 1. Backend

```bash
cd backend
npm install
# Edit .env with your MongoDB URI and Cloudinary credentials
npm run dev
```

### 2. Mobile App

```bash
cd mobile
npm install
```

**Important:** In `src/services/api.js` and `src/services/socket.js`, replace `YOUR_SERVER_IP` with your machine's local IP (e.g., `192.168.1.10`).

```bash
npx expo start
# Scan QR code with Expo Go app on your phone
```

---

## Features

| Feature | Description |
|---|---|
| 🗺️ Live Map | See all active alerts on Google Maps |
| 🚨 Report Issue | Submit issue with photo + auto location |
| ⚡ Real-time Alerts | Socket.io pushes alerts to nearby drivers instantly |
| 🆘 Emergency Button | One-tap SOS broadcasts your location to all drivers |
| 📋 Complaint History | View and upvote past reports |
| 👤 Driver Profile | Manage your driver identity |

## Issue Types Covered

- 👮 Police Harassment
- 💰 Roadside Extortion
- 🅿️ Unsafe Parking Areas
- 💥 Accident Zones
- 🚧 Poor Road Conditions
- ⚠️ Other

---

## Environment Variables (backend/.env)

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/truck_alert
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/drivers/register` | Register/login driver |
| PATCH | `/api/drivers/:id/location` | Update driver location |
| POST | `/api/reports` | Create new report |
| GET | `/api/reports?lat=&lng=&radius=` | Get nearby reports |
| GET | `/api/reports/driver/:id` | Get driver's report history |
| PATCH | `/api/reports/:id/upvote` | Upvote a report |
| PATCH | `/api/reports/:id/resolve` | Mark report as resolved |
