import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';

import HomeScreen from '../screens/HomeScreen';
import DeviceScreen from '../screens/DeviceScreen';
import AboutScreen from '../screens/AboutScreen';
import TermsScreen from '../screens/TermsScreen';


const Drawer = createDrawerNavigator();

export default function DrawerNavigator() {
  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Drawer.Screen name="Home" component={HomeScreen} />
       <Drawer.Screen name="Device" component={DeviceScreen} />
       <Drawer.Screen name="About" component={AboutScreen} />
       <Drawer.Screen name="Terms" component={TermsScreen} />
      {/* Add other drawer screens here */}
    </Drawer.Navigator>
  );
}
