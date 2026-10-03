import Image from "next/image";
import { login } from "./actions";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  missing: "E-posta adresi ve şifre zorunludur.",
  invalid: "E-posta adresi veya şifre hatalı.",
  profile: "Kullanıcı profili bulunamadı veya hesap aktif değil.",
  site: "Kullanıcıya atanmış saha bulunamadı.",
  role: "Kullanıcı rolü tanımlanamadı.",
};

export default async function LoginPage({
  searchParams,
}: LoginPageProps) {
  const { error } = await searchParams;
  const errorMessage = error
    ? errorMessages[error] ?? "Giriş sırasında bir hata oluştu."
    : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f8fc] p-6">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-blue-100 bg-white p-8 shadow-lg">
          <div className="flex justify-center">
            <Image
              src="/Uluova.png"
              alt="ULUOVA"
              width={500}
              height={140}
              className="h-auto w-52"
              priority
            />
          </div>

          <div className="mt-8 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Yönetim Sistemine Giriş
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Devam etmek için kullanıcı bilgilerinizle giriş yapın.
            </p>
          </div>

          {errorMessage && (
            <div
              role="alert"
              className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {errorMessage}
            </div>
          )}

          <form action={login} className="mt-7 space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                E-posta Adresi
              </label>

              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="ornek@uluova.com.tr"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0b68b2] focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Şifre
              </label>

              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="Şifrenizi girin"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0b68b2] focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-[#064786] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#053b70] focus:outline-none focus:ring-4 focus:ring-blue-200"
            >
              Giriş Yap
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-xs text-slate-400">
          ULUOVA İnşaat A.Ş. Yönetim Sistemi
        </p>
      </div>
    </main>
  );
}