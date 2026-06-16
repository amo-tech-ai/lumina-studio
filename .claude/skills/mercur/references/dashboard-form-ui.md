# Dashboard Form UI

Use when:
- adding or editing forms in admin or vendor
- wiring create/edit flows
- reviewing validation or submission behavior

Applies to **admin** and **vendor**.

## Core rule

Follow existing Mercur form patterns in the screen/package. Before custom field wrappers → [medusa-ui-conformance.md](medusa-ui-conformance.md).

## Stack

`react-hook-form` + `zod` + `@mercurjs/dashboard-shared` + `@medusajs/ui`.

## RouteFocusModal (create)

```tsx
const CreatePage = () => (
  <RouteFocusModal>
    <CreateForm />
  </RouteFocusModal>
);
export default CreatePage;

const CreateForm = () => {
  const { t } = useTranslation();
  const { handleSuccess } = useRouteModal();
  const form = useForm({ defaultValues: { ... }, resolver: zodResolver(schema) });

  const handleSubmit = form.handleSubmit(async (data) => {
    await mutateAsync(data, {
      onSuccess: () => { toast.success("Created"); handleSuccess("/route"); },
      onError: (error) => toast.error(error.message),
    });
  });

  return (
    <RouteFocusModal.Form form={form}>
      <form onSubmit={handleSubmit} className="flex h-full flex-col overflow-hidden">
        <RouteFocusModal.Header />
        <RouteFocusModal.Body className="flex size-full flex-col items-center p-16">
          <div className="flex w-full max-w-[720px] flex-col gap-y-8">{/* fields */}</div>
        </RouteFocusModal.Body>
        <RouteFocusModal.Footer>
          <RouteFocusModal.Close asChild>
            <Button size="small" variant="secondary">{t("actions.cancel")}</Button>
          </RouteFocusModal.Close>
          <Button size="small" variant="primary" type="submit" isLoading={isPending}>
            {t("actions.create")}
          </Button>
        </RouteFocusModal.Footer>
      </form>
    </RouteFocusModal.Form>
  );
};
```

## RouteDrawer (edit)

Side panel from the right. Edit route must use `@` prefix — see [dashboard-page-ui.md](dashboard-page-ui.md).

## Key components

- `RouteFocusModal` / `RouteDrawer` — page wrapper + context
- `.Form`, `.Header`, `.Body`, `.Footer`, `.Close`
- `Form.Field` / `.Item` / `.Label` / `.Control` / `.ErrorMessage`
- `Form.Label optional` for optional fields

## Tabbed forms

If using `TabbedForm`, do **not** wrap in `RouteFocusModal.Form` — see [dashboard-tab-ui.md](dashboard-tab-ui.md).

## Hard rules

1. i18n — no hardcoded labels/buttons.
2. Explicit validation (zod + zodResolver for non-trivial forms).
3. Submission guards — not just disabled buttons.
4. Group fields; no unstructured walls.
5. `useRouteModal()` only inside `RouteFocusModal` provider.

## When to switch

- Page shell → [dashboard-page-ui.md](dashboard-page-ui.md)
- Tab wizard → [dashboard-tab-ui.md](dashboard-tab-ui.md)

## Verification

- Validation on expected fields
- Pending state guarded on all submit paths
- Build/lint after non-trivial changes
