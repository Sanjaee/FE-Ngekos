import React from "react";
import { useRouter } from "next/router";
import { dummyHotels } from "@/data/dummyHotels";
import DetailPage from "@/components/Layout/DetailPage";

const index = () => {
  const router = useRouter();
  const { id } = router.query;

  // Cari rental berdasarkan id
  const rental = dummyHotels.find((h) => h.rentalId === id);

  if (!rental) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center text-gray-600 text-xl">
          Kosan tidak ditemukan.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto ">
        <DetailPage hotel={rental} />
      </div>
    </div>
  );
};

export default index;
