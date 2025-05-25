import React from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, DrawerActions } from '@react-navigation/native';

export default function TermScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header with drawer menu */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
            <Ionicons name="menu" size={30} color="#595757" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>GPS-Link</Text>
        </View>

        {/* Main content */}
        <View style={styles.content}>
          <Text style={styles.title}>Terms & Conditions</Text>
          <Text style={styles.aboutText}>
            Welcome to Kinder Tracker! By using our app, you agree to the following terms and conditions:
            {'\n\n'}
            • The app is intended for parental and guardian use to monitor children's locations for safety purposes only.
            {'\n'}• Location data is used solely for providing real-time tracking and notifications.
            {'\n'}• Do not use the app for unlawful or unauthorized purposes.
            {'\n'}• We are committed to protecting your privacy and data security.
            {'\n\n'}
            Please review our Privacy Policy for more details. Continued use of Kinder Tracker indicates your acceptance of these terms.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#dffbff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    margin: 10,
    elevation: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 20,
    color: '#000',
    paddingLeft: 70,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  aboutText: {
    fontSize: 16,
    color: '#333',
    marginTop: 10,
    lineHeight: 22,
  },
});