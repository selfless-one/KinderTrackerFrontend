// src/screens/AuthScreen.tsx
import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // First, add a new state variable at the top with other state declarations:
const [deviceId, setDeviceId] = useState('');

  const { authenticate } = useContext(AuthContext);

  const isValidEmail = (email: string) => /\S+@\S+\.\S+/.test(email);

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setEmail('');
    setPassword('');
    setConfirm('');
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
   
  if (!email || !password || (!isLogin && (!confirm || !deviceId))) {
    setError('Please fill in all fields');
    setLoading(false);
    return;
  }

    if (!isValidEmail(email)) {
      setError('Invalid email format');
      setLoading(false);
      return;
    }

    if (!isLogin && password !== confirm) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const endpoint = isLogin
        ? 'http://192.168.100.81:8080/auth/signin'
        : 'http://192.168.100.81:8080/auth/signup';

      const response = await axios.post(endpoint, { email, password });
      const token = typeof response.data === 'string' ? response.data : response.data.token;

      if (token) {
        await AsyncStorage.setItem('authToken', token);
        authenticate(email, token);
      } else {
        setError('Authentication failed.');
      }
    } catch (err: any) {
      if (err.response) {
        if (err.response.status === 400 || err.response.status === 404) {
          setError('Invalid credentials. Please check your email or password.');
        } else {
          setError(`Error ${err.response.status}: ${err.response.data?.message || 'Something went wrong.'}`);
        }
      } else {
        setError('Failed to authenticate. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.card}>
          <Text style={styles.header}>
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </Text>
          <Text style={styles.subheader}>
            {isLogin ? 'Sign in to your account' : 'Register a new account'}
          </Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              onChangeText={setEmail}
              value={email}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              secureTextEntry
              onChangeText={setPassword}
              value={password}
            />
          </View>

          {!isLogin && (
            <>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Confirm your password"
                secureTextEntry
                onChangeText={setConfirm}
                value={confirm}
              />
            </View>

             <View style={styles.inputContainer}>
      <Text style={styles.label}>ESP32 Address</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Registered ESP32 Address"
        onChangeText={setDeviceId}
        value={deviceId}
        autoCapitalize="none"
      />
   
    </View>
   </>
            
          )}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {isLogin ? 'Sign In' : 'Sign Up'}
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.toggleContainer}>
            <Text style={styles.toggleText}>
              {isLogin ? "Don't have an account?" : 'Already have an account?'}
            </Text>
            <TouchableOpacity onPress={toggleMode}>
              <Text style={styles.toggleActionText}>
                {isLogin ? ' Sign Up' : ' Sign In'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#33a0d1',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#87e5cf',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  header: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1a365d',
    textAlign: 'center',
    marginBottom: 8,
  },
  subheader: {
    fontSize: 15,
    color: '#718096',
    textAlign: 'center',
    marginBottom: 28,
  },
  inputContainer: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    color: '#2d3748',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    height: 50,
    borderColor: '#e2e8f0',
    borderWidth: 1,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    fontSize: 15,
    color: '#1a202c',
  },
  button: {
    backgroundColor: '#4f46e5',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: '#a5b4fc',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  toggleText: {
    color: '#4a5568',
    fontSize: 14,
  },
  toggleActionText: {
    color: '#4f46e5',
    fontWeight: '600',
    fontSize: 14,
  },
  errorText: {
    color: '#e53e3e',
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 14,
    fontWeight: '500',
  },
});