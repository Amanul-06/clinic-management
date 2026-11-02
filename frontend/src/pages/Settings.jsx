import { useRef, useState } from "react";
import { Building2, ImagePlus, Save, Upload, X } from "lucide-react";
import { useBranding } from "../context/useBranding";

export default function Settings() {
  const { branding, updateBranding } = useBranding();
  const fileRef = useRef(null);

  const [form, setForm] = useState(branding);
  const [saved, setSaved] = useState(false);

  const handleChange = (e) => {
    setForm((previous) => ({
      ...previous,
      [e.target.name]: e.target.value,
    }));
    setSaved(false);
  };

  const handleLogo = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("Logo must be smaller than 2 MB.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setForm((previous) => ({
        ...previous,
        logo: reader.result,
      }));
      setSaved(false);
    };

    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    updateBranding(form);
    setSaved(true);
  };

  return (
    <div className="settings-page">
      <div className="page-heading">
        <div>
          <div className="page-eyebrow">
            <Building2 size={15} />
            CONFIGURATION
          </div>
          <h1>Clinic Settings</h1>
          <p>Manage your clinic's identity and contact information.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <section className="panel settings-panel">
          <div className="settings-section-heading">
            <div className="settings-icon">
              <Building2 size={21} />
            </div>
            <div>
              <h3>Clinic Branding</h3>
              <p>
                Customize how your clinic appears throughout the application.
              </p>
            </div>
          </div>

          <div className="form-divider" />

          <div className="settings-logo-section">
            <div>
              <h4>Clinic Logo</h4>
              <p>Recommended: square PNG or SVG image, maximum 2 MB.</p>
            </div>

            <div className="logo-upload-area">
              <div className="logo-preview">
                {form.logo ? (
                  <img src={form.logo} alt="Clinic logo preview" />
                ) : (
                  <ImagePlus size={28} />
                )}
              </div>

              <div className="logo-actions">
                <button
                  type="button"
                  className="outline-button"
                  onClick={() => fileRef.current?.click()}
                >
                  <Upload size={16} />
                  Upload Logo
                </button>

                {form.logo && (
                  <button
                    type="button"
                    className="remove-logo"
                    onClick={() => {
                      setForm((previous) => ({ ...previous, logo: "" }));
                      setSaved(false);
                    }}
                  >
                    <X size={15} /> Remove
                  </button>
                )}

                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleLogo}
                />
              </div>
            </div>
          </div>

          <div className="form-divider" />

          <div className="settings-form-grid">
            <div className="field-group full-width">
              <label htmlFor="clinicName">Clinic Name *</label>
              <input
                id="clinicName"
                name="clinicName"
                value={form.clinicName}
                onChange={handleChange}
                placeholder="Enter clinic name"
                required
              />
            </div>

            <div className="field-group">
              <label htmlFor="phone">Contact Number</label>
              <input
                id="phone"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+91 XXXXX XXXXX"
              />
            </div>

            <div className="field-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="clinic@example.com"
              />
            </div>

            <div className="field-group full-width">
              <label htmlFor="address">Clinic Address</label>
              <textarea
                id="address"
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Enter complete clinic address"
                rows={3}
              />
            </div>
          </div>

          <div className="settings-footer">
            {saved && (
              <span className="save-success">Changes saved successfully.</span>
            )}

            <button type="submit" className="primary-button">
              <Save size={17} />
              Save Changes
            </button>
          </div>
        </section>
      </form>

      <div className="settings-note">
        <Building2 size={19} />
        <div>
          <strong>Branding configuration</strong>
          <p>
            Your clinic name and logo will appear on the login page and
            throughout the application. This prototype saves settings locally;
            we'll move them to the database later.
          </p>
        </div>
      </div>
    </div>
  );
}
