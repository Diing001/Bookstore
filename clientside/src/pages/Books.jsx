import { useEffect, useRef, useState } from "react";
import api from "../api/axios";

export default function Books() {
  const [books, setBooks] = useState([]);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null); // the book being bought
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [paying, setPaying] = useState(false);
  const timerRef = useRef(null);

  // search
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null); // null = not searching
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  useEffect(() => {
    api.get("/books")
      .then((res) => setBooks(res.data))
      .catch(() => setError("Could not load books"));
    return () => clearInterval(timerRef.current); // stop polling if we leave the page
  }, []);

  const finish = (text) => {
    clearInterval(timerRef.current);
    setMessage(text);
    setPaying(false);
  };

  const checkOrder = (orderId) => {
    let tries = 0;
    timerRef.current = setInterval(async () => {
      tries++;
      try {
        const { data } = await api.get(`/mpesa/status/${orderId}`);
        if (data.status === "paid") finish(`✅ Payment received. M-Pesa receipt: ${data.mpesaReceipt || "pending"}`);
        else if (data.status === "failed") finish(`❌ Payment failed: ${data.failReason || "unknown reason"}`);
        else if (tries >= 30) finish("We haven't received confirmation yet. If money was deducted, it will update soon.");
      } catch {
        finish("Could not check the payment status.");
      }
    }, 3000); // ask every 3 seconds, for up to 90 seconds
  };

  const handlePay = async () => {
    setPaying(true);
    setMessage("");
    try {
      const { data } = await api.post("/mpesa/pay", { bookId: selected._id, phone });
      setMessage("📲 Check your phone and enter your M-Pesa PIN...");
      checkOrder(data.orderId);
    } catch (err) {
      finish(err.response?.data?.message || "Could not start payment");
    }
  };

  const chooseBook = (book) => {
    clearInterval(timerRef.current);
    setSelected(book);
    setMessage("");
    setPaying(false);
  };

  // ---------- search ----------
  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setSearchError("");
    try {
      const { data } = await api.get("/books/search", { params: { q: query } });
      setSearchResults(data);
    } catch (err) {
      setSearchError(err.response?.data?.message || "Search failed");
    }
    setSearching(false);
  };

  const clearSearch = () => {
    setQuery("");
    setSearchResults(null);
    setSearchError("");
  };

  if (error) return <p>{error}</p>;

  const visibleBooks = searchResults ?? books; // search results if searching, else all books

  return (
    <div>
      <h2>Books available</h2>

      <div style={{ marginBottom: "15px" }}>
        <input
          placeholder="Search by meaning, e.g. starting a small business"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          style={{ width: "300px" }}
        />
        <button onClick={handleSearch} disabled={searching}>
          {searching ? "Searching..." : "Search"}
        </button>
        {searchResults && <button onClick={clearSearch}>Clear</button>}
        {searchError && <p>{searchError}</p>}
        {searchResults && searchResults.length === 0 && <p>No close matches found.</p>}
      </div>

      {visibleBooks.length === 0 ? (
        !searchResults && <p>No books yet.</p>
      ) : (
        <table cellPadding="8">
          <thead>
            <tr>
              <th align="left">Title</th>
              <th align="left">Price (KES)</th>
              {searchResults && <th align="left">Match</th>}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {visibleBooks.map((book) => (
              <tr key={book._id}>
                <td>
                  {book.title}
                  <div style={{ fontSize: "12px", color: "#666" }}>{book.description}</div>
                </td>
                <td>{book.price}</td>
                {searchResults && <td>{Math.round(book.score * 100)}%</td>}
                <td><button onClick={() => chooseBook(book)}>Buy</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {selected && (
        <div style={{ marginTop: "20px", padding: "15px", border: "1px solid #ccc", borderRadius: "6px", maxWidth: "400px" }}>
          <h3>Buy "{selected.title}" for KES {selected.price}</h3>
          <input
            placeholder="M-Pesa number, e.g. 0712345678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={paying}
          />
          <button onClick={handlePay} disabled={paying || !phone}>
            {paying ? "Waiting..." : "Pay with M-Pesa"}
          </button>
          {message && <p>{message}</p>}
        </div>
      )}
    </div>
  );
}