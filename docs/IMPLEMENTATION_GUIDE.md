# CollabSpace Implementation Guide 🚀

A tailored guide to building the CollabSpace platform, aligned with the current project structure and technology stack (Next.js, Express, Prisma, Shadcn UI).

---

## 📚 Phase 1: Project Setup & Architecture

### 1.1 Project Structure (Monorepo)

The project is organized as a monorepo with `client` (Next.js) and `server` (Express) directories.

```
/TeamSYNC
├── client/          # Frontend (Next.js 15+, Tailwind CSS, Shadcn UI)
│   ├── src/app      # App Router (Pages & Layouts)
│   ├── src/components/ui # Shadcn UI Components (Currently Empty)
│   └── src/store    # Zustand State Management
├── server/          # Backend (Express, Prisma, PostgreSQL)
└── docs/            # Documentation
```

### 1.2 Tech Stack

- **Frontend**: Next.js 15 (App Router), Tailwind CSS v4, Shadcn UI, Zustand (State), Axios.
- **Backend**: Node.js, Express, Prisma ORM, PostgreSQL.
- **Authentication**: JWT (Access + Refresh Tokens).

---

## 🛠 Phase 2: Backend Architecture (Current Implementation)

The backend follows a layered architecture: `Routes -> Controllers -> Services`.

### 2.1 Database Schema (`server/prisma/schema.prisma`)

The core `User` model supports email/password auth and password resets.

```prisma
model User {
  id           String       @id @default(uuid())
  email        String       @unique
  passwordHash String?
  displayName  String
  avatarUrl    String?
  authProvider AuthProvider @default(EMAIL)

  // Password Reset
  resetToken       String?   @unique
  resetTokenExpiry DateTime?

  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt

  // ... relations (Workspaces, Channels, Messages)
}
```

### 2.2 Authentication Flow

The backend implements the following endpoints in `server/src/routes/auth.js`:

| Method | Endpoint                    | Description            | Body                               |
| :----- | :-------------------------- | :--------------------- | :--------------------------------- |
| `POST` | `/api/auth/register`        | Register a new user    | `{ email, password, displayName }` |
| `POST` | `/api/auth/login`           | Login user             | `{ email, password }`              |
| `POST` | `/api/auth/forgot-password` | Request password reset | `{ email }`                        |

**Key Files:**

- `server/src/routes/auth.js`: Defines the API routes.
- `server/src/controllers/auth.controller.js`: Handles request/response logic.
- `server/src/lib/auth.js`: Utilities for hashing passwords and generating JWTs.
- `server/src/middleware/auth.middleware.js`: Protects routes using JWT verification.

---

## 🎨 Phase 3: Frontend Implementation (Action Plan)

The frontend is initialized with Next.js and Tailwind, but **Shadcn UI components are missing**, and the authentication pages are not yet implemented.

### 3.1 Install Shadcn UI Components

Since `client/src/components/ui` is empty, you must install the necessary components:

```bash
cd client
npx shadcn@latest add button input label card form alert toast sonner skeleton
```

### 3.2 Setup State Management (Zustand)

Create `client/src/store/useAuthStore.js` to manage the user session. This file is currently empty/missing.

```javascript
/* client/src/store/useAuthStore.js */
import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";
import { toast } from "sonner";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isCheckingAuth: true,

  checkAuth: async () => {
    try {
      // NOTE: Ensure your backend has a /auth/check or /users/me endpoint
      // If not, you might need to rely on stored tokens or add that endpoint
      const response = await axiosInstance.get("/auth/check");
      set({ authUser: response.data });
    } catch (error) {
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/register", data);
      set({ authUser: res.data.user });
      toast.success("Account created successfully");
    } catch (error) {
      toast.error(error.response.data.error || "Signup failed");
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data.user });
      toast.success("Logged in successfully");
    } catch (error) {
      toast.error(error.response.data.error || "Login failed");
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: () => {
    set({ authUser: null });
    toast.success("Logged out");
    // Clear tokens from local storage if managed manually
  },
}));
```

### 3.3 Create Axios Instance

Create `client/src/lib/axios.js`:

```javascript
/* client/src/lib/axios.js */
import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  withCredentials: true,
});
```

### 3.4 Implement Login Page

Update `client/src/app/auth/login/page.jsx` with this code:

```jsx
"use client";
import { useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoggingIn } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login({ email, password });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access your workspace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/auth/forgot-password"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoggingIn}>
              {isLoggingIn ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/auth/register"
              className="font-medium text-primary hover:underline"
            >
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
```

### 3.5 Implement Register Page

Create/Update `client/src/app/auth/register/page.jsx` with this code:

```jsx
"use client";
import { useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useState } from "react";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: "",
    displayName: "",
    password: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState([]);
  const [showPasswordRequirements, setShowPasswordRequirements] =
    useState(false);
  const { signup, isSigningUp } = useAuthStore();

  const validatePassword = (password) => {
    const errors = [];
    if (password.length < 8) {
      errors.push("At least 8 characters");
    }
    if (!/[A-Z]/.test(password)) {
      errors.push("One uppercase letter");
    }
    if (!/[a-z]/.test(password)) {
      errors.push("One lowercase letter");
    }
    if (!/[0-9]/.test(password)) {
      errors.push("One number");
    }
    if (!/[!@#$%^&*(),.?":{}|<>_\-+=\\/\[\]~`]/.test(password)) {
      errors.push("One special character");
    }
    return errors;
  };

  const handlePasswordChange = (e) => {
    const password = e.target.value;
    setFormData({ ...formData, password });
    if (password) {
      setPasswordErrors(validatePassword(password));
    } else {
      setPasswordErrors([]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.email || !formData.displayName || !formData.password) {
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      return;
    }

    if (passwordErrors.length > 0) {
      return;
    }

    if (formData.displayName.length < 2 || formData.displayName.length > 50) {
      return;
    }

    await signup({
      email: formData.email,
      displayName: formData.displayName,
      password: formData.password,
    });
  };

  const passwordStrength = 5 - passwordErrors.length;

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Create Account
          </CardTitle>
          <CardDescription className="text-center">
            Join CollabSpace to start collaborating
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            {/* Display Name Field */}
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                name="displayName"
                type="text"
                placeholder="John Doe"
                value={formData.displayName}
                onChange={handleChange}
                minLength={2}
                maxLength={50}
                required
              />
              <p className="text-xs text-muted-foreground">2-50 characters</p>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handlePasswordChange}
                onFocus={() => setShowPasswordRequirements(true)}
                required
              />

              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="space-y-2">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded ${
                          i < passwordStrength ? "bg-green-500" : "bg-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {passwordErrors.length === 0
                      ? "Strong password"
                      : `${passwordErrors.length} requirements left`}
                  </p>
                </div>
              )}

              {/* Password Requirements Checklist */}
              {showPasswordRequirements && passwordErrors.length > 0 && (
                <div className="mt-2 space-y-1 bg-gray-50 dark:bg-gray-800 p-2 rounded text-sm">
                  <p className="font-semibold text-xs text-muted-foreground">
                    Password must have:
                  </p>
                  {[
                    "At least 8 characters",
                    "One uppercase letter",
                    "One lowercase letter",
                    "One number",
                    "One special character",
                  ].map((req) => (
                    <div key={req} className="flex items-center gap-2">
                      {passwordErrors.includes(req) ? (
                        <AlertCircle className="h-3 w-3 text-red-500" />
                      ) : (
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                      )}
                      <span
                        className={
                          passwordErrors.includes(req)
                            ? "text-red-600"
                            : "text-green-600"
                        }
                      >
                        {req}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
              {formData.password &&
                formData.confirmPassword &&
                formData.password !== formData.confirmPassword && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>Passwords do not match</AlertDescription>
                  </Alert>
                )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={
                isSigningUp ||
                passwordErrors.length > 0 ||
                formData.password !== formData.confirmPassword
              }
            >
              {isSigningUp ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Sign Up"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="font-medium text-primary hover:underline"
            >
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
```

#### Key Features of Registration Page:

- **Real-time Password Validation**: Displays password strength indicator and checklist
- **Confirmation Password**: Ensures passwords match
- **Display Name Validation**: 2-50 character requirement
- **Email Validation**: Built-in HTML5 email validation
- **User-Friendly Feedback**: Visual indicators for all validation states
- **Loading State**: Shows spinner during signup
- **Disabled Submit**: Until all validations pass

---

### 3.6 Implement Forgot Password Page

Create/Update `client/src/app/auth/forgot-password/page.jsx` with this code:

```jsx
"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { axiosInstance } from "@/lib/axios";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState("request"); // "request" | "sent"
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await axiosInstance.post("/auth/forgot-password", {
        email,
      });
      setStep("sent");
    } catch (err) {
      // Security: Don't reveal if email exists or not
      setStep("sent");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setEmail("");
    setStep("request");
    setError("");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 px-4">
      <Card className="w-full max-w-md">
        {step === "request" ? (
          <>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">
                Reset Password
              </CardTitle>
              <CardDescription className="text-center">
                Enter your email address and we&apos;ll send you a link to reset
                your password
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || !email}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <p className="text-sm text-muted-foreground text-center">
                Remember your password?{" "}
                <Link
                  href="/auth/login"
                  className="font-medium text-primary hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </>
        ) : (
          <>
            <CardHeader>
              <div className="flex justify-center mb-4">
                <CheckCircle2 className="h-12 w-12 text-green-500" />
              </div>
              <CardTitle className="text-2xl font-bold text-center">
                Check Your Email
              </CardTitle>
              <CardDescription className="text-center">
                We&apos;ve sent a password reset link to{" "}
                <strong>{email}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>Note:</strong> The reset link will expire in 1 hour.
                  Check your spam folder if you don&apos;t see the email.
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                Click the link in the email to create a new password.
                You&apos;ll be automatically logged in after resetting your
                password.
              </p>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <Button
                onClick={handleReset}
                variant="outline"
                className="w-full"
              >
                Try Another Email
              </Button>
              <p className="text-sm text-muted-foreground text-center">
                Back to{" "}
                <Link
                  href="/auth/login"
                  className="font-medium text-primary hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  );
}
```

#### Key Features of Forgot Password Page:

- **Two-Step UI**: Request form → Success message
- **Security**: Same success message for valid/invalid emails (prevents email enumeration)
- **Email Validation**: Built-in HTML5 validation
- **User Guidance**: Clear instructions and expiry information
- **Loading State**: Visual feedback during request
- **Error Handling**: Graceful error display
- **Try Again Option**: Allows resending to different email

---

### 3.7 Backend Password Reset Endpoint

Update `server/src/routes/auth.js` to add the reset password endpoint:

```javascript
router.post("/forgot-password", authRateLimit, controller.forgotPassword);
router.post("/reset-password", controller.resetPassword); // Add this line
```

Add the `resetPassword` controller in `server/src/controllers/auth.controller.js`:

```javascript
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: "All fields required" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      return res.status(400).json({ error: passwordError });
    }

    // Hash the token to match with database
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find user with valid reset token
    const user = await prisma.user.findFirst({
      where: {
        resetToken: hashedToken,
        resetTokenExpiry: {
          gt: new Date(), // Token not expired
        },
      },
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired reset link" });
    }

    // Update password and clear reset token
    const passwordHash = await hashPassword(newPassword);

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true,
      },
    });

    // Generate new tokens
    const payload = { userId: updatedUser.id, email: updatedUser.email };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    res.json({
      message: "Password reset successful",
      user: updatedUser,
      accessToken,
      refreshToken,
    });
  } catch (err) {
    next(err);
  }
};
```

Add `crypto` import at the top of `auth.controller.js`:

```javascript
const crypto = require("crypto");
```

---

### 3.8 Frontend Reset Password Page (Optional for Full Flow)

For complete password reset flow, create `client/src/app/auth/reset-password/page.jsx`:

```jsx
"use client";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { axiosInstance } from "@/lib/axios";
import Link from "next/link";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Invalid or missing reset token");
    }
  }, [token]);

  const validatePassword = (password) => {
    const errors = [];
    if (password.length < 8) errors.push("At least 8 characters");
    if (!/[A-Z]/.test(password)) errors.push("One uppercase letter");
    if (!/[a-z]/.test(password)) errors.push("One lowercase letter");
    if (!/[0-9]/.test(password)) errors.push("One number");
    if (!/[!@#$%^&*(),.?":{}|<>_\-+=\\/\[\]~`]/.test(password))
      errors.push("One special character");
    return errors;
  };

  const handlePasswordChange = (e) => {
    const password = e.target.value;
    setFormData({ ...formData, newPassword: password });
    if (password) {
      setPasswordErrors(validatePassword(password));
    } else {
      setPasswordErrors([]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await axiosInstance.post("/auth/reset-password", {
        token,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      });
      setSuccess(true);
      setTimeout(() => router.push("/auth/login"), 2000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = 5 - passwordErrors.length;

  if (!token) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              Invalid Link
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                The password reset link is invalid or has expired. Please
                request a new one.
              </AlertDescription>
            </Alert>
            <Link href="/auth/forgot-password" className="block mt-4">
              <Button className="w-full">Request New Link</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-center">
              Password Reset Successful!
            </CardTitle>
            <CardDescription className="text-center">
              Your password has been reset. Redirecting to login...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Create New Password
          </CardTitle>
          <CardDescription className="text-center">
            Enter your new password below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                placeholder="••••••••"
                value={formData.newPassword}
                onChange={handlePasswordChange}
                required
                disabled={isLoading}
              />

              {formData.newPassword && (
                <div className="space-y-2">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded ${
                          i < passwordStrength ? "bg-green-500" : "bg-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  {passwordErrors.length === 0 && (
                    <p className="text-xs text-green-600">Strong password</p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
              {formData.newPassword &&
                formData.confirmPassword &&
                formData.newPassword !== formData.confirmPassword && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>Passwords do not match</AlertDescription>
                  </Alert>
                )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={
                isLoading ||
                passwordErrors.length > 0 ||
                formData.newPassword !== formData.confirmPassword
              }
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                "Reset Password"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 🏗️ Frontend-Backend Architecture & Data Flow

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        CLIENT (Next.js 15)                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Pages (src/app/auth/)                                          │   │
│  │  ├── login/page.jsx          → User Login                       │   │
│  │  ├── register/page.jsx       → User Registration               │   │
│  │  ├── forgot-password/page.jsx → Password Reset Request         │   │
│  │  └── reset-password/page.jsx → Create New Password             │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│           ▲                                                               │
│           │ (component rendering)                                        │
│           │                                                               │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Store (src/store/useAuthStore.js)                              │   │
│  │  ├── signup()        → POST /auth/register                     │   │
│  │  ├── login()         → POST /auth/login                        │   │
│  │  ├── logout()        → Clear tokens                            │   │
│  │  └── checkAuth()     → GET /auth/check                         │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│           ▲                                                               │
│           │ (HTTP requests)                                              │
│           │                                                               │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Axios Instance (src/lib/axios.js)                              │   │
│  │  ├── baseURL: /api                                              │   │
│  │  ├── withCredentials: true (for cookies)                       │   │
│  │  └── Request/Response interceptors (token handling)            │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
                                    ▲
                                    │ HTTP/REST
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        SERVER (Express)                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Routes (src/routes/auth.js)                                     │  │
│  │  ├── POST /api/auth/register                                     │  │
│  │  ├── POST /api/auth/login                                        │  │
│  │  ├── POST /api/auth/forgot-password                              │  │
│  │  └── POST /api/auth/reset-password                               │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│           ▲                                                               │
│           │ (request routing)                                            │
│           │                                                               │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Middleware (src/middleware/)                                    │  │
│  │  ├── auth.middleware.js      → JWT verification                 │  │
│  │  ├── error.middleware.js     → Error handling                   │  │
│  │  └── rateLimiter.js          → Rate limiting                    │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│           ▲                                                               │
│           │                                                               │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Controllers (src/controllers/auth.controller.js)                │  │
│  │  ├── register()          → Validate & create user               │  │
│  │  ├── login()             → Verify credentials                   │  │
│  │  ├── forgotPassword()    → Generate reset token                 │  │
│  │  └── resetPassword()     → Verify token & update password       │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│           ▲                                                               │
│           │ (business logic)                                             │
│           │                                                               │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Services (src/services/auth.service.js)                         │  │
│  │  └── saveResetToken()    → Generate & save reset token           │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│           ▲                                                               │
│           │                                                               │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Libraries (src/lib/)                                            │  │
│  │  ├── auth.js             → JWT & bcrypt utilities               │  │
│  │  ├── prisma.js           → Prisma client                        │  │
│  │  └── validationPassword.js → Password validation rules          │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│           ▲                                                               │
│           │ (database operations)                                        │
│           │                                                               │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Database (PostgreSQL)                                           │  │
│  │  └── User Table (Prisma ORM)                                    │  │
│  │      ├── id, email, passwordHash                                │  │
│  │      └── resetToken, resetTokenExpiry                           │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Authentication Flows

### User Registration Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          REGISTRATION FLOW                               │
└─────────────────────────────────────────────────────────────────────────┘

FRONTEND (Client)                    SERVER (Backend)                  DATABASE
─────────────────                    ───────────────                   ────────

  User fills form
  (email, displayName,
   password, confirm)
         │
         ├─→ Validate locally
         │   ✓ Format check
         │   ✓ Password strength
         │   ✓ Match confirmation
         │
         ├─→ POST /auth/register
         │   (email, displayName,
         │    password)
         │                              ◄─────────────────────────┐
         │                              │  Receive & Parse       │
         │                              │                        │
         │                              ├─→ Validate email      │
         │                              │   format               │
         │                              │                        │
         │                              ├─→ Hash password       │
         │                              │   (bcrypt 12 rounds)   │
         │                              │                        │
         │                              ├─→ Check if email      │
         │                              │   exists               │
         │                              │                        │ Query: findUnique
         │                              │─────────────────────────→ by email
         │                              │                        │
         │                              │ ◄───────────────────── │
         │                              │ (user not found ✓)    │
         │                              │                        │
         │                              ├─→ Create new user
         │                              │   (email, passwordHash,
         │                              │    displayName)        │
         │                              │─────────────────────────→ INSERT
         │                              │                        │ new User
         │                              │ ◄───────────────────── │
         │                              │ (user created ✓)      │
         │                              │                        │
         │                              ├─→ Generate tokens
         │                              │   ✓ Access (15m exp)  │
         │                              │   ✓ Refresh (7d exp)  │
         │                              │                        │
         │ ◄───────────────────────────│                        │
         │ 201 Created                 │                        │
         │ { user, accessToken,        │                        │
         │   refreshToken }            │                        │
         │                              │                        │
    Store tokens                        │
    (localStorage/cookie)               │
         │                              │
    Update useAuthStore                 │
    (authUser)                          │
         │                              │
    Redirect to                         │
    Dashboard                           │
         │                              │
         └─→ Success ✓                │
```

### User Login Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            LOGIN FLOW                                    │
└─────────────────────────────────────────────────────────────────────────┘

FRONTEND (Client)                    SERVER (Backend)                  DATABASE
─────────────────                    ───────────────                   ────────

  User enters
  (email, password)
         │
         ├─→ Validate locally
         │   ✓ Non-empty
         │   ✓ Valid email
         │
         ├─→ POST /auth/login
         │   { email, password }
         │
         │   [Rate Limit Check]
         │   ◄────────────────────
         │                              │  Receive & Parse      │
         │                              │                       │
         │                              ├─→ Find user by
         │                              │   email               │
         │                              │─────────────────────────→ Query: findUnique
         │                              │                       │ by email.toLowerCase()
         │                              │ ◄───────────────────── │
         │                              │ (user found)          │
         │                              │                       │
         │                              ├─→ Verify password
         │                              │   bcrypt.compare()    │
         │                              │   password vs         │
         │                              │   passwordHash        │
         │                              │                       │
         │                              ├─→ Password valid?
         │                              │   YES ✓               │
         │                              │                       │
         │                              ├─→ Generate tokens
         │                              │   ✓ Access (15m)     │
         │                              │   ✓ Refresh (7d)     │
         │                              │                       │
         │ ◄───────────────────────────│                       │
         │ 200 OK                      │                       │
         │ { user, accessToken,        │                       │
         │   refreshToken }            │                       │
         │                              │                       │
    Store tokens                        │
    (httpOnly cookie or               │
     localStorage)                     │
         │                              │
    Update useAuthStore                 │
    (authUser logged in)                │
         │                              │
    Redirect to                         │
    Dashboard/Last Page                 │
         │                              │
         └─→ Success ✓                │
```

**Error Cases:**

```
User not found             → 401 "Invalid credentials"
Password incorrect         → 401 "Invalid credentials"
Rate limit exceeded        → 429 "Too many requests"
```

### Forgot Password Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      FORGOT PASSWORD FLOW                                │
└─────────────────────────────────────────────────────────────────────────┘

FRONTEND (Client)                    SERVER (Backend)                  DATABASE
─────────────────                    ───────────────                   ────────

  User enters
  email
         │
         ├─→ Validate email
         │   format
         │
         ├─→ POST /auth/forgot-password
         │   { email }
         │
         │   [Rate Limit Check]
         │   ◄────────────────────
         │                              │  Receive & Parse      │
         │                              │                       │
         │                              ├─→ Find user by
         │                              │   email               │
         │                              │─────────────────────────→ Query: findUnique
         │                              │                       │ by email
         │                              │ ◄───────────────────── │
         │                              │                       │
         │                              ├─→ User found?
         │                              │   YES ✓               │
         │                              │                       │
         │                              ├─→ Generate reset
         │                              │   token (32 bytes)    │
         │                              │                       │
         │                              ├─→ Hash token
         │                              │   (SHA-256)           │
         │                              │                       │
         │                              ├─→ Save to database
         │                              │   ✓ hashedToken      │
         │                              │   ✓ expiry (1 hour)  │
         │                              │─────────────────────────→ UPDATE
         │                              │                       │ resetToken
         │                              │ ◄───────────────────── │ resetTokenExpiry
         │                              │                       │
         │                              ├─→ Send email
         │                              │   with token link:    │
         │                              │   /reset-password     │
         │                              │   ?token=xxxxx        │
         │                              │   (Queue to email     │
         │                              │    service)           │
         │                              │                       │
         │ ◄───────────────────────────│                       │
         │ 200 OK                      │                       │
         │ { message: "If email       │                       │
         │    exists, reset link      │                       │
         │    sent" }                 │                       │
         │                              │                       │
    Show success message              │
    (regardless of email              │
     existence)                        │
         │                              │
    Redirect to login                  │
    page                               │
         │                              │
         └─→ Success ✓                │

         (User checks email)
         │
         ├─→ Click reset link
         │   /reset-password?token=xxxxx
         │
         └─→ Navigate to Reset Page
```

### Password Reset Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      PASSWORD RESET FLOW                                 │
└─────────────────────────────────────────────────────────────────────────┘

FRONTEND (Client)                    SERVER (Backend)                  DATABASE
─────────────────                    ───────────────                   ────────

  User visits reset link
  /reset-password?token=xxxxx
         │
         ├─→ Extract token from URL
         │
         ├─→ Show reset password form
         │   (new password, confirm)
         │
    User fills form
         │
         ├─→ Validate passwords
         │   ✓ Strength check
         │   ✓ Match
         │
         ├─→ POST /auth/reset-password
         │   { token, newPassword,
         │     confirmPassword }
         │                              │  Receive & Parse      │
         │                              │                       │
         │                              ├─→ Hash received
         │                              │   token (SHA-256)     │
         │                              │                       │
         │                              ├─→ Find user with
         │                              │   matching token      │
         │                              │─────────────────────────→ Query: findFirst
         │                              │                       │ resetToken
         │                              │ ◄───────────────────── │ resetTokenExpiry
         │                              │ (user found)          │ > now()
         │                              │                       │
         │                              ├─→ Token expired?
         │                              │   NO ✓                │
         │                              │                       │
         │                              ├─→ Hash new password
         │                              │   (bcrypt 12 rounds)  │
         │                              │                       │
         │                              ├─→ Update user
         │                              │   ✓ passwordHash
         │                              │   ✓ clear resetToken  │
         │                              │   ✓ clear expiry      │
         │                              │─────────────────────────→ UPDATE
         │                              │                       │ User
         │                              │ ◄───────────────────── │
         │                              │ (update success)      │
         │                              │                       │
         │                              ├─→ Generate new tokens
         │                              │   ✓ Access (15m)     │
         │                              │   ✓ Refresh (7d)     │
         │                              │                       │
         │ ◄───────────────────────────│                       │
         │ 200 OK                      │                       │
         │ { message: "Password       │                       │
         │    reset successful",       │                       │
         │   user, accessToken,        │                       │
         │   refreshToken }            │                       │
         │                              │                       │
    Store tokens                        │
    (logged in)                         │
         │                              │
    Show success message               │
         │                              │
    Redirect to Dashboard              │
    (after 2 seconds)                  │
         │                              │
         └─→ Success ✓                │

Error Cases:
  - Invalid/Missing token    → 400 "Invalid or expired reset link"
  - Expired token           → 400 "Invalid or expired reset link"
  - Passwords don't match   → 400 "Passwords do not match"
  - Weak password           → 400 [specific requirement]
```

Error Cases:

- Invalid/Missing token → 400 "Invalid or expired reset link"
- Expired token → 400 "Invalid or expired reset link"
- Passwords don't match → 400 "Passwords do not match"
- Weak password → 400 [specific requirement]

```

---

## 📁 Component File Mapping & Connections

### Frontend File Structure & Dependencies

```

client/src/
│
├── app/
│ ├── layout.js # Root layout (wraps app)
│ │ └── Loads useAuthStore
│ │
│ └── auth/
│ ├── register/
│ │ └── page.jsx ─────────────────┐
│ │ ├── Uses: useAuthStore │
│ │ │ └── signup() │
│ │ └── Uses: UI Components │
│ │ (Button, Input, Card) │
│ │ │
│ ├── login/ │
│ │ └── page.jsx ─────────────────┤
│ │ ├── Uses: useAuthStore │
│ │ │ └── login() │
│ │ └── Uses: UI Components │
│ │ (Button, Input, Card) │
│ │ │
│ ├── forgot-password/ │
│ │ └── page.jsx ─────────────────┤ All use axiosInstance
│ │ ├── Uses: axiosInstance │ for HTTP requests
│ │ │ └── POST /forgot │
│ │ └── Uses: UI Components │
│ │ (Button, Input, Card) │
│ │ │
│ └── reset-password/ │
│ └── page.jsx ─────────────────┘
│ ├── Uses: axiosInstance
│ │ └── POST /reset
│ └── Uses: UI Components
│ (Button, Input, Card)
│
├── store/
│ └── useAuthStore.js
│ ├── Uses: axiosInstance
│ │ ├── POST /auth/register
│ │ ├── POST /auth/login
│ │ └── GET /auth/check
│ └── Uses: Zustand (create, set, get)
│
├── lib/
│ ├── axios.js
│ │ ├── baseURL: /api
│ │ └── Export: axiosInstance
│ │
│ └── utils.js
│ └── Utility functions
│
└── components/
└── ui/
├── button.tsx
├── input.tsx
├── label.tsx
├── card.tsx
├── alert.tsx
└── [other Shadcn components]

```

### Backend File Structure & Dependencies

```

server/src/
│
├── routes/
│ └── auth.js
│ └── Connects endpoints to controllers
│ ├── POST /register → controller.register
│ ├── POST /login → controller.login
│ ├── POST /forgot-password → controller.forgotPassword
│ └── POST /reset-password → controller.resetPassword
│
├── controllers/
│ └── auth.controller.js
│ ├── Uses: auth library functions
│ │ ├── hashPassword()
│ │ ├── verifyPassword()
│ │ ├── generateAccessToken()
│ │ ├── generateRefreshToken()
│ │ └── verifyAccessToken()
│ │
│ ├── Uses: auth service
│ │ └── saveResetToken()
│ │
│ ├── Uses: validation library
│ │ └── validatePassword()
│ │
│ └── Uses: Prisma
│ ├── prisma.user.create()
│ ├── prisma.user.findUnique()
│ ├── prisma.user.findFirst()
│ └── prisma.user.update()
│
├── services/
│ └── auth.service.js
│ ├── Uses: crypto module
│ │ ├── randomBytes()
│ │ └── createHash()
│ │
│ ├── Uses: auth library
│ │ └── N/A (calls from controller)
│ │
│ └── Uses: Prisma
│ ├── prisma.user.findUnique()
│ └── prisma.user.update()
│
├── lib/
│ ├── auth.js
│ │ ├── hashPassword() [bcryptjs]
│ │ ├── verifyPassword() [bcryptjs]
│ │ ├── generateAccessToken() [jsonwebtoken]
│ │ ├── generateRefreshToken() [jsonwebtoken]
│ │ ├── verifyAccessToken() [jsonwebtoken]
│ │ └── verifyRefreshToken() [jsonwebtoken]
│ │
│ ├── prisma.js
│ │ └── Exports Prisma client instance
│ │
│ └── validationPassword.js
│ ├── Regex patterns:
│ │ ├── /[A-Z]/ → Uppercase
│ │ ├── /[a-z]/ → Lowercase
│ │ ├── /[0-9]/ → Number
│ │ └── /[!@#$%^&*()...]/ → Special char
│ │
│ └── Returns: Array of errors or null
│
├── middleware/
│ ├── auth.js
│ │ ├── verifyAccessToken()
│ │ └── Protects routes
│ │
│ ├── error.middleware.js
│ │ └── Centralized error handling
│ │
│ └── rateLimiter.js
│ └── authRateLimit (5 attempts/15 min)
│
├── prisma/
│ ├── schema.prisma
│ │ └── User model
│ │ ├── id: String @id @default(uuid())
│ │ ├── email: String @unique
│ │ ├── passwordHash: String?
│ │ ├── displayName: String
│ │ ├── avatarUrl: String?
│ │ ├── resetToken: String? @unique
│ │ └── resetTokenExpiry: DateTime?
│ │
│ └── migrations/
│ └── All schema changes versioned
│
└── index.js (or server entry)
├── Initializes Express app
├── Mounts middleware
├── Mounts routes
└── Connects to database

```

---

## 🔗 Request-Response Flow Map

### Key Connections:

```

REGISTRATION REQUEST FLOW:
register/page.jsx
↓ (form submission)
useAuthStore.signup()
↓ (calls axiosInstance.post)
axiosInstance
↓ (HTTP POST /auth/register)
server/routes/auth.js
↓ (routes to controller)
server/controllers/auth.controller.js::register()
↓ (validates & processes)
server/lib/validationPassword.js ─→ Check rules
server/lib/auth.js ─→ hashPassword()
server/lib/prisma.js ─→ Database queries
↓ (stores user)
Database (PostgreSQL)
↓ (returns created user)
server/lib/auth.js ─→ generateAccessToken()
server/lib/auth.js ─→ generateRefreshToken()
↓ (returns response)
axiosInstance
↓ (response received)
useAuthStore
↓ (updates authUser state)
register/page.jsx
↓ (renders success & redirects)
Dashboard

---

LOGIN REQUEST FLOW:
login/page.jsx
↓ (form submission)
useAuthStore.login()
↓ (calls axiosInstance.post)
axiosInstance
↓ (HTTP POST /auth/login)
server/middleware/rateLimiter.js ─→ Rate limit check
↓ (if passes)
server/routes/auth.js
↓ (routes to controller)
server/controllers/auth.controller.js::login()
↓ (finds user & verifies)
server/lib/prisma.js ─→ findUnique by email
server/lib/auth.js ─→ verifyPassword()
↓ (credentials valid)
server/lib/auth.js ─→ generateAccessToken()
server/lib/auth.js ─→ generateRefreshToken()
↓ (returns response)
axiosInstance
↓ (response received)
useAuthStore
↓ (updates authUser state)
login/page.jsx
↓ (renders success & redirects)
Dashboard

---

FORGOT PASSWORD REQUEST FLOW:
forgot-password/page.jsx
↓ (form submission)
axiosInstance.post(/forgot-password)
↓ (HTTP POST /auth/forgot-password)
server/middleware/rateLimiter.js ─→ Rate limit check
↓ (if passes)
server/routes/auth.js
↓ (routes to controller)
server/controllers/auth.controller.js::forgotPassword()
↓ (finds user)
server/lib/prisma.js ─→ findUnique by email
↓ (if found)
server/services/auth.service.js::saveResetToken()
├─ crypto.randomBytes() ─→ Generate random token
├─ crypto.createHash() ─→ Hash token
└─ prisma.user.update() ─→ Save hashed token & expiry
↓ (email queued for sending)
axiosInstance
↓ (response received)
forgot-password/page.jsx
↓ (shows success message)
Email service sends reset link

---

PASSWORD RESET REQUEST FLOW:
reset-password/page.jsx
↓ (form submission with token)
axiosInstance.post(/reset-password)
↓ (HTTP POST /auth/reset-password)
server/routes/auth.js
↓ (routes to controller)
server/controllers/auth.controller.js::resetPassword()
↓ (validates token & password)
server/lib/validationPassword.js ─→ Check password rules
crypto.createHash() ─→ Hash received token
server/lib/prisma.js ─→ findFirst with valid token & expiry
↓ (if valid & not expired)
server/lib/auth.js ─→ hashPassword()
server/lib/prisma.js ─→ update passwordHash, clear token
↓ (password updated)
server/lib/auth.js ─→ generateAccessToken()
server/lib/auth.js ─→ generateRefreshToken()
↓ (returns response with tokens)
axiosInstance
↓ (response received)
useAuthStore
↓ (stores tokens, updates authUser)
reset-password/page.jsx
↓ (shows success & redirects)
Login or Dashboard

```

---

## 🔐 Authentication Security Checklist

- [x] Password hashing with bcrypt (12 rounds)
- [x] JWT tokens with expiration (15m access, 7d refresh)
- [x] Password validation (8+ chars, uppercase, lowercase, number, special char)
- [x] Rate limiting on login/forgot-password endpoints
- [x] Password reset token with 1-hour expiry
- [x] Email-based security (no email enumeration)
- [ ] HTTPS enforcement
- [ ] CORS configuration
- [ ] Refresh token rotation
- [ ] Device tracking

---

## 📅 Roadmap

- [x] **Backend**: Server, DB, Auth Routes (Ready).
- [x] **Registration**: Backend & Frontend (Complete).
- [x] **Forgot Password**: Backend & Frontend (Complete).
- [ ] **Frontend Config**: Install Shadcn components (`button`, `card`, `input`, etc.).
- [ ] **Frontend State**: Create `axios.js` and `useAuthStore.js`.
- [ ] **Frontend Pages**: Copy-paste the code into the respective `page.jsx` files.
- [ ] **Protected Routes**: Create a wrapper to protect private pages.

---
```
