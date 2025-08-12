# Real Estate API

A comprehensive Real Estate API built with Node.js, Express, and MongoDB that provides complete functionality for property management, user authentication, image handling, geolocation services, and email notifications.

## Features

### Core Functionality
- **Property Management**: Create, read, update, delete property listings
- **User Authentication**: JWT-based secure authentication system
- **Image Management**: Cloudinary integration for image upload and management
- **Geolocation Services**: Address geocoding and location-based property search
- **Email Notifications**: Welcome emails, password resets, and agent contact emails
- **Wishlist & Enquiries**: Save favorite properties and contact agents
- **Advanced Search**: Filter properties by location, price, type, and amenities

### Security & Performance
- **Rate Limiting**: 100 requests per IP per 15 minutes
- **Password Security**: PBKDF2 hashing with salt
- **Input Validation**: Comprehensive request validation
- **CORS Support**: Cross-origin resource sharing enabled
- **Compression**: Response compression for better performance
- **Security Headers**: Helmet.js for enhanced security

### Advanced Features
- **Geospatial Search**: Find properties within specified radius
- **Role-based Access**: Buyer, Seller, and Admin roles
- **Property Status Tracking**: Multiple status states for property listings
- **Related Properties**: Location-based property recommendations
- **Pagination**: Efficient data loading with pagination support

## Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.0 or higher)
- Cloudinary account for image storage
- OpenCage API key for geocoding
- SMTP server for email services

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd real-estate-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   
   Create a `.env` file in the root directory:
   ```env
   # Database
   DATABASE=mongodb://localhost:27017/realestate

   # JWT Configuration
   JWT_SECRET=your_super_secret_jwt_key
   JWT_EXPIRATION=7d

   # Cloudinary Configuration
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret

   # OpenCage Geocoding
   OPENCAGE_API_KEY=your_opencage_api_key

   # Email Configuration
   SMTP_HOST=your_smtp_host
   SMTP_PORT=587
   SMTP_USER=your_email@example.com
   SMTP_PASS=your_email_password
   ```

4. **Start the server**
   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

5. **Verify installation**
   
   The server will start on `http://localhost:8000`. You can test the API by visiting:
   ```
   GET http://localhost:8000/api
   ```

## API Documentation

For complete API documentation including all endpoints, request/response examples, and authentication details, please refer to the [API Documentation](http://localhost:8000/api/api-docs).

The API documentation covers:
- Authentication endpoints
- User management
- Property CRUD operations
- Image upload/management
- Search and filtering
- Wishlist and enquiries
- Admin operations
- Error handling
- Data models

## Project Structure

```
├── controllers/
│   ├── authController.js      # Authentication logic
│   └── adController.js        # Property management logic
├── helpers/
│   ├── authHelper.js          # Password hashing utilities
│   ├── cloudinary.js          # Image upload/management
│   ├── email.js              # Email service utilities
│   ├── geocoder.js           # Address geocoding
│   └── ad.js                 # Advertisement utilities
├── middleware/
│   └── authMiddleware.js     # Authentication middleware
├── models/
│   ├── user.js               # User data model
│   └── ad.js                 # Advertisement data model
├── routes/
│   ├── auth.js               # Authentication routes
│   └── ad.js                 # Advertisement routes
└── index.js                 # Main application file
```

## Technologies Used

### Backend Framework
- **Express.js**: Web application framework
- **MongoDB**: NoSQL database
- **Mongoose**: MongoDB object modeling

### Authentication & Security
- **JWT**: JSON Web Tokens for authentication
- **bcrypt/pbkdf2**: Password hashing
- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Express Rate Limit**: Rate limiting middleware

### External Services
- **Cloudinary**: Image storage and optimization
- **OpenCage**: Geocoding API
- **Nodemailer**: Email service
- **Sharp**: Image processing

### Development Tools
- **Morgan**: HTTP request logger
- **Dotenv**: Environment variable management
- **Multer**: File upload handling
- **Slugify**: URL slug generation
- **Nanoid**: Unique ID generation

## Key Features Explained

### Geospatial Search
The API uses MongoDB's geospatial indexing to provide location-based property search within a specified radius. Properties are automatically geocoded when created, allowing users to find nearby listings.

### Image Management
Integration with Cloudinary provides automatic image optimization, resizing, and CDN delivery. Images are resized to 1600x900 pixels while maintaining aspect ratio for consistent presentation.

### Role-Based Access Control
- **Buyers**: Can search, view properties, add to wishlist, and contact agents
- **Sellers**: Can create, edit, and manage their property listings
- **Admins**: Have full control over all properties and users

### Email Automation
- Welcome emails for new user registrations
- Password reset emails with temporary passwords
- Agent contact emails when users inquire about properties

### Advanced Search Capabilities
- Location-based search with radius filtering
- Price range search with tolerance
- Property type and amenity filtering
- Bedroom/bathroom count filtering

## Security Considerations

- All passwords are hashed using PBKDF2 with salt
- JWT tokens for stateless authentication
- Rate limiting to prevent abuse
- Input validation on all endpoints
- CORS configured for cross-origin requests
- Security headers via Helmet.js

## Usage Examples

### User Registration
```bash
curl -X POST http://localhost:8000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "phone": "+1234567890"
  }'
```

### Create Property Listing
```bash
curl -X POST http://localhost:8000/api/create-ad \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Beautiful Family Home",
    "address": "123 Main St, City, State",
    "price": "500000",
    "propertyType": "House",
    "action": "Sale",
    "bedrooms": 3,
    "bathrooms": 2
  }'
```

### Search Properties
```bash
curl -X POST http://localhost:8000/api/search-ads \
  -H "Content-Type: application/json" \
  -d '{
    "address": "New York, NY",
    "action": "Sale",
    "propertyType": "Apartment",
    "bedrooms": "2"
  }'
```
