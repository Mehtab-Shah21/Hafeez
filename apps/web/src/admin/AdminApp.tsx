import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, ClipboardList, FileText, Gauge, Image, Inbox, LayoutTemplate, LogOut, Menu, Search, Settings, ShieldCheck, Sparkles, Users as UsersIcon, X } from 'lucide-react';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Helmet } from 'react-helmet-async';
import { Navigate, NavLink, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { hasPermission, SEO_ENTITY_TYPES, type AuthUser, type Permission, type RoleKey, type SeoEntityType } from '@app/shared';
import { cn } from '@/lib/utils';
import { api, ensureCsrf, errorText, setCsrf } from './api';
import { MODULES } from './modules';
import { EntityEdit, EntityList } from './pages/entity';
import { AuditLog, Dashboard, HeroManager, Inquiries, MediaLibrary, PageEditor, PagesList, SeoGlobal, SettingsPage, Users } from './pages/screens';
import { NotFoundLog, SeoEntityPage, SeoTable } from './pages/seo';
import { Btn, Field, Input, Notice } from './ui';

/**
 * Admin SPA (client-rendered, noindex, separate lazy chunk). Mounted at /admin/* by the main router.
 * English UI; every content form has EN + AR tabs.
 */
export default function AdminApp() {
  const qc = useQueryClient();
  const me = useQuery({
    queryKey: ['admin-me'],
    queryFn: () => api<{ user: AuthUser }>('GET', '/auth/me').then((r) => r.user),
    retry: false,
  });
  useEffect(() => {
    document.documentElement.lang = 'en';
    document.documentElement.dir = 'ltr';
  }, []);

  const head = (
    <Helmet>
      <title>Admin</title>
      <meta name="robots" content="noindex,nofollow" />
    </Helmet>
  );
  if (me.isLoading) return head;
  if (!me.data) return (
    <>
      {head}
      <Login onDone={() => void qc.invalidateQueries({ queryKey: ['admin-me'] })} />
    </>
  );
  return (
    <>
      {head}
      <Shell user={me.data} onLogout={() => qc.setQueryData(['admin-me'], null)} />
    </>
  );
}

function Login({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      await ensureCsrf();
      const r = await api<{ user: AuthUser; csrfToken: string }>('POST', '/auth/login', { email, password });
      setCsrf(r.csrfToken);
      onDone();
    } catch (e2) {
      setErr(errorText(e2));
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="grid min-h-screen place-items-center bg-navy p-4">
      <form onSubmit={(e) => void submit(e)} className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-8 shadow-lift">
        <h1 className="text-2xl font-semibold text-navy">Sign in</h1>
        <Field label="Email">
          <Input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Password">
          <Input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        {err && <Notice kind="error">{err}</Notice>}
        <Btn type="submit" disabled={busy} className="w-full justify-center">
          {busy ? 'Signing in…' : 'Sign in'}
        </Btn>
      </form>
    </main>
  );
}

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  perm: Permission;
}

function Shell({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  const role: RoleKey = user.role;
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname]);

  const groups: { title: string; items: NavItem[] }[] = [
    {
      title: 'Overview',
      items: [
        { to: '/admin', label: 'Dashboard', icon: <Gauge />, perm: 'content:read' },
        { to: '/admin/inquiries', label: 'Inquiries', icon: <Inbox />, perm: 'inquiries:manage' },
      ],
    },
    {
      title: 'Content',
      items: [
        { to: '/admin/pages', label: 'Pages', icon: <LayoutTemplate />, perm: 'content:read' },
        { to: '/admin/hero', label: 'Hero', icon: <Sparkles />, perm: 'content:read' },
        ...MODULES.filter((m) => m.key !== 'redirects').map((m) => ({ to: `/admin/m/${m.key}`, label: m.title, icon: <FileText />, perm: 'content:read' as Permission })),
        { to: '/admin/media', label: 'Media', icon: <Image />, perm: 'content:read' },
      ],
    },
    {
      title: 'SEO',
      items: [
        { to: '/admin/seo', label: 'SEO overview', icon: <Search />, perm: 'content:read' },
        { to: '/admin/m/redirects', label: 'Redirects', icon: <FileText />, perm: 'content:read' },
        { to: '/admin/seo/404', label: '404 log', icon: <FileText />, perm: 'content:read' },
        { to: '/admin/seo/global', label: 'Global SEO & tracking', icon: <Settings />, perm: 'content:read' },
      ],
    },
    {
      title: 'Settings',
      items: [
        { to: '/admin/settings', label: 'Company & site', icon: <Building2 />, perm: 'settings:write' },
        { to: '/admin/users', label: 'Users & roles', icon: <UsersIcon />, perm: 'users:manage' },
        { to: '/admin/audit', label: 'Audit log', icon: <ClipboardList />, perm: 'audit:read' },
      ],
    },
  ];

  const logout = async () => {
    await api('POST', '/auth/logout').catch(() => undefined);
    onLogout();
  };

  const nav = (
    <nav aria-label="Admin" className="space-y-6 p-4">
      {groups.map((g) => {
        const items = g.items.filter((i) => hasPermission(role, i.perm));
        if (!items.length) return null;
        return (
          <div key={g.title}>
            <p className="px-3 text-xs font-semibold uppercase tracking-wide text-offwhite/50">{g.title}</p>
            <ul className="mt-2 space-y-0.5">
              {items.map((i) => (
                <li key={i.to}>
                  <NavLink to={i.to} end={i.to === '/admin' || i.to === '/admin/seo'} className={({ isActive }) => cn('flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-offwhite/80 hover:bg-white/10 hover:text-white [&_svg]:size-4', isActive && 'bg-white/10 text-white')}>
                    {i.icon}
                    {i.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-offwhite lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className={cn('surface-dark fixed inset-y-0 start-0 z-40 w-64 overflow-y-auto bg-navy transition-transform lg:static lg:translate-x-0', open ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full')}>
        <div className="flex items-center justify-between p-4">
          <span className="flex items-center gap-2 font-semibold text-white">
            <ShieldCheck className="size-5 text-yellow" /> Admin
          </span>
          <button type="button" className="text-white lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
            <X className="size-5" />
          </button>
        </div>
        {nav}
      </aside>
      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-mist bg-white/90 px-4 py-3 backdrop-blur lg:px-8">
          <button type="button" className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="size-5" />
          </button>
          <a href="/" target="_blank" rel="noreferrer" className="text-sm font-medium text-blue">
            View website ↗
          </a>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-steel sm:inline">
              {user.name} · {role.replace('_', ' ').toLowerCase()}
            </span>
            <Btn variant="secondary" onClick={() => void logout()}>
              <LogOut /> Sign out
            </Btn>
          </div>
        </header>
        <main className="p-4 lg:p-8">
          <Routes>
            <Route index element={<Dashboard role={role} />} />
            <Route path="inquiries" element={<Guard role={role} perm="inquiries:manage"><Inquiries /></Guard>} />
            <Route path="pages" element={<PagesList />} />
            <Route path="pages/:id" element={<PageEditor role={role} />} />
            <Route path="hero" element={<HeroManager role={role} />} />
            <Route path="m/:module" element={<EntityList role={role} />} />
            <Route path="m/:module/:id" element={<EntityEdit role={role} />} />
            <Route path="media" element={<MediaLibrary role={role} />} />
            <Route path="seo" element={<SeoTable role={role} />} />
            <Route path="seo/404" element={<NotFoundLog role={role} />} />
            <Route path="seo/global" element={<SeoGlobal role={role} />} />
            <Route path="seo/:type/:id" element={<SeoRoute role={role} />} />
            <Route path="settings" element={<Guard role={role} perm="settings:write"><SettingsPage role={role} /></Guard>} />
            <Route path="users" element={<Guard role={role} perm="users:manage"><Users /></Guard>} />
            <Route path="audit" element={<Guard role={role} perm="audit:read"><AuditLog /></Guard>} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function Guard({ role, perm, children }: { role: RoleKey; perm: Permission; children: ReactNode }) {
  return hasPermission(role, perm) ? <>{children}</> : <Notice kind="error">Your role does not have access to this section.</Notice>;
}

function SeoRoute({ role }: { role: RoleKey }) {
  const { type = '', id = '' } = useParams();
  if (!(SEO_ENTITY_TYPES as readonly string[]).includes(type)) return <Navigate to="/admin/seo" replace />;
  return <SeoEntityPage role={role} type={type as SeoEntityType} id={id} />;
}
