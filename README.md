# Code Track

Code Track is a modern, full-stack web application designed for competitive programmers to seamlessly track their progress, analyze their performance, and stay updated with coding contests. By integrating with the Codeforces API, Code Track provides users with real-time insights into their coding journey.

## 🚀 Features

### User Authentication & Security
- **Secure Authentication:** JWT-based login and registration system with Bcrypt password hashing.
- **Email Verification:** Secure OTP-based email verification using Nodemailer/Resend.
- **Profile Management:** Update user details, manage settings, and upload profile pictures (handled via Multer).

### Codeforces Integration
- **Account Linking:** Connect your Codeforces handle to fetch real-time data.
- **Dashboard Overview:** View key metrics including current rating, max rating, rank, max rank, problems solved, and community contribution.
- **Rating History:** Visualize your rating trajectory over time with interactive charts.
- **Streak Tracking:** Keep the momentum going by tracking your active coding streaks.

### Contest Management
- **Upcoming Contests:** Stay prepared by viewing a list of upcoming Codeforces contests.
- **Contest History:** Review your past contest performances and historical data.

### Premium UI/UX
- **Modern Design:** Dark-themed interface with glassmorphism effects, dynamic gradients, and smooth micro-animations.
- **Responsive Layout:** fully responsive design ensuring a seamless experience across desktop and mobile devices.
- **Data Visualization:** Clean and interactive charts built with Recharts to display rating history and progress.
- **Real-time Feedback:** Toast notifications via Sonner for a responsive user experience.

## 💻 Technology Stack

### Frontend
- **Framework:** React 19, Vite
- **Styling:** Tailwind CSS (v4), PostCSS, Tailwind Merge
- **UI Components:** Shadcn UI, Radix UI, Base UI
- **Icons:** Lucide React, React Icons
- **Data Visualization:** Recharts
- **Routing:** React Router DOM
- **HTTP Client:** Axios
- **Notifications:** Sonner

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose
- **Authentication:** JSON Web Tokens (JWT)
- **Email Services:** Nodemailer, Resend, Brevo
- **File Uploads:** Multer
- **External API:** Codeforces API integration

## 📂 Project Structure

- `client/`: Contains the React/Vite frontend application, including pages (Dashboard, Analytics, Contests, Profile), components, routes, and services.
- `server/`: Contains the Node.js/Express backend, including controllers, models (UserModel), routes, middleware, and external API services.

## 🛠️ Getting Started

### Prerequisites
- Node.js installed on your machine
- MongoDB instance (local or Atlas)
- Codeforces API access (public endpoints used)

### Installation

1. **Clone the repository**
2. **Install Backend Dependencies:**
   ```bash
   cd server
   npm install
   ```
3. **Install Frontend Dependencies:**
   ```bash
   cd client
   npm install
   ```

### Configuration
1. Create a `.env` file in the `server` directory and add the following variables:
   - `PORT`
   - `MONGODB_URI`
   - `JWT_SECRET`
   - Email service credentials (e.g., Resend API key)
2. Create a `.env` file in the `client` directory to configure the backend API URL:
   - `VITE_API_URL`

### Running the Application
1. **Start the Backend Server:**
   ```bash
   cd server
   npm run dev
   ```
2. **Start the Frontend Development Server:**
   ```bash
   cd client
   npm run dev
   ```

## 📈 Future Enhancements
- Integration with other competitive programming platforms (LeetCode, CodeChef).
- Advanced problem-solving analytics by tags and difficulty.
- Social features to compare progress with friends.
