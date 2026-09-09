import { Header } from '@/components/brand';
export default function NotFound() {
  return (
    <>
      <Header />
      <main className="empty-state">
        <h1>This find wandered off.</h1>
        <p>The product or page you’re looking for isn’t in this collection.</p>
        <a className="button primary" href="/shop">
          Find something else
        </a>
      </main>
    </>
  );
}
