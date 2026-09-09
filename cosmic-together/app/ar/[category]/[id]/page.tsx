import { notFound } from 'next/navigation';
import { productById } from '@/lib/catalog';
import { Experience } from '@/ar/experience';
export default async function Page({
  params,
}: {
  params: Promise<{ category: string; id: string }>;
}) {
  const { category, id } = await params;
  const product = productById(id);
  if (!product || category !== product.category) notFound();
  return <Experience product={product} />;
}
