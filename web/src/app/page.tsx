"use client";

import { useState } from "react";
import { VoiceControl } from "@/components/features/voice-control";
import { TransactionList } from "@/components/features/transaction-list";

export default function Home() {
  // State untuk memicu refresh list transaksi
  const [refreshKey, setRefreshKey] = useState(0);

  const handleTransactionSuccess = () => {
    // Increment key untuk memaksa useEffect di TransactionList berjalan ulang
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Sticky Header */}
      <header className="sticky top-0 w-full p-4 flex justify-between items-center bg-white shadow-sm z-10">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">SuaraNiaga</h1>
          <p className="text-xs text-slate-500">Asisten Warung AI</p>
        </div>
        <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200" />
      </header>

      <main className="flex-1 flex flex-col items-center w-full max-w-md mx-auto pt-6">
        {/* Pass callback sukses ke Voice Control */}
        <VoiceControl onSuccess={handleTransactionSuccess} />
        
        {/* Pass refresh trigger ke List */}
        <div className="w-full mt-8">
          <TransactionList refreshTrigger={refreshKey} />
        </div>
      </main>
    </div>
  );
}