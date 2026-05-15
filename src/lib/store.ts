import { useEffect, useState, useCallback } from "react";
import { initialProducts } from "./mock-data";
import type { ChatThread, Product } from "./types";

const PRODUCTS_KEY = "stockai.products.v1";
const THREADS_KEY = "stockai.threads.v1";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

// --- products ---
export function useProducts() {
  const [products, setProducts] = useState<Product[]>(() =>
    read<Product[]>(PRODUCTS_KEY, initialProducts),
  );

  useEffect(() => {
    write(PRODUCTS_KEY, products);
  }, [products]);

  const updateProduct = useCallback((id: string, patch: Partial<Product>) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }, []);

  return { products, setProducts, updateProduct };
}

// --- threads ---
export function loadThreads(): ChatThread[] {
  return read<ChatThread[]>(THREADS_KEY, []);
}
export function saveThreads(threads: ChatThread[]) {
  write(THREADS_KEY, threads);
}

export function useThreads() {
  const [threads, setThreads] = useState<ChatThread[]>(() => loadThreads());

  useEffect(() => {
    saveThreads(threads);
  }, [threads]);

  return { threads, setThreads };
}