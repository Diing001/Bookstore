import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Books from "./pages/Books";          // NEW
import Authors from "./pages/Authors";      // NEW


export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
       <Route path="/dashboard" element={<Dashboard />}>
    <Route index element={<Books />} />
    <Route path="authors" element={<Authors />} />
  </Route>

  <Route path="*" element={<Navigate to="/login" />} />   {/* NEW: the catch-all from earlier */}
</Routes>
    
  );
}