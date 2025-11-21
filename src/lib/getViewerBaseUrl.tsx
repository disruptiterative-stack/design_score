"use client";
import { Product } from "../domain/entities/Product";

export function getViewerBaseUrl(product: Product): string | undefined {
  const cdnBaseUrl = process.env.NEXT_PUBLIC_CDN_BASE_URL;
  const userId = product.user_id;
  const productId = product.product_id;
  if (cdnBaseUrl && userId && productId) {
    return `${cdnBaseUrl}/${userId}/${productId}`;
  }
  // Si falta user_id o product_id, usar product.path como fallback
  return product.path;
}
