import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import CardLayout from "@/components/Layout/CardLayout";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function ViewKosan() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [rentals, setRentals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/partner/login");
      return;
    }
    if (session.user?.userType !== "partner") {
      router.push("/partner/login");
      return;
    }
    const partnerId = session.user?.backendPartner?.partnerId;
    if (!partnerId) return;
    setIsLoading(true);
    axios
      .get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/rental/partner/${partnerId}`,
        {
          headers: {
            Authorization: `Bearer ${session?.user?.jwtToken}`,
          },
        }
      )
      .then((res) => {
        setRentals(res.data.rentals || []);
      })
      .catch((err) => {
        setError(err.response?.data?.error || "Gagal memuat data kosan.");
      })
      .finally(() => setIsLoading(false));
  }, [session, status, router]);

  const handleDelete = async (rentalId: string) => {
    if (!session?.user?.backendPartner?.partnerId) return;
    if (!window.confirm("Yakin ingin menghapus kosan ini?")) return;
    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/rental/${rentalId}/partner/${session.user.backendPartner.partnerId}`,
        {
          headers: {
            Authorization: `Bearer ${session?.user?.jwtToken}`,
          },
        }
      );
      toast({
        title: "Berhasil",
        description: "Kosan berhasil dihapus.",
        variant: "default",
      });
      // Refetch data
      setIsLoading(true);
      axios
        .get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/rental/partner/${session.user.backendPartner.partnerId}`,
          {
            headers: {
              Authorization: `Bearer ${session?.user?.jwtToken}`,
            },
          }
        )
        .then((res) => {
          setRentals(res.data.rentals || []);
        })
        .catch((err) => {
          setError(err.response?.data?.error || "Gagal memuat data kosan.");
        })
        .finally(() => setIsLoading(false));
    } catch (error: any) {
      toast({
        title: "Gagal menghapus",
        description: error.response?.data?.error || "Gagal menghapus kosan",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl text-gray-800 font-bold">
            Daftar Kosan Saya
          </h1>
          <Button
            variant="outline"
            onClick={() => router.push("/partner/dashboard")}
          >
            Kembali ke Dashboard
          </Button>
        </div>
        {isLoading ? (
          <div className="text-gray-500">Memuat data kosan...</div>
        ) : error ? (
          <div
            className="text-red-500 break-words break-all"
            style={{ textWrap: "wrap" }}
          >
            {error}
          </div>
        ) : rentals.length === 0 ? (
          <div className="text-gray-500">Belum ada kosan yang terdaftar.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rentals.map((rental) => (
              <div key={rental.rentalId} className="relative">
                <CardLayout
                  image={rental.images?.[0] || "/public/window.svg"}
                  name={rental.name}
                  address={rental.address}
                  rating={rental.rating || 0}
                  reviewCount={rental.reviewCount || 0}
                  price={rental.price}
                  originalPrice={rental.originalPrice}
                  description={rental.description}
                  facilities={rental.facilities || []}
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="mt-2 w-full flex items-center gap-2"
                  onClick={() => handleDelete(rental.rentalId)}
                >
                  <Trash2 className="w-4 h-4" /> Hapus
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
