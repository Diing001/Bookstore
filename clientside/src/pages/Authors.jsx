import { useEffect, useState } from "react";
import api from "../api/axios";

export default function Authors() {
  const [authors, setAuthors] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/books")
      .then((res) => {
        const names = res.data.map((book) => book.author);
        setAuthors([...new Set(names)]);       // remove duplicate names
      })
      .catch(() => setError("Could not load authors"));
  }, []);

  if (error) return <p>{error}</p>;

  return (
    <div>
      <h2>Our authors</h2>
      <ul>
        {authors.map((name) => (
          <li key={name}>{name}</li>
        ))}
      </ul>
    </div>
  );
}