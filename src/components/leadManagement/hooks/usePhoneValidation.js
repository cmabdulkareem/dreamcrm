import { useState, useEffect } from "react";
import axios from "axios";
import API from "../../../config/api";

/**
 * usePhoneValidation
 * Manages phone uniqueness checking with debounce.
 * @param {string} phone1 - current phone value
 * @param {boolean} isEditOpen - whether the edit modal is open
 * @param {string|null} excludeId - current lead's ID to exclude from duplicate check
 */
export function usePhoneValidation({ phone1, isEditOpen, excludeId }) {
    const [phoneExists, setPhoneExists] = useState(false);
    const [checkingPhone, setCheckingPhone] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});

    const checkPhoneExistence = async (phone) => {
        if (!phone || phone.length < 10) {
            setPhoneExists(false);
            return;
        }

        setCheckingPhone(true);
        try {
            const url = `${API}/customers/check-phone?phone=${phone}${excludeId ? `&excludeId=${excludeId}` : ''}`;
            const response = await axios.get(url, { withCredentials: true });

            if (response.data.exists) {
                setPhoneExists(true);
                setValidationErrors(prev => ({
                    ...prev,
                    phone1: `Lead exists with this number (${response.data.leadName})`
                }));
            } else {
                setPhoneExists(false);
                setValidationErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.phone1;
                    return newErrors;
                });
            }
        } catch (error) {
            console.error("Error checking phone existence:", error);
        } finally {
            setCheckingPhone(false);
        }
    };

    // Reset when modal closes; debounce when phone changes
    useEffect(() => {
        if (!isEditOpen) {
            setPhoneExists(false);
            setValidationErrors({});
            return;
        }

        const timer = setTimeout(() => {
            if (phone1) {
                checkPhoneExistence(phone1);
            }
        }, 500);

        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phone1, isEditOpen]);

    return { phoneExists, checkingPhone, validationErrors, setValidationErrors };
}
