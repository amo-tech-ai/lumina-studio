import { CrmRecordContext } from "@/components/crm/crm-record-context";

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <CrmRecordContext />
      {children}
    </>
  );
}
