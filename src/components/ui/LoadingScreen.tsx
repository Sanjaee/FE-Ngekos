import React from "react";

export default function LoadingScreen({
  text = "Loading...",
}: {
  text?: string;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full border-4 border-gray-200 border-t-blue-500 h-16 w-16 mb-4" />
        <p className="text-gray-700 text-lg font-medium">{text}</p>
      </div>
    </div>
  );
}
