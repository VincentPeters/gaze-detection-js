/**
 * Form Hook
 *
 * A custom hook for managing form state and validation.
 */

import { useState, useCallback, useEffect } from 'react';

/**
 * Custom hook for managing form state and validation
 *
 * @param {Object} initialValues - Initial form values
 * @param {Function} [validate] - Validation function
 * @param {Function} [onSubmit] - Submit handler
 * @returns {Object} Form state and handlers
 */
function useForm(initialValues = {}, validate, onSubmit) {
  // Form values state
  const [values, setValues] = useState(initialValues);

  // Form errors state
  const [errors, setErrors] = useState({});

  // Form touched fields state
  const [touched, setTouched] = useState({});

  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form dirty state
  const [isDirty, setIsDirty] = useState(false);

  // Reset form to initial values
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
    setIsDirty(false);
  }, [initialValues]);

  // Handle input change
  const handleChange = useCallback((event) => {
    const { name, value, type, checked } = event.target;

    // Handle different input types
    const inputValue = type === 'checkbox' ? checked : value;

    setValues(prevValues => ({
      ...prevValues,
      [name]: inputValue
    }));

    setIsDirty(true);
  }, []);

  // Handle input blur
  const handleBlur = useCallback((event) => {
    const { name } = event.target;

    setTouched(prevTouched => ({
      ...prevTouched,
      [name]: true
    }));
  }, []);

  // Set a specific field value
  const setFieldValue = useCallback((name, value) => {
    setValues(prevValues => ({
      ...prevValues,
      [name]: value
    }));

    setIsDirty(true);
  }, []);

  // Set a specific field error
  const setFieldError = useCallback((name, error) => {
    setErrors(prevErrors => ({
      ...prevErrors,
      [name]: error
    }));
  }, []);

  // Set a field as touched
  const setFieldTouched = useCallback((name, isTouched = true) => {
    setTouched(prevTouched => ({
      ...prevTouched,
      [name]: isTouched
    }));
  }, []);

  // Handle form submission
  const handleSubmit = useCallback((event) => {
    if (event) {
      event.preventDefault();
    }

    setTouched(
      Object.keys(values).reduce((acc, key) => {
        acc[key] = true;
        return acc;
      }, {})
    );

    // Validate form if validation function is provided
    const validationErrors = validate ? validate(values) : {};
    setErrors(validationErrors);

    // Check if there are any errors
    const hasErrors = Object.keys(validationErrors).length > 0;

    if (!hasErrors) {
      setIsSubmitting(true);

      // Call onSubmit if provided
      if (onSubmit) {
        onSubmit(values);
      }
    }

    return !hasErrors;
  }, [values, validate, onSubmit]);

  // Validate form when values change
  useEffect(() => {
    if (validate && isDirty) {
      const validationErrors = validate(values);
      setErrors(validationErrors);
    }
  }, [values, validate, isDirty]);

  // Reset isSubmitting when submission is complete
  useEffect(() => {
    if (isSubmitting) {
      setIsSubmitting(false);
    }
  }, [isSubmitting]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isDirty,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    setFieldError,
    setFieldTouched,
    resetForm
  };
}

export default useForm;
