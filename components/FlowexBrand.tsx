import Image from "next/image";

type FlowexBrandProps = {
  className?: string;
  priority?: boolean;
};

export function FlowexBrand({
  className = "",
  priority = false,
}: FlowexBrandProps) {
  return (
    <span className={`flowex-brand-lockup ${className}`}>
      <Image
        src="/flowex-logo-brand.png"
        alt=""
        width={34}
        height={34}
        priority={priority}
        className="flowex-brand-mark-image"
      />
      <span className="flowex-brand-wordmark">Flowex</span>
    </span>
  );
}
