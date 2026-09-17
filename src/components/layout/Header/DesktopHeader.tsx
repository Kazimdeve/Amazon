import { type FormEvent, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { categories } from '../../../data/categories';
import { useCart } from '../../../features/cart/useCart';
import styles from './DesktopHeader.module.css';

const secondaryLinks = [
  { label: 'Medical Care', className: '' },
  { label: 'Amazon Basics', className: '' },
  { label: 'Best Sellers', className: '' },
  { label: "Today's Deals", className: '' },
  { label: 'New Releases', className: '' },
  { label: 'Prime', className: '' },
  { label: 'Books', className: styles.optionalCompact },
  { label: 'Registry', className: styles.optionalCompact },
  { label: 'Gift Cards', className: styles.optionalMedium },
  { label: 'Groceries', className: styles.optionalMedium },
  { label: 'Smart Home', className: styles.optionalWide },
  { label: 'Customer Service', className: styles.optionalWide },
] as const;

function AmazonWordmark() {
  return (
    <Link className={`${styles.navBox} ${styles.logoLink}`} to="/" aria-label="Amazon Clone home">
      <span className={styles.logoText}>amazon</span>
      <svg className={styles.logoSmile} viewBox="0 0 82 18" aria-hidden="true">
        <path d="M3 3.5c19 12 48 13 72 2" />
        <path d="m68.5 2.5 7 3-4 6" />
      </svg>
    </Link>
  );
}

function LocationIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 22s7-7.4 7-13A7 7 0 1 0 5 9c0 5.6 7 13 7 13Z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 12 8" aria-hidden="true">
      <path d="m1 1 5 5 5-5" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="10.8" cy="10.8" r="6.8" />
      <path d="m16 16 5 5" />
    </svg>
  );
}

function HamburgerIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg viewBox="0 0 50 38" aria-hidden="true">
      <path d="M1.5 3h7l5.2 23.8h28.1L47.5 9.5H10" />
      <path d="M14.5 30.4h27" />
      <circle cx="17.5" cy="35" r="2.5" />
      <circle cx="38" cy="35" r="2.5" />
    </svg>
  );
}

function AccountIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 21c.7-4.5 3.2-7 7.5-7s6.8 2.5 7.5 7" />
    </svg>
  );
}

export function DesktopHeader() {
  const { itemCount } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const currentParams = new URLSearchParams(location.search);
  const [query, setQuery] = useState(currentParams.get('k') ?? '');
  const [department, setDepartment] = useState(currentParams.get('category') ?? 'all');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuTriggerRef = useRef<HTMLButtonElement | null>(null);
  const menuCloseRef = useRef<HTMLButtonElement | null>(null);

  function closeMenuAndRestoreFocus() {
    setIsMenuOpen(false);
    window.setTimeout(() => menuTriggerRef.current?.focus(), 0);
  }

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setQuery(params.get('k') ?? '');
    setDepartment(params.get('category') ?? 'all');
  }, [location.search]);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!isMenuOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    menuCloseRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') closeMenuAndRestoreFocus();
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    const params = new URLSearchParams({ k: trimmedQuery });
    if (department !== 'all') params.set('category', department);
    navigate(`/s?${params.toString()}`);
  }

  const departmentLabel = department === 'all'
    ? 'All'
    : categories.find((category) => category.id === department)?.name ?? 'All';

  return (
    <header className={styles.header}>
      <a className={styles.skipLink} href="#main-content">
        Skip to main content
      </a>

      <div className={styles.primaryRow}>
        <button
          className={`${styles.navBox} ${styles.mobileMenuButton}`}
          type="button"
          aria-label={`${isMenuOpen ? 'Close' : 'Open'} navigation menu`}
          aria-controls="amazon-navigation-drawer"
          aria-expanded={isMenuOpen}
          onClick={(event) => {
            if (!isMenuOpen) menuTriggerRef.current = event.currentTarget;
            else closeMenuAndRestoreFocus();
            if (!isMenuOpen) setIsMenuOpen(true);
          }}
        >
          <span className={styles.hamburger}>
            <HamburgerIcon />
          </span>
        </button>

        <AmazonWordmark />

        <button className={`${styles.navBox} ${styles.location}`} type="button">
          <span className={styles.locationIcon}>
            <LocationIcon />
          </span>
          <span className={styles.twoLineLabel}>
            <span className={styles.labelTop}>Deliver to</span>
            <span className={styles.labelBottom}>Pakistan</span>
          </span>
        </button>

        <form className={styles.searchForm} role="search" onSubmit={handleSearch}>
          <label className={styles.visuallyHidden} htmlFor="search-department">
            Search department
          </label>
          <div className={styles.departmentWrap}>
            <span
              aria-hidden="true"
              className={styles.departmentLabel}
              data-department-label
            >
              {departmentLabel}
            </span>
            <select
              id="search-department"
              className={styles.departmentSelect}
              value={department}
              onChange={(event) => setDepartment(event.target.value)}
            >
              <option value="all">All</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <span className={styles.departmentChevron}>
              <ChevronIcon />
            </span>
          </div>

          <label className={styles.visuallyHidden} htmlFor="global-search-input">
            Search Amazon
          </label>
          <input
            id="global-search-input"
            className={styles.searchInput}
            type="search"
            name="k"
            placeholder="Search Amazon"
            autoComplete="off"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button className={styles.searchButton} type="submit" aria-label="Search">
            <SearchIcon />
          </button>
        </form>

        <button className={`${styles.navBox} ${styles.language}`} type="button">
          <span className={styles.flag} aria-hidden="true" />
          <span>EN</span>
          <span className={styles.smallChevron}>
            <ChevronIcon />
          </span>
        </button>

        <button className={`${styles.navBox} ${styles.account}`} type="button">
          <span className={styles.twoLineLabel}>
            <span className={styles.labelTop}>Hello, sign in</span>
            <span className={styles.labelBottom}>Account &amp; Lists</span>
          </span>
          <span className={styles.mobileAccountLabel}>Sign in</span>
          <span className={styles.mobileAccountIcon}>
            <AccountIcon />
          </span>
          <span className={styles.accountChevron}>
            <ChevronIcon />
          </span>
        </button>

        <button className={`${styles.navBox} ${styles.orders}`} type="button">
          <span className={styles.twoLineLabel}>
            <span className={styles.labelTop}>Returns</span>
            <span className={styles.labelBottom}>&amp; Orders</span>
          </span>
        </button>

        <Link
          className={`${styles.navBox} ${styles.cart}`}
          to="/gp/cart/view.html"
          aria-label={`Cart, ${itemCount} ${itemCount === 1 ? 'item' : 'items'}`}
        >
          <span className={styles.cartGraphic}>
            <CartIcon />
            <span className={styles.cartCount}>{itemCount}</span>
          </span>
          <span className={styles.cartLabel}>Cart</span>
        </Link>
      </div>

      <nav className={styles.secondaryRow} aria-label="Primary departments">
        <button
          className={`${styles.secondaryLink} ${styles.allButton}`}
          type="button"
          aria-controls="amazon-navigation-drawer"
          aria-expanded={isMenuOpen}
          onClick={(event) => {
            if (!isMenuOpen) menuTriggerRef.current = event.currentTarget;
            else closeMenuAndRestoreFocus();
            if (!isMenuOpen) setIsMenuOpen(true);
          }}
        >
          <span className={styles.hamburger}>
            <HamburgerIcon />
          </span>
          All
        </button>
        {secondaryLinks.map((item) => (
          <Link
            className={`${styles.secondaryLink} ${item.className}`}
            key={item.label}
            to={`/s?${new URLSearchParams({ k: item.label }).toString()}`}
          >
            {item.label}
            {item.label === 'Prime' ? (
              <span className={styles.navChevron}>
                <ChevronIcon />
              </span>
            ) : null}
          </Link>
        ))}
      </nav>

      {isMenuOpen ? (
        <div className={styles.menuLayer}>
          <button
            className={styles.menuBackdrop}
            type="button"
            aria-label="Close navigation menu"
            onClick={closeMenuAndRestoreFocus}
          />
          <aside
            id="amazon-navigation-drawer"
            className={styles.menuDrawer}
            aria-labelledby="navigation-drawer-title"
            role="dialog"
            aria-modal="true"
          >
            <div className={styles.menuHeader}>
              <span className={styles.menuHeaderIcon}><AccountIcon /></span>
              <h2 id="navigation-drawer-title">Hello, sign in</h2>
              <button
                className={styles.menuClose}
                type="button"
                aria-label="Close navigation menu"
                onClick={closeMenuAndRestoreFocus}
                ref={menuCloseRef}
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <nav className={styles.menuContent} aria-label="Menu departments">
              <Link to="/" onClick={() => setIsMenuOpen(false)}>Home</Link>
              <h3>Shop by department</h3>
              {categories.map((category) => (
                <Link
                  key={category.id}
                  to={`/s?${new URLSearchParams({ category: category.id, k: category.name }).toString()}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {category.name}
                </Link>
              ))}
              <h3>Explore Amazon</h3>
              {secondaryLinks.map((item) => (
                <Link
                  key={`drawer-${item.label}`}
                  to={`/s?${new URLSearchParams({ k: item.label }).toString()}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <button className={styles.drawerLanguage} type="button">
                <span className={styles.flag} aria-hidden="true" />
                <span>English - EN</span>
                <span className={styles.smallChevron}><ChevronIcon /></span>
              </button>
            </nav>
          </aside>
        </div>
      ) : null}
    </header>
  );
}
