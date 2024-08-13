const express = require("express");
const app = express();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const dotenv = require("dotenv");
const JWT_SECRET = process.env.JWT_SECRET;

app.use(express.json());
dotenv.config();


const users = [
  { id: 1, username: "user1", password: bcrypt.hashSync("password1", 10) },
  { id: 2, username: "user2", password: bcrypt.hashSync("password2", 10) },
  { id: 3, username: "user3", password: bcrypt.hashSync("password3", 10) },
];

app.get("/hello", (req, res) => {
  res.send("<h1>Hello World!</h1>");
});

app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;

  // Find user
  const user = users.find((u) => u.username === username);

  // Check if user exists and password is correct
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: "Invalid username or password" });
  }

  // Generate JWT
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "1h" });

  res.json({ message: "Login successful", token });
});

const expenses = [
  {
    id: 1,
    userId: 1,
    description: "Groceries",
    amount: 50.0,
    date: "2024-07-30",
  },
  { id: 2, userId: 1, description: "Gas", amount: 30.0, date: "2024-07-29" },
  {
    id: 3,
    userId: 2,
    description: "Movie tickets",
    amount: 25.0,
    date: "2024-07-28",
  },
];

app.get("/api/expenses", (req, res) => {
  console.log(expenses);
  res.json(expenses);
});

app.get("/api/totalExpense", (req, res) => {
  const userId = parseInt(req.query.userId);

  if (!userId) {
    // Check if userId is not provided
    return res.status(400).json({ message: "User ID is required." }); // Return 400 Bad Request
  }

  // Filter expenses by userId
  const userExpenses = expenses.filter(
    (totalExpense) => totalExpense.userId === userId
  );

  if (userExpenses.length === 0) {
    // If no expenses found for the user
    return res
      .status(404)
      .json({ message: "No expenses found for the specified user." }); // Return 404 Not Found
  }

  // Calculate total expense amount
  const totalExpense = userExpenses.reduce(
    (total, expense) => total + expense.amount,
    0
  );

  // Return total expense as JSON
  res.json({ userId, totalExpense });
});

app.post("/api/expenses", (req, res) => {
  const { error } = validateExpense(req.body);
  if (error) {
    res.status(400).json(error.details[0].message);
    return;
  }
  const { userId, description, amount, date } = req.body;
  const expense = {
    id: expenses.length + 1,
    description,
    amount: parseFloat(amount),
    date,
  };
  expenses.push(expense);
  res.status(201).json(expense);
});

app.put("/api/expenses/:id", (req, res) => {
  const id = parseInt(req.params.id); // Parse id from URL as integer.

  const expense = expenses.find((expense) => expense.id === id);

  if (!expense) {
    res.status(404).json("Expense doesn't exist");
    return;
  }

  const { error } = validateExpense(req.body); // Validate the incoming data.

  if (error) {
    res.status(400).json(error.details[0].message); // Send a 400 error if validation fails.
    return;
  }

  const { description, amount, date } = req.body; // Extract details from request body for updating.

  // Update the existing expense
  expense.description = description; // Update description.
  expense.amount = parseFloat(amount); // Convert amount to float and update.
  expense.date = date; // Update date.

  // Return the updated expense
  res.status(200).json(expense); // Return 200 OK with the updated expense data.
});

function validateExpense(expense) {
  const schema = Joi.object({
    description: Joi.string().min(3).required(),
    amount: Joi.number().positive().required(), 
    date: Joi.string().isoDate().required(),
  });
  return schema.validate(expense);
}

app.delete("/api/expenses/:id", (req, res) => {
  const id = parseInt(req.params.id); // Parse id from URL as integer.
  const expense = expenses.find((expense) => expense.id === id);
  if (!expense) {
    res.status(404).json("Expense doesn't exist");
    return;
  }

  //delete
  const index = expenses.indexOf(expense);
  expenses.splice = (index, 1);
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err.message : null,
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
