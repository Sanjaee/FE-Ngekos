import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import CardLayout from "@/components/Layout/CardLayout";
import { Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import LoadingScreen from "@/components/ui/LoadingScreen";

import axios from "axios";

const facilities = [
  { id: "wifi", label: "WiFi" },
  { id: "ac", label: "AC" },
  { id: "kitchen", label: "Kitchen" },
  { id: "tv", label: "TV" },
  { id: "parking", label: "Parking" },
  { id: "security", label: "Security" },
  { id: "laundry", label: "Laundry" },
  { id: "pool", label: "Swimming Pool" },
  { id: "gym", label: "Gym" },
  { id: "garden", label: "Garden" },
];

export default function AddKosan() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address: "",
    lat: "",
    lng: "",
    price: "",
    originalPrice: "",
    roomCount: "1",
    mainImage: "",
    selectedFacilities: [] as string[],
    images: [] as string[],
  });
  const [rentals, setRentals] = useState<any[]>([]);

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

    // If partner hasn't paid, redirect to payment
    if (session.user?.backendPartner?.maxRooms === 0) {
      router.push("/partner/payment");
      return;
    }

    // Fetch rentals for this partner
    const partnerId = session.user?.backendPartner?.partnerId;
    if (!partnerId) return;
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
      .catch(() => {
        setRentals([]);
      });
  }, [session, status, router]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFacilityChange = (facilityId: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      selectedFacilities: checked
        ? [...prev.selectedFacilities, facilityId]
        : prev.selectedFacilities.filter((id) => id !== facilityId),
    }));
  };

  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, mainImage: e.target.value }));
  };

  const handleImageChange = (idx: number, value: string) => {
    setFormData((prev) => {
      const newImages = [...prev.images];
      newImages[idx] = value;
      return { ...prev, images: newImages };
    });
  };

  const handleAddImage = () => {
    setFormData((prev) => ({ ...prev, images: [...prev.images, ""] }));
  };

  const handleRemoveImage = (idx: number) => {
    setFormData((prev) => {
      const newImages = prev.images.filter((_, i) => i !== idx);
      return { ...prev, images: newImages };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const partnerId = session?.user?.backendPartner?.partnerId;
      if (!partnerId) {
        setError("Partner ID not found in session");
        setIsLoading(false);
        return;
      }
      const payload = {
        partnerId,
        name: formData.name,
        description: formData.description,
        address: formData.address,
        lat: formData.lat,
        lng: formData.lng,
        price: formData.price,
        originalPrice: formData.originalPrice,
        roomCount: rentals.length + 1,
        facilities: formData.selectedFacilities,
        images: formData.images,
        mainImage: formData.mainImage,
      };
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/rental/create`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.user?.jwtToken}`,
          },
        }
      );
      if (response.data.success) {
        toast({
          title: "Sukses",
          description: "Rental property added successfully!",
          variant: "default",
        });
        router.push("/partner/view-kosan");
      } else {
        toast({
          title: "Error",
          description: response.data.error || "Failed to add rental property",
          variant: "destructive",
        });
        setError(response.data.error || "Failed to add rental property");
      }
    } catch (error: any) {
      console.error("Add rental error:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.error || "Failed to add rental property",
        variant: "destructive",
      });
      setError(error.response?.data?.error || "Failed to add rental property");
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading") {
    return <LoadingScreen text="Loading..." />;
  }

  if (!session || session.user?.userType !== "partner") {
    return null;
  }

  const partner = session.user.backendPartner;
  const availableRooms = (partner?.maxRooms || 0) - rentals.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <Card className="py-6">
              <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                  <CardTitle>Property Information</CardTitle>
                  <CardDescription>
                    Fill in the details of your rental property
                  </CardDescription>
                </div>
                <Button
                  variant="plain"
                  onClick={() => router.push("/partner/dashboard")}
                  className="text-sm"
                >
                  Back to Dashboard
                </Button>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                      {error}
                    </div>
                  )}

                  {/* Main Image Input & Images Array Input */}
                  <div className="space-y-2 mb-6">
                    <Label htmlFor="mainImage">Main Image URL</Label>
                    <Input
                      id="mainImage"
                      name="mainImage"
                      type="url"
                      value={formData.mainImage}
                      onChange={handleMainImageChange}
                      placeholder="https://..."
                      className="mt-1"
                    />
                    <Label className="mt-2">Images (URLs)</Label>
                    {(formData.images.length === 0
                      ? [""]
                      : formData.images
                    ).map((img, idx, arr) => (
                      <div key={idx} className="flex items-center gap-2 mt-1">
                        <Input
                          type="url"
                          value={img}
                          onChange={(e) =>
                            handleImageChange(idx, e.target.value)
                          }
                          placeholder={`Image URL #${idx + 1}`}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={() => handleRemoveImage(idx)}
                          className="px-2"
                          aria-label="Hapus gambar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="default"
                      onClick={handleAddImage}
                      className="mt-2"
                    >
                      Tambah Gambar
                    </Button>
                  </div>

                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Basic Information
                    </h3>

                    <div>
                      <Label htmlFor="name">Property Name *</Label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="e.g., Cozy Studio Apartment"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Describe your property..."
                        className="mt-1"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="address">Address *</Label>
                      <Input
                        id="address"
                        name="address"
                        type="text"
                        required
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="e.g., Jl. Sudirman No. 123, Jakarta Pusat"
                        className="mt-1"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="lat">Latitude</Label>
                        <Input
                          id="lat"
                          name="lat"
                          type="number"
                          step="any"
                          value={formData.lat}
                          onChange={handleInputChange}
                          placeholder="-6.2088"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="lng">Longitude</Label>
                        <Input
                          id="lng"
                          name="lng"
                          type="number"
                          step="any"
                          value={formData.lng}
                          onChange={handleInputChange}
                          placeholder="106.8456"
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      onClick={() => {
                        if (navigator.geolocation) {
                          navigator.geolocation.getCurrentPosition(
                            (position) => {
                              setFormData((prev) => ({
                                ...prev,
                                lat: position.coords.latitude.toString(),
                                lng: position.coords.longitude.toString(),
                              }));
                            },
                            (error) => {
                              toast({
                                title: "Gagal mengambil lokasi",
                                description: error.message,
                                variant: "destructive",
                              });
                            }
                          );
                        } else {
                          toast({
                            title: "Geolocation tidak didukung",
                            description:
                              "Geolocation tidak didukung di browser ini.",
                            variant: "destructive",
                          });
                        }
                      }}
                      className="mt-2"
                    >
                      Ambil Lokasi Saya
                    </Button>
                  </div>

                  {/* Pricing */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Pricing
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="price">Price per Month (Rp) *</Label>
                        <Input
                          id="price"
                          name="price"
                          type="number"
                          required
                          value={formData.price}
                          onChange={handleInputChange}
                          placeholder="500000"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="originalPrice">
                          Original Price (Rp)
                        </Label>
                        <Input
                          id="originalPrice"
                          name="originalPrice"
                          type="number"
                          value={formData.originalPrice}
                          onChange={handleInputChange}
                          placeholder="600000"
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Facilities */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Facilities
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {facilities.map((facility) => (
                        <div
                          key={facility.id}
                          className="flex items-center space-x-2"
                        >
                          <input
                            type="checkbox"
                            id={facility.id}
                            checked={formData.selectedFacilities.includes(
                              facility.id
                            )}
                            onChange={(e) =>
                              handleFacilityChange(
                                facility.id,
                                e.target.checked
                              )
                            }
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <Label htmlFor={facility.id} className="text-sm">
                            {facility.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading || availableRooms <= 0}
                    className="w-full"
                  >
                    {availableRooms <= 0
                      ? "Kuota Kamar Habis"
                      : isLoading
                      ? "Adding Property..."
                      : "Add Property"}
                  </Button>
                  {availableRooms <= 0 && (
                    <div className="text-red-600 text-sm mt-2">
                      Kuota kamar Anda sudah habis. Silakan upgrade paket untuk
                      menambah kamar.
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-16">
              <Card className="pt-6">
                <CardHeader>
                  <CardTitle>Property Preview</CardTitle>
                  <CardDescription>
                    How your property will appear to users
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 px-0">
                  <CardLayout
                    image={
                      formData.mainImage || formData.images[0] || "/window.svg"
                    }
                    name={formData.name || "Nama Kosan"}
                    address={formData.address || "Alamat akan tampil di sini"}
                    rating={0}
                    reviewCount={0}
                    price={formData.price ? parseInt(formData.price) : 0}
                    originalPrice={
                      formData.originalPrice
                        ? parseInt(formData.originalPrice)
                        : undefined
                    }
                    description={formData.description}
                    facilities={formData.selectedFacilities}
                  />
                </CardContent>
              </Card>
              {/* Partner Info */}
              <Card className="py-6 mt-6">
                <CardHeader>
                  <CardTitle>Your Account</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-sm">
                    <span className="text-gray-500">Partner:</span>
                    <span className="ml-2 font-medium">
                      {partner?.username}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500">Available Rooms:</span>
                    <span className="ml-2 font-medium text-blue-600">
                      {availableRooms}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500">Status:</span>
                    <Badge
                      variant={
                        partner?.subscriptionStatus === "active"
                          ? "default"
                          : "secondary"
                      }
                      className="ml-2 text-xs"
                    >
                      {partner?.subscriptionStatus === "active"
                        ? "Active"
                        : "Inactive"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
