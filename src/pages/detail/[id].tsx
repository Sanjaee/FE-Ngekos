import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import DetailPage from "@/components/Layout/DetailPage";
import { apiService, Rental } from "@/lib/api";
import { Button } from "@/components/ui/button";

const index = () => {
  const router = useRouter();
  const { id } = router.query;
  const [rental, setRental] = useState<Rental | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id && typeof id === "string") {
      fetchRental(id);
    }
  }, [id]);

  const fetchRental = async (rentalId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getRentalById(rentalId);

      if (response.success) {
        setRental(response.rental);
      } else {
        setError("Failed to load rental details");
      }
    } catch (err) {
      console.error("Error fetching rental:", err);
      setError("Rental not found or failed to load");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Loading rental details...</div>
        </div>
      </div>
    );
  }

  if (error || !rental) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="text-gray-600 text-xl mb-4">
            {error || "Kosan tidak ditemukan."}
          </div>
          <Button
            onClick={() => router.push("/")}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Kembali ke Beranda
          </Button>
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
