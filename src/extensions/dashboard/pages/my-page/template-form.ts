export type TemplateForm = {
  triggerType: string;
  layout: string;
  subject: string;
  preheader: string;
  headerStyle: 'dark' | 'brand' | 'white';
  headerText: string;
  showBadge: boolean;
  badgeText: string;
  headline: string;
  body: string;
  showProductImage: boolean;
  reviewQuote: string;
  buttonLabel: string;
  showFeatures: boolean;
  featuresTitle: string;
  featuresText: string;
  closingText: string;
  signoffText: string;
  footerDisclaimer: string;
};

export function insertVariable(
  field: keyof TemplateForm,
  variable: string,
  form: TemplateForm,
  setForm: (updater: (f: TemplateForm) => TemplateForm) => void,
) {
  const current = String(form[field] ?? '');
  const spacer =
    current.length > 0 && !current.endsWith(' ') && !current.endsWith('\n') ? ' ' : '';
  setForm((f) => ({ ...f, [field]: `${current}${spacer}${variable}` }));
}
