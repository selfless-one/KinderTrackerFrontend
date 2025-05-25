// src/screens/AuthScreen.tsx
import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator } from 'react-native';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  const { authenticate } = useContext(AuthContext);

  const isValidEmail = (email: string) => /\S+@\S+\.\S+/.test(email);

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setEmail('');
    setPassword('');
    setConfirm('');
  };

  const [loading, setLoading] = useState(false);

const handleSubmit = async () => {
  console.log("Submit clicked");
  setError('');
  setLoading(true);

  if (!email || !password || (!isLogin && !confirm)) {
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

    console.log('Sending request to:', endpoint);

    const response = await axios.post(endpoint, { email, password });

    console.log('Response received:', response.status, response.data);

    const token = typeof response.data === 'string' ? response.data : response.data.token;

    if (token) {
      console.log("Token found, calling authenticate()");
      await AsyncStorage.setItem('authToken', token);
      authenticate(email, token);
    } else {
      console.log("No token in response");
      setError('Authentication failed.');
    }

  } catch (err: any) {
    //console.error('Error in API call:', err);

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
    <View style={styles.container}>
      <Text style={styles.header}>
        {isLogin ? 'Login to Your Account' : 'Create an Account'}
      </Text>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TextInput
        style={styles.input}
        placeholder="Email"
        onChangeText={setEmail}
        value={email}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        onChangeText={setPassword}
        value={password}
      />
      {!isLogin && (
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          secureTextEntry
          onChangeText={setConfirm}
          value={confirm}
        />
      )}

     <TouchableOpacity
  style={[styles.button, loading && { backgroundColor: '#a4c6f0' }]}
  onPress={handleSubmit}
  disabled={loading}
>
  {loading ? (
    <ActivityIndicator size="small" color="#fff" />
  ) : (
    <Text style={styles.buttonText}>
      {isLogin ? 'Login' : 'Register'}
    </Text>
  )}
</TouchableOpacity>



      <TouchableOpacity onPress={toggleMode}>
        <Text style={styles.toggleText}>
          {isLogin ? "Don't have an account? Register" : 'Already have an account? Login'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 30,
    justifyContent: 'center',
    flex: 1,
    backgroundColor: '#f4f4f4',
  },
  header: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 45,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#2e86de',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  toggleText: {
    textAlign: 'center',
    color: '#2e86de',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
  },
});