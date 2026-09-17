import { Link } from 'react-router-dom';
import styles from './AmazonFooter.module.css';

const footerColumns = [
  {
    heading: 'Get to Know Us',
    links: [
      'Careers',
      'Amazon Newsletter',
      'About Amazon',
      'Accessibility',
      'Sustainability',
      'Press Center',
      'Investor Relations',
      'Amazon Devices',
      'Amazon Science',
    ],
  },
  {
    heading: 'Make Money with Us',
    links: [
      'Sell products on Amazon',
      'Sell apps on Amazon',
      'Supply to Amazon',
      'Protect & Build Your Brand',
      'Become an Affiliate',
      'Become a Delivery Driver',
      'Start a Package Delivery Business',
      'Advertise Your Products',
      'Self-Publish with Us',
      'Become an Amazon Hub Partner',
    ],
  },
  {
    heading: 'Amazon Payment Products',
    links: [
      'Amazon Visa',
      'Amazon Store Card',
      'Amazon Secured Card',
      'Credit Card Marketplace',
      'Shop with Points',
      'Reload Your Balance',
      'Gift Cards',
      'Amazon Currency Converter',
    ],
  },
  {
    heading: 'Let Us Help You',
    links: [
      'Your Account',
      'Your Orders',
      'Shipping Rates & Policies',
      'Returns & Replacements',
      'Manage Your Content and Devices',
      'Recalls and Product Safety Alerts',
      'Registry & Gift List',
      'Help',
    ],
  },
] as const;

const services = [
  ['Amazon Music', 'Stream millions of songs'],
  ['Amazon Ads', 'Reach customers wherever they spend their time'],
  ['6pm', 'Score deals on fashion brands'],
  ['AbeBooks', 'Books, art & collectibles'],
  ['ACX', 'Audiobook Publishing Made Easy'],
  ['Sell on Amazon', 'Start a Selling Account'],
  ['Veeqo', 'Shipping Software Inventory Management'],
  ['Amazon Business', 'Everything For Your Business'],
  ['AmazonGlobal', 'Ship Orders Internationally'],
  ['Home Services', 'Experienced Pros Happiness Guaranteed'],
  ['Amazon Web Services', 'Scalable Cloud Computing Services'],
  ['Audible', 'Listen to Books & Original Audio Performances'],
  ['Box Office Mojo', 'Find Movie Box Office Data'],
  ['Goodreads', 'Book reviews & recommendations'],
  ['IMDb', 'Movies, TV & Celebrities'],
] as const;

function AmazonFooterWordmark() {
  return (
    <Link className={styles.logo} to="/" aria-label="Amazon Clone home">
      <span className={styles.logoText}>amazon</span>
      <span className={styles.logoTld}>.com</span>
      <svg className={styles.logoSmile} viewBox="0 0 82 18" aria-hidden="true">
        <path d="M3 3.5c19 12 48 13 72 2" />
        <path d="m68.5 2.5 7 3-4 6" />
      </svg>
    </Link>
  );
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c3 3.4 3 14.6 0 18M12 3c-3 3.4-3 14.6 0 18" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 12 14" aria-hidden="true">
      <path d="m3 5 3-3 3 3M3 9l3 3 3-3" />
    </svg>
  );
}

export function AmazonFooter() {
  return (
    <footer className={styles.footer} aria-label="Amazon footer">
      <a className={styles.backToTop} href="#root">
        Back to top
      </a>

      <div className={styles.primaryFooter} data-footer-primary>
        <nav className={styles.columns} aria-label="Footer navigation">
          {footerColumns.map((column) => (
            <section className={styles.column} data-footer-column key={column.heading}>
              <h2>{column.heading}</h2>
              <ul>
                {column.links.map((label) => (
                  <li key={label}>
                    <Link to={`/s?${new URLSearchParams({ k: label }).toString()}`}>{label}</Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </nav>

        <div className={styles.brandRow}>
          <AmazonFooterWordmark />
          <div className={styles.controls}>
            <button className={styles.localeControl} type="button">
              <span className={styles.globeIcon}>
                <GlobeIcon />
              </span>
              English
              <span className={styles.chevronIcon}>
                <ChevronIcon />
              </span>
            </button>
            <button className={styles.localeControl} type="button">
              <span className={styles.flag} aria-hidden="true" />
              United States
            </button>
          </div>
        </div>
      </div>

      <div className={styles.legalFooter} data-footer-legal>
        <nav className={styles.services} aria-label="Amazon services">
          {services.map(([name, description]) => (
            <Link to={`/s?${new URLSearchParams({ k: name }).toString()}`} key={name}>
              <span className={styles.serviceName}>{name}</span>
              <span className={styles.serviceDescription}>{description}</span>
            </Link>
          ))}
        </nav>

        <div className={styles.legalRow}>
          <nav aria-label="Legal">
            <a href="#conditions-of-use">Conditions of Use</a>
            <a href="#privacy-notice">Privacy Notice</a>
            <a href="#consumer-health-data-privacy">Consumer Health Data Privacy Disclosure</a>
            <a href="#privacy-choices">
              <span className={styles.privacyIcon} aria-hidden="true">
                ✓<span>×</span>
              </span>
              Your Ads Privacy Choices
            </a>
          </nav>
          <p>© 1996–2026, Amazon.com, Inc. or its affiliates</p>
        </div>
      </div>
    </footer>
  );
}
