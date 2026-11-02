import { createContext, useState } from "react";

export const BrandingContext = createContext(null);

const defaultBranding = {
  clinicName: "Your Clinic",
  logo: "",
  address: "",
  phone: "",
  email: "",
};

function getInitialBranding() {
  try {
    const saved = localStorage.getItem("clinic_branding");
    return saved
      ? { ...defaultBranding, ...JSON.parse(saved) }
      : defaultBranding;
  } catch {
    return defaultBranding;
  }
}

export function BrandingProvider({ children }) {
  const [branding, setBranding] = useState(getInitialBranding);

  const updateBranding = (updates) => {
    setBranding((previous) => {
      const updated = { ...previous, ...updates };

      try {
        localStorage.setItem("clinic_branding", JSON.stringify(updated));
      } catch {
        console.error("Unable to save clinic branding.");
      }

      return updated;
    });
  };

  return (
    <BrandingContext.Provider value={{ branding, updateBranding }}>
      {children}
    </BrandingContext.Provider>
  );
}
