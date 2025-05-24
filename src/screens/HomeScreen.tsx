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

const { width } = Dimensions.get('window');

// Polyline decode function
function decodePolyline(encoded: string): { latitude: number; longitude: number }[] {
  let index = 0,
    lat = 0,
    lng = 0,
    coordinates = [];

  while (index < encoded.length) {
    let b,
      shift = 0,
      result = 0;
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

export default function Mapcreen() {
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

  const [places, setPlaces] = useState<
    { id: number; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags: any }[]
  >([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [routeCoords, setRouteCoords] = useState<{ latitude: number; longitude: number }[]>([]);

  // Upload current device location to Firebase Realtime Database
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

  // Fetch nearby places (e.g., restaurants) from Overpass API
  const fetchNearbyPlaces = async (latitude: number, longitude: number) => {
    const query = `
      [out:json];
      (
        node["amenity"="restaurant"](around:500,${latitude},${longitude});
        way["amenity"="restaurant"](around:500,${latitude},${longitude});
        relation["amenity"="restaurant"](around:500,${latitude},${longitude});
      );
      out center;
    `;

    try {
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`,
      });
      const json = await response.json();
      if (json.elements) {
        setPlaces(json.elements);
      }
    } catch (error) {
      console.error('Overpass API error:', error);
    }
  };

  // Location subscription & upload
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
          fetchNearbyPlaces(loc.coords.latitude, loc.coords.longitude);
        }
      );
    })();

    return () => subscription?.remove();
  }, []);

  // Listen for devices locations in Firebase
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

  // Recenter map on user location
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

  // Zoom map in/out
  const zoom = (factor: number) => {
    const newRegion = {
      ...region,
      latitudeDelta: region.latitudeDelta * factor,
      longitudeDelta: region.longitudeDelta * factor,
    };
    setRegion(newRegion);
    mapRef.current?.animateToRegion(newRegion, 300);
  };

  // Show device selector modal
  const openDeviceSelector = () => {
    setModalVisible(true);
  };

  // Select a device to track
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

  // Navigate from current location to selected device using Google Directions API
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
            provider={undefined} // defaults to Google on Android/iOS, or Apple on iOS
            // You can add `customMapStyle` here if needed
          >
            {/* Device markers */}
            {deviceMarkers.map(({ deviceId, latitude, longitude, timestamp }) => (
              <Marker
                key={deviceId}
                coordinate={{ latitude, longitude }}
                pinColor={deviceId === selectedDevice ? 'blue' : 'red'}
                onPress={() => setSelectedDevice(deviceId)}
              >
                <Callout>
                  <View>
                    <Text style={{ fontWeight: 'bold' }}>{deviceId}</Text>
                    <Text>{new Date(timestamp).toLocaleString()}</Text>
                  </View>
                </Callout>
              </Marker>
            ))}

            {/* Nearby Places markers */}
            {places.map((place) => {
              const lat = place.lat ?? place.center?.lat;
              const lon = place.lon ?? place.center?.lon;
              if (!lat || !lon) return null;

              return (
                <Marker
                  key={place.id}
                  coordinate={{ latitude: lat, longitude: lon }}
                  pinColor="green"
                  title={place.tags?.name || 'Place'}
                  description={place.tags?.amenity || ''}
                />
              );
            })}

            {/* Route Polyline */}
            {routeCoords.length > 0 && (
              <Polyline
                coordinates={routeCoords}
                strokeColor="#007AFF"
                strokeWidth={4}
              />
            )}
          </MapView>
        </View>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.roundButton}
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          >
            <Ionicons name="menu" size={24} color="white" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.roundButton} onPress={recenter}>
            <Ionicons name="locate" size={24} color="white" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.roundButton} onPress={() => zoom(0.5)}>
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.roundButton} onPress={() => zoom(2)}>
            <Ionicons name="remove" size={24} color="white" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.roundButton} onPress={openDeviceSelector}>
            <Ionicons name="people" size={24} color="white" />
          </TouchableOpacity>

          {selectedDevice && (
            <TouchableOpacity style={styles.roundButton} onPress={navigateToSelectedDevice}>
              <Ionicons name="navigate" size={24} color="white" />
            </TouchableOpacity>
          )}
        </View>

        {/* Device selector modal */}
        {modalVisible && (
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Device</Text>
              {deviceMarkers.length === 0 && <Text>No devices found</Text>}
              {deviceMarkers.map(({ deviceId }) => (
                <TouchableOpacity
                  key={deviceId}
                  onPress={() => selectDevice(deviceId)}
                  style={[
                    styles.deviceItem,
                    selectedDevice === deviceId && styles.deviceItemSelected,
                  ]}
                >
                  <Text style={styles.deviceText}>{deviceId}</Text>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={[styles.roundButton, { alignSelf: 'center', marginTop: 10 }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={{ color: 'white', paddingHorizontal: 20, fontWeight: 'bold' }}>
                  Close
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
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
  },
  mapWrapper: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  buttonContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'column',
    alignItems: 'center',
  },
  roundButton: {
    backgroundColor: '#007AFF',
    borderRadius: 30,
    padding: 12,
    marginBottom: 10,
    elevation: 3,
  },
  modalContainer: {
    position: 'absolute',
    top: 100,
    left: width * 0.1,
    width: width * 0.8,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 999,
  },
  modalContent: {
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  deviceItem: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    width: '100%',
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
  },
  deviceItemSelected: {
    backgroundColor: '#007AFF22',
  },
  deviceText: {
    fontSize: 16,
  },
});
