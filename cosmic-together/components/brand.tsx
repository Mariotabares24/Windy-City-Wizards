import { ArrowUpRight, ShoppingBag, UsersRound } from 'lucide-react';
import { CosmicMark } from './cosmic-mark';
export function Brand() {
  return (
    <a href="/" className="brand" aria-label="Cosmic Mart home">
      <span className="brand-mark">
        <CosmicMark size={23} />
      </span>
      <span>
        cosmic<span className="brand-light">mart</span>
      </span>
    </a>
  );
}
export function Header({ active = '' }: { active?: string }) {
  return (
    <header className="site-header">
      <Brand />
      <nav aria-label="Main navigation">
        <a className={active === 'shop' ? 'active' : ''} href="/shop">
          Discover
        </a>
        <a href="/shop?category=fashion">Fashion</a>
        <a href="/shop?category=home">Home & living</a>
        <a href="/shop?category=gadgets">Gadgets</a>
      </nav>
      <div className="header-actions">
        <a className="circle-link" href="/shop?circle=1" aria-label="Shop together">
          <UsersRound size={18} />
          <span>Shop together</span>
        </a>
        <a className="icon-button" href="/cart" aria-label="Shopping bag">
          <ShoppingBag size={20} />
        </a>
        <a
          className="avatar"
          href="/settings"
          aria-label="Shopping preferences"
        >
          M
        </a>
      </div>
    </header>
  );
}
export function Footer() {
  return (
    <footer className="footer">
      <Brand />
      <p>Good finds. Better together.</p>
      <div>
        <a href="/demo">
          Guided demo <ArrowUpRight size={14} />
        </a>
        <a href="/settings">Privacy & preferences</a>
      </div>
      <small>
        Prototype catalog · Illustrative products, prices & availability · No
        payments
      </small>
    </footer>
  );
}
