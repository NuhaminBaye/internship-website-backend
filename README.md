# Internship Platform Backend

A comprehensive backend API for an internship platform built with Express.js, MongoDB, and Socket.IO.

## Features

### For Interns
- ✅ User Registration/Login with JWT authentication
- ✅ Profile Management with resume upload
- ✅ Search and Filter Options for internships
- ✅ Detailed Internship Listings
- ✅ Resource Center with articles and guides
- ✅ Reviews and Ratings system
- ✅ Networking Opportunities (Forums/Chat)
- ✅ Email Alerts for new opportunities

### For Companies
- ✅ Company Profiles with culture showcase
- ✅ Easy Internship Posting Interface
- ✅ Application Management
- ✅ Review Management

### Additional Features
- ✅ Real-time notifications with Socket.IO
- ✅ File upload with Cloudinary integration
- ✅ Email notifications with Nodemailer
- ✅ Rate limiting and security middleware
- ✅ Comprehensive error handling
- ✅ Data validation with express-validator

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer + Cloudinary
- **Email**: Nodemailer
- **Real-time**: Socket.IO
- **Security**: Helmet, CORS, Rate Limiting
- **Validation**: Express-validator

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd internship-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Copy `config.env` and update the values:
   ```bash
   cp config.env config.env.local
   ```
   - Update the following variables:
     - `MONGODB_URI`: Your MongoDB connection string
     - `JWT_SECRET`: A secure secret for JWT tokens
     - `EMAIL_USER` & `EMAIL_PASS`: Email credentials for notifications
     - `CLOUDINARY_*`: Cloudinary credentials for file uploads

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Start the production server**
   ```bash
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/register-company` - Register new company
- `POST /api/auth/login` - Login user/company
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/password` - Update password

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/profile-picture` - Upload profile picture
- `POST /api/users/resume` - Upload resume
- `POST /api/users/education` - Add education
- `PUT /api/users/education/:id` - Update education
- `DELETE /api/users/education/:id` - Delete education
- `POST /api/users/experience` - Add experience
- `PUT /api/users/experience/:id` - Update experience
- `DELETE /api/users/experience/:id` - Delete experience
- `PUT /api/users/preferences` - Update preferences

### Companies
- `GET /api/companies/profile` - Get company profile
- `PUT /api/companies/profile` - Update company profile
- `POST /api/companies/logo` - Upload company logo
- `POST /api/companies/internships` - Create internship
- `GET /api/companies/internships` - Get company internships
- `PUT /api/companies/internships/:id` - Update internship
- `DELETE /api/companies/internships/:id` - Delete internship
- `GET /api/companies/internships/:id/applications` - Get applications
- `PUT /api/companies/applications/:id/status` - Update application status

### Internships
- `GET /api/internships` - Get all internships (with search/filter)
- `GET /api/internships/featured` - Get featured internships
- `GET /api/internships/:id` - Get internship by ID
- `POST /api/internships/:id/apply` - Apply for internship
- `GET /api/internships/my-applications` - Get user applications
- `GET /api/internships/applications/:id` - Get application by ID
- `GET /api/internships/stats` - Get internship statistics

### Reviews
- `GET /api/reviews/company/:id` - Get company reviews
- `GET /api/reviews/internship/:id` - Get internship reviews
- `POST /api/reviews` - Create review
- `PUT /api/reviews/:id` - Update review
- `DELETE /api/reviews/:id` - Delete review
- `POST /api/reviews/:id/helpful` - Mark review as helpful
- `GET /api/reviews/my-reviews` - Get user reviews
- `GET /api/reviews/company/:id/summary` - Get company rating summary

### Resources
- `GET /api/resources` - Get all resources (with search/filter)
- `GET /api/resources/featured` - Get featured resources
- `GET /api/resources/:id` - Get resource by ID
- `POST /api/resources` - Create resource
- `PUT /api/resources/:id` - Update resource
- `DELETE /api/resources/:id` - Delete resource
- `POST /api/resources/:id/image` - Upload featured image
- `POST /api/resources/:id/like` - Like resource
- `GET /api/resources/category/:category` - Get resources by category
- `GET /api/resources/author/:id` - Get resources by author
- `GET /api/resources/stats` - Get resource statistics

### Forum
- `GET /api/forum` - Get all forum posts (with search/filter)
- `GET /api/forum/pinned` - Get pinned posts
- `GET /api/forum/:id` - Get forum post by ID
- `POST /api/forum` - Create forum post
- `PUT /api/forum/:id` - Update forum post
- `DELETE /api/forum/:id` - Delete forum post
- `POST /api/forum/:id/reply` - Add reply to post
- `POST /api/forum/:id/like` - Like forum post
- `POST /api/forum/:postId/reply/:replyId/like` - Like reply
- `PUT /api/forum/:id/pin` - Pin/unpin post (Admin)
- `PUT /api/forum/:id/lock` - Lock/unlock post (Admin)
- `GET /api/forum/category/:category` - Get posts by category
- `GET /api/forum/author/:id` - Get posts by author
- `GET /api/forum/stats` - Get forum statistics

### Email Alerts
- `POST /api/alerts` - Create email alert
- `GET /api/alerts` - Get user's email alert
- `PUT /api/alerts/:id` - Update email alert
- `DELETE /api/alerts/:id` - Delete email alert
- `POST /api/alerts/send-notifications` - Send notifications (Admin)
- `POST /api/alerts/application-status` - Send application status notification

## Database Models

- **User**: Intern profiles with education, experience, skills
- **Company**: Company profiles with culture and social media
- **Internship**: Detailed internship listings with requirements
- **Application**: Internship applications with status tracking
- **Review**: Company and internship reviews with ratings
- **Resource**: Articles and guides for career development
- **Forum**: Discussion posts and replies for networking
- **Notification**: User notifications for various events
- **EmailAlert**: User preferences for email notifications

## Socket.IO Events

### Client to Server
- `join-user-room` - Join user's personal notification room
- `join-company-room` - Join company's notification room
- `new-forum-post` - Broadcast new forum post
- `new-forum-reply` - Send reply to specific forum post
- `application-status-update` - Notify applicant of status change

### Server to Client
- `forum-post-created` - New forum post notification
- `forum-reply-created` - New forum reply notification
- `application-updated` - Application status update notification

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting to prevent abuse
- CORS configuration
- Helmet for security headers
- Input validation and sanitization
- File upload restrictions

## Environment Variables

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/internship-platform
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, email nuhaminbaye95@gmail.com or create an issue in the repository.
