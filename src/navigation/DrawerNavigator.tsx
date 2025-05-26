import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';

import HomeScreen from '../screens/HomeScreen';
import DeviceScreen from '../screens/DeviceScreen';
import AboutScreen from '../screens/AboutScreen';
import TermsScreen from '../screens/TermsScreen';
import AddDeviceScreen from '../screens/AddDeviceScreen';
import CustomDrawerContent from './CustomDrawerContent';

const Drawer = createDrawerNavigator();

export default function DrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={props => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          backgroundColor: '#f3f0ff', // Drawer panel background
          borderTopRightRadius: 32,   // Rounded top-right
          borderBottomRightRadius: 32, // Rounded bottom-right
          width: 260,                 // Custom width
          shadowColor: '#000',
          shadowOpacity: 0.1,
          shadowOffset: { width: 2, height: 0 },
          shadowRadius: 8,
          elevation: 8,
        },
        drawerActiveTintColor: '#6c47ff', // Active item color
        drawerInactiveTintColor: '#333',  // Inactive item color
        drawerLabelStyle: {
          fontSize: 17,
          fontWeight: '600',
        },
      }}
    >
      <Drawer.Screen name="Live Map" component={HomeScreen} options={{ drawerLabel: "Live Map" }} />
      <Drawer.Screen name="Add Device" component={AddDeviceScreen} options={{ drawerLabel: "Add New Device" }} />
      <Drawer.Screen name="About" component={AboutScreen} options={{ drawerLabel: "About This App" }} />
      <Drawer.Screen name="Terms" component={TermsScreen} options={{ drawerLabel: "Terms & Conditions" }} />
      {/* Add other drawer screens here */}
    </Drawer.Navigator>
  );
}
