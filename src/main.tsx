import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// The admin panel is a separate lazy chunk: public visitors never download admin code.
// (App stays a normal static import so the public site starts with no extra round trip.)
const isAdminRoute = window.location.pathname.replace(/\/+$/, '').startsWith('/admin');
const root = createRoot(document.getElementById('root')!);

if (isAdminRoute) {
  import('./admin/AdminApp').then(({ default: AdminApp }) => root.render(<AdminApp />));
} else if (isPortalRoute) {
  import('./components/ApplicantPortal').then(({ default: ApplicantPortal }) => root.render(<ApplicantPortal />));
} else {
  root.render(<App />);
}
