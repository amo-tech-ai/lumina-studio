# Dashboard Tab UI

Use when:
- adding tabs to tabbed flows
- extending multi-step wizards
- reviewing tab validation or navigation

Applies to **admin** and **vendor**. Before custom tab UI → [medusa-ui-conformance.md](medusa-ui-conformance.md).

## Required component

Always **`TabbedForm`** from `@mercurjs/dashboard-shared` — do not build tab nav with raw `ProgressTabs`.

## TabbedForm API

Handles internally: `RouteFocusModal.Form`, header `ProgressTabs`, `KeyboundForm`, default footer.

**Props:** `form`, `onSubmit`, optional `isLoading`, optional custom `footer`.

**TabbedForm.Tab:** `id`, `label`, optional `validationFields`, optional `isVisible(form)`.

## Page structure

```tsx
const CreatePage = () => (
  <RouteFocusModal>
    <CreateForm />
  </RouteFocusModal>
);
export default CreatePage;

const CreateForm = () => {
  const { handleSuccess } = useRouteModal();
  const form = useForm({ resolver: zodResolver(schema), defaultValues: { ... } });
  const handleSubmit = form.handleSubmit(async (data) => {
    handleSuccess("/entity-route");
  });

  return (
    <TabbedForm form={form} onSubmit={handleSubmit}>
      <TabbedForm.Tab id="general" label="General">
        <div className="flex flex-col gap-y-4 p-8">{/* Form.Field */}</div>
      </TabbedForm.Tab>
    </TabbedForm>
  );
};
```

Do **not** nest `TabbedForm` inside `RouteFocusModal.Form`.

## Known issue: validation blocks Continue

Internal `onNext` triggers full-form validation. **Workaround:** only `.min(1)` required fields on the **first** tab; use `.optional()` on later tabs.

## Hard rules

1. i18n tab labels.
2. One clear purpose per tab.
3. No manual `ProgressTabs` for wizards.
4. No `RouteFocusModal.Form` wrapper around `TabbedForm`.
5. No required zod on tabs beyond the first.
6. Dynamic `isVisible` must not leave flow invalid.

## When to switch

- Page shell → [dashboard-page-ui.md](dashboard-page-ui.md)
- Simple form (no tabs) → [dashboard-form-ui.md](dashboard-form-ui.md)

## Verification

- Continue works (later-tab fields not required in schema)
- Translation-ready labels
- Build/lint after changes
