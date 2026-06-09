# Slicely - Custom Pizza Delivery Web Application

Slicely is a premium full-stack web application built for the **AICTE / Oasis Infobyte Level 3 Internship Task**. It allows customers to build their own custom pizzas with dynamic visual feedback, place orders, complete test payments, and track order stages in real-time. It also provides an administrator panel for inventory auditing, threshold parameters adjustment, and order tracking dashboard.

## 🚀 Key Features

1. **User & Admin Authentication**: Complete signup, login, email verification with OTP, and forgot-password reset flow.
2. **Interactive Pizza Visualizer**: A 2D rendering canvas that builds your pizza dynamically in the browser as you select toppings (crust, sauce, cheese, veggies, meats).
3. **Smart Inventory-Connected Checks**: Ingredient selection panels indicate stock levels and block out-of-stock items dynamically.
4. **Simulated Razorpay Gateway**: Supports sandbox mode. If Razorpay keys are omitted or dummy, a beautiful simulated validation window executes to verify orders automatically.
5. **Admin Inventory Sliders**: Adjust raw stock quantities and low-stock alert thresholds.
6. **Low Stock Email Alerts**: Automatically triggers alert emails via Nodemailer when any stock breaches safety parameters.
7. **Real-time Timeline Tracking**: Synchronized tracking (Received -> Kitchen -> Out for Delivery -> Delivered) powered by Socket.io so client dashboards update without page refreshes.
8. **Smart Database Fallback**: Runs instantly using local JSON file-based database if MongoDB is not installed or running.

---

## 🛠️ Tech Stack

- **Frontend**: React (Vite), Lucide Icons, Socket.io-Client
- **Backend**: Node.js, Express, Socket.io, Nodemailer, Razorpay SDK, Mongoose/MongoDB

---

## 📂 Project Structure

```
pizza-delivery-website/
├── backend/
│   ├── config/          # DB connection, mailer, and razorpay configs
│   ├── controllers/     # Controller logic (Auth, Inventory, Orders, Payments)
│   ├── middleware/      # Auth & Admin role checkpoints
│   ├── models/          # Mongoose Schemas (User, Order, Inventory)
│   ├── routes/          # Express Routers
│   ├── server.js        # Server Entry point
│   ├── .env             # Active environment settings
│   └── package.json     # Node dependencies
└── frontend/
    ├── src/
    │   ├── components/  # Shared layouts, visualizer canvas
    │   ├── context/     # React Context providers (Auth, Orders)
    │   ├── pages/       # Home (Builder), Auth, User & Admin Dashboards
    │   ├── App.jsx      # Navigation, layouts, and socket connection
    │   ├── index.css    # Premium CSS design system (glassmorphism & animations)
    │   └── main.jsx
    ├── index.html
    ├── vite.config.js   # Vite config with API proxy to port 5000
    └── package.json
```

---

## 💻 Running Locally

### Prerequisites
- Node.js installed locally.
- MongoDB installed (optional - if MongoDB is offline, the app automatically switches to local file storage!).

### Step 1: Install Dependencies

Open your terminal and run:

```bash
# Install backend packages
cd backend
npm install

# Install frontend packages
cd ../frontend
npm install
```

### Step 2: Configure Environment Variables

The default `.env` variables are pre-configured to run out of the box. If you wish to use real credentials, edit `backend/.env`:

```ini
PORT=5000
MONGO_URI=mongodb://localhost:27017/pizza-delivery
JWT_SECRET=supersecretpizzaappkey123
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=noreply@pizzadelivery.com
ADMIN_EMAIL=admin@pizzadelivery.com
RAZORPAY_KEY_ID=rzp_test_dummykey123
RAZORPAY_KEY_SECRET=dummysecretkey456
```

### Step 3: Start the Servers

You will need to start both the backend server and the frontend development server:

#### Start Backend:
```bash
cd backend
npm run dev
```

#### Start Frontend (in a new terminal):
```bash
cd frontend
npm run dev
```

The React website will launch at **`http://localhost:3000`**.

---

## 📝 Grading & Testing Guide

1. **Creating Admin Account**: Go to the Sign Up screen, check the **"Register as Admin"** box, and sign up. You will instantly have administrator rights.
2. **Developer OTP helper**: During registration or password resets, the email OTP verification code is displayed in a green **"Dev Sandbox Hint"** card on the screen. Copy-paste this code to verify (no SMTP set up needed!).
3. **Placing Order**: Go to the Pizza Builder, customize a pizza, and click **"Order Pizza"**.
4. **Paying**: Click **"Pay"** on the payment window. The checkout will automatically execute simulated signatures and confirm the order.
5. **Real-time Status Updates**:
   - Open a client window at `http://localhost:3000` logged into your User account and go to **"My Orders"** (the tracking timeline will show "Order Received").
   - Open an incognito/separate browser window logged into your Admin account and go to **"Admin Dashboard"**.
   - Change the status dropdown for the order. Watch the User's timeline update in real-time instantly without refreshing the page!
