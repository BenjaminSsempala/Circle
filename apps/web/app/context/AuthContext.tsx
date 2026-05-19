import { createContext, useContext, ReactNode, useState } from 'react';

interface AuthContextType {
  formData: Record<string, any>;
  updateFormData: (data: Partial<Record<string, any>>) => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [currentStep, setCurrentStep] = useState(1);

  const updateFormData = (data: Partial<Record<string, any>>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  return (
    <AuthContext.Provider value={{ formData, updateFormData, currentStep, setCurrentStep }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
