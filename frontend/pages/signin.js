import { useState } from "react";
import axios from "axios";

export default function Signin() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSignin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/request-signin`,
        { email }
      );
      setMessage(response.data.message);
    } catch (error) {
      setMessage("Error signing in");
    }
  };

  return (
    <div>
      <h1>Signin</h1>
      <form onSubmit={handleSignin}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
        />
        <button type="submit">Request Signin Link</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}
