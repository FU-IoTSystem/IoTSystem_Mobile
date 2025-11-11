import AsyncStorage from '@react-native-async-storage/async-storage';

// API base URL for all platforms
const API_BASE_URL = 'http://192.168.88.169:8080';

// Helper function to get JWT token from AsyncStorage
const getAuthToken = async () => {
  try {
    return await AsyncStorage.getItem('authToken');
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    try {
      const errorJson = await response.json();
      const errorMessage = errorJson.message || errorJson.error || errorJson.details || JSON.stringify(errorJson);
      throw new Error(errorMessage);
    } catch (jsonError) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(errorText || `HTTP error! status: ${response.status}`);
    }
  }
  
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      return await response.json();
    } catch (e) {
      const text = await response.text().catch(() => '');
      try {
        return JSON.parse(text);
      } catch {
        return { raw: text };
      }
    }
  } else {
    const text = await response.text().catch(() => '');
    try {
      return JSON.parse(text);
    } catch {
      return { raw: text };
    }
  }
};

const extractArrayFromPayload = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && typeof payload === 'object') {
    const candidateKeys = ['data', 'content', 'records', 'items', 'result', 'list'];

    for (const key of candidateKeys) {
      if (Object.prototype.hasOwnProperty.call(payload, key)) {
        const extracted = extractArrayFromPayload(payload[key]);
        if (Array.isArray(extracted)) {
          return extracted;
        }
      }
    }
  }

  return Array.isArray(payload) ? payload : [];
};

// Helper function to make API requests
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = await getAuthToken();
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }
  
  const mergedHeaders = {
    ...defaultHeaders,
    ...(options.headers || {})
  };
  
  const config = {
    ...options,
    headers: mergedHeaders
  };

  console.log('Making API request:', {
    method: config.method || 'GET',
    url: url,
    headers: config.headers,
    body: config.body
  });
  
  // Log request body if it exists
  if (config.body) {
    try {
      const bodyObj = JSON.parse(config.body);
      console.log('Request body:', bodyObj);
    } catch (e) {
      console.log('Request body (raw):', config.body);
    }
  }

  try {
    const response = await fetch(url, config);
    console.log('API response status:', response.status, response.statusText);
    const result = await handleResponse(response);
    console.log('API response data:', result);
    return result;
  } catch (error) {
    console.error('API request failed:', error);
    console.error('Error response:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    throw error;
  }
};

// Authentication API
export const authAPI = {
  login: async (username, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Login failed');
      }
      
      const token = await response.text();
      await AsyncStorage.setItem('authToken', token);
      return token;
    } catch (error) {
      console.error('Login failed:', error);
      // Provide more helpful error messages
      if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
        throw new Error(`Cannot connect to server at ${API_BASE_URL}. Please ensure the backend server is running on port 8080 and your device is on the same network.`);
      }
      throw error;
    }
  },

  logout: async () => {
    await AsyncStorage.removeItem('authToken');
  },

  getProfile: async () => {
    return apiRequest('/api/me/profile');
  },

  updateProfile: async (profileData) => {
    return apiRequest('/api/me/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  changePassword: async (oldPassword, newPassword) => {
    return apiRequest('/api/me/change-password', {
      method: 'POST',
      body: JSON.stringify({
        oldPassword,
        newPassword
      }),
    });
  },

  updateUser: async (userId, userData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/register/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`
        },
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Update user failed');
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Update user failed:', error);
      throw error;
    }
  },

  isAuthenticated: async () => {
    const token = await getAuthToken();
    return !!token;
  }
};

// Wallet API
export const walletAPI = {
  getMyWallet: async () => {
    return apiRequest('/api/wallet/myWallet');
  },
  
  topUp: async (amount, description) => {
    return apiRequest('/api/wallet-transactions/top-up', {
      method: 'POST',
      body: JSON.stringify({
        amount: amount,
        description: description
      }),
    });
  }
};

// Wallet Transaction API
export const walletTransactionAPI = {
  getAll: async () => {
    const response = await apiRequest('/api/wallet-transactions/getAll');
    return response.data || [];
  },
  
  getHistory: async () => {
    const response = await apiRequest('/api/wallet-transactions/history');
    return response.data || [];
  }
};

// Borrowing Group API
export const borrowingGroupAPI = {
  getAll: async () => {
    return apiRequest('/api/borrowing-groups');
  },

  getByAccountId: async (accountId) => {
    return apiRequest(`/api/borrowing-groups/account/${accountId}`);
  },

  addMemberToGroup: async (borrowingGroupData) => {
    return apiRequest('/api/borrowing-groups/add-member', {
      method: 'POST',
      body: JSON.stringify(borrowingGroupData),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },

  removeMemberFromGroup: async (studentGroupId, accountId) => {
    return apiRequest(`/api/borrowing-groups/student-group/${studentGroupId}/account/${accountId}`, {
      method: 'DELETE',
    });
  },

  getByStudentGroupId: async (studentGroupId) => {
    return apiRequest(`/api/borrowing-groups/student-group/${studentGroupId}`);
  },

  getByStudentGroupIdWithDetails: async (studentGroupId) => {
    return apiRequest(`/api/borrowing-groups/student-group/${studentGroupId}/details`);
  },

  promoteToLeader: async (borrowingGroupData) => {
    console.log('===== Calling promoteToLeader API =====');
    console.log('Request data:', borrowingGroupData);
    try {
      const result = await apiRequest('/api/borrowing-groups/promote-leader', {
        method: 'PUT',
        body: JSON.stringify(borrowingGroupData),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log('API Response received:', result);
      return result;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  demoteToMember: async (borrowingGroupData) => {
    console.log('===== Calling demoteToMember API =====');
    console.log('Request data:', borrowingGroupData);
    try {
      const result = await apiRequest('/api/borrowing-groups/demote-member', {
        method: 'PUT',
        body: JSON.stringify(borrowingGroupData),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log('API Response received:', result);
      return result;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }
};

// Student Group API
export const studentGroupAPI = {
  getAll: async () => {
    return apiRequest('/api/student-groups/getAll');
  },

  getById: async (id) => {
    return apiRequest(`/api/student-groups/getById/${id}`);
  },

  create: async (groupData) => {
    return apiRequest('/api/student-groups/create', {
      method: 'POST',
      body: JSON.stringify(groupData),
    });
  },

  update: async (id, groupData) => {
    return apiRequest(`/api/student-groups/update/${id}`, {
      method: 'PUT',
      body: JSON.stringify(groupData),
    });
  },

  delete: async (id) => {
    return apiRequest(`/api/student-groups/delete/${id}`, {
      method: 'DELETE',
    });
  }
};

// Borrowing Requests API
export const borrowingRequestAPI = {
  getAll: async () => {
    const response = await apiRequest('/api/borrowing-requests');
    return response.data || [];
  },

  getApproved: async () => {
    const response = await apiRequest('/api/borrowing-requests/getAPPROVED');
    return response.data || [];
  },

  getByStatuses: async (statuses) => {
    const statusParams = statuses.map(s => `statuses=${encodeURIComponent(s)}`).join('&');
    const response = await apiRequest(`/api/borrowing-requests/by-statuses?${statusParams}`);
    return response.data || [];
  },

  getById: async (id) => {
    const response = await apiRequest(`/api/borrowing-requests/get_by/${id}`);
    return response.data;
  },

  getByUser: async (userId) => {
    const response = await apiRequest(`/api/borrowing-requests/user/${userId}`);
    const payload = response?.data ?? response;
    const extracted = extractArrayFromPayload(payload);
    return Array.isArray(extracted) ? extracted : [];
  },

  create: async (requestData) => {
    const response = await apiRequest('/api/borrowing-requests/post', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
    return response.data;
  },

  createComponentRequest: async (componentRequestData) => {
    const response = await apiRequest('/api/borrowing-requests/component', {
      method: 'POST',
      body: JSON.stringify(componentRequestData),
    });
    return response.data;
  },

  update: async (id, requestData) => {
    const response = await apiRequest(`/api/borrowing-requests/update/${id}`, {
      method: 'PUT',
      body: JSON.stringify(requestData),
    });
    return response.data;
  },

  delete: async (id) => {
    return apiRequest(`/api/borrowing-requests/delete/${id}`, {
      method: 'DELETE',
    });
  },

  getRequestComponents: async (requestId) => {
    const response = await apiRequest(`/api/request-kit-components/by-request/${requestId}`);
    return response.data || [];
  }
};

// Kit API
export const kitAPI = {
  getAllKits: async () => {
    return apiRequest('/api/kits/');
  },

  getKitById: async (kitId) => {
    return apiRequest(`/api/kits/${kitId}`);
  },

  createSingleKit: async (kitData) => {
    return apiRequest('/api/kits/create-single', {
      method: 'POST',
      body: JSON.stringify(kitData),
    });
  },

  updateKit: async (kitId, kitData) => {
    return apiRequest(`/api/kits/${kitId}`, {
      method: 'PUT',
      body: JSON.stringify(kitData),
    });
  },

  getStudentKits: async () => {
    return apiRequest('/api/kits/student');
  }
};

// Kit Component API
export const kitComponentAPI = {
  createComponent: async (componentData) => {
    return apiRequest('/api/kitComponent', {
      method: 'POST',
      body: JSON.stringify(componentData),
    });
  },

  updateComponent: async (id, componentData) => {
    return apiRequest(`/api/kitComponent?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(componentData),
    });
  },

  deleteComponent: async (id) => {
    return apiRequest(`/api/kitComponent?id=${id}`, {
      method: 'DELETE',
    });
  }
};

// Classes API
export const classesAPI = {
  getAllClasses: async () => {
    return apiRequest('/api/classes/get_All');
  },

  getClassById: async (id) => {
    return apiRequest(`/api/classes/getbyId/${id}`);
  },

  getListLecturers: async () => {
    return apiRequest('/api/classes/getListLecturers');
  },

  createClass: async (classData, teacherId) => {
    return apiRequest(`/api/classes/post/${teacherId}`, {
      method: 'POST',
      body: JSON.stringify(classData),
    });
  },

  updateClass: async (id, classData) => {
    return apiRequest(`/api/classes/update/${id}`, {
      method: 'PUT',
      body: JSON.stringify(classData),
    });
  },

  deleteClass: async (id) => {
    return apiRequest(`/api/classes/delete/${id}`, {
      method: 'DELETE',
    });
  }
};

// User API
export const userAPI = {
  getUsers: async () => {
    return apiRequest('/api/admin/users');
  },

  getAllAccounts: async (page = 0, size = 10) => {
    try {
      const response = await apiRequest(`/api/admin/accounts?page=${page}&size=${size}`);
      // Handle different response formats: direct array, ApiResponse with array in data, or PageResponse
      return extractArrayFromPayload(response);
    } catch (error) {
      console.error('Failed to fetch all accounts:', error);
      throw error;
    }
  },

  createUser: async (userData) => {
    return apiRequest('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  createSingleStudent: async (studentData) => {
    console.log('Creating student with data:', studentData);
    
    if (!studentData.email) {
      throw new Error('Email is required');
    }
    
    const requestData = {
      username: studentData.email,
      password: studentData.password || '1',
      studentCode: studentData.studentCode,
      roles: 'STUDENT',
      phoneNumber: studentData.phoneNumber,
      fullName: studentData.name
    };
    
    console.log('Request data:', requestData);
    
    return apiRequest('/api/aas/create-single-student', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
  },

  createSingleLecturer: async (lecturerData) => {
    console.log('Creating lecturer with data:', lecturerData);
    
    if (!lecturerData.email) {
      throw new Error('Email is required');
    }
    
    const requestData = {
      username: lecturerData.email,
      password: lecturerData.password || '1',
      studentCode: lecturerData.studentCode || '',
      roles: 'LECTURER',
      phoneNumber: lecturerData.phoneNumber,
      fullName: lecturerData.name
    };
    
    console.log('Request data:', requestData);
    
    return apiRequest('/api/aas/create-single-lecturer', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
  },

  updateUser: async (id, userData) => {
    return apiRequest(`/api/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },

  deleteUser: async (id) => {
    return apiRequest(`/api/admin/users/${id}`, {
      method: 'DELETE',
    });
  },

  getLecturers: async () => {
    try {
      const response = await apiRequest('/api/classes/getListLecturers');
      if (response && Array.isArray(response)) {
        return response.map(lecturer => ({
          value: lecturer.email,
          label: lecturer.fullName || lecturer.email,
          email: lecturer.email,
          fullName: lecturer.fullName,
          id: lecturer.id,
          phone: lecturer.phone,
          createdAt: lecturer.createdAt,
          status: lecturer.isActive ? 'ACTIVE' : 'INACTIVE'
        }));
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch lecturers:', error);
      return [];
    }
  },

  getStudents: async () => {
    try {
      const response = await apiRequest('/api/getAllStudent');
      if (response && response.data && Array.isArray(response.data)) {
        return response.data.map(student => ({
          id: student.id,
          email: student.email,
          fullName: student.fullName || student.email,
          studentCode: student.studentCode,
          phoneNumber: student.phone,
          createdAt: student.createdAt,
          status: student.isActive ? 'ACTIVE' : 'INACTIVE'
        }));
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch students:', error);
      return [];
    }
  },
};

// Penalties API
export const penaltiesAPI = {
  getAll: async () => {
    return apiRequest('/api/penalties/getAll');
  },

  getUnresolved: async () => {
    return apiRequest('/api/penalties/getAllByResolved-F');
  },

  getPenByAccount: async () => {
    return apiRequest('/api/penalties/getPenByAccount');
  },

  getById: async (id) => {
    return apiRequest(`/api/penalties/${id}`);
  },

  create: async (penaltyData) => {
    return apiRequest('/api/penalties/create', {
      method: 'POST',
      body: JSON.stringify(penaltyData),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },

  update: async (id, penaltyData) => {
    return apiRequest(`/api/penalties/update/${id}`, {
      method: 'PUT',
      body: JSON.stringify(penaltyData),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },

  delete: async (id) => {
    return apiRequest(`/api/penalties/delete/${id}`, {
      method: 'DELETE',
    });
  },

  confirmPenaltyPayment: async (penaltyId) => {
    return apiRequest(`/api/penalties/confirm-payment/${penaltyId}`, {
      method: 'POST'
    });
  }
};

// Penalty Detail API
export const penaltyDetailAPI = {
  getAll: async () => {
    return apiRequest('/api/penalty-details');
  },

  getById: async (id) => {
    return apiRequest(`/api/penalty-details/${id}`);
  },

  create: async (detailData) => {
    return apiRequest('/api/penalty-details/create', {
      method: 'POST',
      body: JSON.stringify(detailData),
    });
  },

  createMultiple: async (detailsData) => {
    return apiRequest('/api/penalty-details/create-multiple', {
      method: 'POST',
      body: JSON.stringify(detailsData),
    });
  },

  findByPenaltyId: async (penaltyId) => {
    return apiRequest(`/api/penalty-details/penalty/${penaltyId}`);
  },

  findByPoliciesId: async (policiesId) => {
    return apiRequest(`/api/penalty-details/policies/${policiesId}`);
  }
};

// Penalty Policies API
export const penaltyPoliciesAPI = {
  getAll: async () => {
    return apiRequest('/api/penalty-policies/getAll');
  },

  getById: async (id) => {
    return apiRequest(`/api/penalty-policies/getById/${id}`);
  },

  create: async (policyData) => {
    return apiRequest('/api/penalty-policies/create', {
      method: 'POST',
      body: JSON.stringify(policyData),
    });
  },

  update: async (id, policyData) => {
    return apiRequest(`/api/penalty-policies/update/${id}`, {
      method: 'PUT',
      body: JSON.stringify(policyData),
    });
  },

  delete: async (id) => {
    return apiRequest(`/api/penalty-policies/delete/${id}`, {
      method: 'DELETE',
    });
  }
};

// Damage Report API
export const damageReportAPI = {
  getAll: async () => {
    return apiRequest('/api/reports/damage');
  },

  getById: async (id) => {
    return apiRequest(`/api/reports/damage/${id}`);
  },

  create: async (reportData) => {
    return apiRequest('/api/reports/damage/create', {
      method: 'POST',
      body: JSON.stringify(reportData),
    });
  },

  update: async (id, reportData) => {
    return apiRequest(`/api/reports/damage/${id}`, {
      method: 'PUT',
      body: JSON.stringify(reportData),
    });
  },

  delete: async (id) => {
    return apiRequest(`/api/reports/damage/${id}`, {
      method: 'DELETE',
    });
  },

  getByAccountId: async (accountId) => {
    return apiRequest(`/api/reports/damage/account/${accountId}`);
  },

  getByKitId: async (kitId) => {
    return apiRequest(`/api/reports/damage/kit/${kitId}`);
  },

  getByBorrowRequestId: async (borrowRequestId) => {
    return apiRequest(`/api/reports/damage/borrow-request/${borrowRequestId}`);
  },

  getByStatus: async (status) => {
    return apiRequest(`/api/reports/damage/status/${status}`);
  }
};

// Notification API
export const notificationAPI = {
  getMyNotifications: async () => {
    const response = await apiRequest('/api/notifications/user');
    return response.data || response;
  },

  getRoleNotifications: async () => {
    const response = await apiRequest('/api/notifications/role');
    return response.data || response;
  },

  createNotifications: async (notifications) => {
    return apiRequest('/api/notifications/create-notifications', {
      method: 'POST',
      body: JSON.stringify(notifications),
    });
  },

  create: async (payload) => {
    return apiRequest('/api/notifications/create', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
};

// QR Code API
export const qrCodeAPI = {
  decode: async (base64QRCode) => {
    const response = await apiRequest('/api/qr-code/decode', {
      method: 'POST',
      body: JSON.stringify({ base64QRCode }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  },

  parse: async (qrText) => {
    const response = await apiRequest('/api/qr-code/parse', {
      method: 'POST',
      body: JSON.stringify({ qrText }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  },
};

// Class Assignment API
export const classAssignmentAPI = {
  getAll: async () => {
    const response = await apiRequest('/api/class-assignments');
    return Array.isArray(response) ? response : (response?.data || []);
  },

  create: async (assignmentData) => {
    return apiRequest('/api/class-assignments', {
      method: 'POST',
      body: JSON.stringify(assignmentData),
    });
  },

  delete: async (id) => {
    return apiRequest(`/api/class-assignments/${id}`, {
      method: 'DELETE',
    });
  },
};

// Excel Import API
export const excelImportAPI = {
  importAccounts: async (file, role) => {
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      type: file.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      name: file.name || 'import.xlsx',
    });
    formData.append('role', role);

    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/api/excel/import-accounts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    return handleResponse(response);
  },
};

