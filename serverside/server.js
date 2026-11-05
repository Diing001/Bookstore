require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const bookRoutes = require("./routes/bookRoutes");
const mpesaRoutes = require("./routes/mpesaRoutes");

const app = express();
connectDB();

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/mpesa", mpesaRoutes);  
app.listen(process.env.PORT, () =>
  console.log(`Server running on http://localhost:${process.env.PORT}`)
);