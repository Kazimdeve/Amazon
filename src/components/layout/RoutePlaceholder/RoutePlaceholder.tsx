import type { ReactNode } from 'react';
import styles from './RoutePlaceholder.module.css';

interface RoutePlaceholderProps {
  children?: ReactNode;
  title: string;
}

export function RoutePlaceholder({ children, title }: RoutePlaceholderProps) {
  return (
    <main className={styles.page} id="main-content">
      <h1 className={styles.title}>{title}</h1>
      {children}
    </main>
  );
}
