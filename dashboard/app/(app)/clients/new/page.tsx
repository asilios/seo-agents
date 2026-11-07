import { NewClientForm } from "@/components/forms";
import { Card, PageHead } from "@/components/ui";
import { requireSession } from "@/lib/session";
import { t } from "@/lib/texts";

export default async function NewClientPage() {
  await requireSession();
  return (
    <>
      <PageHead title={t.newClient.title} lead={t.newClient.lead} />
      <Card><NewClientForm /></Card>
    </>
  );
}
