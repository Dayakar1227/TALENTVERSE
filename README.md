 # TalentVerse — Creative Talent Collaboration Platform

<p align="center">
  <img src="https://img.shields.io/badge/Frontend-React%2019-blue?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Backend-FastAPI-green?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Database-MongoDB-success?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Cloud-Cloudinary-orange?style=for-the-badge" />
  <img src="https://img.shields.io/badge/License-MIT-red?style=for-the-badge" />
</p>

<p align="center">
  <b>A modern full-stack platform designed to connect artists, recruiters, creators, and collaborators through portfolio showcasing, job opportunities, and creative networking.</b>
</p>

---

# 📌 Overview

TalentVerse is an advanced talent ecosystem that enables creative professionals to build portfolios, discover opportunities, collaborate on projects, and interact with recruiters in a centralized digital environment.

The platform is designed with a scalable architecture using modern web technologies, secure authentication mechanisms, cloud-based media handling, and responsive UI/UX principles.

---

# ✨ Core Features

## 🔐 Authentication & Authorization
- Secure User Registration & Login
- JWT-Based Authentication
- Password Encryption using bcrypt
- Protected API Routes
- Role-Based Access Control (RBAC)
- Session Validation

---

## 👤 User Management
- User Profile Creation
- Dynamic Dashboard
- User Activity Monitoring
- Trust Score Integration
- Personalized User Experience

---

## 💼 Job Portal System
- Browse Available Opportunities
- Advanced Search & Filtering
- Recruiter Job Posting
- One-Click Job Application
- Job Recommendation Structure
- Recruiter & Applicant Management

---

## 🎨 Portfolio Management
- Upload Creative Works
- Cloudinary Media Storage
- Portfolio Showcase System
- AI Verification Workflow
- Portfolio Editing & Deletion
- Public Talent Profiles

---

## 🤝 Collaboration Platform
- Create Collaboration Requests
- Discover Creative Partnerships
- Interest-Based Matching
- Community Networking Features
- Collaboration Management Dashboard

---

## 🏢 Company & Recruiter Module
- Company Profile Pages
- Recruiter Listings
- Talent Discovery System
- Organization-Specific Opportunities

---

# 🏗️ System Architecture

```text
┌─────────────────────┐
│      Frontend       │
│ React + TailwindCSS │
└──────────┬──────────┘
           │ REST APIs
           ▼
┌─────────────────────┐
│      Backend        │
│ FastAPI Application │
└──────────┬──────────┘
           │
 ┌─────────┴─────────┐
 ▼                   ▼
MongoDB Atlas    Cloudinary
 Database         Media CDN
```

---

# 🛠️ Technology Stack

## Frontend Technologies

| Technology | Purpose |
|------------|---------|
| React 19 | UI Development |
| Vite | Build Tool |
| Tailwind CSS | Styling Framework |
| React Router DOM | Routing |
| Framer Motion | Animations |
| Recharts | Data Visualization |
| Lucide React | Icon Library |

---

## Backend Technologies

| Technology | Purpose |
|------------|---------|
| FastAPI | REST API Framework |
| MongoDB Atlas | NoSQL Database |
| Motor | Async MongoDB Driver |
| Pydantic v2 | Data Validation |
| JWT | Authentication |
| bcrypt | Password Hashing |
| Cloudinary | Media Storage |

---

# 📂 Project Structure

```bash
TalentVerse/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── layouts/
│   │   └── assets/
│   │
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── app/
│   │   ├── routes/
│   │   ├── models/
│   │   ├── database/
│   │   ├── middleware/
│   │   ├── services/
│   │   ├── schemas/
│   │   └── utils/
│   │
│   ├── requirements.txt
│   └── main.py
│
├── .env
├── README.md
└── LICENSE
```

---

# ⚙️ Installation & Setup

## 1️⃣ Clone Repository

```bash
git clone https://github.com/your-username/TalentVerse.git

cd TalentVerse
```

---

# 🚀 Backend Setup

## Create Virtual Environment

```bash
python -m venv venv
```

## Activate Environment

### Windows
```bash
venv\Scripts\activate
```

### Linux / macOS
```bash
source venv/bin/activate
```

---

## Install Dependencies

```bash
pip install -r requirements.txt
```

---

## Configure Environment Variables

Create a `.env` file inside the backend directory.

```env
MONGODB_URL=your_mongodb_connection
JWT_SECRET_KEY=your_secret_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## Start Backend Server

```bash
uvicorn main:app --reload
```

Server URL:

```bash
http://127.0.0.1:8000
```

---

# 💻 Frontend Setup

## Install Packages

```bash
npm install
```

---

## Run Development Server

```bash
npm run dev
```

Frontend URL:

```bash
http://localhost:5173
```

---

# 🔗 API Documentation

## Authentication APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register New User |
| POST | `/api/auth/login` | Authenticate User |
| GET | `/api/auth/me` | Fetch Current User |

---

## Job APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/jobs` | Retrieve Jobs |
| POST | `/api/jobs` | Create Job |
| GET | `/api/jobs/{id}` | Job Details |
| DELETE | `/api/jobs/{id}` | Delete Job |

---

## Portfolio APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/portfolio/upload` | Upload Media |
| GET | `/api/portfolio` | Get Portfolio |
| DELETE | `/api/portfolio/{id}` | Delete Media |

---

## Collaboration APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/collaborations` | Create Collaboration |
| GET | `/api/collaborations` | Get Collaborations |
| DELETE | `/api/collaborations/{id}` | Delete Collaboration |

---

# 🔒 Security Features

- JWT-Based Authentication
- Secure Password Hashing
- Environment Variable Protection
- Role-Based Access Control
- Protected API Middleware
- Secure Database Integration

---

# 🗄️ Database Collections

```text
users
jobs
portfolio
collaborations
companies
applications
```

---

# ☁️ Deployment Strategy

## Frontend Deployment
- Vercel
- Netlify

## Backend Deployment
- Render
- Railway
- AWS EC2

## Database Hosting
- MongoDB Atlas

---

# 📊 Key Functionalities

| Module | Functionality |
|--------|---------------|
| Authentication | Login/Register/JWT |
| Portfolio | Upload & Manage Creative Work |
| Jobs | Apply & Post Opportunities |
| Dashboard | Analytics & User Insights |
| Collaboration | Connect with Creators |
| Company Module | Recruiter & Company Profiles |

---

# 📸 Screenshots

Add application screenshots here.

```md
![Dashboard](./screenshots/dashboard.png)
![Jobs](./screenshots/jobs.png)
![Portfolio](./screenshots/portfolio.png)
```

---

# 📈 Future Enhancements

- AI-Based Talent Recommendations
- Real-Time Messaging System
- Video Portfolio Support
- Notification & Alert System
- Resume Parsing Engine
- Advanced Analytics Dashboard

---

# 🧪 Testing

## Run Frontend Tests

```bash
npm test
```

## Run Backend Tests

```bash
pytest
```

---

# 👨‍💻 Author

## DAYAKAR

Full Stack Developer • Python Developer • AI Enthusiast

---

# 🤝 Contributing

Contributions are welcome.

1. Fork the repository
2. Create a new feature branch
3. Commit your changes
4. Push to your branch
5. Open a Pull Request

---

# 📄 License

This project is licensed under the **MIT License**.

---

# ⭐ Show Your Support

If you found this project useful:

- ⭐ Star this repository
- 🍴 Fork the project
- 🛠️ Contribute to development

---

# 🙌 Acknowledgements

- React
- FastAPI
- MongoDB Atlas
- Tailwind CSS
- Cloudinary
- Open Source Community
- Modern Web Development Ecosystem
