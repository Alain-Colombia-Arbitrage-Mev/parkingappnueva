import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../src/providers/LanguageProvider';
import { LinearGradient } from 'expo-linear-gradient';
import { useJobs, useLocation, useUI, useSettings } from '../../src/store';

// Interfaces para los tipos de ofertas según el nuevo sistema
interface Opportunity {
  id: string;
  title: string;
  businessName: string;
  discount: number;
  coordinates: { lat: number; lng: number };
  distance?: number;
  availableUntil: Date;
  originalPrice: number;
  discountedPrice: number;
  category: 'food' | 'retail' | 'services' | 'entertainment' | 'perishables';
  quantity: number;
  remainingQuantity: number;
}

interface FlashJob {
  id: string;
  title: string;
  fixedPrice: number;
  currency: 'USD' | 'COP';
  coordinates: { lat: number; lng: number };
  distance?: number;
  urgency: 'high' | 'urgent';
  deadline: Date;
  category: string;
  description: string;
}

interface JobOffer {
  id: string;
  title: string;
  budget: { min: number; max: number; currency: 'USD' | 'COP' };
  coordinates: { lat: number; lng: number };
  distance?: number;
  jobType: 'fixed_price' | 'bids_allowed';
  proposalsCount?: number;
  category: string;
  description: string;
  deadline?: Date;
}

export default function HomeScreen() {
  const { jobs, fetchJobs, favorites, addToFavorites, removeFromFavorites } = useJobs();
  const { currentLocation, getCurrentLocation, locationLoading } = useLocation();
  const { ui, setFilters, openBottomSheet } = useUI();
  const { settings } = useSettings();

  // Función temporal para formatear moneda
  const formatCurrency = (amount: number, currency: string) => {
    const locale = currency === 'USD' ? 'en-US' : 'es-CO';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Estados del filtro
  const [activeFilter, setActiveFilter] = useState<'all' | 'urgent' | 'recent'>('all');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);

  // Fetch jobs when component mounts or location changes
  useEffect(() => {
    const loadJobs = async () => {
      try {
        await fetchJobs(ui.activeFilters);
      } catch (error) {
        console.error('Failed to load jobs:', error);
      }
    };

    loadJobs();
  }, [fetchJobs, ui.activeFilters]);

  // Get current location on mount
  useEffect(() => {
    getCurrentLocation();
  }, [getCurrentLocation]);

  // Filtrar trabajos según el filtro activo
  const getFilteredJobs = () => {
    switch (activeFilter) {
      case 'urgent':
        return jobs.filter(job => job.isUrgent);
      case 'recent':
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
        return jobs.filter(job => job.createdAt > oneDayAgo);
      default:
        return jobs;
    }
  };

  const filteredJobs = getFilteredJobs();
  const totalCount = jobs.length;
  const urgentCount = jobs.filter(job => job.isUrgent).length;

  // Handler para clicks en trabajos
  const handleJobClick = (job: any) => {
    setSelectedItem({ type: 'job', data: job });
    setDetailsModalVisible(true);
  };

  // Handler para favoritos
  const handleFavoriteToggle = async (jobId: string) => {
    try {
      if (favorites.includes(jobId)) {
        await removeFromFavorites(jobId);
      } else {
        await addToFavorites(jobId);
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Radar de Trabajos</Text>
          <Text style={styles.subtitle}>
            {totalCount} oportunidades cerca de ti
          </Text>
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="options-outline" size={24} color="#374151" />
        </TouchableOpacity>
      </View>

      {/* Filter Pills */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        <TouchableOpacity
          style={[styles.filterPill, activeFilter === 'all' && styles.filterPillActive]}
          onPress={() => setActiveFilter('all')}
        >
          <Text style={[styles.filterText, activeFilter === 'all' && styles.filterTextActive]}>
            Todos ({totalCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterPill, activeFilter === 'urgent' && styles.filterPillActive]}
          onPress={() => setActiveFilter('urgent')}
        >
          <Text style={[styles.filterText, activeFilter === 'urgent' && styles.filterTextActive]}>
            ⚡ Urgentes ({urgentCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterPill, activeFilter === 'recent' && styles.filterPillActive]}
          onPress={() => setActiveFilter('recent')}
        >
          <Text style={[styles.filterText, activeFilter === 'recent' && styles.filterTextActive]}>
            🕒 Recientes
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Map Placeholder */}
      <View style={styles.mapContainer}>
        <View style={styles.mapPlaceholder}>
          <View style={styles.mapBackground}>
            {/* Simulated map background */}
            <LinearGradient
              colors={['#e0f2fe', '#f0f9ff', '#f8fafc']}
              style={StyleSheet.absoluteFill}
            />
            
            {/* User location dot */}
            <View style={styles.userLocationDot}>
              <View style={styles.userLocationInner} />
              <View style={styles.userLocationPulse} />
            </View>
            
            {/* Job markers */}
            {filteredJobs.slice(0, 6).map((job, index) => (
              <TouchableOpacity
                key={job.id}
                style={[
                  job.isUrgent ? styles.urgentJobMarker : styles.regularJobMarker,
                  {
                    top: `${20 + (index % 3) * 25}%`,
                    left: `${15 + Math.floor(index / 3) * 35}%`
                  }
                ]}
                onPress={() => handleJobClick(job)}
              >
                <Text style={styles.markerText}>
                  {job.isUrgent ? '⚡' : '💼'}
                </Text>
                {favorites.includes(job.id) && (
                  <View style={styles.favoriteIndicator}>
                    <Ionicons name="heart" size={12} color="#ef4444" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
            
            {/* Map info overlay */}
            <View style={styles.mapInfo}>
              <Text style={styles.mapInfoText}>Mapa de Google Maps próximamente</Text>
              <Text style={styles.mapInfoSubtext}>Mostrando ubicaciones simuladas</Text>
            </View>
          </View>
        </View>
        
        {/* Loading overlay */}
        {locationLoading && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingContainer}>
              <Ionicons name="location-outline" size={24} color="#3B82F6" />
              <Text style={styles.loadingText}>Obteniendo ubicación...</Text>
            </View>
          </View>
        )}
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Ionicons name="briefcase-outline" size={16} color="#3B82F6" />
          <Text style={styles.statText}>
            {totalCount} trabajos
          </Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="flash-outline" size={16} color="#EF4444" />
          <Text style={styles.statText}>
            {urgentCount} urgentes
          </Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="heart-outline" size={16} color="#10B981" />
          <Text style={styles.statText}>
            {favorites.length} favoritos
          </Text>
        </View>
      </View>

      {/* Details Modal */}
      <Modal
        visible={detailsModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.fullModalHeader}>
            <Text style={styles.modalTitle}>Detalles</Text>
            <TouchableOpacity 
              onPress={() => setDetailsModalVisible(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>
          
          {selectedItem && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.modalCard}>
                <View style={styles.modalHeader}>
                  <Text style={styles.itemTitle}>{selectedItem.data.title}</Text>
                  <TouchableOpacity
                    onPress={() => handleFavoriteToggle(selectedItem.data.id)}
                    style={styles.favoriteButton}
                  >
                    <Ionicons
                      name={favorites.includes(selectedItem.data.id) ? "heart" : "heart-outline"}
                      size={24}
                      color={favorites.includes(selectedItem.data.id) ? "#ef4444" : "#6b7280"}
                    />
                  </TouchableOpacity>
                </View>

                <Text style={styles.categoryText}>{selectedItem.data.category}</Text>

                <Text style={styles.priceText}>
                  {formatCurrency(selectedItem.data.budget.min, selectedItem.data.budget.currency)}
                  {selectedItem.data.budget.min !== selectedItem.data.budget.max &&
                    ` - ${formatCurrency(selectedItem.data.budget.max, selectedItem.data.budget.currency)}`
                  } {selectedItem.data.budget.currency}
                </Text>

                <Text style={styles.descriptionText}>{selectedItem.data.description}</Text>

                {selectedItem.data.isUrgent && (
                  <View style={styles.urgentBadge}>
                    <Ionicons name="flash" size={14} color="#ef4444" />
                    <Text style={styles.urgentText}>Urgente</Text>
                  </View>
                )}

                {selectedItem.data.distance && (
                  <Text style={styles.distanceText}>
                    📍 {selectedItem.data.distance} km de distancia
                  </Text>
                )}
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  filterButton: {
    padding: 8,
  },
  filterContainer: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
  },
  filterPillActive: {
    backgroundColor: '#3b82f6',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  filterTextActive: {
    color: '#ffffff',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  mapPlaceholder: {
    flex: 1,
    borderRadius: 12,
    margin: 16,
    overflow: 'hidden',
  },
  mapBackground: {
    flex: 1,
    position: 'relative',
  },
  userLocationDot: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateX: -10 }, { translateY: -10 }],
  },
  userLocationInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  userLocationPulse: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#3B82F6',
    opacity: 0.3,
  },
  urgentJobMarker: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  regularJobMarker: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  favoriteIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  favoriteButton: {
    padding: 4,
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  urgentText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ef4444',
    marginLeft: 4,
  },
  distanceText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
  },
  markerText: {
    fontSize: 16,
  },
  mapInfo: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 8,
    borderRadius: 6,
  },
  mapInfoText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  mapInfoSubtext: {
    fontSize: 10,
    color: '#6B7280',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 8,
    padding: 12,
    zIndex: 1000,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    marginLeft: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
    marginLeft: 4,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  fullModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  businessName: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  priceText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  originalPrice: {
    textDecorationLine: 'line-through',
    color: '#9ca3af',
  },
  discountedPrice: {
    color: '#059669',
  },
  descriptionText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
    lineHeight: 20,
  },
  discountBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  discountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#d97706',
  },
});