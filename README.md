# International Payment Portal

A secure payment portal application with separate customer and employee authentication portals, built with React and Node.js.

## Features

- **Dual Portal System**: Separate authentication for customers and employees
- **Security Features**:
  - JWT token authentication
  - Bcrypt password hashing
  - Input sanitization (XSS protection)
  - Rate limiting
  - CSRF protection
  - SSL/TLS enforcement
- **Payment Processing**: Secure international payment handling with SWIFT code support

## Prerequisites

Before running this project, make sure you have installed:

- [Node.js](https://nodejs.org/) (v14 or higher)
- npm (comes with Node.js)

## Installation

1. Clone the repository or download the project files

2. Install dependencies:
   ```bash
   npm install
   ```

## Running the Application

### Development Mode

To run both the frontend and backend in development mode:

```bash
npm run dev
```

This will start:
- Frontend React app on `http://localhost:5173`
- Backend server on `http://localhost:3000`

### Frontend Only

To run just the frontend:

```bash
npm run dev:client
```

### Backend Only

To run just the backend server:

```bash
npm run dev:server
```

### Production Build

To create a production build:

```bash
npm run build
```

To preview the production build:

```bash
npm run preview
```

## Project Structure

```
international-payment-portal/
├── .github/              # GitHub configuration
├── node_modules/         # Dependencies
├── server/              # Backend Express server
│   ├── middleware/      # Authentication middleware
│   └── routes/          # API routes (auth, payments)
├── src/                 # Frontend React application
│   ├── App.jsx         # Main React component
│   ├── index.css       # Global styles
│   └── main.jsx        # React entry point
├── index.html          # HTML template
├── package.json        # Project dependencies and scripts
└── vite.config.js      # Vite configuration
```

## Usage

1. **Select Portal Type**: Choose between Customer or Employee portal
2. **Register**: Create a new account with email and password
   - Password must be 8+ characters with uppercase, lowercase, number, and special character
3. **Login**: Use your credentials to access the payment portal
4. **Process Payments**: Fill in payment details and submit

## API Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/payments/process` - Process payment (requires authentication)

## Environment Variables

The application uses the following default configuration:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`

## Technologies Used

### Frontend
- React 18
- Vite
- Lucide React (icons)

### Backend
- Express.js
- bcryptjs (password hashing)
- jsonwebtoken (JWT authentication)
- express-validator (input validation)
- helmet (security headers)
- cors (cross-origin resource sharing)

## Security Notes

- Never commit sensitive data like API keys or secrets
- Always use HTTPS in production
- Regularly update dependencies to patch security vulnerabilities
- Implement proper rate limiting in production

## License

This project is for educational purposes.
