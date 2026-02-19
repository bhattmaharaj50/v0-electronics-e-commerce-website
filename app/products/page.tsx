import { products } from "@/data/products";

export default function Products() {
  return (
    <div className="grid grid-cols-3 gap-6 p-4">
      {products.map((p) => (
        <div key={p.name} className="border rounded p-4">
          <img src={p.image} className="h-40 object-cover w-full" alt={p.name} />
          <h2 className="mt-2 font-bold">{p.name}</h2>
          <p className="text-green-600">KES {p.price}</p>
          <p dangerouslySetInnerHTML={{ __html: p.description }} className="mt-1 text-sm"></p>
        </div>
      ))}
    </div>
  );
}
