import Image from "next/image";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#171429] px-5 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_18%,rgba(249,178,26,.48),transparent_26%),radial-gradient(circle_at_72%_72%,rgba(77,126,232,.52),transparent_32%),linear-gradient(135deg,#2b0e3d,#6d2558_42%,#211a61)]" />
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:42px_42px]" />
      <section className="glass-card relative grid w-full max-w-5xl overflow-hidden rounded-[34px] md:grid-cols-[1.05fr_.95fr]">
        <div className="flex min-h-[560px] flex-col justify-between p-8 text-white sm:p-12">
          <div>
            <Image src="/youth-camp-logo.png" alt="Youth Camp 2026" width={240} height={138} className="rounded-2xl bg-white/92 p-4 shadow-soft" priority />
            <h1 className="mt-10 text-4xl font-black leading-tight sm:text-5xl">Youth Camp 2026 Admin</h1>
            <p className="mt-4 max-w-md text-base font-medium leading-7 text-white/78">
              Secure camp operations for participants, attendance, meals, outreach, and certificate readiness.
            </p>
          </div>
          <div className="mt-10 grid grid-cols-3 gap-3 text-center text-white">
            {["11 Days", "QR Check-in", "Live Records"].map((item) => (
              <div key={item} className="rounded-2xl border border-white/18 bg-white/10 px-3 py-4 text-sm font-bold">
                {item}
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center p-6 sm:p-10">
          <div className="w-full rounded-[30px] border border-white/20 bg-white/12 p-6 shadow-soft sm:p-9">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-white/18 text-white shadow-inner">
                <span className="text-4xl font-black">YC</span>
              </div>
              <h2 className="text-2xl font-black text-white">Director Login</h2>
              <p className="mt-2 text-sm font-medium text-white/70">Authorized staff access only</p>
            </div>
            <LoginForm />
          </div>
        </div>
      </section>
    </main>
  );
}
