import Link from "next/link";

export function Header() {
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand" href="/">
          <span className="brand-mark">L</span>
          <span>Lucifer<span className="brand-light">Donghua</span></span>
        </Link>
        <nav aria-label="Main navigation">
          <Link href="/">Home</Link>
          <Link href="/anime">Browse</Link>
        </nav>
        <form className="header-search" action="/anime">
          <label className="sr-only" htmlFor="global-search">Search titles</label>
          <input id="global-search" type="search" name="q" placeholder="Search donghua..." />
          <button aria-label="Search" type="submit">⌕</button>
        </form>
      </div>
    </header>
  );
}
