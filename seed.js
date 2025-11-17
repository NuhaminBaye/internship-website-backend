const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: './config.env' });

// Import models
const User = require('./models/User');
const Company = require('./models/Company');
const Internship = require('./models/Internship');
const Resource = require('./models/Resource');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/internship-platform', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const seedData = async () => {
  try {
    console.log('Starting database seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Company.deleteMany({});
    await Internship.deleteMany({});
    await Resource.deleteMany({});

    console.log('Cleared existing data');

    // Create sample users
    const users = await User.create([
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        phone: '+1234567890',
        location: 'New York, NY',
        bio: 'Computer Science student passionate about web development',
        skills: ['JavaScript', 'React', 'Node.js', 'Python'],
        education: [{
          institution: 'University of Technology',
          degree: 'Bachelor of Science',
          fieldOfStudy: 'Computer Science',
          startDate: new Date('2020-09-01'),
          endDate: new Date('2024-05-01'),
          current: false
        }],
        preferences: {
          industries: ['Technology', 'Software Development'],
          internshipTypes: ['remote', 'full-time'],
          locations: ['New York', 'Remote'],
          salaryRange: { min: 2000, max: 5000 }
        }
      },
      {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        password: 'password123',
        phone: '+1234567891',
        location: 'San Francisco, CA',
        bio: 'Marketing student with interest in digital marketing and social media',
        skills: ['Digital Marketing', 'Social Media', 'Content Creation', 'Analytics'],
        education: [{
          institution: 'State University',
          degree: 'Bachelor of Arts',
          fieldOfStudy: 'Marketing',
          startDate: new Date('2021-09-01'),
          endDate: new Date('2025-05-01'),
          current: true
        }],
        preferences: {
          industries: ['Marketing', 'Digital Media'],
          internshipTypes: ['part-time', 'remote'],
          locations: ['San Francisco', 'Remote'],
          salaryRange: { min: 1500, max: 3000 }
        }
      }
    ]);

    console.log('Created sample users');

    // Create sample companies
    const companies = await Company.create([
      {
        name: 'TechCorp Solutions',
        email: 'hr@techcorp.com',
        password: 'password123',
        website: 'https://techcorp.com',
        phone: '+1234567892',
        description: 'Leading technology company specializing in innovative software solutions',
        industry: 'Technology',
        size: '201-500',
        location: {
          address: '123 Tech Street',
          city: 'San Francisco',
          state: 'CA',
          country: 'USA',
          zipCode: '94105'
        },
        culture: {
          values: ['Innovation', 'Collaboration', 'Excellence'],
          benefits: ['Health Insurance', 'Flexible Hours', 'Learning Budget'],
          workEnvironment: 'Modern office with collaborative spaces'
        },
        socialMedia: {
          linkedin: 'https://linkedin.com/company/techcorp',
          twitter: 'https://twitter.com/techcorp'
        }
      },
      {
        name: 'MarketingPro Agency',
        email: 'careers@marketingpro.com',
        password: 'password123',
        website: 'https://marketingpro.com',
        phone: '+1234567893',
        description: 'Full-service marketing agency helping businesses grow their digital presence',
        industry: 'Marketing',
        size: '51-200',
        location: {
          address: '456 Marketing Ave',
          city: 'New York',
          state: 'NY',
          country: 'USA',
          zipCode: '10001'
        },
        culture: {
          values: ['Creativity', 'Results', 'Teamwork'],
          benefits: ['Health Insurance', 'Remote Work', 'Professional Development'],
          workEnvironment: 'Creative and dynamic workspace'
        },
        socialMedia: {
          linkedin: 'https://linkedin.com/company/marketingpro',
          instagram: 'https://instagram.com/marketingpro'
        }
      }
    ]);

    console.log('Created sample companies');

    // Create sample internships
    const internships = await Internship.create([
      {
        title: 'Software Development Intern',
        company: companies[0]._id,
        description: 'Join our development team and work on cutting-edge web applications using modern technologies.',
        requirements: [
          'Currently enrolled in Computer Science or related field',
          'Experience with JavaScript and React',
          'Strong problem-solving skills',
          'Good communication skills'
        ],
        responsibilities: [
          'Develop web applications using React and Node.js',
          'Collaborate with senior developers',
          'Participate in code reviews',
          'Write unit tests'
        ],
        skills: ['JavaScript', 'React', 'Node.js', 'Git', 'Testing'],
        location: 'San Francisco, CA',
        internshipType: 'full-time',
        duration: '3 months',
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-08-31'),
        applicationDeadline: new Date('2024-05-15'),
        salary: {
          amount: 4000,
          currency: 'USD',
          period: 'monthly'
        },
        benefits: [
          'Health Insurance',
          'Flexible Work Hours',
          'Learning Budget',
          'Mentorship Program'
        ],
        category: 'Software Development',
        industry: 'Technology',
        experienceLevel: 'entry-level',
        maxApplications: 50,
        tags: ['web-development', 'react', 'nodejs', 'full-stack']
      },
      {
        title: 'Digital Marketing Intern',
        company: companies[1]._id,
        description: 'Learn digital marketing strategies and work on real client campaigns.',
        requirements: [
          'Currently enrolled in Marketing or related field',
          'Basic knowledge of social media platforms',
          'Creative thinking abilities',
          'Analytical skills'
        ],
        responsibilities: [
          'Create social media content',
          'Analyze campaign performance',
          'Assist with client presentations',
          'Research market trends'
        ],
        skills: ['Social Media', 'Content Creation', 'Analytics', 'Marketing'],
        location: 'New York, NY',
        internshipType: 'part-time',
        duration: '6 months',
        startDate: new Date('2024-07-01'),
        endDate: new Date('2024-12-31'),
        applicationDeadline: new Date('2024-06-15'),
        salary: {
          amount: 2500,
          currency: 'USD',
          period: 'monthly'
        },
        benefits: [
          'Remote Work Option',
          'Professional Development',
          'Client Interaction',
          'Portfolio Building'
        ],
        category: 'Digital Marketing',
        industry: 'Marketing',
        experienceLevel: 'entry-level',
        maxApplications: 30,
        tags: ['digital-marketing', 'social-media', 'content-creation']
      }
    ]);

    console.log('Created sample internships');

    // Create sample resources
    const resources = await Resource.create([
      {
        title: 'How to Write a Winning Resume',
        content: `
          <h2>Introduction</h2>
          <p>Your resume is your first impression with potential employers. Here's how to make it stand out:</p>
          
          <h3>1. Choose the Right Format</h3>
          <p>Use a clean, professional format that's easy to read. Stick to standard fonts like Arial or Times New Roman.</p>
          
          <h3>2. Highlight Your Skills</h3>
          <p>Include relevant skills that match the job description. Use action verbs to describe your achievements.</p>
          
          <h3>3. Quantify Your Achievements</h3>
          <p>Use numbers and percentages to show the impact of your work. For example: "Increased website traffic by 40%"</p>
          
          <h3>4. Keep It Concise</h3>
          <p>Limit your resume to 1-2 pages. Focus on the most relevant experience and achievements.</p>
          
          <h3>5. Proofread</h3>
          <p>Check for spelling and grammar errors. Ask someone else to review it as well.</p>
        `,
        excerpt: 'Learn how to create a professional resume that gets you noticed by employers.',
        category: 'resume',
        tags: ['resume', 'job-search', 'career'],
        author: users[0]._id,
        readingTime: 5,
        isPublished: true
      },
      {
        title: 'Ace Your Interview: 10 Essential Tips',
        content: `
          <h2>Pre-Interview Preparation</h2>
          <p>Preparation is key to interview success. Here are essential tips:</p>
          
          <h3>1. Research the Company</h3>
          <p>Learn about the company's mission, values, and recent news. This shows genuine interest.</p>
          
          <h3>2. Practice Common Questions</h3>
          <p>Prepare answers for common questions like "Tell me about yourself" and "Why do you want this job?"</p>
          
          <h3>3. Prepare Questions to Ask</h3>
          <p>Have thoughtful questions ready about the role, team, and company culture.</p>
          
          <h3>4. Dress Appropriately</h3>
          <p>Choose professional attire that matches the company culture.</p>
          
          <h3>5. Arrive Early</h3>
          <p>Plan to arrive 10-15 minutes early to account for any delays.</p>
          
          <h2>During the Interview</h2>
          <h3>6. Maintain Eye Contact</h3>
          <p>Show confidence and engagement through good eye contact.</p>
          
          <h3>7. Listen Carefully</h3>
          <p>Pay attention to the interviewer's questions and respond thoughtfully.</p>
          
          <h3>8. Use the STAR Method</h3>
          <p>Structure your answers using Situation, Task, Action, Result format.</p>
          
          <h3>9. Show Enthusiasm</h3>
          <p>Express genuine interest in the role and company.</p>
          
          <h3>10. Follow Up</h3>
          <p>Send a thank-you email within 24 hours of the interview.</p>
        `,
        excerpt: 'Master the art of interviewing with these proven tips and strategies.',
        category: 'interview',
        tags: ['interview', 'job-search', 'career'],
        author: users[1]._id,
        readingTime: 8,
        isPublished: true
      }
    ]);

    console.log('Created sample resources');

    console.log('Database seeding completed successfully!');
    console.log(`Created ${users.length} users, ${companies.length} companies, ${internships.length} internships, and ${resources.length} resources`);

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the seeder
seedData();
