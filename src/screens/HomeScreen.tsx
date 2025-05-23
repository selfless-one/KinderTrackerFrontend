// src/screens/HomeScreen.tsx

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import MapView, { Marker, Region, Callout, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import * as Device from 'expo-device';
import { Ionicons } from '@expo/vector-icons';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { getDatabase, ref, set, onValue } from 'firebase/database';
import { app } from '../services/firebase';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';


const { width } = Dimensions.get('window');

// Polyline decode function
function decodePolyline(encoded: string): { latitude: number; longitude: number }[] {
  let index = 0, lat = 0, lng = 0, coordinates = [];

  while (index < encoded.length) {
    let b, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let deltaLat = (result & 1) ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let deltaLng = (result & 1) ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    coordinates.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return coordinates;
}

export default function HomeScreen() {
  const navigation = useNavigation();
  const mapRef = useRef<MapView>(null);
  const db = getDatabase(app);

  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [region, setRegion] = useState<Region>({
    latitude: 14.6256,
    longitude: 121.1224,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  const [deviceMarkers, setDeviceMarkers] = useState<
    { deviceId: string; latitude: number; longitude: number; timestamp: string }[]
  >([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [routeCoords, setRouteCoords] = useState<{ latitude: number; longitude: number }[]>([]);

  const uploadLocation = async (loc: Location.LocationObject) => {
    const deviceName = Device.deviceName || Device.modelName || 'Unknown_Device';
    const data = {
      deviceName,
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      timestamp: new Date().toISOString(),
    };
    try {
      await set(ref(db, `locations/${deviceName}`), data);
    } catch (err) {
      console.error('Upload error:', err);
    }
  };

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Location permission not granted');
        return;
      }

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Highest,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        async (loc) => {
          setLocation(loc);
          await uploadLocation(loc);
        }
      );
    })();

    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    const locationRef = ref(db, 'locations/');
    const unsubscribe = onValue(locationRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const updatedMarkers = Object.entries(data).map(([deviceId, value]: any) => ({
          deviceId,
          latitude: value.latitude,
          longitude: value.longitude,
          timestamp: value.timestamp,
        }));
        setDeviceMarkers(updatedMarkers);
      }
    });

    return () => unsubscribe();
  }, []);

  const recenter = () => {
    if (location) {
      const { latitude, longitude } = location.coords;
      const newRegion = { latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 };
      setRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 1000);
      setSelectedDevice(null);
      setRouteCoords([]);
    }
  };

  const zoom = (factor: number) => {
    const newRegion = {
      ...region,
      latitudeDelta: region.latitudeDelta * factor,
      longitudeDelta: region.longitudeDelta * factor,
    };
    setRegion(newRegion);
    mapRef.current?.animateToRegion(newRegion, 300);
  };

  const openDeviceSelector = () => {
    setModalVisible(true);
  };

  const selectDevice = (deviceId: string) => {
    setSelectedDevice(deviceId);
    setModalVisible(false);

    const device = deviceMarkers.find((d) => d.deviceId === deviceId);
    if (device) {
      const newRegion = {
        latitude: device.latitude,
        longitude: device.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 1000);
      setRouteCoords([]);
    }
  };

  const navigateToSelectedDevice = async () => {
    if (!location) {
      alert('Current location not available');
      return;
    }
    if (!selectedDevice) {
      alert('No device selected');
      return;
    }

    const device = deviceMarkers.find((d) => d.deviceId === selectedDevice);
    if (!device) {
      alert('Selected device not found');
      return;
    }

    const origin = `${location.coords.latitude},${location.coords.longitude}`;
    const destination = `${device.latitude},${device.longitude}`;
    const GOOGLE_MAPS_API_KEY = 'AIzaSyD-s3l3tAly_hOhSec_sLLGNyKTZ45DoQI';
    const GOOGLE_PLACES_API_KEY = 'AIzaSyD-s3l3tAly_hOhSec_sLLGNyKTZ45DoQI';


    try {
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&key=${GOOGLE_MAPS_API_KEY}&mode=driving`;
      const response = await fetch(url);
      const json = await response.json();

      if (json.routes && json.routes.length > 0) {
        const points = decodePolyline(json.routes[0].overview_polyline.points);
        setRouteCoords(points);

        const midIndex = Math.floor(points.length / 2);
        const midPoint = points[midIndex];
        const newRegion: Region = {
          latitude: midPoint.latitude,
          longitude: midPoint.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };
        setRegion(newRegion);
        mapRef.current?.animateToRegion(newRegion, 1000);
      } else {
        alert('No routes found');
        setRouteCoords([]);
      }
    } catch (error) {
      console.error('Directions API error:', error);
      alert('Failed to fetch route');
      setRouteCoords([]);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.mapWrapper}>
          <MapView
            ref={mapRef}
            style={styles.map}
            region={region}
            showsUserLocation
            showsMyLocationButton={false}
          >
            {selectedDevice &&
              deviceMarkers
                .filter((marker) => marker.deviceId === selectedDevice)
                .map((marker) => (
                  <Marker
                    key={marker.deviceId}
                    coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
                    title={marker.deviceId}
                    pinColor="red"
                  >
                    <Callout>
                      <View>
                        <Text style={{ fontWeight: 'bold' }}>{marker.deviceId}</Text>
                        <Text>{new Date(marker.timestamp).toLocaleString()}</Text>
                      </View>
                    </Callout>
                  </Marker>
                ))}

            {routeCoords.length > 0 && (
              <Polyline
                coordinates={routeCoords}
                strokeColor="#001eff"
                strokeWidth={4}
                lineDashPattern={[10, 10]}
              />
            )}
          </MapView>

          {/* Overlay Header with Menu */}
          <View style={styles.mapHeader}>
            <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
              <Ionicons name="menu" size={30} color="#fff" />
            </TouchableOpacity>
          </View>
          
 
          {/* Zoom Buttons */}
          <View style={styles.zoomControls}>
            <TouchableOpacity style={styles.zoomButton} onPress={() => zoom(0.5)}>
              <Ionicons name="add" size={28} color="#00c4c1" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.zoomButton} onPress={() => zoom(2)}>
              <Ionicons name="remove" size={28} color="#00c4c1" />
            </TouchableOpacity>
          </View>

          {/* Bottom Navigation */}
          <View style={styles.bottomNavOverlay}>
            <View style={styles.bottomNav}>
              <TouchableOpacity style={styles.navButton} onPress={recenter}>
                <Ionicons name="locate" size={28} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.navButton} onPress={navigateToSelectedDevice}>
                <Ionicons name="navigate" size={28} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.navButton} onPress={openDeviceSelector}>
                <Ionicons name="clipboard" size={28} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Device Selector Modal */}
      {modalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Select a device to track</Text>
            {deviceMarkers.length === 0 && <Text>No devices available</Text>}
            {deviceMarkers.map((device) => (
              <TouchableOpacity
                key={device.deviceId}
                style={styles.deviceItem}
                onPress={() => selectDevice(device.deviceId)}
              >
                <Text style={styles.deviceText}>{device.deviceId}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.deviceItem, { backgroundColor: '#ccc' }]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={[styles.deviceText, { textAlign: 'center' }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
  },
  mapWrapper: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  mapHeader: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: '#065d96',
    padding: 10,
    borderRadius: 10,
    elevation: 5,
    zIndex: 999,
  },
  bottomNavOverlay: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#065d96',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderRadius: 20,
    paddingVertical: 5,
    width: width * 0.9,
    elevation: 5,
    bottom: 30,
  },
  navButton: {
    padding: 10,
  },
  zoomControls: {
    position: 'absolute',
    right: 20,
    bottom: 150,
    zIndex: 20,
    alignItems: 'center',
  },
  zoomButton: {
    backgroundColor: '#fff',
    width: 55,
    height: 55,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 5,
    elevation: 4,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  modalContainer: {
    width: '85%',
    maxHeight: '70%',
    backgroundColor: '#fff',
    borderRadius: 15,
    paddingVertical: 20,
    paddingHorizontal: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  deviceItem: {
    backgroundColor: '#fa4646',
    marginVertical: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  deviceText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 20,
    textAlign: 'center',
  },
});
