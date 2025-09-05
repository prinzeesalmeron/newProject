import { useState, useCallback } from 'react';
import type { FormState } from '../types';

interface UseFormOptions<T> {
  initialValues: T;
  validate?: (values: T) => Record<string, string>;
  onSubmit?: (values: T) => Promise<void> | void;
}

export function useForm<T extends Record<string, any>>({
  initialValues,
  validate,
  onSubmit
}: UseFormOptions<T>) {
  const [formState, setFormState] = useState<FormState<T>>({
    data: initialValues,
    errors: {},
    loading: false,
    touched: {}
  });

  const setValue = useCallback((field: keyof T, value: any) => {
    setFormState(prev => ({
      ...prev,
      data: { ...prev.data, [field]: value },
      errors: { ...prev.errors, [field]: '' },
      touched: { ...prev.touched, [field]: true }
    }));
  }, []);

  const setValues = useCallback((values: Partial<T>) => {
    setFormState(prev => ({
      ...prev,
      data: { ...prev.data, ...values }
    }));
  }, []);

  const setError = useCallback((field: keyof T, error: string) => {
    setFormState(prev => ({
      ...prev,
      errors: { ...prev.errors, [field]: error }
    }));
  }, []);

  const setErrors = useCallback((errors: Record<string, string>) => {
    setFormState(prev => ({
      ...prev,
      errors: { ...prev.errors, ...errors }
    }));
  }, []);

  const validateForm = useCallback(() => {
    if (!validate) return true;
    
    const errors = validate(formState.data);
    setFormState(prev => ({ ...prev, errors }));
    
    return Object.keys(errors).length === 0;
  }, [validate, formState.data]);

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setFormState(prev => ({ ...prev, loading: true, errors: {} }));
      await onSubmit?.(formState.data);
    } catch (error: any) {
      setFormState(prev => ({
        ...prev,
        errors: { submit: error.message || 'An error occurred' }
      }));
    } finally {
      setFormState(prev => ({ ...prev, loading: false }));
    }
  }, [validateForm, onSubmit, formState.data]);

  const reset = useCallback(() => {
    setFormState({
      data: initialValues,
      errors: {},
      loading: false,
      touched: {}
    });
  }, [initialValues]);

  return {
    values: formState.data,
    errors: formState.errors,
    loading: formState.loading,
    touched: formState.touched,
    setValue,
    setValues,
    setError,
    setErrors,
    handleSubmit,
    reset,
    isValid: Object.keys(formState.errors).length === 0,
    isDirty: Object.keys(formState.touched).length > 0
  };
}