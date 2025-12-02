"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge"; // Pastikan install badge dulu: npx shadcn@latest add badge
import { getTransactions } from "@/services/voice-service";
import { cn } from "@/lib/utils";

// Definisi tipe data sederhana untuk display
interface TransactionItem {
  product_name: string;
  quantity: number;
  unit: string;
}

interface Transaction {
  id: string;
  created_at: string;
  customer_name: string | null;
  is_debt: boolean;
  transaction_items: TransactionItem[];
}

interface TransactionListProps {
  refreshTrigger: number; // Prop sederhana untuk memicu refresh dari parent
}

export function TransactionList({ refreshTrigger }: TransactionListProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch data saat komponen mount atau refreshTrigger berubah
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const data = await getTransactions();
      setTransactions(data);
      setLoading(false);
    };

    fetchData();
  }, [refreshTrigger]);

  if (loading && transactions.length === 0) {
    return <div className="text-center text-slate-400 mt-8">Memuat riwayat...</div>;
  }

  return (
    <div className="w-full max-w-sm px-4 pb-20 space-y-4">
      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">
        Riwayat Terkini
      </h3>
      
      {transactions.length === 0 ? (
        <p className="text-center text-slate-400 text-sm">Belum ada transaksi hari ini.</p>
      ) : (
        transactions.map((tx) => (
          <Card key={tx.id} className="overflow-hidden border-slate-100 shadow-sm">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between bg-slate-50/50">
              <div className="flex flex-col">
                <span className="font-bold text-slate-800">
                  {tx.customer_name || "Pelanggan Umum"}
                </span>
                <span className="text-xs text-slate-400">
                  {new Date(tx.created_at).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              {/* Badge Visual untuk Hutang */}
              {tx.is_debt ? (
                <Badge variant="destructive" className="bg-red-100 text-red-600 hover:bg-red-200 border-0">
                  HUTANG
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-200 border-0">
                  LUNAS
                </Badge>
              )}
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <ul className="space-y-1">
                {tx.transaction_items.map((item, idx) => (
                  <li key={idx} className="text-sm flex justify-between text-slate-600">
                    <span>{item.product_name}</span>
                    <span className="font-medium">
                      {item.quantity} {item.unit}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}