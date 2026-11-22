import ActionForm from '@/components/ActionForm';
import ImageField from '@/components/ImageField';

// Renders the editable website fields for one group (content or system).
export default function FieldsForm({ action, fields, values }) {
  return (
    <ActionForm action={action} submit="Save changes" className="form-grid">
      {fields.map((f) => {
        if (f.type === 'image') {
          return <ImageField key={f.key} name={f.key} label={f.label} help={f.help} folder="site" defaultValue={values[f.key] || ''} />;
        }
        return (
          <label className="field" key={f.key}>
            <span className="lbl">{f.label}</span>
            {f.type === 'textarea'
              ? <textarea name={f.key} rows={f.rows || 4} defaultValue={values[f.key] || ''} />
              : <input name={f.key} defaultValue={values[f.key] || ''} />}
            {f.help && <span className="help">{f.help}</span>}
          </label>
        );
      })}
    </ActionForm>
  );
}
