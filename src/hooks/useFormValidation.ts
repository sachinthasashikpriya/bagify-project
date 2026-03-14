import { useState } from 'react';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: unknown, formData?: unknown) => string | null;
}

export interface ValidationRules {
  [key: string]: ValidationRule;
}

export interface ValidationErrors {
  [key: string]: string;
}

export function useFormValidation<T extends Record<string, unknown>>(
  initialData: T,
  rules: ValidationRules
) {
  const [data, setData] = useState<T>(initialData);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = (name: string, value: unknown, allData?: T): string | null => {
    const rule = rules[name];
    if (!rule) return null;

    if (rule.required && (!value || value.toString().trim() === '')) {
      return `${name.charAt(0).toUpperCase() + name.slice(1)} is required`;
    }

    if (value && rule.minLength && value.toString().length < rule.minLength) {
      return `${name.charAt(0).toUpperCase() + name.slice(1)} must be at least ${rule.minLength} characters`;
    }

    if (value && rule.maxLength && value.toString().length > rule.maxLength) {
      return `${name.charAt(0).toUpperCase() + name.slice(1)} must not exceed ${rule.maxLength} characters`;
    }

    if (value && rule.pattern && !rule.pattern.test(value.toString())) {
      return `${name.charAt(0).toUpperCase() + name.slice(1)} format is invalid`;
    }

    if (rule.custom) {
      return rule.custom(value, allData || data);
    }

    return null;
  };

  const validateAll = (): boolean => {
    const newErrors: ValidationErrors = {};
    
    Object.keys(rules).forEach(field => {
      const error = validateField(field, data[field], data);
      if (error) {
        newErrors[field] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateField = (name: string, value: unknown) => {
    const newData = { ...data, [name]: value };
    setData(newData);
    
    if (touched[name]) {
      const error = validateField(name, value, newData);
      setErrors(prev => ({
        ...prev,
        [name]: error || ''
      }));
    }
  };

  const touchField = (name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, data[name], data);
    setErrors(prev => ({
      ...prev,
      [name]: error || ''
    }));
  };

  const reset = () => {
    setData(initialData);
    setErrors({});
    setTouched({});
  };

  return {
    data,
    errors,
    touched,
    updateField,
    touchField,
    validateAll,
    reset,
    isValid: Object.keys(errors).filter(key => errors[key]).length === 0 && Object.keys(touched).length > 0
  };
}