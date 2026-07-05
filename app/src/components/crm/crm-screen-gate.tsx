/** Placeholder until IPI-373 Claude Design comps ship — no list/detail UI here. */
export function CrmScreenGate({ screen }: { screen: string }) {
  return (
    <div className="p-8">
      <h1 className="font-serif text-2xl">{screen}</h1>
      <p className="mt-2 max-w-lg font-sans text-sm text-muted-foreground">
        Screen UI ships after IPI-373 design sign-off. Use the assistant to search records, log
        activity, and move deal stages.
      </p>
    </div>
  );
}
