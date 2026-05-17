import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n";
import { Mail, Loader2, ArrowLeft, KeyRound } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Link } from "react-router-dom";
import SeoHead from "@/components/SeoHead";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const { signInWithOtp, verifyOtp } = useAuth();
  const { t } = useI18n();

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => (c <= 1 ? 0 : c - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    const { error } = await signInWithOtp(email);
    if (error) {
      const m = error.message.match(/(\d+)\s*seconds?/i);
      if (m) setCooldown(parseInt(m[1], 10));
      else setError(error.message);
    } else {
      setSent(true);
      setCooldown(60);
    }
    setLoading(false);
  };

  const handleVerify = async (value: string) => {
    setOtp(value);
    if (value.length === 8) {
      setVerifying(true);
      setError(null);
      const { error } = await verifyOtp(email, value);
      if (error) {
        setError(error.message);
        setOtp("");
      }
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setLoading(true);
    setError(null);
    const { error } = await signInWithOtp(email);
    if (error) {
      const m = error.message.match(/(\d+)\s*seconds?/i);
      if (m) setCooldown(parseInt(m[1], 10));
      else setError(error.message);
    } else {
      setCooldown(60);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-4">
      <div className="flex items-center gap-2 px-4 pt-4 pb-2 w-full">
        <Link to="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1" />
        <LanguageSwitcher />
        <ThemeToggle />
      </div>

      <div className="flex-1 flex items-center justify-center w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm space-y-6"
        >
          <div className="text-center">
            <h1 className="text-3xl font-display font-bold text-foreground mb-2">
              {t("auth.title")}
            </h1>
            <p className="text-muted-foreground text-sm">
              {sent ? t("auth.otpSubtitle") : t("auth.subtitle")}
            </p>
          </div>

          {sent ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card border border-border rounded-xl p-6 space-y-5"
            >
              <div className="text-center space-y-3">
                <KeyRound className="w-10 h-10 text-primary mx-auto" />
                <h2 className="font-display font-semibold text-foreground">
                  {t("auth.checkEmail")}
                </h2>
                <p className="text-muted-foreground text-sm">
                  {t("auth.linkSent")}
                </p>
                <button
                  type="button"
                  onClick={() => { setSent(false); setError(null); setOtp(""); }}
                  className="text-primary text-sm underline underline-offset-2 hover:opacity-80"
                >
                  {email} — {t("auth.changeEmail")}
                </button>
              </div>

              <div className="flex justify-center">
                <InputOTP
                  maxLength={8}
                  value={otp}
                  onChange={handleVerify}
                  disabled={verifying}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                    <InputOTPSlot index={6} />
                    <InputOTPSlot index={7} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              {verifying && (
                <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t("auth.verifying")}
                </div>
              )}

              {error && (
                <p className="text-destructive text-sm text-center">{error}</p>
              )}

              <Button
                variant="outline"
                className="w-full"
                onClick={handleResend}
                disabled={loading || verifying || cooldown > 0}
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {cooldown > 0 ? t("auth.resendIn").replace("{s}", String(cooldown)) : t("auth.resendCode")}
              </Button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t("auth.emailLabel")}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t("auth.emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              {error && (
                <p className="text-destructive text-sm">{error}</p>
              )}
              <Button type="submit" className="w-full gap-2" disabled={loading}>
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Mail className="w-4 h-4" />
                )}
                {t("auth.sendLink")}
              </Button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}
