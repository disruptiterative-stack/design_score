"use client";
import { Product } from "../domain/entities/Product";

export function getViewerBaseUrl(product: Product): string | undefined {
  const cdnBaseUrl = process.env.NEXT_PUBLIC_CDN_BASE_URL;
  console.log(cdnBaseUrl);
  const admin_id = product.admin_id;
  const productId = product.product_id;
  if (cdnBaseUrl && admin_id && productId) {
    return `${cdnBaseUrl}/${admin_id}/${productId}`;
  }
  // Si falta user_id o product_id, usar product.path como fallback
  return product.path;
}
