"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { getOrder, confirmCheckoutPayment } from "@/lib/api";
import { OrderSuccessTemplate } from "@/components/templates/OrderSuccessTemplate";
import { useCart } from "@/context/CartContext";
import type { Order } from "@/types";

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const sessionId = searchParams.get("session_id");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const { clearCart } = useCart();
  const confirmedRef = useRef(false);

  useEffect(() => {
    async function confirmAndFetch() {
      if (confirmedRef.current) return;
      confirmedRef.current = true;

      try {
        if (sessionId) {
          await confirmCheckoutPayment(sessionId);
          clearCart();
        }

        if (orderId) {
          const res = await getOrder(orderId);
          setOrder(res.data);
        }
      } catch {
        setOrder(null);
      } finally {
        setLoading(false);
      }
    }

    if (!orderId && !sessionId) {
      setLoading(false);
      return;
    }

    confirmAndFetch();
  }, [orderId, sessionId, clearCart]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-brown">Confirming your payment...</p>
      </div>
    );
  }

  return <OrderSuccessTemplate order={order} />;
}

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <p className="text-brown">Loading...</p>
        </div>
      }
    >
      <OrderSuccessContent />
    </Suspense>
  );
}
