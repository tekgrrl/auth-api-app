const request = require("supertest");
const { app, server } = require("../../server");
const User = require("../../models/User");
const Token = require("../../models/Token");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

const envFile = process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : ".env";
dotenv.config({ path: envFile });

beforeAll(async () => {
  // Connect to a test database before running tests
  await mongoose.connect(process.env.DB_URI);
});

afterAll(async () => {
  // Disconnect from and clean the test database after tests
  await mongoose.connection.db.dropDatabase();
  await mongoose.connection.close();
  await new Promise((resolve) => server.close(resolve));
});

describe("POST /auth/signup", () => {
  it("should create a new user and return a success message", async () => {
    const res = await request(app).post("/auth/signup").send({
      email: "test@example.com",
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty(
      "message",
      "Signup successful. Please check your email to verify your account."
    );
    expect(res.body).toHaveProperty("previewUrl");

    // Check if user was created in the database
    const user = await User.findOne({ email: "test@example.com" });
    expect(user).toBeTruthy();
    expect(user.verified).toBe(false);

    // Check if a token was created
    const token = await Token.findOne({ email: "test@example.com" });
    expect(token).toBeTruthy();
  });

  it("should return an error if email is already registered", async () => {
    // First, create a user
    await new User({ email: "existing@example.com" }).save();

    // Try to sign up with the same email
    const res = await request(app).post("/auth/signup").send({
      email: "existing@example.com",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error", "Email already registered");
  });
});
