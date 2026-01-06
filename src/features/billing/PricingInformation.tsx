import { PricingCard } from '@/features/billing/PricingCard';
import { getAllCreditPackages } from '@/utils/AppConfig';

export const PricingInformation = (props: {
  buttonList: Record<string, React.ReactNode>;
}) => {
  const packages = getAllCreditPackages();

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {packages.map((pkg, index) => (
        <PricingCard
          key={pkg.id}
          packageId={pkg.id}
          credits={pkg.credits}
          price={pkg.price}
          pricePerCredit={pkg.pricePerCredit}
          button={props.buttonList[pkg.id]}
          index={index}
        />
      ))}
    </div>
  );
};
