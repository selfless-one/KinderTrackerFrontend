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

export default function DeviceScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header with drawer menu */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
            <Ionicons name="menu" size={30} color="#595757" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Terms</Text>
        </View>

        {/* Main content */}
        <View style={styles.content}>
          <Text style={styles.title}>KidGuardian Terms & Conditions</Text>
          <View style={styles.termsCard}>
            <Text style={styles.termsWelcome}>
              Welcome to <Text style={styles.kinderHighlight}>KidGuardian</Text>!
            </Text>
            <Text style={styles.termsIntro}>
              By using this application, you agree to the following terms:
            </Text>
            <View style={styles.divider} />
            <View style={styles.termItem}>
              <Text style={styles.termText}>
                <Text style={styles.termBold}>Purpose:</Text> KidGuardian is designed to help guardians and authorized users monitor the location of children for safety and peace of mind.
              </Text>
            </View>
            <View style={styles.termItem}>
              <Text style={styles.termText}>
                <Text style={styles.termBold}>Data Collection:</Text> The app collects and uses location data to provide real-time tracking. Your data is stored securely and is not shared with third parties except as required by law.
              </Text>
            </View>
            <View style={styles.termItem}>
              <Text style={styles.termText}>
                <Text style={styles.termBold}>User Responsibility:</Text> You are responsible for keeping your login credentials secure and for any activity that occurs under your account.
              </Text>
            </View>
            <View style={styles.termItem}>
              <Text style={styles.termText}>
                <Text style={styles.termBold}>Appropriate Use:</Text> Do not use KidGuardian for unlawful purposes or to track individuals without their consent.
              </Text>
            </View>
            <View style={styles.termItem}>
              <Text style={styles.termText}>
                <Text style={styles.termBold}>Limitation of Liability:</Text> While we strive for accuracy, we do not guarantee the precision of location data at all times. Use the app as a supplementary tool for safety.
              </Text>
            </View>
            <View style={styles.termItem}>
              <Text style={styles.termText}>
                <Text style={styles.termBold}>Updates:</Text> Terms may change as the app evolves. Continued use of the app means you accept any updated terms.
              </Text>
            </View>
            <View style={styles.divider} />
            <Text style={styles.termsContact}>
              If you have questions or concerns, please contact the project team.
            </Text>
          </View>
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
    backgroundColor: '#f3f0ff',
  },
  header: {
    backgroundColor: '#e5e0ff', // subtle contrast for header, like AboutScreen
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#d1cfff', // match AboutScreen border
    borderRadius: 8,
    margin: 10,
    elevation: 5,
    shadowColor: '#6c47ff', // subtle purple shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 20,
    color: '#6c47ff', // accent color like AboutScreen
    paddingLeft: 70,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#008080',
    marginBottom: 18,
    textAlign: 'center',
    letterSpacing: 1,
  },
  termsCard: {
    backgroundColor: '#f8fcfd',
    borderRadius: 18,
    paddingVertical: 24,
    paddingHorizontal: 18,
    shadowColor: '#008080',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 3,
    marginTop: 0,
    marginBottom: 0,
  },
  termsWelcome: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#008080',
    marginBottom: 6,
    textAlign: 'center',
  },
  kinderHighlight: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  termsIntro: {
    fontSize: 15,
    color: '#333',
    marginBottom: 10,
    textAlign: 'justify',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0f1f3',
    marginVertical: 10,
    borderRadius: 1,
  },
  termItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  termCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#e0f7fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 2,
    borderWidth: 1,
    borderColor: '#b2ebf2',
  },
  termCircleText: {
    color: '#008080',
    fontWeight: 'bold',
    fontSize: 14,
  },
  termText: {
    fontSize: 15,
    color: '#333',
    flex: 1,
    lineHeight: 22,
    backgroundColor: '#fafdff',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 0,
    textAlign: 'justify',
  },
  termBold: {
    fontWeight: 'bold',
    color: '#007AFF',
  },
  termsContact: {
    marginTop: 14,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
