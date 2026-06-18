"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

const translations = {
  pt: {
    title: "Criar Conta",
    nickname: "Nickname",
    nicknameHint: "Mínimo 3 caracteres",
    password: "Senha",
    passwordHint: "Mínimo 6 caracteres",
    confirm: "Confirmar Senha",
    submit: "Criar Conta",
    loading: "Criando...",
    hasAccount: "Já tem conta?",
    login: "Entrar",
    back: "Voltar",
    passwordMismatch: "As senhas não coincidem.",
  },
  en: {
    title: "Create Account",
    nickname: "Nickname",
    nicknameHint: "Minimum 3 characters",
    password: "Password",
    passwordHint: "Minimum 6 characters",
    confirm: "Confirm Password",
    submit: "Create Account",
    loading: "Creating...",
    hasAccount: "Already have an account?",
    login: "Login",
    back: "Back",
    passwordMismatch: "Passwords do not match.",
  },
};

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const { lang } = useLanguage();
  const t = translations[lang];

  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError(t.passwordMismatch);
      return;
    }

    setLoading(true);
    const result = await register(nickname, password);
    setLoading(false);

    if (result.success) {
      router.push("/");
    } else {
      setError(result.message || "Erro ao criar conta.");
    }
  };

  return (
    <div className="min-h-screen bg-[#00183F] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        <button
          onClick={() => router.push("/")}
          className="text-gray-400 hover:text-white text-sm font-bold uppercase tracking-widest mb-8 flex items-center gap-2 transition-colors"
        >
          ← {t.back}
        </button>

        <div className="bg-[#0a2550] border-4 border-white shadow-[8px_8px_0_0_rgba(0,0,0,0.5)] p-8">
          <h1 className="text-white font-black text-3xl uppercase tracking-wider mb-8 border-l-8 border-emerald-400 pl-4">
            {t.title}
          </h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <label className="text-gray-300 text-xs font-bold uppercase tracking-widest">
                {t.nickname}
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                required
                autoComplete="username"
                className="bg-[#00183F] border-2 border-white/30 text-white px-4 py-3 font-bold focus:outline-none focus:border-emerald-400 transition-colors"
              />
              <span className="text-gray-500 text-xs">{t.nicknameHint}</span>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-gray-300 text-xs font-bold uppercase tracking-widest">
                {t.password}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="bg-[#00183F] border-2 border-white/30 text-white px-4 py-3 font-bold focus:outline-none focus:border-emerald-400 transition-colors"
              />
              <span className="text-gray-500 text-xs">{t.passwordHint}</span>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-gray-300 text-xs font-bold uppercase tracking-widest">
                {t.confirm}
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
                className="bg-[#00183F] border-2 border-white/30 text-white px-4 py-3 font-bold focus:outline-none focus:border-emerald-400 transition-colors"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm font-bold border-l-4 border-red-400 pl-3">
                {error}
              </p>
            )}

            <motion.button
              type="submit"
              disabled={loading}
              className="mt-2 px-6 py-4 bg-emerald-500 text-[#00183F] border-4 border-[#00183F] font-black text-lg uppercase tracking-wider shadow-[4px_4px_0_0_#00183F] disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              whileHover={{ translateY: -2, translateX: -2, boxShadow: "8px 8px 0 0 #00183F" }}
              whileTap={{ translateY: 2, translateX: 2, boxShadow: "0px 0px 0 0 #00183F" }}
            >
              {loading ? t.loading : t.submit}
            </motion.button>
          </form>
        </div>

        <p className="text-gray-400 text-sm text-center mt-6">
          {t.hasAccount}{" "}
          <button
            onClick={() => router.push("/login")}
            className="text-emerald-400 font-bold hover:underline"
          >
            {t.login}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
