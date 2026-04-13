# Parcle Backend

A Node.js backend API for a parcel delivery system built with TypeScript, Express, and MongoDB.

## Features

- User authentication with JWT
- Role-based access control
- Parcel management
- Traveller management
- OTP verification

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   ```

## Running the Application

To start the development server:
```bash
npm run dev
```

The server will run on `http://localhost:5000` by default.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/verify-otp` - Verify OTP

### Parcels
- `GET /api/parcels` - Get all parcels
- `POST /api/parcels` - Create a new parcel
- `PUT /api/parcels/:id` - Update a parcel
- `DELETE /api/parcels/:id` - Delete a parcel

### Travellers
- `GET /api/travellers` - Get all travellers
- `POST /api/travellers` - Create a new traveller
- `PUT /api/travellers/:id` - Update a traveller
- `DELETE /api/travellers/:id` - Delete a traveller

## Technologies Used

- Node.js
- TypeScript
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- Zod for validation
- bcryptjs for password hashing
- Morgan for logging
- CORS

## Project Structure

```
src/
├── app.ts              # Express app setup
├── server.ts           # Server entry point
├── config/
│   └── db.ts           # Database connection
├── controllers/        # Route controllers
├── middleware/         # Custom middleware
├── models/             # Mongoose models
├── routes/             # API routes
├── utils/              # Utility functions
└── validators/         # Input validation
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

This project is licensed under the ISC License.