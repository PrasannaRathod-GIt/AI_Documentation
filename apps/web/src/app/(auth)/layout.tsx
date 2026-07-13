export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),_transparent_50%),linear-gradient(135deg,_#020617,_#111827)] px-4 py-10 text-slate-100">
      {children}
    </div>
  );
}
