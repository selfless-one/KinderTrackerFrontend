import React, { useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
  TextInput,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { useDeviceContext } from '../context/DeviceContext';

interface Device {
  id: string;
  name: string;
  ip: string;
}

export default function DeviceScreen() {
  const navigation = useNavigation();
  const [devices, setDevices] = useState<Device[]>([]);
  const [deviceName, setDeviceName] = useState('');

  const addDevice = () => {
    if (!deviceName.trim()) {
      Alert.alert('Error', 'Please enter a device name');
      return;
    }

    // Simulate device IP (in real case, get from local network scanning or input)
    const ip = `192.168.0.${devices.length + 2}`;

    const newDevice: Device = {
      id: Date.now().toString(),
      name: deviceName,
      ip,
    };

    setDevices([...devices, newDevice]);
    setDeviceName('');

    // 🔧 TODO: Add backend call here to store device and its location
  };

  const updateDeviceName = (id: string, newName: string) => {
    const updated = devices.map(device =>
      device.id === id ? { ...device, name: newName } : device
    );
    setDevices(updated);

    // 🔧 TODO: Update name in backend here
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
            <Ionicons name="menu" size={30} color="#595757" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>GPS-Link</Text>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          <Text style={styles.title}>Devices</Text>

          {/* Add Device Input */}
          <View style={styles.inputContainer}>
            <TextInput
              value={deviceName}
              onChangeText={setDeviceName}
              placeholder="Enter device name"
              style={styles.input}
            />
            <TouchableOpacity style={styles.addButton} onPress={addDevice}>
              <Text style={styles.addButtonText}>Add Device</Text>
            </TouchableOpacity>
          </View>

          {/* Device List */}
          <FlatList
            data={devices}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={styles.deviceCard}>
                <Text style={styles.deviceText}>Name: {item.name}</Text>
                <Text style={styles.deviceText}>IP: {item.ip}</Text>

                {/* Edit Name */}
                <TextInput
                  style={styles.editInput}
                  placeholder="Edit name"
                  onSubmitEditing={(e) => updateDeviceName(item.id, e.nativeEvent.text)}
                />
              </View>
            )}
          />
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
  inputContainer: {
    flexDirection: 'row',
    marginTop: 10,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    borderRadius: 6,
    marginRight: 10,
  },
  addButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  deviceCard: {
    marginTop: 15,
    padding: 12,
    backgroundColor: '#f4f4f4',
    borderRadius: 8,
    borderColor: '#ccc',
    borderWidth: 1,
  },
  deviceText: {
    fontSize: 16,
    marginBottom: 5,
  },
  editInput: {
    marginTop: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#888',
    paddingVertical: 4,
  },
});
