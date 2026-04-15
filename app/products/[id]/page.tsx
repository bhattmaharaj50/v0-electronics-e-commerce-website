import { products } from "@/lib/products"
import ProductDetailClient from "./product-detail-client"

export function generateStaticParams() {
  return products.map((product) => ({
    id: product.id,
  }))
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <ProductDetailClient id={id} />
}
