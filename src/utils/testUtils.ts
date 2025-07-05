
export const testUtils = {
  // User creation test data
  createTestUser: (role: 'parent' | 'admin' | 'teacher' | 'staff' = 'parent') => ({
    email: `test-${role}@example.com`,
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User',
    phone: '+1234567890',
    role
  }),

  // Child test data
  createTestChild: () => ({
    firstName: 'Test',
    lastName: 'Child',
    age: 5,
    allergies: 'None',
    medicalInfo: 'No medical conditions',
    emergencyContactName: 'Emergency Contact',
    emergencyContactPhone: '+1987654321'
  }),

  // Class test data
  createTestClass: () => ({
    name: 'Test Class',
    description: 'Test class description',
    ageRange: '3-5 years',
    capacity: 20,
    room: 'Room A'
  }),

  // Wait utility for async operations
  wait: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),

  // Mock local storage
  mockLocalStorage: () => {
    const store: { [key: string]: string } = {};
    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => store[key] = value,
      removeItem: (key: string) => delete store[key],
      clear: () => Object.keys(store).forEach(key => delete store[key])
    };
  },

  // Generate test phone number
  generateTestPhone: () => `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,

  // Generate test email
  generateTestEmail: () => `test${Date.now()}@example.com`,

  // Validate form data
  validateTestData: {
    user: (user: any) => {
      const errors = [];
      if (!user.email) errors.push('Email is required');
      if (!user.password) errors.push('Password is required');
      if (!user.firstName) errors.push('First name is required');
      if (!user.lastName) errors.push('Last name is required');
      return { isValid: errors.length === 0, errors };
    },
    child: (child: any) => {
      const errors = [];
      if (!child.firstName) errors.push('First name is required');
      if (!child.lastName) errors.push('Last name is required');
      if (child.age < 0 || child.age > 18) errors.push('Age must be between 0 and 18');
      return { isValid: errors.length === 0, errors };
    }
  }
};

export default testUtils;
