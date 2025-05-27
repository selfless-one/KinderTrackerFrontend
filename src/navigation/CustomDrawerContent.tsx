import React, { useContext } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Alert, BackHandler } from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { AuthContext } from '../context/AuthContext'; // <-- import your context

export default function CustomDrawerContent(props: any) {
  const { logout } = useContext(AuthContext); // <-- get logout function

  const handleLogout = async () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            // await AsyncStorage.removeItem('authToken');
            logout(); // <-- this will trigger the navigator to show AuthScreen
          }
        },
      ],
      { cancelable: true }
    );
  };

  const handleExit = () => {
    Alert.alert(
      'Exit',
      'Are you sure you want to exit the app?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Exit', style: 'destructive', onPress: () => {
            BackHandler.exitApp(); // <-- exits the app on Android
          }
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <DrawerItemList {...props} />
      </View>
      <View style={styles.bottomButtons}>
        <TouchableOpacity style={styles.button} onPress={handleLogout}>
          <Text style={styles.buttonText}>Log Out</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleExit}>
          <Text style={styles.buttonText}>Exit</Text>
        </TouchableOpacity>
      </View>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  bottomButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
    gap: 10, // For spacing between buttons (React Native 0.71+)
  },
  button: {
    backgroundColor: '#fff', // Changed to white
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    alignSelf: 'center',
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#6c47ff', // Optional: add border to match theme
  },
  buttonText: {
    color: '#6c47ff', // Changed to match the border color
    fontWeight: '600',
    fontSize: 16,
  },
});