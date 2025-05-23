// src/components/CustomDrawer.tsx

import React, { useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {
  DrawerContentScrollView,
  DrawerItemList,
  DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { AuthContext } from '../context/AuthContext';

export default function CustomDrawer(props: DrawerContentComponentProps) {
  const { user, logout } = useContext(AuthContext);

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ flex: 1 }}>
      <View style={styles.drawerContent}>

        {/* Show User ID */}
        {user && (
          <Text style={styles.username}>
            Hello, {user}
          </Text>
        )}

        {/* Default Drawer Items */}
        <DrawerItemList {...props} />

        {/* Additional Navigation Items */}
        <TouchableOpacity
          style={styles.item}
          onPress={() => props.navigation.navigate('Device')}
        >
          <Text style={styles.label}>Device</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.item}
          onPress={() => props.navigation.navigate('About')}
        >
          <Text style={styles.label}>About</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.item}
          onPress={() => props.navigation.navigate('Terms')}
        >
          <Text style={styles.label}>Terms</Text>
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity
          style={styles.item}
          onPress={logout}
        >
          <Text style={styles.label}>Logout</Text>
        </TouchableOpacity>
      </View>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  drawerContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  item: {
    marginTop: 30,
    paddingVertical: 10,
  },
  label: {
    fontSize: 18,
    color: '#333',
    fontWeight: '500',
  },
});
