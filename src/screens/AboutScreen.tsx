import React from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
  Linking,
  ScrollView, // <-- Add this import
} from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
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
          <Text style={styles.headerTitle}>GPS-Link</Text>
        </View>

        {/* Main content */}
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Logo or App Icon Placeholder */}
          <View style={styles.logoContainer}>
            <Ionicons name="shield-checkmark" size={60} color="#00778B" />
          </View>

          <Text style={styles.title}>Kinder Tracker</Text>
          <Text style={styles.mission}>
            Empowering parents to keep their children safe and connected, anytime and anywhere.
          </Text>

          <View style={styles.divider} />

          {/* About Section */}
          <View style={styles.aboutCard}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.description}>
              Kinder Tracker is a smart family safety app that uses IoT-enabled devices to provide real-time location tracking, instant alerts, and safe zone monitoring. Built with privacy in mind, it keeps families connected and reassured—wherever they are.
            </Text>
          </View>

          {/* Key Features Section */}
          <View style={styles.featuresCard}>
            <Text style={styles.sectionTitle}>Key Features</Text>
            <View style={styles.featureRow}>
              <Ionicons name="location-sharp" size={18} color="#00778B" style={styles.featureIcon} />
              <Text style={styles.featureText}>Live GPS tracking with IoT-enabled wearables</Text>
            </View>
            {/* <View style={styles.featureRow}>
              <Ionicons name="notifications" size={18} color="#00778B" style={styles.featureIcon} />
              <Text style={styles.featureText}>Safe zone notifications</Text>
            </View> */}
            <View style={styles.featureRow}>
              <Ionicons name="time" size={18} color="#00778B" style={styles.featureIcon} />
              <Text style={styles.featureText}>Location history review</Text>
            </View>
            <View style={styles.featureRow}>
              <Ionicons name="alert-circle" size={18} color="#00778B" style={styles.featureIcon} />
              <Text style={styles.featureText}>Emergency SOS alerts</Text>
            </View>
            <View style={styles.featureRow}>
              <Ionicons name="lock-closed" size={18} color="#00778B" style={styles.featureIcon} />
              <Text style={styles.featureText}>Easy and private to use</Text>
            </View>
          </View>

          {/* Version Section */}
          <View style={styles.versionCard}>
            <Text style={styles.sectionTitle}>Version</Text>
            <View style={styles.versionRow}>
              <Ionicons name="information-circle" size={20} color="#00778B" style={styles.versionIcon} />
              <Text style={styles.versionText}>1.0.0</Text>
            </View>
          </View>

          <View style={styles.creditsCard}>
            <Text style={styles.sectionTitle}>Credits</Text>
            <Text style={styles.creditsLabel}>Developers:</Text>
            <View style={styles.creditsList}>
              <View style={styles.creditRow}>
                <Ionicons name="person-circle" size={18} color="#00778B" style={styles.creditIcon} />
                <Text style={styles.creditName}>Razonable Rowel</Text>
              </View>
              <View style={styles.creditRow}>
                <Ionicons name="person-circle" size={18} color="#00778B" style={styles.creditIcon} />
                <Text style={styles.creditName}>Boncales Brytch</Text>
              </View>
              <View style={styles.creditRow}>
                <Ionicons name="person-circle" size={18} color="#00778B" style={styles.creditIcon} />
                <Text style={styles.creditName}>Merca Randy</Text>
              </View>
              <View style={styles.creditRow}>
                <Ionicons name="person-circle" size={18} color="#00778B" style={styles.creditIcon} />
                <Text style={styles.creditName}>Guzman Carlo Dave</Text>
              </View>
              <View style={styles.creditRow}>
                <Ionicons name="person-circle" size={18} color="#00778B" style={styles.creditIcon} />
                <Text style={styles.creditName}>Santiago Kobe</Text>
              </View>
              <View style={styles.creditRow}>
                <Ionicons name="person-circle" size={18} color="#00778B" style={styles.creditIcon} />
                <Text style={styles.creditName}>Padua Angel</Text>
              </View>
              <View style={styles.creditRow}>
                <Ionicons name="person-circle" size={18} color="#00778B" style={styles.creditIcon} />
                <Text style={styles.creditName}>Yamat John Niño</Text>
              </View>
              <View style={styles.creditRow}>
                <Ionicons name="person-circle" size={18} color="#00778B" style={styles.creditIcon} />
                <Text style={styles.creditName}>Urminita Ken</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact</Text>
            <View style={styles.contactRow}>
              <Ionicons name="mail" size={20} color="#00778B" style={styles.contactIcon} />
              <Text
                style={styles.link}
                onPress={() => Linking.openURL('mailto:razonabler23@gmail.com')}
              >
                razonabler23@gmail.com
              </Text>
            </View>
            <View style={styles.contactRow}>
              <FontAwesome name="facebook-square" size={20} color="#1877F3" style={styles.contactIcon} />
              <Text
                style={styles.link}
                onPress={() => Linking.openURL('https://www.facebook.com/kymzone')}
              >
                facebook.com/kymzone
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Disclaimer</Text>
            <Text style={styles.sectionContent}>
              Kinder Tracker is intended for use by parents and guardians. Please respect privacy and comply with all applicable laws.
            </Text>
          </View>
        </ScrollView>
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
    paddingHorizontal: 12, // Add horizontal padding to fit content
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
  logoContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 10,
    color: '#00778B',
    textAlign: 'center',
  },
  mission: {
    fontSize: 16,
    color: '#00778B',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 15,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 15,
  },
  section: {
    marginTop: 15,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00778B',
    marginTop: 2,
  },
  sectionContent: {
    color: '#444',
    fontSize: 15,
    textAlign: 'justify', // Justify section content text
  },
  description: {
    color: '#444',
    fontSize: 15,
    marginBottom: 10,
    textAlign: 'justify', // Justify the description text
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 2,
  },
  contactIcon: {
    marginRight: 8,
  },
  link: {
    color: '#00778B',
    textDecorationLine: 'underline',
    fontWeight: 'bold',
    fontSize: 15,
  },
  creditsCard: {
    backgroundColor: '#f2fcff',
    borderRadius: 10,
    padding: 15,
    marginTop: 15,
    marginBottom: 10,
    // Remove horizontal margin for edge-to-edge fit
    shadowColor: '#00778B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  creditsLabel: {
    fontWeight: '600',
    color: '#00778B',
    marginBottom: 6,
    marginTop: 4,
    fontSize: 15,
  },
  creditsList: {
    marginLeft: 4,
  },
  creditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  creditIcon: {
    marginRight: 8,
  },
  creditName: {
    fontSize: 15,
    color: '#444',
  },
  scrollContent: {
    paddingBottom: 30,
  },
  aboutCard: {
    backgroundColor: '#eafcff',
    borderRadius: 10,
    padding: 15,
    marginTop: 15,
    marginBottom: 10,
    // Remove horizontal margin for edge-to-edge fit
    shadowColor: '#00778B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  featuresCard: {
    backgroundColor: '#f8fdff',
    borderRadius: 10,
    padding: 15,
    marginTop: 10,
    marginBottom: 10,
    // Remove horizontal margin for edge-to-edge fit
    shadowColor: '#00778B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureIcon: {
    marginRight: 10,
  },
  featureText: {
    fontSize: 15,
    color: '#444',
    flex: 1,
  },
  versionCard: {
    backgroundColor: '#f8fdff',
    borderRadius: 10,
    padding: 15,
    marginTop: 10,
    marginBottom: 10,
    // alignItems: 'center', // Remove this line to left-align content
    shadowColor: '#00778B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  versionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  versionIcon: {
    marginRight: 8,
  },
  versionText: {
    fontSize: 16,
    color: '#00778B',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
