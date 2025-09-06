import { useState, useEffect } from 'react';

interface PhoneUser {
  _id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  userType: 'phone';
}

export function usePhoneUser() {
  const [phoneUser, setPhoneUser] = useState<PhoneUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPhoneUser, setIsPhoneUser] = useState(false);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('phoneUser');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        // Ensure userType is always 'phone' for phone users
        if (user.userType !== 'phone') {
          user.userType = 'phone';
          localStorage.setItem('phoneUser', JSON.stringify(user));
        }
        setPhoneUser(user);
        setIsPhoneUser(true);
      }
    } catch (error) {
      console.error('Error parsing phone user from localStorage:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearPhoneUser = () => {
    localStorage.removeItem('phoneUser');
    setPhoneUser(null);
    setIsPhoneUser(false);
  };

  return {
    phoneUser,
    isLoading,
    isPhoneUser,
    clearPhoneUser
  };
}
