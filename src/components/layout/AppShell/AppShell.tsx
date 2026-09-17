import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { CartProvider } from '../../../features/cart/CartContext';
import { AmazonFooter } from '../Footer/AmazonFooter';
import { DesktopHeader } from '../Header/DesktopHeader';
import styles from './AppShell.module.css';

function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    if (!navigator.userAgent.toLowerCase().includes('jsdom')) {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
  }, [pathname, search]);

  return null;
}

export function AppShell() {
  return (
    <CartProvider>
      <ScrollToTop />
      <div className={styles.shell}>
        <DesktopHeader />
        <Outlet />
        <AmazonFooter />
      </div>
    </CartProvider>
  );
}
