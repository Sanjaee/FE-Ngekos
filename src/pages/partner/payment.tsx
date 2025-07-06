import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import axios from "axios";
import { toast } from "@/hooks/use-toast";
import LoadingScreen from "@/components/ui/LoadingScreen";

const paymentMethods = [
  {
    id: "bank_transfer",
    name: "Bank Transfer",
    description: "Transfer via BCA, Mandiri, BNI, BRI",
    icon: "🏦",
    processingTime: "1-3 business days",
  },
  {
    id: "ewallet",
    name: "E-Wallet",
    description: "GoPay, OVO, DANA, LinkAja",
    icon: "📱",
    processingTime: "Instant",
  },
  {
    id: "credit_card",
    name: "Credit Card",
    description: "Visa, Mastercard, JCB",
    icon: "💳",
    processingTime: "Instant",
  },
];

export default function PartnerPayment() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedMethod, setSelectedMethod] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentId, setPaymentId] = useState("");
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

    // If partner already has rooms, redirect to dashboard
    if (session.user?.backendPartner?.maxRooms > 0) {
      router.push("/partner/dashboard");
      return;
    }
  }, [session, status, router]);

  const handleMethodSelect = (methodId: string) => {
    setSelectedMethod(methodId);
  };

  const handleCreatePayment = async () => {
    if (!selectedMethod) {
      toast({
        title: "Pilih metode pembayaran",
        description: "Silakan pilih salah satu metode pembayaran.",
        variant: "destructive",
      });
      setError("Please select a payment method");
      return;
    }
    setIsProcessing(true);
    setError("");
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/payment/create`,
        {
          partnerId: session?.user?.id,
          amount: 50000,
          roomsAllowed: 10,
          method: selectedMethod,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.user?.jwtToken}`,
          },
        }
      );
      if (response.data.success) {
        setPaymentId(response.data.payment.paymentId);
        setCurrentStep(2);
      }
    } catch (error: any) {
      console.error("Payment creation error:", error);
      toast({
        title: "Gagal membuat pembayaran",
        description: error.response?.data?.error || "Failed to create payment",
        variant: "destructive",
      });
      setError(error.response?.data?.error || "Failed to create payment");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProcessPayment = async () => {
    setIsProcessing(true);
    setError("");
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/payment/process`,
        {
          paymentId: paymentId,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.user?.jwtToken}`,
          },
        }
      );
      if (response.data.success) {
        toast({
          title: "Pembayaran Berhasil",
          description: "Pembayaran Anda telah diproses.",
          variant: "default",
        });
        await signIn("credentials", { redirect: false });
        setCurrentStep(3);
        setTimeout(() => {
          router.push("/partner/addKosan");
        }, 2000);
      }
    } catch (error: any) {
      console.error("Payment processing error:", error);
      toast({
        title: "Gagal memproses pembayaran",
        description: error.response?.data?.error || "Payment processing failed",
        variant: "destructive",
      });
      setError(error.response?.data?.error || "Payment processing failed");
    } finally {
      setIsProcessing(false);
    }
  };

  if (status === "loading") {
    return <LoadingScreen text="Loading..." />;
  }

  if (!session || session.user?.userType !== "partner") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Complete Your Setup
          </h1>
          <p className="mt-2 text-gray-600">
            Choose your payment method to start adding rental properties
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center space-x-4">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= step
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {step}
              </div>
              {step < 3 && (
                <div
                  className={`w-16 h-1 mx-2 ${
                    currentStep > step ? "bg-blue-600" : "bg-gray-200"
                  }`}
                ></div>
              )}
            </div>
          ))}
        </div>

        {/* Step Labels */}
        <div className="flex justify-center space-x-16 text-sm text-gray-600">
          <span>Select Payment</span>
          <span>Processing</span>
          <span>Success</span>
        </div>

        {/* Step 1: Payment Method Selection */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Select Payment Method</CardTitle>
              <CardDescription>
                Choose how you'd like to pay for your subscription
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h4 className="text-sm font-medium text-blue-800 mb-2">
                  Payment Details
                </h4>
                <div className="text-sm text-blue-700 space-y-1">
                  <p>
                    <strong>Amount:</strong> Rp 50,000
                  </p>
                  <p>
                    <strong>Rooms Allowed:</strong> 10 properties
                  </p>
                  <p>
                    <strong>Duration:</strong> 1 year
                  </p>
                </div>
              </div>

              <RadioGroup
                value={selectedMethod}
                onValueChange={handleMethodSelect}
              >
                {paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <RadioGroupItem value={method.id} id={method.id} />
                    <Label
                      htmlFor={method.id}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{method.icon}</span>
                        <div>
                          <div className="font-medium">{method.name}</div>
                          <div className="text-sm text-gray-500">
                            {method.description}
                          </div>
                          <div className="text-xs text-gray-400">
                            Processing: {method.processingTime}
                          </div>
                        </div>
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              <Button
                onClick={handleCreatePayment}
                disabled={!selectedMethod || isProcessing}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Payment...
                  </>
                ) : (
                  "Continue to Payment"
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Payment Processing */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Processing Payment</CardTitle>
              <CardDescription>
                Please wait while we process your payment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Processing your payment...</p>
                <p className="text-sm text-gray-500 mt-2">
                  This may take a few moments
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <h4 className="text-sm font-medium text-yellow-800 mb-2">
                  Payment Information
                </h4>
                <div className="text-sm text-yellow-700 space-y-1">
                  <p>
                    <strong>Transaction ID:</strong> {paymentId}
                  </p>
                  <p>
                    <strong>Amount:</strong> Rp 50,000
                  </p>
                  <p>
                    <strong>Method:</strong>{" "}
                    {paymentMethods.find((m) => m.id === selectedMethod)?.name}
                  </p>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              <Button
                onClick={handleProcessPayment}
                disabled={isProcessing}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  "Complete Payment"
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Payment Success */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-green-800">
                Payment Successful! 🎉
              </CardTitle>
              <CardDescription className="text-green-700">
                Your payment has been processed successfully
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-green-800">
                  Payment Completed
                </h3>
                <p className="text-gray-600 mt-2">
                  You can now add up to 10 rental properties
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <h4 className="text-sm font-medium text-green-800 mb-2">
                  Payment Summary
                </h4>
                <div className="text-sm text-green-700 space-y-1">
                  <p>
                    <strong>Transaction ID:</strong> {paymentId}
                  </p>
                  <p>
                    <strong>Amount:</strong> Rp 50,000
                  </p>
                  <p>
                    <strong>Rooms Allowed:</strong> 10
                  </p>
                  <p>
                    <strong>Status:</strong>{" "}
                    <Badge variant="default" className="text-xs">
                      Active
                    </Badge>
                  </p>
                </div>
              </div>

              <div className="text-center text-sm text-gray-500">
                <p>Redirecting to dashboard...</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
