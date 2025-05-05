# ShopSmart E-Commerce Platform

A modern, full-stack e-commerce platform with separate admin and customer interfaces. Built with React, Node.js, Express, and Supabase.

🚀 **Live Demo**: [ShopSmart E-Commerce](https://full-stack-e-commerce-green.vercel.app/)

## Features

### Customer Features
- 🛍️ Browse products with filtering and sorting options
- 🔍 Search products by name, category, or description
- 🛒 Real-time shopping cart management
- 💳 Secure checkout process
- 📦 Order tracking and history
- 👤 User profiles and address management

### Admin Features
- 📊 Product management (CRUD operations)
- 📈 Inventory tracking
- 📋 Order management
- 🗂️ Category management
- 📊 Basic analytics and stock monitoring

### Technical Features
- 🔐 JWT-based authentication
- 🚀 Real-time updates with Supabase
- 💾 Data caching for improved performance
- 🎨 Responsive design with Tailwind CSS
- 🛡️ Input validation and error handling
- 📧 Order confirmation emails (development mode)

## Tech Stack

### Frontend
- React
- React Router DOM
- TailwindCSS
- React Icons
- React Hot Toast
- Context API for state management

### Backend
- Node.js
- Express
- Sequelize ORM
- Supabase
- JSON Web Tokens
- Node-Cache

### Database
- Supabase (PostgreSQL)

## Project Structure

```
├── backend/
│   ├── controllers/      # Request handlers
│   ├── middleware/       # Custom middleware
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   └── config/          # Configuration files
│
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── contexts/    # React contexts
│   │   ├── hooks/       # Custom hooks
│   │   ├── pages/       # Page components
│   │   ├── services/    # API services
│   │   └── utils/       # Utility functions
│   └── public/          # Static files
```

## Key Features in Detail

### Shopping Cart
- Real-time cart updates
- Persistent cart data
- Stock validation
- Optimistic updates for better UX

### Order Management
- Transaction-based order processing
- Stock level management
- Order status tracking
- Email notifications

### Product Management
- Image upload to Supabase Storage
- Category organization
- Stock level monitoring
- Bulk operations support

## Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/Skinnyfella/full-stack-e-commerce.git
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Configure environment variables**
   - Create `.env` files in both frontend and backend directories
   - Set up required environment variables:
     ```env
     # Backend .env
     DATABASE_URL=your_supabase_url
     JWT_SECRET=your_jwt_secret
     SUPABASE_URL=your_supabase_url
     SUPABASE_KEY=your_supabase_key

     # Frontend .env
     VITE_SUPABASE_URL=your_supabase_url
     VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
     VITE_API_URL=your_api_url
     ```

4. **Start the development servers**
   ```bash
   # Start backend server
   cd backend
   npm run dev

   # Start frontend server
   cd ../frontend
   npm run dev
   ```

## Deployment

The application is deployed using:
- Frontend: Vercel
- Backend: Your preferred hosting service
- Database: Supabase cloud

## Contributing

1. Fork the repository
2. Create a new branch: `git checkout -b feature-name`
3. Make your changes
4. Commit your changes: `git commit -m 'Add feature'`
5. Push to the branch: `git push origin feature-name`
6. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Tailwind CSS for the UI components
- Supabase for the backend infrastructure
- React Icons for the icon set
- All other open-source contributors