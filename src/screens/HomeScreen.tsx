// src/screens/HomeScreen.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  Modal,
  Animated,
} from 'react-native';
import MapView, { Marker, Region, Callout, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const API_BASE_URL = 'http://192.168.100.81:8080';
const REGION_UPDATE_DISTANCE = 50; // meters
const LOCATION_UPDATE_INTERVAL = 5000; // 5 seconds

// Types
interface Coordinate {
  latitude: number;
  longitude: number;
}

interface DeviceMarker {
  deviceId: string;
  latitude: number;
  longitude: number;
  timestamp: string;
}

interface Place {
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags: Record<string, string>;
}

// Polyline decode function
function decodePolyline(encoded: string): Coordinate[] {
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

function isValidCoordinate(lat: number, lng: number): boolean {
  return Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
}

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const toRad = (x: number) => (x * Math.PI) / 180;

  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // distance in meters
}

// Helper function to format dateTimeTrack
function formatDateTimeTrack(dateTimeStr: string | null): string {
  if (!dateTimeStr) return '';
  const date = new Date(dateTimeStr);
  if (isNaN(date.getTime())) return dateTimeStr; // fallback if invalid
  // Format: Month Day, Year, HH:MM AM/PM
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export default function MapScreen() {
  const navigation = useNavigation();
  const mapRef = useRef<MapView>(null);

  // Add this ref to keep track of zoom
  const zoomRef = useRef({ latitudeDelta: 0.01, longitudeDelta: 0.01 });

  // State
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const [deviceMarkers, setDeviceMarkers] = useState<DeviceMarker[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [routeCoords, setRouteCoords] = useState<Coordinate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [googlePlaces, setGooglePlaces] = useState<any[]>([]); // <-- Add this line
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogContent, setDialogContent] = useState<{ latitude: number, longitude: number, places: any[], localTime?: string }>({ latitude: 0, longitude: 0, places: [], localTime: '' });
  const [faceManLoading, setFaceManLoading] = useState(false); // Add loading state
  const [legendOpen, setLegendOpen] = useState(true); // <-- Open by default
  const legendAnim = useRef(new Animated.Value(0)).current; // <-- Panel visible at start
  const [localTime, setLocalTime] = useState<string | null>(null); // Add this state

  // Update zoomRef whenever region changes
  useEffect(() => {
    if (region) {
      zoomRef.current = {
        latitudeDelta: region.latitudeDelta,
        longitudeDelta: region.longitudeDelta,
      };
    }
  }, [region]);

  // Fetch API location
  const getLocation = useCallback(async () => {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) {
      setError('Authentication token not found');
      return;
    }

    let retries = 0;
    const maxRetries = 3;

    while (retries < maxRetries) {
      try {
        const response = await fetch(`${API_BASE_URL}/location/getcurrent`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        const latitude = Number(data.latitude);
        const longitude = Number(data.longitude);

        if (!isNaN(latitude) && !isNaN(longitude) && isValidCoordinate(latitude, longitude)) {
          // Use zoomRef for deltas
          const newRegion = {
            latitude,
            longitude,
            latitudeDelta: zoomRef.current.latitudeDelta,
            longitudeDelta: zoomRef.current.longitudeDelta,
          };
          setRegion(newRegion);

          if (location) {
            await fetchRoute(location, { latitude, longitude });
          }
          return;
        } else {
          throw new Error('Invalid coordinates from API');
        }
      } catch (err) {
        retries++;
        if (retries >= maxRetries) {
          setError('Failed to get location after several attempts');
          console.error('Error fetching location:', err);
        }
        await new Promise(res => setTimeout(res, 2000));
      }
    }
  }, [location]);

  // Fetch nearby places
  const fetchNearbyPlaces = async (latitude: number, longitude: number) => {
    if (!isValidCoordinate(latitude, longitude)) return;

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

  
  // Fetch route between two points
  const fetchRoute = async (from: Location.LocationObject, to: Coordinate) => {
    if (!from || !to) return;

    try {
      const { latitude: lat1, longitude: lon1 } = from.coords;
      const { latitude: lat2, longitude: lon2 } = to;

      const url = `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=full&geometries=geojson`;
      const response = await fetch(url);
      
      if (!response.ok) throw new Error('Route request failed');
      
      const data = await response.json();
      
      if (data.routes?.[0]?.geometry?.coordinates) {
        const coords = data.routes[0].geometry.coordinates.map(
          ([lon, lat]: [number, number]) => ({ 
            latitude: lat, 
            longitude: lon 
          })
        );
        setRouteCoords(coords);
      }
    } catch (error) {
      console.error('Route fetch failed:', error);
      setRouteCoords([]);
    }
  };

  // Location subscription & upload
  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;
    let apiInterval: NodeJS.Timeout;

    const initLocation = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Location permission not granted');
          setIsLoading(false);
          return;
        }

        // Get initial device location first
        const initialLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High
        });
        setLocation(initialLocation);
        
        // Then get API location
        await getLocation();

        // Set up interval for API updates
        apiInterval = setInterval(getLocation, LOCATION_UPDATE_INTERVAL);

        // Watch device location
        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: LOCATION_UPDATE_INTERVAL,
            distanceInterval: 10,
          },
          (loc) => {
            setLocation(loc);
            fetchNearbyPlaces(loc.coords.latitude, loc.coords.longitude);
            
            // Update viewport if needed
            // if (!region || getDistance(
            //   region.latitude, 
            //   region.longitude, 
            //   loc.coords.latitude, 
            //   loc.coords.longitude
            // ) > REGION_UPDATE_DISTANCE) {
            //   setRegion(prev => ({
            //     latitude: loc.coords.latitude,
            //     longitude: loc.coords.longitude,
            //     latitudeDelta: prev?.latitudeDelta || 0.01,
            //     longitudeDelta: prev?.longitudeDelta || 0.01,
            //   }));
            // }
          }
        );
      } catch (err) {
        setError('Failed to initialize location services');
        console.error('Location initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initLocation();

    return () => {
      subscription?.remove();
      clearInterval(apiInterval);
    };
  }, []);

  // Set mapReady when region and routeCoords are ready
  useEffect(() => {
    if (region && routeCoords.length > 0) {
      setMapReady(true);
    }
  }, [region, routeCoords]);

  // Recenter map on user locatioN
 const recenter = () => {
  if (region) {
    const zoomedInDelta = 0.005; // smaller than 0.01 for more zoom-in
    const newRegion = {
      ...region,
      latitudeDelta: zoomedInDelta,
      longitudeDelta: zoomedInDelta
    };
    setRegion(newRegion);
    mapRef.current?.animateToRegion(newRegion, 1000);
    setSelectedDevice(null);
  }
};


  // Helper for zoom levels
  const zoomLevels = [
    0.5, 0.25, 0.1, 0.07, 0.05, 0.03, 0.02, 0.015, 0.01, 0.007, 0.005, 0.003, 0.002, 0.001
  ];

  // Zoom In
  const zoomIn = () => {
    if (region) {
      const currentIndex = zoomLevels.findIndex(
        level => Math.abs(level - region.latitudeDelta) < 0.001
      );
      const newIndex = Math.max(0, currentIndex - 1);
      const newRegion = {
        ...region,
        latitudeDelta: zoomLevels[newIndex],
        longitudeDelta: zoomLevels[newIndex] * (width / Dimensions.get('window').height),
      };
      setRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 300);
    }
  };

  // Zoom Out
  const zoomOut = () => {
    if (region) {
      const currentIndex = zoomLevels.findIndex(
        level => Math.abs(level - region.latitudeDelta) < 0.001
      );
      const newIndex = Math.min(zoomLevels.length - 1, currentIndex + 1);
      const newRegion = {
        ...region,
        latitudeDelta: zoomLevels[newIndex],
        longitudeDelta: zoomLevels[newIndex] * (width / Dimensions.get('window').height),
      };
      setRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 300);
    }
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

  // Navigate from current location to selected device
  const navigateToSelectedDevice = async () => {
    if (!location) {
      Alert.alert('Current location not available');
      return;
    }
    if (!selectedDevice) {
      Alert.alert('No device selected');
      return;
    }

    const device = deviceMarkers.find((d) => d.deviceId === selectedDevice);
    if (!device) {
      Alert.alert('Selected device not found');
      return;
    }

    await fetchRoute(location, device);
  };

  // Add this useEffect after your other hooks, inside MapScreen
  useEffect(() => {
    if (location && region) {
      fetchRoute(location, { latitude: region.latitude, longitude: region.longitude });
    }
  }, [location, region]);

  useEffect(() => {
    if (region) {
      fetchNearbyPlaces(region.latitude, region.longitude);
    }
  }, [region]);

  const toggleLegend = () => {
    Animated.timing(legendAnim, {
      toValue: legendOpen ? 160 : 0, // 160 = panel width (hidden), 0 = visible
      duration: 250,
      useNativeDriver: false,
    }).start(() => setLegendOpen(!legendOpen));
  };

  if (isLoading || !mapReady) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading map...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {region ? (
          <View style={styles.mapWrapper}>
            <MapView
              ref={mapRef}
              style={styles.map}
              region={region}
              showsUserLocation
              showsMyLocationButton={false}
              loadingEnabled
            >
              {/* Current device location marker */}
              {location && (
                <Marker
                  key={`user-location-${location.coords.latitude}-${location.coords.longitude}`}
                  coordinate={{
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                  }}
                  pinColor="blue"
                  title="Your Location"
                  
                />
              )}

              {/* API location marker */}
              {region && (
                <Marker
                  key={`api-location-${region.latitude}-${region.longitude}`}
                  coordinate={{
                    latitude: region.latitude,
                    longitude: region.longitude,
                  }}
                  pinColor="red"
                  title="Kinder Location"
                  description="Last known location from Kinder tracker"
                  
                />
              )}

              {/* Route between locations */}
              {routeCoords.length > 0 && (
                <Polyline
                  coordinates={routeCoords}
                  strokeColor="#007AFF"
                  strokeWidth={4}
                />
              )}
              {routeCoords.length > 0 && region && (
                <Polyline
                  coordinates={[
                    { latitude: region.latitude, longitude: region.longitude },
                    routeCoords[routeCoords.length - 1],
                  ]}
                  strokeColor="#FF9800"
                  strokeWidth={3}
                  lineDashPattern={[8, 8]} // Dotted line
                />
              )}

              {/* Device markers */}
              {deviceMarkers.map(({ deviceId, latitude, longitude, timestamp }) => (
                <Marker
                  key={`device-${deviceId}-${timestamp}`}
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

              {/* Google Places green markers */}
              {googlePlaces.map((place: any) => {
                const lat = place.geometry?.location?.lat;
                const lon = place.geometry?.location?.lng;
                if (!lat || !lon) return null;
                return (
                  <Marker
                    key={`google-place-${place.place_id}`}
                    coordinate={{ latitude: lat, longitude: lon }}
                    pinColor="green"
                    title={place.name}
                    description={place.vicinity}
                  />
                );
              })}
            </MapView>

            {/* Menu Button at the top left */}
            <View style={styles.menuButtonContainer}>
              <TouchableOpacity
                style={[styles.roundButton, { backgroundColor: 'white'}]} // transparent background
                onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
              >
                <Ionicons name="menu" size={24} color="blue" />
              </TouchableOpacity>
            </View>

            {/* Kinder Student Button at the top right */}
            {/* REMOVE THIS BLOCK TO REMOVE THE DUPLICATE PERSON BUTTON */}
            {/* 
            <View style={styles.schoolButtonContainer}>
              <TouchableOpacity
                style={[styles.roundButton, {backgroundColor: "#d9534f"}]} // yellow background
                onPress={async () => {
                  if (region) {
                    try {
                      const GOOGLE_API_KEY = 'AIzaSyD-s3l3tAly_hOhSec_sLLGNyKTZ45DoQI';
                      const radius = 500;
                      const types = [
                        'restaurant',
                        'cafe',
                        'school',
                        'park',
                        'shopping_mall',
                      ];
                      let allResults: any[] = [];

                      for (const type of types) {
                        const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${region.latitude},${region.longitude}&radius=${radius}&type=${type}&key=${GOOGLE_API_KEY}`;
                        const response = await fetch(url);
                        const data = await response.json();
                        if (data.results && data.results.length > 0) {
                          allResults = allResults.concat(data.results);
                        }
                      }

                      // Remove duplicates by place_id
                      const uniqueResults: any[] = [];
                      const seen = new Set();
                      for (const place of allResults) {
                        if (!seen.has(place.place_id)) {
                          seen.add(place.place_id);
                          uniqueResults.push(place);
                        }
                      }

                      // Calculate distance in meters for each place
                      const withDistance = uniqueResults.map((place: any) => {
                        const lat = place.geometry?.location?.lat;
                        const lng = place.geometry?.location?.lng;
                        let distance = null;
                        if (lat && lng) {
                          const R = 6371e3;
                          const toRad = (x: number) => (x * Math.PI) / 180;
                          const φ1 = toRad(region.latitude);
                          const φ2 = toRad(lat);
                          const Δφ = toRad(lat - region.latitude);
                          const Δλ = toRad(lng - region.longitude);
                          const a =
                            Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                            Math.cos(φ1) * Math.cos(φ2) *
                            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
                          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                          distance = Math.round(R * c);
                        }
                        return { ...place, distance };
                      });

                      // Filter for valid coordinates first
                      const validPlaces = withDistance.filter(
                        (place: any) => place.geometry?.location?.lat && place.geometry?.location?.lng
                      );
                      // Sort by distance and take only the 5 nearest
                      validPlaces.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
                      const nearestFive = validPlaces.slice(0, 5);

                      // Set only the five nearest places for green markers
                      setGooglePlaces(nearestFive);

                      // Show dialog instead of alert
                      setDialogContent({
                        latitude: region.latitude,
                        longitude: region.longitude,
                        places: nearestFive,
                        localTime: localTime ?? undefined, // Add this line
                      });
                      setDialogVisible(true);

                      mapRef.current?.animateToRegion(region, 1000);
                    } catch (error) {
                      setDialogContent({
                        latitude: region.latitude,
                        longitude: region.longitude,
                        places: [],
                      });
                      setDialogVisible(true);
                    }
                  }
                }}
              >
                <Ionicons name="person" size={24} color="#FFD600" />
              </TouchableOpacity>
            </View>
            */}

            {/* Centered buttons at the bottom */}
            <View style={styles.centerButtonContainer}>
              <View style={{ alignItems: 'center' }}>
                {/* Person Button (Kinder Student) - vertically above Add button */}
                <TouchableOpacity
                  style={[
                    styles.roundButton,
                    styles.centerButton,
                    { backgroundColor: "#008080", marginBottom: 24, padding: 32 }
                  ]}
                  disabled={faceManLoading}
                  onPress={async () => {
                    if (region) {
                      setFaceManLoading(true);
                      setLocalTime(null); // Reset before fetch
                      try {

                         const token = await AsyncStorage.getItem('authToken');
    if (!token) {
      setError('Authentication token not found');
      return;
    }
                        // Fetch local time from your API (localtimedate endpoint)
                        const response = await fetch(`${API_BASE_URL}/location/getcurrent`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });
                        if (response.ok) {
                          const data = await response.json();
                          setLocalTime(data.dateTimeTrack || null); // Use your property here
                        } else {
                          setLocalTime(null);
                        }
                      } catch (error) {
                        setLocalTime(null);
                      }

                      try {
                        const GOOGLE_API_KEY = 'AIzaSyD-s3l3tAly_hOhSec_sLLGNyKTZ45DoQI';
                        const radius = 500;
                        const types = [
                          'restaurant',
                          'cafe',
                          'school',
                          'park',
                          'shopping_mall',
                        ];
                        let allResults: any[] = [];

                        for (const type of types) {
                          const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${region.latitude},${region.longitude}&radius=${radius}&type=${type}&key=${GOOGLE_API_KEY}`;
                          const response = await fetch(url);
                          const data = await response.json();
                          if (data.results && data.results.length > 0) {
                            allResults = allResults.concat(data.results);
                          }
                        }

                        // Remove duplicates by place_id
                        const uniqueResults: any[] = [];
                        const seen = new Set();
                        for (const place of allResults) {
                          if (!seen.has(place.place_id)) {
                            seen.add(place.place_id);
                            uniqueResults.push(place);
                          }
                        }

                        // Calculate distance in meters for each place
                        const withDistance = uniqueResults.map((place: any) => {
                          const lat = place.geometry?.location?.lat;
                          const lng = place.geometry?.location?.lng;
                          let distance = null;
                          if (lat && lng) {
                            const R = 6371e3;
                            const toRad = (x: number) => (x * Math.PI) / 180;
                            const φ1 = toRad(region.latitude);
                            const φ2 = toRad(lat);
                            const Δφ = toRad(lat - region.latitude);
                            const Δλ = toRad(lng - region.longitude);
                            const a =
                              Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                              Math.cos(φ1) * Math.cos(φ2) *
                              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
                            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                            distance = Math.round(R * c);
                          }
                          return { ...place, distance };
                        });

                        // Filter for valid coordinates first
                        const validPlaces = withDistance.filter(
                          (place: any) => place.geometry?.location?.lat && place.geometry?.location?.lng
                        );
                        // Sort by distance and take only the 5 nearest
                        validPlaces.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
                        const nearestFive = validPlaces.slice(0, 5);

                        // Set only the five nearest places for green markers
                        setGooglePlaces(nearestFive);

                        // Show dialog instead of alert
                        setDialogContent({
                          latitude: region.latitude,
                          longitude: region.longitude,
                          places: nearestFive,
                          localTime: localTime ?? undefined, // Add this line
                        });
                        setDialogVisible(true);

                        mapRef.current?.animateToRegion(region, 1000);
                      } catch (error) {
                        setDialogContent({
                          latitude: region.latitude,
                          longitude: region.longitude,
                          places: [],
                        });
                        setDialogVisible(true);
                      } finally {
                        setFaceManLoading(false);
                      }
                    }
                  }}
                >
                  {faceManLoading ? (
                    <ActivityIndicator size={32} color="#FFD600" />
                  ) : (
                    <MaterialCommunityIcons name="face-man" size={40} color="#FFD600" />
                  )}
                </TouchableOpacity>
                {/* Add, Locate, Remove buttons in a row */}
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {/* Recenter Button */}
                  <TouchableOpacity style={[styles.roundButton, styles.centerButton]} onPress={recenter}>
                    <Ionicons name="locate" size={24} color="white" />
                  </TouchableOpacity>
                  {/* Zoom Out Button */}
                  <TouchableOpacity style={[styles.roundButton, styles.centerButton]} onPress={zoomOut}>
                    <Ionicons name="add" size={24} color="white" />
                  </TouchableOpacity>
                  {/* Zoom In Button */}
                  <TouchableOpacity style={[styles.roundButton, styles.centerButton]} onPress={zoomIn}>
                    <Ionicons name="remove" size={24} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Other buttons at the bottom right */}
            <View style={styles.buttonContainerBottom}>
              {/* Navigate to Selected Device */}
              {selectedDevice && (
                <TouchableOpacity style={styles.roundButton} onPress={navigateToSelectedDevice}>
                  <Ionicons name="navigate" size={24} color="white" />
                </TouchableOpacity>
              )}
            </View>

            {/* Slide-out Marker Legend */}
            <Animated.View
  style={[
    styles.legendContainer,
    { transform: [{ translateX: legendAnim }] }
  ]}
>
  <TouchableOpacity onPress={toggleLegend} style={styles.legendToggleButton}>
    <MaterialCommunityIcons
      name={legendOpen ? "chevron-right" : "chevron-left"}
      size={24}
      color="blue" // <-- Set icon color to blue
    />
  </TouchableOpacity>
  {legendOpen && (
    <View>
      <View style={styles.legendItem}>
        <MaterialCommunityIcons name="map-marker" size={22} color="red" style={styles.legendIcon} />
        <Text style={styles.legendText}>Kinder Location</Text>
      </View>
      <View style={styles.legendItem}>
        <MaterialCommunityIcons name="map-marker" size={22} color="green" style={styles.legendIcon} />
        <Text style={styles.legendText}>Kinder Nearby Places</Text>
      </View>
      <View style={styles.legendItem}>
        <MaterialCommunityIcons name="map-marker" size={22} color="blue" style={styles.legendIcon} />
        <Text style={styles.legendText}>Your Current Location</Text>
      </View>
    </View>
  )}
</Animated.View>
          </View>
        ) : (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        )}

        {/* Device selector modal */}
        {modalVisible && (
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Device</Text>
              {deviceMarkers.length === 0 ? (
                <Text>No devices found</Text>
              ) : (
                deviceMarkers.map(({ deviceId }) => (
                  <TouchableOpacity
                    key={`device-select-${deviceId}`}
                    onPress={() => selectDevice(deviceId)}
                    style={[
                      styles.deviceItem,
                      selectedDevice === deviceId && styles.deviceItemSelected,
                    ]}
                  >
                    <Text style={styles.deviceText}>{deviceId}</Text>
                  </TouchableOpacity>
                ))
              )}

              <TouchableOpacity
                style={[styles.roundButton, { alignSelf: 'center', marginTop: 10 }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.buttonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Places dialog */}
        {dialogVisible && (
          <Modal
  visible={dialogVisible}
  transparent
  animationType="fade"
  onRequestClose={() => setDialogVisible(false)}
>
  <View style={styles.dialogOverlay}>
    <View style={styles.dialogBox}>
      <Text style={styles.dialogTitle}>Kinder Location Data</Text>
      {/* Latitude and Longitude on the same line */}
      <View style={[styles.latLngRow, { marginBottom: 8, marginTop: 8 }]}>
        <Text style={styles.importantLabel}>Latitude:</Text>
        <Text style={styles.importantValue}>{dialogContent.latitude}</Text>
        <Text style={[styles.importantLabel, { marginLeft: 16 }]}>Longitude:</Text>
        <Text style={styles.importantValue}>{dialogContent.longitude}</Text>
      </View>
      {localTime && (
        <Text style={styles.importantLabel}>
          Last Time Tracked: <Text style={styles.importantValue}>{formatDateTimeTrack(localTime)}</Text>
        </Text>
      )}
      <Text style={[styles.dialogPlace, { marginTop: 10 }]}>Nearby Places:</Text>
      {dialogContent.places.length > 0 ? (
        dialogContent.places.map((place, idx) => (
          <View key={place.place_id} style={styles.dialogPlaceItem}>
            <Text style={styles.dialogPlaceName}>{idx + 1}. {place.name}</Text>
            <Text style={styles.dialogPlaceVicinity}>{place.vicinity}</Text>
            <Text style={styles.dialogPlaceDistance}>{place.distance ?? '?'} meters</Text>
          </View>
        ))
      ) : (
        <Text style={styles.dialogNoPlaces}>No nearby places found.</Text>
      )}
      <TouchableOpacity
        style={styles.dialogCloseButton}
        onPress={() => setDialogVisible(false)}
      >
        <Text style={styles.dialogCloseButtonText}>Close</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>
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
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: 'red',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
  },
  buttonContainerBottom: {
    position: 'absolute',
    bottom: 30,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  centerButton: {
    marginHorizontal: 8, // Add horizontal spacing between center buttons
    paddingHorizontal: 16, // Extra padding left/right
    paddingVertical: 14,   // Extra padding top/bottom
  },
  menuButtonContainer: {
    position: 'absolute',
    top: 10, // was 30, now moved down
    left: 10,
    flexDirection: 'column',
    alignItems: 'center',
  },
  schoolButtonContainer: {
    position: 'absolute',
    top: 30,
    right: 10,
    flexDirection: 'column',
    alignItems: 'center',
  },
  centerButtonContainer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10, // If using React Native >=0.71, otherwise use marginRight on roundButton
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
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  dialogContainer: {
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
  dialogContent: {
    alignItems: 'center',
  },
  dialogTitle: {
    fontSize: 22,
  fontWeight: '900',
  color: '#008080', // Changed to match face button background color
  alignSelf: 'center',
  marginBottom: 10,
  padding: 6,
  letterSpacing: 0.5, // Optional: slight spacing for emphasis
  },
  dialogPlace: {
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
  },
  dialogPlaceName: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#007AFF',
  },
  dialogPlaceDistance: {
    fontSize: 13,
    color: '#888',
    fontStyle: 'italic',
  },
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  dialogBox: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 22,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 8,
  },
  latLngRow: {
    flexDirection: 'row',
    alignItems: 'baseline', // Ensures text aligns on the baseline
    marginBottom: 4,
  },
  importantLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#d9534f',
    marginTop: 0,
    marginRight: 6, // Add spacing between label and value
  },
  importantValue: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#5856d6',
    marginTop: 0,
    marginRight: 12, // Optional: add a bit more spacing after value
  },
  dialogPlaceItem: {
    marginTop: 6,
    marginBottom: 4,
    padding: 6,
    backgroundColor: '#f7f7f7',
    borderRadius: 8,
    width: '100%',
  },
  dialogPlaceVicinity: {
    fontSize: 13,
    color: '#666',
  },
  dialogNoPlaces: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  dialogCloseButton: {
    alignSelf: 'center',
    marginTop: 18,
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 28,
  },
  dialogCloseButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  legendContainer: {
    position: 'absolute',
    top: 10,
    right: 0, // Anchor to right
    width: 160,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 10,
    padding: 10,
    zIndex: 100,
    elevation: 5,
    minWidth: 140,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  legendToggleButton: {
    position: 'absolute',
    left: -48, // Increase offset for bigger button
    top: 10,
    width: 48, // Increased size
    height: 48, // Increased size
    backgroundColor: 'white', // Green color
    borderTopLeftRadius: 24, // Match new size
    borderBottomLeftRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    zIndex: 101,
  },
  legendToggleText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  legendIcon: {
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    color: '#333',
  },
});