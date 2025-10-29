import './index.css'
import { useEffect } from "react";

function App() {
  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/test")
      .then(res => res.json())
      .then(data => console.log("Data dari backend:", data))
      .catch(err => console.error("CORS error:", err));
  }, []);

  return (
    <div className="p-6 text-xl font-semibold text-blue-600">
      React + Laravel API Connected
    </div>
  );
}

export default App;
