const express = require("express");
const cron = require("node-cron");

const app = express();
const port = 3000;

// Middleware to parse JSON
app.use(express.json());

// In-memory storage for expenses and predefined categories
const expenses = [];
const categories = ["Food", "Travel", "Bills", "Shopping", "Miscellaneous"];

// Utility: Validate expense data
function validateExpense(expense) {
  if (!categories.includes(expense.category)) {
    return "Invalid category. Allowed categories are: " + categories.join(", ");
  }
  if (expense.amount <= 0) {
    return "Amount must be a positive number.";
  }
  if (!Date.parse(expense.date)) {
    return "Invalid date format. Use ISO 8601 format (e.g., 2024-12-04).";
  }
  return null;
}

// Default route for the root URL
app.get("/", (req, res) => {
  res.send("Welcome to the Personal Expense Tracker API! Use the appropriate endpoints to interact.");
});

// POST /expenses - Add a new expense
app.post("/expenses", (req, res) => {
  const { category, amount, date } = req.body;
  const validationError = validateExpense({ category, amount, date });

  if (validationError) {
    return res.status(400).json({ status: "error", error: validationError });
  }

  const id = expenses.length + 1;
  expenses.push({ id, category, amount, date });
  res.json({ status: "success", data: { id }, error: null });
});

// GET /expenses - Retrieve expenses with optional filters
app.get("/expenses", (req, res) => {
  const { category, start_date, end_date } = req.query;
  let filteredExpenses = expenses;

  if (category) {
    filteredExpenses = filteredExpenses.filter(exp => exp.category === category);
  }
  if (start_date && end_date) {
    filteredExpenses = filteredExpenses.filter(
      exp => new Date(exp.date) >= new Date(start_date) && new Date(exp.date) <= new Date(end_date)
    );
  }

  res.json({ status: "success", data: filteredExpenses, error: null });
});

// GET /expenses/analysis - Analyze spending
app.get("/expenses/analysis", (req, res) => {
  const totalByCategory = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {});

  const monthlyTotals = expenses.reduce((acc, exp) => {
    const month = new Date(exp.date).toISOString().slice(0, 7); // Format: YYYY-MM
    acc[month] = (acc[month] || 0) + exp.amount;
    return acc;
  }, {});

  res.json({
    status: "success",
    data: { total_by_category: totalByCategory, monthly_totals: monthlyTotals },
    error: null,
  });
});

// Cron job to generate automated summary reports
cron.schedule("0 0 * * *", () => {
  console.log("Generating daily summary...");
  const today = new Date().toISOString().slice(0, 10); // Format: YYYY-MM-DD
  const dailyExpenses = expenses.filter(exp => exp.date === today);
  const total = dailyExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  console.log(`Summary for ${today}: Total Expenses = $${total}`);
});

// Start the server
app.listen(port, () => {
  console.log(`Personal Expense Tracker API is running on http://localhost:${port}`);
});
