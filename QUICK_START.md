# 🚀 Quick Start Guide - Internship Platform

## Overview
You now have a complete full-stack internship platform with:
- ✅ **Backend**: Node.js/Express API (in `internshipwebsitebackend/`)
- ✅ **Frontend**: React TypeScript UI (in `frontend/`)

## Start Your Application in 2 Steps

### Step 1: Start Backend Server
Open Terminal 1:
```bash
cd internshipwebsitebackend
npm start
```
Backend will run on: **http://localhost:5000**

### Step 2: Start Frontend
Open Terminal 2:
```bash
cd frontend
npm start
```
Frontend will open automatically at: **http://localhost:3000**

## 🎯 First Time Setup

### Backend Configuration
The backend is already configured with:
- MongoDB connection
- JWT authentication
- All API endpoints

### Frontend Configuration
Already configured in `.env`:
```
REACT_APP_API_URL=http://localhost:5000/api
```

## 📸 Adding Images (Optional but Recommended)

To match your UI designs, add these images to `frontend/public/images/`:

1. **hero-student.png** - Student with glasses and striped sweater
2. **about-professional.png** - Professional in red hoodie

Then update image paths in:
- `frontend/src/components/Hero.tsx` (line 28)
- `frontend/src/components/About.tsx` (line 11)

## 🧪 Testing the Application

### 1. View Homepage
- Go to http://localhost:3000
- See the beautiful hero section and about page

### 2. Register as an Intern
- Click "Log In" → "Register here"
- Fill out the form
- You'll be logged in automatically

### 3. Browse Internships
- Click "Search for Internships" or go to "Internships" menu
- View available internships
- Use search and filters

### 4. Apply for an Internship
- Click "more" on any internship card
- Click "Apply Now"
- Write a cover letter and submit

### 5. Register as a Company
- Logout, then register with "Company" role
- Company dashboard will be available

## 📁 Directory Structure

```
Documents/
├── internshipwebsitebackend/    # Backend (Port 5000)
│   ├── models/                  # Database models
│   ├── routes/                  # API routes
│   ├── middleware/              # Auth, error handling
│   ├── server.js                # Main server file
│   └── config.env               # Environment config
│
└── frontend/                    # Frontend (Port 3000)
    ├── src/
    │   ├── components/          # UI components
    │   ├── pages/               # Page components
    │   ├── services/            # API calls
    │   └── context/             # State management
    ├── public/
    │   └── images/              # Add your images here
    ├── .env                     # API configuration
    └── package.json
```

## 🔗 Available Routes

### Frontend Routes
- `/` - Homepage (Hero + About + Stats)
- `/about` - About page
- `/internships` - Browse internships
- `/internships/:id` - Internship details
- `/login` - Login page
- `/register` - Registration page
- `/dashboard` - User dashboard

### Backend API Endpoints
- `GET /api/health` - Health check
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register
- `GET /api/internships` - List internships
- `GET /api/internships/:id` - Get internship
- `POST /api/internships/:id/apply` - Apply for internship
- Many more... (see backend routes/)

## 🎨 Features

✅ Beautiful, responsive UI matching your designs
✅ User authentication (Intern & Company)
✅ Internship browsing with search and filters
✅ Application submission with cover letter
✅ Protected routes and JWT security
✅ Real-time statistics
✅ Mobile-friendly design
✅ Production-ready code

## 🐛 Troubleshooting

### Backend won't start
- Make sure MongoDB is running or connection string is valid
- Check `config.env` file
- Ensure port 5000 is not in use

### Frontend won't start
- Run `npm install` in frontend directory
- Check that port 3000 is not in use
- Verify `.env` file exists

### Connection issues
- Ensure backend is running before starting frontend
- Check browser console for errors
- Verify API URL in `.env` file

### Images not showing
- Place images in `frontend/public/images/`
- Update image paths in components
- Refresh browser

## 📚 Documentation

- **Detailed Setup**: See `frontend/SETUP.md`
- **Frontend Summary**: See `FRONTEND_SUMMARY.md`
- **Backend Docs**: See `internshipwebsitebackend/README.md`

## 🚀 Production Deployment

### Build Frontend
```bash
cd frontend
npm run build
```

### Deploy Backend
- Update MongoDB connection string in production
- Set environment variables
- Deploy to hosting service (Heroku, AWS, etc.)

## 🎉 You're All Set!

Your internship platform is ready to use. Just:
1. Start the backend server
2. Start the frontend server
3. Open http://localhost:3000
4. Start building your intern community! 🎓

For questions or issues, check the detailed documentation files.


