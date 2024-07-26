import { useState } from "react";
import axios from "axios";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      console.log(`base url = ${process.env.NEXT_PUBLIC_API_BASE_URL}`);
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/signup`,
        { email }
      );
      setMessage(response.data.message);
    } catch (error) {
      setMessage("Error signing up");
    }
  };

  return (
    <div>
      <h1>Signup</h1>
      <form onSubmit={handleSignup}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
        />
        <button type="submit">Signup</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}
