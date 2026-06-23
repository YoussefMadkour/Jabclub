'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PackageSelector from '@/components/packages/PackageSelector';
import PaymentUpload from '@/components/packages/PaymentUpload';

export default function PurchasePage() {
  const router = useRouter();
  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [packageDetails, setPackageDetails] = useState<{
    name: string;
    price: number;
  } | null>(null);

  const handleSelectPackage = (packageId: number, packageName: string, packagePrice: number, locationId: number) => {
    setSelectedPackageId(packageId);
    setSelectedLocationId(locationId);
    setPackageDetails({
      name: packageName,
      price: packagePrice
    });
  };

  const handlePaymentSuccess = () => {
    // Redirect to dashboard after successful payment
    router.push('/dashboard');
  };

  const handleCancel = () => {
    setSelectedPackageId(null);
    setSelectedLocationId(null);
    setPackageDetails(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {!selectedPackageId ? (
          <PackageSelector onSelectPackage={handleSelectPackage} />
        ) : packageDetails && selectedLocationId ? (
          <PaymentUpload
            packageId={selectedPackageId!}
            locationId={selectedLocationId}
            packageName={packageDetails.name}
            packagePrice={packageDetails.price}
            onSuccess={handlePaymentSuccess}
            onCancel={handleCancel}
          />
        ) : null}
      </div>
    </div>
  );
}
