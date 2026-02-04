import { Router } from "express";
import { storage } from "../storage";
import {
  generateSessionToken,
  verifyPassword,
  setAdminPassword,
  isAuthenticated,
  requireAuth,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_MS,
} from "./helpers";

const router = Router();

router.post("/login", async (req, res) => {
  try {
    const { password } = req.body;
    const isValid = await verifyPassword(password);
    
    if (isValid) {
      const sessionToken = generateSessionToken();
      const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_MS);
      await storage.createAdminSession({ id: sessionToken, expiresAt });
      
      res.cookie(SESSION_COOKIE_NAME, sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: SESSION_MAX_AGE_MS,
        path: "/",
      });
      
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, error: "Invalid password" });
    }
  } catch (error) {
    console.error("Error during admin login:", error);
    res.status(500).json({ success: false, error: "Login failed" });
  }
});

router.post("/logout", async (req, res) => {
  const sessionToken = req.cookies?.[SESSION_COOKIE_NAME];
  if (sessionToken) {
    await storage.deleteAdminSession(sessionToken);
  }
  res.clearCookie(SESSION_COOKIE_NAME, { path: "/" });
  res.json({ success: true });
});

router.get("/check-session", async (req, res) => {
  res.json({ authenticated: await isAuthenticated(req) });
});

router.post("/change-password", requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const isValid = await verifyPassword(currentPassword);
    
    if (!isValid) {
      res.status(401).json({ success: false, error: "Current password is incorrect" });
      return;
    }
    
    if (!newPassword || newPassword.length < 4) {
      res.status(400).json({ success: false, error: "New password must be at least 4 characters" });
      return;
    }
    
    await setAdminPassword(newPassword);
    res.json({ success: true });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ success: false, error: "Password change failed" });
  }
});

export default router;
