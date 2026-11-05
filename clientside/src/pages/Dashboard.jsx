import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";   // CHANGED: NavLink, Outlet
import api from "../api/axios";

export default function Dashboard() {
  const [username, setUsername] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/auth/me")
      .then((res) => setUsername(res.data.username))
      .catch(() => navigate("/login"));
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  // NEW: styles the link, highlighted when it's the current page
  const linkStyle = ({ isActive }) => ({
    padding: "6px 14px",
    border: "1px solid #333",
    borderRadius: "6px",
    textDecoration: "none",
    color: isActive ? "white" : "#333",
    background: isActive ? "#333" : "transparent",
  });

  return (
    <div>
      {/* NEW: the navbar */}
      <nav style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", borderBottom: "1px solid #ccc" }}>
        <strong>📚 BookShop</strong>
        <NavLink to="/dashboard" end style={linkStyle}>Books</NavLink>
        <NavLink to="/dashboard/authors" style={linkStyle}>Authors</NavLink>
        <span style={{ marginLeft: "auto" }}>Hi, {username}</span>
        <button onClick={logout}>Logout</button>
      </nav>

      {/* NEW: the chosen page appears here */}
      <main style={{ padding: "20px" }}>
        <Outlet />
      </main>
    </div>
  );
}