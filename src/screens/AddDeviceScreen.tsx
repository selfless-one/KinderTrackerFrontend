import React, { useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  StatusBar,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, DrawerActions } from '@react-navigation/native';

export default function AddDeviceScreen() {
  const navigation = useNavigation();
  const [deviceId, setDeviceId] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [showHintDeviceId, setShowHintDeviceId] = useState(false);
  const [showDeviceNotFound, setShowDeviceNotFound] = useState(false);

  const handleAddDevice = () => {
    if (!deviceId.trim() || !deviceName.trim()) {
      Alert.alert('Error', 'Please enter both device name and device ID.');
      return;
    }
    setShowDeviceNotFound(true);
    setDeviceId('');
    setDeviceName('');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header with drawer menu */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
            <Ionicons name="menu" size={30} color="#595757" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Device</Text>
        </View>

        {/* Main content */}
        <View style={styles.content}>
          <Text style={styles.title}>Link Device</Text>
        
          <View style={{ width: '100%', marginBottom: 0 }}>
            <TextInput
              style={styles.input}
              placeholder="Enter Device Name"
              value={deviceName}
              onChangeText={setDeviceName}
              autoCapitalize="words"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={{ position: 'absolute', right: 12, top: 18 }}
              onPress={() => setShowHint(true)}
              accessibilityLabel="Show device name hint"
            >
              <Ionicons name="information-circle-outline" size={22} color="#6c47ff" />
            </TouchableOpacity>
          </View>
          {/* Modal for device name hint */}
          <Modal
            visible={showHint}
            transparent
            animationType="fade"
            onRequestClose={() => setShowHint(false)}
          >
            <View style={styles.hintOverlay}>
              <View style={styles.hintModal}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
               
                  <Text
  style={{
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
    padding: 8, // Added padding
  }}
>
  Who will be carrying the device to track?
</Text>
                </View>
            
                <TouchableOpacity
                  style={styles.hintCloseButton}
                  onPress={() => setShowHint(false)}
                  accessibilityLabel="Close hint"
                >
                  <Text style={styles.hintCloseButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <View style={{ width: '100%', marginBottom: 0 }}>
            <TextInput
              style={styles.input}
              placeholder="Enter the Device ID"
              value={deviceId}
              onChangeText={setDeviceId}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={{ position: 'absolute', right: 12, top: 18 }}
              onPress={() => setShowHintDeviceId(true)}
              accessibilityLabel="Show device ID hint"
            >
              <Ionicons name="information-circle-outline" size={22} color="#6c47ff" />
            </TouchableOpacity>
          </View>
          {/* Modal for device ID hint */}
          <Modal
            visible={showHintDeviceId}
            transparent
            animationType="fade"
            onRequestClose={() => setShowHintDeviceId(false)}
          >
            <View style={styles.hintOverlay}>
              <View style={styles.hintModal}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                 
                  <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 16 }}> Enter the registered device ID.</Text>
                </View>
                <TouchableOpacity
                  style={styles.hintCloseButton}
                  onPress={() => setShowHintDeviceId(false)}
                  accessibilityLabel="Close hint"
                >
                  <Text style={styles.hintCloseButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
          <TouchableOpacity style={styles.addButton} onPress={handleAddDevice}>
            <Text style={styles.addButtonText}>Add Device</Text>
          </TouchableOpacity>
        </View>
      </View>
      {/* Modal for device not found */}
      <Modal
        visible={showDeviceNotFound}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeviceNotFound(false)}
      >
        <View style={styles.hintOverlay}>
          <View style={styles.hintModal}>
            <Text style={{ color: '#d32f2f', fontWeight: 'bold', fontSize: 18, marginBottom: 8 }}>
              Device Not Found
            </Text>
            <Text style={{ color: '#000', fontSize: 16, marginBottom: 16, textAlign: 'center' }}>
              Device id {deviceId} does not exist in our system.
            </Text>
            <TouchableOpacity
              style={styles.hintCloseButton}
              onPress={() => setShowDeviceNotFound(false)}
              accessibilityLabel="Close error"
            >
              <Text style={styles.hintCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f3f0ff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#f3f0ff',
  },
  header: {
    backgroundColor: '#e5e0ff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#d1cfff',
    borderRadius: 8,
    margin: 10,
    elevation: 5,
    shadowColor: '#6c47ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6c47ff',
    flex: 1,
    textAlign: 'center',
    paddingRight: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#6c47ff',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d1cfff',
    padding: 14,
    fontSize: 16,
    marginBottom: 18,
  },
  addButton: {
    backgroundColor: '#6c47ff',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginTop: 8,
    elevation: 2,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
  hintOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hintModal: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 22,
    alignItems: 'center',
    width: 300,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
  },
  hintCloseButton: {
    marginTop: 8,
    backgroundColor: '#6c47ff',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  hintCloseButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});