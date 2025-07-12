const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export interface Rental {
  rentalId: string;
  partnerId: string;
  name: string;
  description?: string;
  address: string;
  lat: number;
  lng: number;
  price: number;
  originalPrice?: number;
  roomCount: number;
  facilities: string[];
  images: string[];
  mainImage?: string;
  isAvailable: boolean;
  isActive: boolean;
  rating: number;
  reviewCount: number;
  bookingCount: number;
  createdAt: string;
  updatedAt: string;
  partner?: {
    businessName?: string;
    username: string;
    phone?: string;
    email?: string;
  };
  reviews?: Review[];
}

export interface Review {
  reviewId: string;
  userId: string;
  rentalId: string;
  rating: number;
  comment?: string;
  createdAt: string;
  user: {
    username: string;
    profilePic?: string;
  };
}

export interface RentalListResponse {
  success: boolean;
  rentals: Rental[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface RentalDetailResponse {
  success: boolean;
  rental: Rental;
}

export interface ApiError {
  success: false;
  error: string;
  details?: string;
}

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }

  // Get all rentals with optional filters
  async getAllRentals(params?: {
    page?: number;
    limit?: number;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    facilities?: string;
    lat?: number;
    lng?: number;
    radius?: number;
  }): Promise<RentalListResponse> {
    const searchParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const queryString = searchParams.toString();
    const endpoint = `/rental/all${queryString ? `?${queryString}` : ""}`;

    return this.request<RentalListResponse>(endpoint);
  }

  // Get rental by ID
  async getRentalById(rentalId: string): Promise<RentalDetailResponse> {
    return this.request<RentalDetailResponse>(`/rental/${rentalId}`);
  }

  // Get rentals by partner ID (protected route)
  async getRentalsByPartner(
    partnerId: string,
    token?: string
  ): Promise<RentalListResponse> {
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return this.request<RentalListResponse>(`/rental/partner/${partnerId}`, {
      headers,
    });
  }
}

export const apiService = new ApiService();
export default apiService;
