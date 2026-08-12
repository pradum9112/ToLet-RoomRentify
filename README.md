# 🏠 ToLet-RoomRentify

A comprehensive, full-stack property rental ecosystem designed to eliminate the tedious hassle of physical, door-to-door accommodation hunting. Users can seamlessly discover, reserve, and discuss rooms, flats, and hotel spaces directly through the platform.

---

## 🛠️ Technology Stack

### Frontend
* **Core Framework:** React 18 (Create React App)
* **Styling & UI:** Chakra UI · Bootstrap · Swiper.js
* **Networking & Real-Time:** Socket.io Client · Axios · Native Fetch Interceptors
* **Location & Auth:** Google Maps API · Google Sign-In (GSI) · CryptoJS

### Backend
* **Runtime & Framework:** Node.js v22.14.0 (LTS) · Express 4
* **Database & ORM:** MongoDB · Mongoose 8
* **Live Messaging:** Socket.io 4 (WebSocket Protocol)
* **Security & Auth:** JWT (`jsonwebtoken`) · `bcryptjs` · CryptoJS
* **Payments:** Razorpay Node.js SDK · HMAC SHA256 Signature Verification
* **Media Handling:** Cloudinary CDN · Multer File Parser
* **Automated Mailer:** Nodemailer (for OTP verification)

---

## 📐 System Architecture & Data Flow

This diagram illustrates the end-to-end data flow between the React Frontend, Node.js Express Backend, Socket.io Real-time Tunnel, Database, and Integrated Third-Party Cloud APIs:

```text
                               ┌─────────────────────────────────────────────────────────┐
                               │                 CLIENT SIDE (React 18)                  │
                               │                                                         │
                               │  ┌───────────────────┐             ┌─────────────────┐  │
                               │  │ UI Components     │             │ App Interceptor │  │
                               │  │ (Chakra UI/Swiper)│             │ (Token & Error) │  │
                               │  └─────────┬─────────┘             └────────┬────────┘  │
                               └────────────┼────────────────────────────────┼───────────┘
                                            │                                │
                                  HTTP / REST API Calls              WebSocket Connection
                            (auth-token / Authorization)             (Bi-directional)
                                            │                                │
                                            ▼                                ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       SERVER SIDE (Node.js + Express)                                   │
│                                                                                                         │
│    ┌───────────────────────────────────────────────────────────────────────────────────────────────┐    │
│    │ Global Middlewares: CORS | BodyParser | Custom ANSI Auto-Color Request Logger                  │    │
│    └──────────────────────────────────────────────┬────────────────────────────────────────────────┘    │
│                                                   │                                                     │
│                ┌──────────────────────────────────┴──────────────────────────────────┐                  │
│                ▼                                                                     ▼                  │
│     ┌─────────────────────┐                                               ┌────────────────────┐        │
│     │ Custom Middleware   │                                               │ Socket.io Server   │        │
│     │ (fetchUser - JWT)   │                                               │ (Real-Time Engine) │        │
│     └──────────┬──────────┘                                               └─────────┬──────────┘        │
│                │                                                                    │                   │
│   ┌────────────┴────────────┬──────────────────┬─────────────────┐                  │                   │
│   ▼                         ▼                  ▼                 ▼                  │                   │
│┌──────┐               ┌───────────┐      ┌───────────┐     ┌───────────┐            │                   │
││ Auth │               │ Property  │      │ Booking & │     │ Chat API  │            │                   │
││ API  │               │ Mgmt API  │      │ Payment   │     │ & Room    │            │                   │
│└──┬───┘               └─────┬─────┘      └─────┬─────┘     └─────┬─────┘            │                   │
└───┼─────────────────────────┼──────────────────┼─────────────────┼──────────────────┼───────────────────┘
    │                         │                  │                 │                  │
    ▼                         ▼                  ▼                 ▼                  ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       EXTERNAL SERVICES & DATABASE                                      │
│                                                                                                         │
│ ┌───────────────┐   ┌───────────────┐   ┌───────────────┐   ┌───────────────┐   ┌─────────────────────┐ │
│ │ Nodemailer    │   │ Cloudinary    │   │ Razorpay API  │   │ Google Maps   │   │ MongoDB Atlas       │ │
│ │ (OTP Mailer)  │   │ (Media Store) │   │ (PG Engine)   │   │ (Geocoding)   │   │ (Mongoose Schemas)  │ │
│ └───────────────┘   └───────────────┘   └───────────────┘   └───────────────┘   └─────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────┘