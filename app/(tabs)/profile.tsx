import React from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ScrollView } from 'react-native';
import { LogOut, User, Shield, Calendar, LogIn } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { router } from 'expo-router';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  
  const handleLogout = async () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error('Logout failed:', error);
              Alert.alert('Error', 'Failed to log out. Please try again.');
            }
          },
        },
      ]
    );
  };
  
  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.notLoggedInContainer}>
          <View style={styles.loginPrompt}>
            <User size={64} color="#1a3a6a" style={styles.loginIcon} />
            <Text style={styles.notLoggedInTitle}>Welcome to VentX</Text>
            <Text style={styles.notLoggedInSubtitle}>
              Please log in to access your inventory management features
            </Text>
            
            <Pressable
              style={styles.loginButton}
              onPress={() => router.push('/(auth)/login')}
              testID="login-button"
              accessibilityLabel="Go to login"
            >
              <LogIn size={20} color="#fff" />
              <Text style={styles.loginButtonText}>Log In</Text>
            </Pressable>
            
            <Pressable
              style={styles.registerButton}
              onPress={() => router.push('/(auth)/register')}
              testID="register-button"
              accessibilityLabel="Go to register"
            >
              <Text style={styles.registerButtonText}>Create Account</Text>
            </Pressable>
          </View>
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>VentX - Phone Stock Manager</Text>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>
      </View>
    );
  }
  
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>{user.email.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.email}>{user.email}</Text>
      </View>
      
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <User size={20} color="#1a3a6a" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>User ID</Text>
            <Text style={styles.infoValue}>{user.id}</Text>
          </View>
        </View>
        
        <View style={styles.infoRow}>
          <Shield size={20} color="#1a3a6a" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Role</Text>
            <Text style={styles.infoValue}>
              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            </Text>
          </View>
        </View>
        
        <View style={styles.infoRow}>
          <Calendar size={20} color="#1a3a6a" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Account Created</Text>
            <Text style={styles.infoValue}>{formatDate(user.createdAt)}</Text>
          </View>
        </View>
      </View>
      
      <Pressable
        style={styles.logoutButton}
        onPress={handleLogout}
        testID="logout-button"
        accessibilityLabel="Log out"
      >
        <LogOut size={20} color="#fff" />
        <Text style={styles.logoutButtonText}>Log Out</Text>
      </Pressable>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>VentX - Phone Stock Manager</Text>
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#1a3a6a',
    paddingTop: 30,
    paddingBottom: 30,
    alignItems: 'center',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1a3a6a',
  },
  email: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '500',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginTop: 2,
  },
  logoutButton: {
    backgroundColor: '#e53935',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    margin: 16,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 30,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
  },
  versionText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  notLoggedInContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loginPrompt: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    maxWidth: 400,
    width: '100%',
  },
  loginIcon: {
    marginBottom: 16,
  },
  notLoggedInTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a3a6a',
    marginBottom: 8,
    textAlign: 'center',
  },
  notLoggedInSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  loginButton: {
    backgroundColor: '#1a3a6a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginBottom: 12,
    width: '100%',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  registerButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#1a3a6a',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    width: '100%',
  },
  registerButtonText: {
    color: '#1a3a6a',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});