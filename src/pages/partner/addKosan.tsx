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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import axios from "axios";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { z } from "zod";

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

// Zod schema
const imageFileSchema = z
  .instanceof(File)
  .refine((file) => file.size <= 3 * 1024 * 1024, "Ukuran gambar maksimal 3MB");

const addKosanSchema = z.object({
  name: z.string().min(1, "Nama kosan wajib diisi"),
  address: z.string().min(1, "Alamat wajib diisi"),
  lat: z.string().min(1, "Latitude wajib diisi"),
  lng: z.string().min(1, "Longitude wajib diisi"),
  price: z.string().min(1, "Harga wajib diisi"),
  mainImageFile: imageFileSchema,
  imagesFiles: z
    .array(imageFileSchema)
    .max(10, "Maksimal 10 gambar")
    .or(z.tuple([])), // allow empty array
});

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
  const [showCoordinateInput, setShowCoordinateInput] = useState(false);
  const [coordinateInput, setCoordinateInput] = useState("");
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState<string>("");
  // Inisialisasi imagesFiles dan imagesPreviews dengan satu elemen
  const [imagesFiles, setImagesFiles] = useState<(File | null)[]>([null]);
  const [imagesPreviews, setImagesPreviews] = useState<string[]>([""]);
  const [uploading, setUploading] = useState(false);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);

  const MAX_IMAGE_SIZE = 3 * 1024 * 1024; // 3MB

  // Function to parse coordinates from various formats
  const parseCoordinates = (
    input: string
  ): { lat: string; lng: string } | null => {
    if (!input || typeof input !== "string") return null;

    // Remove extra whitespace and normalize
    const cleaned = input.trim().replace(/\s+/g, " ");

    // Try different coordinate formats
    const patterns = [
      // Format: -6.230770 106.853030 (space separated)
      /^(-?\d+\.?\d*)\s+(-?\d+\.?\d*)$/,
      // Format: -6.230770,106.853030 (comma separated)
      /^(-?\d+\.?\d*),(-?\d+\.?\d*)$/,
      // Format: -6.230770, 106.853030 (comma with space)
      /^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/,
      // Format: lat:-6.230770 lng:106.853030
      /lat:?\s*(-?\d+\.?\d*).*?lng:?\s*(-?\d+\.?\d*)/i,
      // Format: latitude:-6.230770 longitude:106.853030
      /latitude:?\s*(-?\d+\.?\d*).*?longitude:?\s*(-?\d+\.?\d*)/i,
    ];

    for (const pattern of patterns) {
      const match = cleaned.match(pattern);
      if (match) {
        const lat = parseFloat(match[1]);
        const lng = parseFloat(match[2]);

        // Validate coordinate ranges
        if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          return {
            lat: lat.toString(),
            lng: lng.toString(),
          };
        }
      }
    }

    return null;
  };

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

  // Perbaiki handleAddImage
  const handleAddImage = () => {
    setImagesFiles((prev) => [...prev, null]);
    setImagesPreviews((prev) => [...prev, ""]);
    setFormData((prev) => ({ ...prev, images: [...prev.images, ""] }));
  };

  const handleRemoveImage = (idx: number) => {
    setImagesFiles((prev) => prev.filter((_, i) => i !== idx));
    setImagesPreviews((prev) => prev.filter((_, i) => i !== idx));
    setFormData((prev) => {
      const newImages = [...prev.images];
      newImages.splice(idx, 1);
      return { ...prev, images: newImages };
    });
  };

  // Handler for main image file select (no upload)
  const handleMainImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_IMAGE_SIZE) {
      toast({
        title: "Ukuran gambar terlalu besar",
        description: "Ukuran gambar maksimal 3MB.",
        variant: "destructive",
      });
      return;
    }
    setMainImageFile(file);
    setMainImagePreview(URL.createObjectURL(file));
    setFormData((prev) => ({ ...prev, mainImage: "" })); // clear url
  };

  // Handler for additional images file select (no upload)
  const handleImageFile = (
    idx: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0] || null;
    if (file && file.size > MAX_IMAGE_SIZE) {
      toast({
        title: "Ukuran gambar terlalu besar",
        description: "Ukuran gambar maksimal 3MB.",
        variant: "destructive",
      });
      return;
    }
    setImagesFiles((prev) => {
      const arr = [...prev];
      arr[idx] = file;
      return arr;
    });
    setImagesPreviews((prev) => {
      const arr = [...prev];
      arr[idx] = file ? URL.createObjectURL(file) : "";
      return arr;
    });
    setFormData((prev) => {
      const newImages = [...prev.images];
      newImages[idx] = ""; // clear url
      return { ...prev, images: newImages };
    });
  };

  // Handler untuk hapus main image
  const handleRemoveMainImage = () => {
    setMainImageFile(null);
    setMainImagePreview("");
    setFormData((prev) => ({ ...prev, mainImage: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setUploading(true);
    setError("");

    // Validasi dengan zod
    const validation = addKosanSchema.safeParse({
      ...formData,
      mainImageFile,
      imagesFiles: imagesFiles.filter((f): f is File => !!f),
    });
    if (!validation.success) {
      const errors = validation.error.issues;
      errors.forEach((err: { message: string }) => {
        toast({
          title: "Validasi gagal",
          description: err.message,
          variant: "destructive",
        });
      });
      setIsLoading(false);
      setUploading(false);
      return;
    }

    try {
      const partnerId = session?.user?.backendPartner?.partnerId;
      if (!partnerId) {
        setError("Partner ID not found in session");
        setIsLoading(false);
        setUploading(false);
        return;
      }
      // 1. Upload mainImage if file exists
      let mainImageUrl = formData.mainImage;
      if (mainImageFile) {
        const reader = await new Promise<FileReader>((resolve) => {
          const r = new FileReader();
          r.onloadend = () => resolve(r);
          r.readAsDataURL(mainImageFile);
        });
        mainImageUrl = await uploadToCloudinary(reader.result as string);
      }
      // 2. Upload images[] if file exists
      const imagesUrls: string[] = [];
      for (let i = 0; i < imagesFiles.length; i++) {
        if (imagesFiles[i]) {
          const reader = await new Promise<FileReader>((resolve) => {
            const r = new FileReader();
            r.onloadend = () => resolve(r);
            r.readAsDataURL(imagesFiles[i] as File);
          });
          const url = await uploadToCloudinary(reader.result as string);
          imagesUrls[i] = url;
        } else {
          imagesUrls[i] = formData.images[i] || "";
        }
      }
      // 3. Submit to backend
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
        images: imagesUrls,
        mainImage: mainImageUrl,
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
      setUploading(false);
    }
  };

  if (status === "loading") {
    return <LoadingScreen text="Loading..." />;
  }

  if (!session || session.user?.userType !== "partner") {
    return null;
  }

  const partner = session.user.backendPartner;

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
                    <Label htmlFor="mainImage">Main Image</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        id="mainImage"
                        name="mainImage"
                        type="file"
                        accept="image/*"
                        onChange={handleMainImageFile}
                        disabled={isLoading || uploading}
                      />
                      {mainImagePreview && (
                        <div className="relative inline-block">
                          <img
                            src={mainImagePreview}
                            alt="Main Preview"
                            className="w-20 h-20 object-cover rounded border"
                          />
                          <button
                            type="button"
                            className="absolute -top-2 -right-2 bg-white border border-gray-300 rounded-full p-1 shadow hover:bg-red-500 hover:text-white transition-colors"
                            onClick={handleRemoveMainImage}
                            aria-label="Remove main image"
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </div>
                    <Label className="mt-2">Images (Multiple)</Label>
                    {imagesFiles.map((imgFile, idx) => (
                      <div key={idx} className="flex items-center gap-2 mt-1">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageFile(idx, e)}
                          disabled={isLoading || uploading}
                        />
                        {imagesPreviews[idx] && (
                          <div className="relative inline-block">
                            <img
                              src={imagesPreviews[idx]}
                              alt={`Preview ${idx + 1}`}
                              className="w-16 h-16 object-cover rounded border"
                            />
                            <button
                              type="button"
                              className="absolute -top-2 -right-2 bg-white border border-gray-300 rounded-full p-1 shadow hover:bg-red-500 hover:text-white transition-colors"
                              onClick={() => handleRemoveImage(idx)}
                              aria-label="Remove image"
                            >
                              ×
                            </button>
                          </div>
                        )}
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
                      disabled={isLoading || uploading}
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
                    <div className="space-y-2">
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
                                toast({
                                  title: "Lokasi berhasil diambil",
                                  description: `Lat: ${position.coords.latitude.toFixed(
                                    6
                                  )}, Lng: ${position.coords.longitude.toFixed(
                                    6
                                  )}`,
                                  variant: "default",
                                });
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
                        className="mt-2 mr-2"
                      >
                        Ambil Lokasi Saya
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          setShowCoordinateInput(!showCoordinateInput)
                        }
                        className="mt-2"
                      >
                        {showCoordinateInput ? "Batal" : "Paste Koordinat"}
                      </Button>
                    </div>

                    {showCoordinateInput && (
                      <div className="mt-2">
                        <Input
                          type="text"
                          placeholder="-6.230770 106.853030"
                          value={coordinateInput}
                          onChange={(e) => setCoordinateInput(e.target.value)}
                          onPaste={(e) => {
                            e.preventDefault();
                            const pastedText = e.clipboardData.getData("text");
                            const coordinates = parseCoordinates(pastedText);
                            if (coordinates) {
                              setFormData((prev) => ({
                                ...prev,
                                lat: coordinates.lat,
                                lng: coordinates.lng,
                              }));
                              setCoordinateInput("");
                              setShowCoordinateInput(false);
                              toast({
                                title: "Koordinat berhasil diparse",
                                description: `Lat: ${coordinates.lat}, Lng: ${coordinates.lng}`,
                                variant: "default",
                              });
                            } else {
                              toast({
                                title: "Format koordinat tidak valid",
                                description: "Format: -6.230770 106.853030",
                                variant: "destructive",
                              });
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              const coordinates =
                                parseCoordinates(coordinateInput);
                              if (coordinates) {
                                setFormData((prev) => ({
                                  ...prev,
                                  lat: coordinates.lat,
                                  lng: coordinates.lng,
                                }));
                                setCoordinateInput("");
                                setShowCoordinateInput(false);
                                toast({
                                  title: "Koordinat berhasil diparse",
                                  description: `Lat: ${coordinates.lat}, Lng: ${coordinates.lng}`,
                                  variant: "default",
                                });
                              } else {
                                toast({
                                  title: "Format koordinat tidak valid",
                                  description: "Format: -6.230770 106.853030",
                                  variant: "destructive",
                                });
                              }
                            }
                          }}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Paste atau ketik koordinat seperti "-6.230770
                          106.853030" dan tekan Enter
                        </p>
                      </div>
                    )}
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
                    type="button"
                    onClick={() => setOpenConfirmDialog(true)}
                    disabled={isLoading || uploading}
                    className="w-full"
                  >
                    {isLoading || uploading
                      ? "Adding Property..."
                      : "Add Property"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-16">
              <Card className="pt-6 pb-0">
                <CardHeader>
                  <CardTitle>Property Preview</CardTitle>
                  <CardDescription>
                    How your property will appear to users
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 px-0">
                  <CardLayout
                    image={
                      mainImagePreview || imagesPreviews[0] || "/window.svg"
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
                  {/* Preview images gallery */}
                  {imagesPreviews.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {imagesPreviews.map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt={`Preview ${idx + 1}`}
                          className="w-16 h-16 object-cover rounded border"
                        />
                      ))}
                    </div>
                  )}
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
                    <span className="text-gray-500">Total Properties:</span>
                    <span className="ml-2 font-medium text-blue-600">
                      {rentals.length}
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

      {/* Dialog Konfirmasi */}
      <Dialog open={openConfirmDialog} onOpenChange={setOpenConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Tambah Kosan</DialogTitle>
          </DialogHeader>
          <div className="py-2 text-sm">
            Apakah Anda yakin ingin menambah kosan ini? Pastikan data sudah
            benar.
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpenConfirmDialog(false)}
            >
              Batal
            </Button>
            <Button
              onClick={async () => {
                setOpenConfirmDialog(false);
                await handleSubmit(new Event("submit") as any);
              }}
              disabled={isLoading || uploading}
            >
              Ya, Tambahkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
