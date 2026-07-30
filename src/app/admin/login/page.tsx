'use client';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/admin');
  };

  return (
    <main className='flex min-h-screen flex-col items-center justify-center p-6 bg-slate-950 text-slate-100'>
      <div className='w-full max-w-md p-8 bg-slate-900 rounded-xl border border-slate-800 shadow-xl'>
        <h1 className='text-2xl font-bold mb-2 text-center'>Admin Login</h1>
        <p className='text-sm text-slate-400 text-center mb-6'>Vive Brasil Pass - Panel de Control</p>
        <form onSubmit={handleLogin} className='space-y-4'>
          <div>
            <label className='block text-xs uppercase tracking-wider text-slate-400 mb-2'>Correo de Administrador</label>
            <input type='email' defaultValue='nicolas@admin.com' className='w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500' />
          </div>
          <div>
            <label className='block text-xs uppercase tracking-wider text-slate-400 mb-2'>Contraseña</label>
            <input type='password' defaultValue='123456' className='w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500' />
          </div>
          <button type='submit' className='w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg transition-colors mt-4 cursor-pointer'>
            Entrar al Panel
          </button>
        </form>
      </div>
    </main>
  );
}