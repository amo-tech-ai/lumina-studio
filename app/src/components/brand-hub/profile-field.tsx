export const ProfileField = ({ label, value }: { label: string; value: string }) => (
  <div>
    <dt className="font-sans text-xs font-medium uppercase tracking-wide text-[#94A3B8]">
      {label}
    </dt>
    <dd className="mt-0.5 font-sans text-sm text-[#1E293B]">{value}</dd>
  </div>
);

export const ChipList = ({
  label,
  items,
  className = "bg-[#F8F5F2] text-[#1E293B]",
}: {
  label: string;
  items: string[];
  className?: string;
}) => (
  <div>
    <dt className="font-sans text-xs font-medium uppercase tracking-wide text-[#94A3B8]">
      {label}
    </dt>
    <dd className="mt-1 flex flex-wrap gap-2">
      {items.map((item, index) => (
        <span key={`${item}-${index}`} className={`rounded px-2 py-0.5 font-sans text-xs ${className}`}>
          {item}
        </span>
      ))}
    </dd>
  </div>
);
