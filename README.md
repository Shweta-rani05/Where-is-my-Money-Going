# 💰 Where Is My Money Going?

An **AI-powered Personal Finance & Expense Tracking** application built with the **MERN Stack (MongoDB, Express.js, React, Node.js) and TypeScript**. The application helps users understand their financial habits through intelligent analytics, OCR-powered bank statement parsing, personalized AI insights, budgeting tools, savings tracking, and interactive dashboards.

---

## 🚀 Features

### 🔐 Authentication & Security

* Secure JWT Authentication
* User Registration & Login
* Protected Routes
* Password Hashing with bcryptjs
* Helmet Security Middleware
* Secure HTTP-only authentication flow

### 💳 Transaction Management

* Add, Edit & Delete Transactions
* Search & Filter Transactions
* Income & Expense Tracking
* Category-based Organization
* Monthly Financial History

### 📄 OCR Bank Statement Analyzer

Upload **bank statements (PDFs or Images)** and automatically:

* Extract transactions using OCR
* Detect merchant names
* Categorize expenses
* Calculate total income & expenses
* Import transactions into your dashboard

---

### 🤖 AI Financial Insights

Powered by **Google Gemini 2.5 Flash**, the AI analyzes your financial data and generates personalized recommendations including:

* 📊 Spending Analysis
* 💰 Budget Recommendations
* 📈 Monthly Spending Trends
* ⚠️ Unusual Expense Detection
* 💡 Personalized Saving Tips
* 🎯 Goal-based Financial Suggestions

---

### 💬 AI Financial Assistant

An intelligent chatbot that understands your actual financial data, including:

* Last 30 days of transactions
* Budgets
* Savings Goals
* Income & Expenses

Ask questions like:

* *Where did I spend the most this month?*
* *Can I save ₹5,000 next month?*
* *How can I reduce unnecessary spending?*
* *Which category exceeded my budget?*

---

### 📊 Dashboard & Analytics

Interactive dashboards built using **Recharts** featuring:

* Income vs Expense Overview
* Expense Category Breakdown
* Monthly Spending Trends
* Budget Progress
* Savings Goal Progress
* Financial Summary Cards

---

### 💰 Budget Management

* Create Monthly Budgets
* Category-wise Spending Limits
* Budget Utilization Tracking
* Visual Progress Indicators
* Overspending Alerts

---

### 🎯 Savings Goals

Track financial goals such as:

* Emergency Fund
* Vacation
* New Laptop
* Investments

Features include:

* Goal Progress Tracking
* Target Amount
* Current Savings
* Completion Percentage

---

### 📱 Modern User Experience

* Responsive Design
* Clean Dashboard UI
* Smooth Animations with Framer Motion
* Loading Skeletons
* Toast Notifications
* Mobile Friendly
* Dark Theme Support

---

## 🛠 Tech Stack

### Frontend

* React (Vite)
* TypeScript
* Tailwind CSS
* React Router
* TanStack Query
* React Hook Form
* Zod
* Recharts
* Framer Motion
* Axios
* Lucide React
* React Hot Toast

### Backend

* Node.js
* Express.js
* TypeScript
* MongoDB Atlas
* Mongoose
* JWT Authentication
* bcryptjs
* Helmet
* Morgan
* CORS

### AI & OCR

* Google Gemini 2.5 Flash
* PDF.js (pdfjs-dist)
* Canvas API
* OCR-based Transaction Parsing

---

## 📂 Project Structure

```text
Where-Is-My-Money-Going/
│
├── client/                 # React + Vite + TypeScript frontend
├── server/                 # Express + TypeScript backend
├── package.json            # Root scripts
├── README.md
└── .gitignore
```

---

## ⚙️ Installation

### Clone the Repository

```bash
git clone https://github.com/Shweta-rani05/Where-is-my-Money-Going.git
cd Where-is-my-Money-Going
```

### Install Dependencies

```bash
npm install
```

```bash
cd client
npm install
```

```bash
cd ../server
npm install
```

---

## 🔑 Environment Variables

Create a `.env` file inside the `server` directory.

```env
PORT=5000

MONGODB_URI=your_mongodb_connection

JWT_SECRET=your_jwt_secret

GEMINI_API_KEY=your_gemini_api_key

CLIENT_URL=http://localhost:5173
```

---

## ▶️ Running the Project

### Backend

```bash
cd server
npm run dev
```

### Frontend

```bash
cd client
npm run dev
```

---

## 🚀 Deployment

### Frontend

* Vercel

### Backend

* Render

Supports:

* Dynamic CORS Configuration
* Production Environment Variables
* Secure API Communication

---


## 🔮 Future Enhancements

*  Email Expense Reports
*  Bank API Integration
*  Recurring Transactions
*  Investment Tracking
*  Smart Financial Notifications
*  Multi-Currency Support
*  Credit Score Insights

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome.

If you'd like to contribute:

1. Fork the repository
2. Create a new feature branch
3. Commit your changes
4. Push to your branch
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 👩‍💻 Author

**Shweta Rani**

If you found this project useful, consider giving it a ⭐ on GitHub.
