import React, { createContext, useCallback, useContext, useState } from 'react';
import { authAPI, borrowingGroupAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const isAuthenticated = await authAPI.isAuthenticated();
      console.log('AuthContext: Is authenticated:', isAuthenticated);
      
      if (isAuthenticated) {
        // Get user profile after successful login - same as web
        const profileResponse = await authAPI.getProfile();
        const userProfile = profileResponse.data || profileResponse;
        
        console.log('AuthContext: Profile response:', JSON.stringify(userProfile, null, 2));
        
        if (!userProfile) {
          console.error('AuthContext: Profile data is empty');
          setLoading(false);
          return;
        }
        
        // Get user ID
        const userId = userProfile.id || userProfile.userId;
        if (!userId) {
          console.error('AuthContext: User ID not found in profile');
          setLoading(false);
          return;
        }
        
        // Map backend role to frontend role - same as web
        const roleMapping = {
          'ADMIN': 'admin',
          'STUDENT': 'member', // Student role loads MemberPortal
          'LECTURER': 'lecturer',
          'LEADER': 'leader',   // Leader role loads LeaderPortal
          'ACADEMIC': 'academic' // Academic role loads AcademicAffairsPortal
        };
        
        const mappedRole = roleMapping[userProfile.role] || 'member';
        
        // Check borrowing group role for STUDENT to determine if they are leader - same as web
        let finalRole = mappedRole;
        let borrowingGroupInfo = null;
        
        if (mappedRole === 'member' || mappedRole === 'student') {
          try {
            // Get user's borrowing groups
            const borrowingGroups = await borrowingGroupAPI.getByAccountId(userId);
            console.log('AuthContext: User borrowing groups:', borrowingGroups);
            
            // Handle array or object response
            const groupsArray = Array.isArray(borrowingGroups) 
              ? borrowingGroups 
              : (borrowingGroups?.data || borrowingGroups?.content || []);
            
            if (groupsArray && groupsArray.length > 0) {
              // Find if user has LEADER role - same as web (check bg.roles === 'LEADER')
              const leaderGroup = groupsArray.find(bg => bg.roles === 'LEADER');
              if (leaderGroup) {
                finalRole = 'leader';
                borrowingGroupInfo = {
                  groupId: leaderGroup.studentGroupId,
                  role: 'LEADER'
                };
                console.log('AuthContext: User is a LEADER in group:', borrowingGroupInfo);
              } else {
                // User is a member
                const memberGroup = groupsArray.find(bg => bg.roles === 'MEMBER');
                if (memberGroup) {
                  borrowingGroupInfo = {
                    groupId: memberGroup.studentGroupId,
                    role: 'MEMBER'
                  };
                  console.log('AuthContext: User is a MEMBER in group:', borrowingGroupInfo);
                }
              }
            }
          } catch (error) {
            console.error('AuthContext: Error checking borrowing group role:', error);
            // Continue with default role
          }
        }
        
        // Set user with profile data and determined role - same structure as web
        const userData = {
          id: userId,
          email: userProfile.email,
          name: userProfile.fullName || userProfile.email,
          role: finalRole,
          avatarUrl: userProfile.avatarUrl,
          phone: userProfile.phone,
          studentCode: userProfile.studentCode,
          borrowingGroupInfo: borrowingGroupInfo
        };
        
        console.log('AuthContext: Setting user with final role:', JSON.stringify(userData, null, 2));
        setUser(userData);
      } else {
        console.log('AuthContext: User not authenticated');
        setUser(null);
      }
    } catch (error) {
      console.error('AuthContext: Auth check failed:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (username, password) => {
    try {
      console.log('AuthContext: Attempting login...');
      const token = await authAPI.login(username, password);
      console.log('AuthContext: Login successful, token saved');
      
      // After login, immediately check auth to get user profile
      await checkAuth();
      
      return token;
    } catch (error) {
      console.error('AuthContext: Login failed:', error);
      throw error;
    }
  }, [checkAuth]);

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
      setUser(null);
    } catch (error) {
      console.error('AuthContext: Logout failed:', error);
    }
  }, []);

  const value = {
    user,
    loading,
    checkAuth,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

