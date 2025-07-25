"use client";

import { assets } from "@/data/currencies";
import { useNetworkStore } from "@/store/network";
import { useQuoteStore } from "@/store/quote-store";
import { useTransferStore } from "@/store/transfer-store";
import { useUserSelectionStore } from "@/store/user-selection";
import { ChainTypes } from "@/types";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import FailedCard from "./failed-card";

const OrderFailed = () => {
  const [exploreUrl, setExploreUrl] = useState<string>("");
  const { updateSelection, resetToDefault } = useUserSelectionStore();
  const { quote } = useQuoteStore();
  const { resetQuote } = useQuoteStore();
  const { resetTransfer, transactionHash, transfer } = useTransferStore();
  const { currentNetwork } = useNetworkStore();

  const router = useRouter();

  useEffect(() => {
    if (transactionHash) {
      if (currentNetwork?.type === ChainTypes.EVM) {
        setExploreUrl(
          currentNetwork?.blockExplorers?.default.url + "/tx/" + transactionHash
        );
      } 
    }
  }, [transactionHash, currentNetwork]);

  const handleBackClick = () => {
    resetQuote();
    resetTransfer();
    resetToDefault();

    updateSelection({ asset: assets[0] });

    router.refresh();
  };

  const handleGetReceipt = () => {
    // Receipt generation functionality to be implemented
  };

  if (!quote) return null;

  return (
    <div className="fixed inset-0 z-50 flex-col md:flex-row flex py-20  justify-center bg-black gap-x-16">
      <FailedCard
        transactionHash={transactionHash || undefined}
        exploreUrl={exploreUrl}
        quote={quote}
        onNewPayment={handleBackClick}
        onGetReceipt={handleGetReceipt}
        transferId={transfer?.transferId}
      />
    </div>
  );
};

export default OrderFailed;
