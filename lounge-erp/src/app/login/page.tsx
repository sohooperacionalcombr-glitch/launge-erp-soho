import { LoginForm } from "@/components/forms/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-night-900 flex items-center justify-center p-4">
      {/* Ambient glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(212,133,42,0.08) 0%, transparent 70%)",
        }}
      />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <p className="text-night-400 text-xs uppercase tracking-[0.3em] mb-2">
            Sistema de Gestão
          </p>
          <h1
            className="text-4xl font-display font-bold text-white"
            style={{ letterSpacing: "-0.02em" }}
          >
            Soho
          </h1>
          <div className="mt-2 mx-auto w-8 h-px bg-brand-500" />
        </div>

        <LoginForm />

        <p className="text-center text-night-500 text-xs mt-8">
          LoungeERP v1.0 · Soho Management
        </p>
      </div>
    </div>
  );
}
