import Link from "next/link";

export default function Home() {
  return (
    <div>
      <h1>Welcome to My Auth App</h1>
      <nav>
        <ul>
          <li>
            <Link href="/signup">Signup</Link>
          </li>
          <li>
            <Link href="/signin">Signin</Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}
