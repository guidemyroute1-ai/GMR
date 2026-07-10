import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, TextInput, Dimensions, ImageBackground, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTrips } from '../../hooks/useTrips';
import { useLocation } from '../../contexts/LocationContext';
import ScreenHeader from '../../components/ScreenHeader';
import { TripsFilterModal } from '../../components/TripsFilterModal';


const { width } = Dimensions.get('window');

const CATEGORIES = [
  { id: '1', title: 'This Weekend', icon: 'flash', active: true },
  { id: '2', title: 'Upcoming', icon: 'calendar-outline', active: false },
  { id: '3', title: 'Official', icon: 'ribbon-outline', active: false },
  { id: '4', title: 'Community', icon: 'people-outline', active: false },
  { id: '5', title: 'Nearby', icon: 'location-outline', active: false },
];

const INTERESTS = [
  { id: '1', title: 'Adventure', icon: 'terrain', iconType: 'MaterialIcons', color: '#16a34a' },
  { id: '2', title: 'Treks', icon: 'walk', iconType: 'Ionicons', color: '#3b82f6' },
  { id: '3', title: 'Road Trips', icon: 'car-outline', iconType: 'Ionicons', color: '#f97316' },
  { id: '4', title: 'Camping', icon: 'tent', iconType: 'MaterialCommunityIcons', color: '#22c55e' },
  { id: '5', title: 'Heritage', icon: 'account-balance', iconType: 'MaterialIcons', color: '#a855f7' },
  { id: '6', title: 'Photography', icon: 'camera-outline', iconType: 'Ionicons', color: '#f59e0b' },
  { id: '7', title: 'Food Trails', icon: 'restaurant', iconType: 'MaterialIcons', color: '#ef4444' },
  { id: '8', title: 'More', icon: 'grid-outline', iconType: 'Ionicons', color: '#6b7280' },
];

export default function TripsScreen() {
  const router = useRouter();
  const {
    featuredTrips,
    weekendTrips,
    officialTrips,
    communityTrips,
    nearbyTrips,
    lastMinuteTrips,

    upcomingTrip,
    loading,
    refreshing,
    refresh
  } = useTrips();
  const { selectedCity } = useLocation();
  const [showFilters, setShowFilters] = useState(false);

  const renderFaces = (count: number, size: number = 24, startingIndex: number = 0) => {
    return (
      <View style={[styles.facesRow, { height: size, width: size + (count - 1) * (size / 2) }]}>
        {Array.from({ length: count }).map((_, idx) => (
          <Image 
            key={idx}
            source={{ uri: `https://i.pravatar.cc/100?img=${idx + startingIndex + 15}` }}
            style={[
              styles.faceItem, 
              { 
                width: size, 
                height: size, 
                borderRadius: size / 2, 
                left: idx * (size / 2), 
                zIndex: count - idx 
              }
            ]}
          />
        ))}
      </View>
    );
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      >
        
        {/* Header */}
        <ScreenHeader 
          title="Trips"
           showAvatar={true} 
         
        />

          
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#6b7280" style={styles.searchIcon} />
            <TextInput 
              placeholder="Search trips by destination, vibe, activity..." 
              placeholderTextColor="#9ca3af"
              style={styles.searchInput}
            />
          </View>
          <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilters(true)}>
            <Ionicons name="options-outline" size={18} color="#16a34a" />
            <Text style={styles.filterButtonText}>Filters</Text>
          </TouchableOpacity>
        </View>

        {/* Categories */}
        {/* <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesContainer}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity 
              key={cat.id} 
              style={[styles.categoryPill, cat.active ? styles.categoryPillActive : styles.categoryPillInactive]}
            >
              <Ionicons 
                name={cat.icon as any} 
                size={16} 
                color={cat.active ? '#fff' : '#4b5563'} 
                style={styles.categoryIcon} 
              />
              <Text style={[styles.categoryText, cat.active ? styles.categoryTextActive : styles.categoryTextInactive]}>
                {cat.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView> */}

        {/* Hero Banner: This Weekend */}
        {featuredTrips.length > 0 && (
          <View style={styles.heroContainer}>
            <ImageBackground 
              source={{ uri: featuredTrips[0].images?.[0] || 'https://images.unsplash.com/photo-1533692328991-08159ff19fca?auto=format&fit=crop&w=800&q=80' }} 
              style={styles.heroBanner}
              imageStyle={{ borderRadius: 16 }}
            >
              <View style={styles.heroOverlay}>
                <View style={styles.heroBadge}>
                  <MaterialCommunityIcons name="fire" size={14} color="#eab308" />
                  <Text style={styles.heroBadgeText}>FEATURED</Text>
                </View>
                
                <View style={styles.heroContent}>
                  <Text style={styles.heroTitle}>{featuredTrips[0].title}</Text>
                  <Text style={styles.heroSubtitle}>{featuredTrips[0].subtitle}</Text>
                  
                  <View style={styles.heroGoingContainer}>
                    {renderFaces(Math.min(featuredTrips[0].joined_count, 4), 28, 10)}
                    {featuredTrips[0].joined_count > 4 && (
                      <View style={[styles.heroMoreFaces, { left: 4 * 14 }]}>
                        <Text style={styles.heroMoreFacesText}>+{featuredTrips[0].joined_count - 4}</Text>
                      </View>
                    )}
                    <Text style={[styles.heroGoingText, { marginLeft: featuredTrips[0].joined_count > 4 ? 5 * 14 + 10 : Math.min(featuredTrips[0].joined_count, 4) * 14 + 10 }]}>{featuredTrips[0].joined_count} going</Text>
                  </View>

                  <View style={styles.heroFooter}>
                    <View style={styles.heroPriceWrapper}>
                      <Text style={styles.heroPrice}>₹{featuredTrips[0].price}</Text>
                      <View style={styles.heroDetailsContainer}>
                        <View style={styles.heroDetailsRow}>
                          <Ionicons name="calendar-outline" size={12} color="#d1d5db" />
                          <Text style={styles.heroDetailsText}>{formatDate(featuredTrips[0].trip_date)}</Text>
                        </View>
                        <View style={styles.heroDetailsRow}>
                          <Ionicons name="people-outline" size={14} color="#d1d5db" />
                          <Text style={styles.heroDetailsText}>{Math.max(featuredTrips[0].capacity - featuredTrips[0].joined_count, 0)} seats left</Text>
                        </View>
                      </View>
                    </View>
                    <TouchableOpacity 
                      style={styles.heroJoinButton}
                      onPress={() => router.push(`/tripDetail?id=${featuredTrips[0].id}` as any)}
                    >
                      <Text style={styles.heroJoinButtonText}>Join Trip</Text>
                      <Feather name="arrow-right" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                  
                  {/* Pagination Dots */}
                  {featuredTrips.length > 1 && (
                    <View style={styles.paginationDots}>
                      {featuredTrips.map((_, i) => (
                        <View key={i} style={[styles.dot, i === 0 && styles.dotActive]} />
                      ))}
                    </View>
                  )}
                </View>
              </View>
            </ImageBackground>
          </View>
        )}

        {/* Your Upcoming Trip */}
        {upcomingTrip && (
          <View style={styles.upcomingTripContainer}>
            <Text style={styles.upcomingTripLabel}>Your Upcoming Trip</Text>
            <TouchableOpacity style={styles.upcomingTripCard} onPress={() => router.push(`/tripDetail?id=${upcomingTrip.id}` as any)} activeOpacity={0.95}>
              <Image source={{ uri: upcomingTrip.images?.[0] || 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=200&q=80' }} style={styles.upcomingTripImage} />
              <View style={styles.upcomingTripContent}>
                <View style={styles.upcomingTripHeader}>
                  <Text style={styles.upcomingTripTitle}>{upcomingTrip.title}</Text>
                  <Feather name="chevron-right" size={16} color="#16a34a" />
                </View>
                <View style={styles.upcomingTripDateRow}>
                  <Ionicons name="calendar-outline" size={12} color="#6b7280" />
                  <Text style={styles.upcomingTripDateText}>{formatDate(upcomingTrip.trip_date)}</Text>
                </View>
                <Text style={styles.upcomingTripTimeText}>Trip starts soon</Text>
                
                <View style={styles.upcomingTripFooter}>
                  <View style={styles.upcomingTripFaces}>
                    {renderFaces(Math.min(upcomingTrip.joined_count, 3), 20, 30)}
                    {upcomingTrip.joined_count > 3 && (
                      <View style={[styles.upcomingTripMoreFaces, { left: 3 * 10 }]}>
                        <Text style={styles.upcomingTripMoreFacesText}>+{upcomingTrip.joined_count - 3}</Text>
                      </View>
                    )}
                  </View>
                  <TouchableOpacity 
                    style={styles.openChatButton}
                    onPress={() => router.push(`/trips/chat/${upcomingTrip.id}` as any)}
                  >
                    <Ionicons name="chatbubble-outline" size={14} color="#16a34a" />
                    <Text style={styles.openChatButtonText}>Open Chat</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Happening This Weekend */}
        {weekendTrips.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Happening This Weekend</Text>
            
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalListContent}>
              {weekendTrips.map((item) => (
                <TouchableOpacity key={item.id} style={styles.weekendCard} onPress={() => router.push(`/tripDetail?id=${item.id}` as any)} activeOpacity={0.95}>
                  <ImageBackground source={{ uri: item.images?.[0] || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=300&q=80' }} style={styles.weekendImage} imageStyle={{ borderRadius: 12 }}>
                    <View style={styles.weekendOverlay}>
                      <View style={styles.weekendTopRow}>
                        <View style={[styles.weekendBadge, { backgroundColor: item.date_badge_color || '#22c55e' }]}>
                          <Text style={styles.weekendBadgeText}>{formatDate(item.trip_date)}</Text>
                        </View>
                        <TouchableOpacity>
                          <Ionicons name="heart-outline" size={20} color="#fff" />
                        </TouchableOpacity>
                      </View>
                      <View style={styles.weekendBottomContent}>
                        <Text style={styles.weekendTitle}>{item.title}</Text>
                        <Text style={styles.weekendCategory}>{item.category || item.trip_type}</Text>
                        <View style={styles.weekendFooter}>
                          <View style={styles.weekendFacesRow}>
                            {renderFaces(Math.min(item.joined_count, 3), 16, 20)}
                            <Text style={styles.weekendJoinedText}>{item.joined_count}/{item.capacity}</Text>
                          </View>
                          <Text style={styles.weekendPrice}>₹{item.price}</Text>
                        </View>
                      </View>
                    </View>
                  </ImageBackground>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Explore by Interest */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Explore by Interest</Text>
        
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.interestsContainer}>
            {INTERESTS.map((interest) => (
              <TouchableOpacity key={interest.id} style={styles.interestItem}>
                <View style={[styles.interestIconContainer, { borderColor: `${interest.color}30` }]}>
                  {interest.iconType === 'MaterialIcons' ? (
                    <MaterialIcons name={interest.icon as any} size={24} color={interest.color} />
                  ) : interest.iconType === 'MaterialCommunityIcons' ? (
                    <MaterialCommunityIcons name={interest.icon as any} size={24} color={interest.color} />
                  ) : (
                    <Ionicons name={interest.icon as any} size={24} color={interest.color} />
                  )}
                </View>
                <Text style={styles.interestTitle}>{interest.title}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Official Trips */}
        {officialTrips.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.officialTitleRow}>
                <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
                <Text style={[styles.sectionTitle, { marginLeft: 6 }]}>Official Trips</Text>
              </View>
     
            </View>
            <View style={styles.officialTripContainer}>
              <ImageBackground 
                source={{ uri: officialTrips[0].images?.[0] || 'https://images.unsplash.com/photo-1542382156885-32e73722a84a?auto=format&fit=crop&w=800&q=80' }} 
                style={styles.officialTripImage}
                imageStyle={{ borderRadius: 16 }}
              >
                <View style={styles.officialTripOverlay}>
                  <View style={styles.officialBadge}>
                    <Ionicons name="shield-checkmark" size={12} color="#fff" />
                    <Text style={styles.officialBadgeText}>GMR VERIFIED</Text>
                  </View>
                  <View style={styles.officialTripContent}>
                    <Text style={styles.officialTripTitle}>{officialTrips[0].title}</Text>
                    <Text style={styles.officialTripSubtitle}>{officialTrips[0].subtitle}</Text>
                    <Text style={styles.officialTripIncludes}>{officialTrips[0].includes}</Text>
                    
                    <View style={styles.officialTripFooter}>
                      <View style={styles.officialTripFaces}>
                        {renderFaces(Math.min(officialTrips[0].joined_count, 3), 20, 50)}
                        <View style={styles.ratingBadge}>
                          <Ionicons name="star" size={10} color="#eab308" />
                          <Text style={styles.ratingText}>{officialTrips[0].rating || '5.0'} ({officialTrips[0].review_count || 0})</Text>
                        </View>
                      </View>
                      <View style={styles.officialTripPriceAction}>
                        <Text style={styles.officialTripPrice}>₹{officialTrips[0].price}</Text>
                        <TouchableOpacity style={styles.viewDetailsButton}>
                          <Text style={styles.viewDetailsText}>View Details</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              </ImageBackground>
            </View>
          </View>
        )}

        {/* Community Trips */}
        {communityTrips.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Community Trips</Text>
                <Text style={styles.sectionSubtitle}>Hosted by travelers like you</Text>
              </View>
         
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalListContent}>
              {communityTrips.map((trip) => (
                <TouchableOpacity key={trip.id} style={styles.communityTripCard} onPress={() => router.push(`/tripDetail?id=${trip.id}` as any)} activeOpacity={0.95}>
                  <View style={styles.hostHeader}>
                    <Image source={{ uri: trip.organizer?.photo_url || 'https://i.pravatar.cc/100' }} style={styles.hostImage} />
                    <View style={styles.hostInfo}>
                      <Text style={styles.hostName}>{trip.organizer?.name || 'Organizer'}</Text>
                      <View style={styles.hostRatingRow}>
                        <Ionicons name="star" size={10} color="#eab308" />
                        <Text style={styles.hostRatingText}>{trip.organizer?.rating || '5.0'}</Text>
                      </View>
                    </View>
                    <TouchableOpacity style={styles.hostHeartIcon}>
                      <Ionicons name="heart-outline" size={18} color="#6b7280" />
                    </TouchableOpacity>
                  </View>
                  <Image source={{ uri: trip.images?.[0] || 'https://images.unsplash.com/photo-1543329978-01314352e8ea?auto=format&fit=crop&w=300&q=80' }} style={styles.communityTripImage} />
                  <View style={styles.communityTripDetails}>
                    <Text style={styles.communityTripTitle} numberOfLines={1}>{trip.title}</Text>
                    <Text style={styles.communityTripSubtitle} numberOfLines={1}>{trip.subtitle}</Text>
                    <View style={styles.communityTripFooter}>
                      <View style={styles.communityTripFaces}>
                        {renderFaces(Math.min(trip.joined_count, 3), 16, 5)}
                        <Text style={styles.communityTripGoingText}>{trip.joined_count} going</Text>
                      </View>
                      <Text style={styles.communityTripPrice}>₹{trip.price}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Bottom Small Cards Section (Near You & Last Minute) */}
        <View style={[styles.bottomDualSection, { marginBottom: 30 }]}>
          
          <View style={styles.halfSection}>
            <View style={[styles.sectionHeader, { marginBottom: 8 }]}>
              <Text style={[styles.sectionTitle, { fontSize: 16 }]}>Near You</Text>
          
            </View>
                {nearbyTrips.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalListContent}>
                {nearbyTrips.map((item) => (
                  <TouchableOpacity key={item.id} style={styles.smallCard} onPress={() => router.push(`/tripDetail?id=${item.id}` as any)} activeOpacity={0.95}>
                    <ImageBackground source={{ uri: item.images?.[0] || 'https://images.unsplash.com/photo-1511994298241-608e28f14fde?auto=format&fit=crop&w=300&q=80' }} style={styles.smallCardImage} imageStyle={{ borderRadius: 8 }}>
                      <View style={styles.smallCardOverlay}>
                        <View style={[styles.smallCardIconBadge, { backgroundColor: '#22c55e' }]}>
                          <Ionicons name="location-outline" size={12} color="#fff" />
                        </View>
                        <View style={styles.smallCardBottomText}>
                          <Text style={styles.smallCardTitle} numberOfLines={1}>{item.title}</Text>
                          <Text style={styles.smallCardSubtitle}>{formatDate(item.trip_date)}</Text>
                          <Text style={styles.smallCardSubtitle}>{item.city || 'Near you'}</Text>
                        </View>
                      </View>
                    </ImageBackground>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={{ padding: 16, alignItems: 'center' }}>
                <Text style={{ color: '#6b7280', fontSize: 12 }}>No nearby trips found.</Text>
              </View>
            )}
          </View>

          <View style={styles.halfSection}>
            <View style={[styles.sectionHeader, { marginBottom: 8 }]}>
              <Text style={[styles.sectionTitle, { fontSize: 16 }]}>Last Minute Escapes</Text>
         
            </View>
                {lastMinuteTrips.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalListContent}>
                {lastMinuteTrips.map((item) => (
                  <TouchableOpacity key={item.id} style={styles.smallCardLarge} onPress={() => router.push(`/tripDetail?id=${item.id}` as any)} activeOpacity={0.95}>
                    <ImageBackground source={{ uri: item.images?.[0] || 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=300&q=80' }} style={styles.smallCardImage} imageStyle={{ borderRadius: 8 }}>
                      <View style={styles.smallCardOverlay}>
                        <View style={styles.leavingTodayBadge}>
                          <Text style={styles.leavingTodayText}>Leaving Soon</Text>
                        </View>
                        <View style={styles.smallCardBottomText}>
                          <Text style={styles.smallCardTitle} numberOfLines={1}>{item.title}</Text>
                          <Text style={styles.smallCardSubtitle}>{Math.max(item.capacity - item.joined_count, 0)} Seats Left</Text>
                          <View style={styles.lastMinutePriceRow}>
                            <Text style={styles.lastMinutePrice}>₹{item.price}</Text>
                            {item.original_price && <Text style={styles.lastMinuteOldPrice}>₹{item.original_price}</Text>}
                          </View>
                        </View>
                      </View>
                    </ImageBackground>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={{ padding: 16, alignItems: 'center' }}>
                <Text style={{ color: '#6b7280', fontSize: 12 }}>No last minute trips.</Text>
              </View>
            )}
          </View>
        </View>

        {/* Empty Space at bottom */}
        <View style={{ height: 40 }} />
      </ScrollView>

      <TripsFilterModal 
        visible={showFilters} 
        onClose={() => setShowFilters(false)} 
        onApply={(filters) => {
          // Here you can handle the applied filters
          console.log('Applied filters:', filters);
        }} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bellIconContainer: {
    marginRight: 16,
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  locationText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    marginHorizontal: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 24,
    paddingHorizontal: 16,
    height: 48,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
  },
  filterButtonText: {
    color: '#16a34a',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 6,
  },
  categoriesContainer: {
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
    borderWidth: 1,
  },
  categoryPillActive: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  categoryPillInactive: {
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
  },
  categoryIcon: {
    marginRight: 6,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
  },
  categoryTextActive: {
    color: '#ffffff',
  },
  categoryTextInactive: {
    color: '#374151',
  },
  heroContainer: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  heroBanner: {
    width: '100%',
    height: 220,
    borderRadius: 16,
  },
  heroOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 16,
    padding: 16,
    justifyContent: 'space-between',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  heroBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  heroContent: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  heroTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 2,
  },
  heroSubtitle: {
    color: '#e5e7eb',
    fontSize: 13,
    marginBottom: 12,
  },
  heroGoingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
    height: 28,
  },
  heroMoreFaces: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  heroMoreFacesText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  heroGoingText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  heroFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  heroPriceWrapper: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  heroPrice: {
    color: '#22c55e',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  heroDetailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  heroDetailsText: {
    color: '#d1d5db',
    fontSize: 11,
    marginLeft: 4,
  },
  heroJoinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16a34a',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  heroJoinButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 6,
  },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
    marginHorizontal: 3,
  },
  dotActive: {
    width: 16,
    backgroundColor: '#fff',
  },
  upcomingTripContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  upcomingTripLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16a34a',
    marginBottom: 8,
  },
  upcomingTripCard: {
    flexDirection: 'row',
    backgroundColor: '#f0fdf4',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#dcfce7',
  },
  upcomingTripImage: {
    width: 70,
    height: 70,
    borderRadius: 10,
    marginRight: 12,
  },
  upcomingTripContent: {
    flex: 1,
    justifyContent: 'center',
  },
  upcomingTripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  upcomingTripTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  upcomingTripDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  upcomingTripDateText: {
    fontSize: 12,
    color: '#4b5563',
    marginLeft: 4,
  },
  upcomingTripTimeText: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  upcomingTripFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  upcomingTripFaces: {
    flexDirection: 'row',
    position: 'relative',
    height: 20,
    width: 60,
  },
  upcomingTripMoreFaces: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fff',
  },
  upcomingTripMoreFacesText: {
    color: '#16a34a',
    fontSize: 8,
    fontWeight: '700',
  },
  openChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#16a34a',
    backgroundColor: '#fff',
  },
  openChatButtonText: {
    color: '#16a34a',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    color: '#16a34a',
    fontSize: 13,
    fontWeight: '600',
    marginRight: 2,
  },
  horizontalListContent: {
    paddingHorizontal: 12,
  },
  weekendCard: {
    width: 160,
    height: 180,
    marginHorizontal: 6,
  },
  weekendImage: {
    width: '100%',
    height: '100%',
  },
  weekendOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    padding: 10,
    justifyContent: 'space-between',
  },
  weekendTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  weekendBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  weekendBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  weekendBottomContent: {
    justifyContent: 'flex-end',
  },
  weekendTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  weekendCategory: {
    color: '#e5e7eb',
    fontSize: 11,
    marginBottom: 8,
  },
  weekendFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weekendFacesRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weekendJoinedText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 6,
  },
  weekendPrice: {
    color: '#4ade80',
    fontSize: 14,
    fontWeight: '700',
  },
  facesRow: {
    flexDirection: 'row',
    position: 'relative',
  },
  faceItem: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  interestsContainer: {
    paddingHorizontal: 12,
  },
  interestItem: {
    alignItems: 'center',
    marginHorizontal: 10,
    width: 64,
  },
  interestIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: '#f9fafb',
  },
  interestTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
  },
  officialTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  officialTripContainer: {
    paddingHorizontal: 16,
  },
  officialTripImage: {
    width: '100%',
    height: 180,
  },
  officialTripOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 16,
    padding: 16,
    justifyContent: 'space-between',
  },
  officialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  officialBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 4,
  },
  officialTripContent: {
    justifyContent: 'flex-end',
  },
  officialTripTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  officialTripSubtitle: {
    color: '#f3f4f6',
    fontSize: 12,
    marginBottom: 2,
  },
  officialTripIncludes: {
    color: '#e5e7eb',
    fontSize: 11,
    marginBottom: 10,
  },
  officialTripFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  officialTripFaces: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 32,
  },
  ratingText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 2,
  },
  officialTripPriceAction: {
    alignItems: 'flex-end',
  },
  officialTripPrice: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  viewDetailsButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
  },
  viewDetailsText: {
    color: '#111827',
    fontSize: 12,
    fontWeight: '600',
  },
  communityTripCard: {
    width: 240,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    padding: 12,
  },
  hostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  hostImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  hostInfo: {
    flex: 1,
  },
  hostName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  hostRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hostRatingText: {
    fontSize: 11,
    color: '#4b5563',
    fontWeight: '600',
    marginLeft: 2,
  },
  hostTripsText: {
    color: '#9ca3af',
    fontWeight: '400',
  },
  hostHeartIcon: {
    padding: 4,
  },
  communityTripImage: {
    width: '100%',
    height: 100,
    borderRadius: 10,
    marginBottom: 10,
  },
  communityTripDetails: {},
  communityTripTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  communityTripSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 10,
  },
  communityTripFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  communityTripFaces: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  communityTripGoingText: {
    fontSize: 11,
    color: '#4b5563',
    marginLeft: 32,
  },
  communityTripPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#16a34a',
  },
  bottomDualSection: {
    paddingHorizontal: 16,
    flexDirection: 'column',
    gap: 20,
  },
  halfSection: {},
  smallCard: {
    width: 140,
    height: 90,
    marginRight: 10,
  },
  smallCardLarge: {
    width: 180,
    height: 90,
    marginRight: 10,
  },
  smallCardImage: {
    width: '100%',
    height: '100%',
  },
  smallCardOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 8,
    padding: 8,
    justifyContent: 'space-between',
  },
  smallCardIconBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  smallCardBottomText: {
    justifyContent: 'flex-end',
  },
  smallCardTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  smallCardSubtitle: {
    color: '#e5e7eb',
    fontSize: 10,
  },
  leavingTodayBadge: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  leavingTodayText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  lastMinutePriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  lastMinutePrice: {
    color: '#4ade80',
    fontSize: 12,
    fontWeight: '700',
    marginRight: 4,
  },
  lastMinuteOldPrice: {
    color: '#d1d5db',
    fontSize: 10,
    textDecorationLine: 'line-through',
  },
});

