import { FormEvent, useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import colliLogo from "@assets/logo_ccv_colli.png";

const COLORS = {
  cream: "#EFE8D8",
  panel: "#FAF8F5",
  maroon: "#722F37",
  warmBrown: "#2C1F14",
  secondary: "#7A6A5A",
  green: "#5B7A4E",
};

export default function ColliAdminLogin() {
  const [, setLocation] = useLocation();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!password.trim()) return;

    setLoading(true);
    setError("");

    try {
      await apiRequest("POST", "/api/colli/admin/login", { password });
      setLocation("/colli/admina/panel");
    } catch {
      setError("Password non corretta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className="min-h-[100svh] px-6"
      style={{
        backgroundColor: COLORS.cream,
        color: COLORS.warmBrown,
        paddingTop: "calc(env(safe-area-inset-top) + 24px)",
        paddingBottom: "calc(env(safe-area-inset-bottom) + 24px)",
      }}
    >
      <div className="mx-auto flex min-h-[calc(100svh-48px)] w-full max-w-md flex-col">
        <button
          type="button"
          onClick={() => setLocation("/colli/menu")}
          className="flex h-10 w-10 items-center justify-center"
          aria-label="Torna al menu Colli"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </button>

        <div className="flex flex-1 flex-col items-center justify-center">
          <img
            src={colliLogo}
            alt="Camera con Vista Colli"
            className="mb-8 h-24 w-auto object-contain"
          />

          <form
            onSubmit={handleSubmit}
            className="w-full rounded-lg border p-6 shadow-[0_8px_24px_rgba(44,31,20,0.08)]"
            style={{ backgroundColor: COLORS.panel, borderColor: "rgba(44,31,20,0.10)" }}
          >
            <h1 className="font-display text-3xl">Admin Colli</h1>
            <p className="mt-2 text-sm" style={{ color: COLORS.secondary }}>
              Inserisci la password per accedere.
            </p>

            <div className="mt-6 flex items-center gap-2 rounded-md border bg-white px-3">
              <Input
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError("");
                }}
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className="h-12 border-0 px-0 shadow-none focus-visible:ring-0"
                autoCapitalize="none"
                autoComplete="current-password"
                data-testid="input-colli-admin-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                className="flex h-9 w-9 shrink-0 items-center justify-center"
                aria-label={showPassword ? "Nascondi password" : "Mostra password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </div>

            {error && (
              <p className="mt-3 text-sm" style={{ color: COLORS.maroon }}>
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading || !password.trim()}
              className="mt-6 h-12 w-full text-white"
              style={{ backgroundColor: COLORS.green }}
              data-testid="button-colli-admin-login"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Accedi"}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
