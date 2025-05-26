// src/screens/AuthScreen.tsx
import React, { useContext, useState, useRef } from 'react';
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
  Image,
  Animated, // <-- add this
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
  const [deviceId, setDeviceId] = useState('');

  // Animation for card fade and slide
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current; // 0 = visible, 30 = offscreen

  const { authenticate } = useContext(AuthContext);

  const isValidEmail = (email: string) => /\S+@\S+\.\S+/.test(email);

  const toggleMode = () => {
    // Animate fade and slide up
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250, // increased from 90
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -30, // slide up by 30px
        duration: 300, // increased from 150
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsLogin((prev) => !prev);
      setError('');
      setEmail('');
      setPassword('');
      setConfirm('');
      setDeviceId('');
      // Animate fade and slide back in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250, // increased from 90
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250, // increased from 90
          useNativeDriver: true,
        }),
      ]).start();
    });
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
        ? 'https://kindertrackerbackend-184543767933.europe-west1.run.app/auth/signin'
        : 'https://kindertrackerbackend-184543767933.europe-west1.run.app/auth/signup';

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
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.centered}>
          <Animated.View
            style={[
              styles.card,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Logo or Avatar Placeholder */}
            <View style={styles.logoContainer}>
              <View style={styles.simpleLogo}>
                <Image
                  source={require('../assets/trackerlogo.png')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
            </View>
            <Text style={styles.header}>
              {isLogin ? 'KidGuardian' : 'KidGuardian'}
            </Text>
            <Text style={styles.subheader}>
              {isLogin ? 'Login to your account' : 'Register a new account'}
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
                  <Text style={styles.label}>ESP32 ID</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your registered ESP32 ID"
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
                  {isLogin ? 'Log in' : 'Sign Up'}
                </Text>
              )}
            </TouchableOpacity>

            <View style={styles.toggleContainer}>
              <Text style={styles.toggleText}>
                {isLogin ? "Don't have an account?" : 'Already have an account?'}
              </Text>
              <TouchableOpacity onPress={toggleMode}>
                <Text style={styles.toggleActionText}>
                  {isLogin ? ' Sign Up' : 'Log in'}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f0ff',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 16,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#f3f0ff',
    borderRadius: 18,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
    alignSelf: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  simpleLogo: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
  },
  logoIcon: {
    fontSize: 28,
    color: '#fff',
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
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
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