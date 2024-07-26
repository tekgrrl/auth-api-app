import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import axios from "axios";

export default function Auth() {
  const router = useRouter();
  const { token } = router.query;
  const [message, setMessage] = useState("Authenticating...");

  useEffect(() => {
    if (token) {
      axios
        .get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/signin`, {
          params: { token },
        })
        .then((response) => {
          // Save the JWT token in localStorage
          localStorage.setItem("session_token", response.data.token);
          setMessage("Authentication successful! Redirecting...");
          // Redirect to a protected page
          setTimeout(() => {
            router.push("/protected");
          }, 2000); // Add a slight delay for UX purposes
        })
        .catch((error) => {
          console.error("Error during authentication:", error);
          setMessage("Authentication failed! Invalid or expired token.");
        });
    }
  }, [token]);

  return (
    <div>
      <h1>{message}</h1>
    </div>
  );
}
