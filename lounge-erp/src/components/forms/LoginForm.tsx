"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface LoginData {
  email: string;
  password: string;
}

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginData>();

  async function onSubmit(data: LoginData) {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      toast.error(
        error.message === "Invalid login credentials"
          ? "E-mail ou senha incorretos"
          : "Erro ao fazer login. Tente novamente."
      );
      setLoading(false);
      return;
    }

    toast.success("Bem-vindo!");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="card p-6 space-y-4">
        {/* Email */}
        <div>
          <label className="label-base">E-mail</label>
          <input
            {...register("email", {
              required: "E-mail é obrigatório",
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "E-mail inválido",
              },
            })}
            type="email"
            placeholder="seu@email.com"
            className="input-base"
            autoComplete="email"
          />
          {errors.email && (
            <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="label-base">Senha</label>
          <div className="relative">
            <input
              {...register("password", {
                required: "Senha é obrigatória",
                minLength: { value: 6, message: "Mínimo 6 caracteres" },
              })}
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className="input-base pr-10"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-night-400 hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && (
            <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>
          )}
        </div>
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Entrando...
          </>
        ) : (
          <>
            <LogIn size={16} />
            Entrar
          </>
        )}
      </button>
    </form>
  );
}
