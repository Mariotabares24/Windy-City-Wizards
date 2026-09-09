import { Photo } from '@/components/photo';
import { notFound } from 'next/navigation';
import { ArrowLeft, Box, MapPin, ShieldCheck } from 'lucide-react';
import { Header, Footer } from '@/components/brand';
import { AddToBag } from '@/components/commerce';
import { productById, money, categoryLabel } from '@/lib/catalog';
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const p = productById(id);
  if (!p) notFound();
  return (
    <>
      <Header />
      <main className="product-page">
        <a href={'/shop?category=' + p.category} className="text-button">
          <ArrowLeft size={15} /> Back to{' '}
          {categoryLabel[p.category].toLowerCase()}
        </a>
        <div className="product-detail">
          <div className="detail-photo">
            <Photo
              src={p.image}
              alt={`${p.name} — illustrative product photography`}
              width={800}
              height={1000}
            />
            <span>ILLUSTRATIVE CATALOG PHOTOGRAPHY</span>
          </div>
          <div className="detail-info">
            <div className="eyebrow">
              THE COSMIC COLLECTION / {categoryLabel[p.category].toUpperCase()}
            </div>
            <h1>{p.name}</h1>
            <span className="detail-price">{money(p.price)}</span>
            <p>{p.description}</p>
            <span className="stock">
              <MapPin size={14} />
              {p.stock
                ? `${p.stock} in sample inventory`
                : 'Currently unavailable'}
            </span>
            <AddToBag product={p} />
            <a
              className="button full"
              href={'/ar/' + p.category + '/' + p.id}
            >
              <Box size={18} /> Try it in your world
            </a>
            <dl className="spec-list">
              {Object.entries(p.specs).map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
            <p className="fine-print">
              <ShieldCheck size={14} /> Your camera stays on your device.
              Previews are approximate and do not guarantee fit or dimensions.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

