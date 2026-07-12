import { ReactNode } from 'react';
import AdminSidebar from './AdminSidebar';

export default function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f4f7f5] text-slate-950">
      <AdminSidebar />
      <main className="min-h-screen lg:pl-64">
        <div className="mx-auto w-full max-w-[1680px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          {children}
        </div>
      </main>
    </div>
  );
}
