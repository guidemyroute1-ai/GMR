import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, TextInput, Dimensions, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import ScreenHeader from '../../components/ScreenHeader';

import { getCommunities, getStories, getDiscussions, getPeopleYouMayKnow } from '../../services/communityService';
import { Community, CommunityStory, CommunityDiscussion, Profile } from '../../types/community';
import { useTrips } from '../../hooks/useTrips';

const { width } = Dimensions.get('window');

export default function CommunityScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [communities, setCommunities] = useState<Community[]>([]);
  const [stories, setStories] = useState<CommunityStory[]>([]);
  const [discussions, setDiscussions] = useState<CommunityDiscussion[]>([]);
  const [people, setPeople] = useState<Profile[]>([]);
  
  const { communityTrips } = useTrips();

  const loadData = async () => {
    try {
      const [communitiesData, storiesData, discussionsData, peopleData] = await Promise.all([
        getCommunities(),
        getStories(),
        getDiscussions(),
        getPeopleYouMayKnow(),
      ]);

      setCommunities(communitiesData);
      setStories(storiesData);
      setDiscussions(discussionsData);
      setPeople(peopleData);
    } catch (error) {
      console.error('Error loading community data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#16a34a" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#16a34a" />}
      >
        
        {/* Header */}
        <ScreenHeader 
          title="Community"
          subtitle="Meet people. Share stories. Travel together."
          showAvatar={true}
        />


        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#6b7280" style={styles.searchIcon} />
            <TextInput 
              placeholder="Search communities, people, or topics..." 
              placeholderTextColor="#9ca3af"
              style={styles.searchInput}
            />
          </View>

        </View>

      

        {/* Featured Communities */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Communities</Text>
            {/* <TouchableOpacity style={styles.seeAllButton}>
              <Text style={styles.seeAllText}>See all</Text>
              <Feather name="arrow-right" size={14} color="#16a34a" />
            </TouchableOpacity> */}
          </View>
          {communities.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalListContent}>
              {communities.map((community) => (
                <TouchableOpacity 
                  key={community.id} 
                  style={styles.communityCard}
                  onPress={() => router.push(`/community/${community.id}` as any)}
                >
                  <Image source={{ uri: community.image_url || 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=400&q=80' }} style={styles.communityCardImage} />
                  <View style={[styles.communityIconBadge, { backgroundColor: community.icon_color }]}>
                    <Ionicons name={community.icon_name as any} size={14} color="#fff" />
                  </View>
                  <View style={styles.communityCardContent}>
                    <Text style={styles.communityCardTitle}>{community.name}</Text>

                    <Text style={styles.communityCardTags}>{community.tags}</Text>
                    <View style={styles.communityCardFooter}>
                      <View style={styles.memberFaces}>
                        {[1, 2, 3].map((_, idx) => (
                          <Image 
                            key={idx}
                            source={{ uri: `https://i.pravatar.cc/100?img=${idx + community.name.charCodeAt(0)}` }}
                            style={[styles.memberFaceItem, { left: idx * 12, zIndex: 3 - idx }]}
                          />
                        ))}
                        <View style={[styles.memberFaceMore, { left: 3 * 12 }]}>
                          <Text style={styles.memberFaceMoreText}>+{community.member_count > 3 ? community.member_count - 3 : 0}</Text>
                        </View>
                      </View>
                      <View style={styles.joinButton}>
                        <Text style={styles.joinButtonText}>Join</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.emptyText}>No communities found.</Text>
          )}
        </View>

        {/* Popular Discussions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Popular Discussions</Text>
            {/* <TouchableOpacity style={styles.seeAllButton}>
              <Text style={styles.seeAllText}>See all</Text>
              <Feather name="arrow-right" size={14} color="#16a34a" />
            </TouchableOpacity> */}
          </View>
          <View style={styles.discussionsContainer}>
            {discussions.length > 0 ? discussions.map((discussion, index) => (
              <TouchableOpacity 
                key={discussion.id} 
                style={[styles.discussionItem, index !== discussions.length - 1 && styles.discussionItemBorder]}
                onPress={() => router.push(`/community/${discussion.community_id}` as any)}
              >
                <Image source={{ uri: discussion.image_url || discussion.community?.image_url || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=100&q=80' }} style={styles.discussionImage} />
                <View style={styles.discussionContent}>
                  <Text style={styles.discussionTitle} numberOfLines={2}>{discussion.title}</Text>
                  <View style={styles.discussionMeta}>
                    <Ionicons name="location" size={12} color="#16a34a" />
                    <Text style={styles.discussionCommunity}>{discussion.community?.name || 'Community'}</Text>
                    <Text style={styles.discussionMetaDot}>•</Text>
                    <Text style={styles.discussionMetaText}>{discussion.replies_count} replies</Text>
                    <Text style={styles.discussionMetaDot}>•</Text>
                    <Text style={styles.discussionMetaText}>{new Date(discussion.created_at).toLocaleDateString()}</Text>
                  </View>
                </View>
                <View style={styles.discussionRight}>
                  <View style={styles.discussionFaces}>
                    {[1, 2, 3].map((_, idx) => (
                      <Image 
                        key={idx}
                        source={{ uri: `https://i.pravatar.cc/100?img=${idx + 10 + index}` }}
                        style={[styles.discussionFaceItem, { left: idx * 14, zIndex: 3 - idx }]}
                      />
                    ))}
                  </View>
                  <View style={styles.repliesBadge}>
                    <Text style={styles.repliesBadgeText}>{discussion.replies_count}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )) : (
              <Text style={styles.emptyText}>No discussions found.</Text>
            )}
          </View>
        </View>

        {/* People You May Know */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Verified Organizers</Text>
            {/* <TouchableOpacity style={styles.seeAllButton}>
              <Text style={styles.seeAllText}>See all</Text>
              <Feather name="arrow-right" size={14} color="#16a34a" />
            </TouchableOpacity> */}
          </View>
          {(() => {
            const verifiedOrganizers = people.filter((p) => p.is_trip_organizer_verified === true);
            return verifiedOrganizers.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalListContent}>
                {verifiedOrganizers.map((person) => (
                  <View key={person.id} style={styles.personCard}>
                    <Image source={{ uri: person.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80' }} style={styles.personImage} />
                    <View style={styles.personContent}>
                      <Text style={styles.personName}>{person.name || 'User'}</Text>
                      <Text style={styles.personLocation}>{person.location || 'Unknown Location'}</Text>
                      <View style={styles.personTagContainer}>
                        <Ionicons name={(person.tag_icon as any) || 'person'} size={10} color="#16a34a" />
                        <Text style={styles.personTagText}>{person.tag || 'Explorer'}</Text>
                      </View>
                      <Text style={styles.personStats}>{person.trips_count} Trips • {person.rating} <Ionicons name="star" size={10} color="#eab308" /></Text>
                      <TouchableOpacity 
                        style={styles.connectButton}
                        onPress={() => router.push(`/organizer/${person.id}` as any)}
                      >
                        <Text style={styles.connectButtonText}>Connect</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <Text style={[styles.emptyText, { paddingHorizontal: 16 }]}>No verified organizers found.</Text>
            );
          })()}
        </View>

        {/* Upcoming Community Trips */}
        <View style={[styles.section, { marginBottom: 30 }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Community Trips</Text>
            <TouchableOpacity style={styles.seeAllButton}>
              <Text style={styles.seeAllText}>See all</Text>
              <Feather name="arrow-right" size={14} color="#16a34a" />
            </TouchableOpacity>
          </View>
          {communityTrips && communityTrips.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalListContent}>
              {communityTrips.map((trip) => {
                const dateObj = new Date(trip.trip_date);
                const month = dateObj.toLocaleString('default', { month: 'short' }).toUpperCase();
                const day = dateObj.getDate();
                const fullDate = dateObj.toLocaleString('default', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
                
                return (
                  <TouchableOpacity 
                    key={trip.id} 
                    style={styles.eventCard}
                    onPress={() => router.push(`/tripDetail?id=${trip.id}` as any)}
                    activeOpacity={0.9}
                  >
                    <View style={styles.eventImageContainer}>
                      <Image source={{ uri: (trip.images && trip.images[0]) || 'https://images.unsplash.com/photo-1511994298241-608e28f14fde?auto=format&fit=crop&w=400&q=80' }} style={styles.eventImage} />
                      <View style={styles.eventDateBadge}>
                        <Text style={styles.eventDateMonth}>{month}</Text>
                        <Text style={styles.eventDateDay}>{day}</Text>
                      </View>
                    </View>
                    <View style={styles.eventContent}>
                      <Text style={styles.eventTitle} numberOfLines={1}>{trip.title}</Text>
                      <Text style={styles.eventCommunity}>{trip.organizer?.name || 'Community Trip'}</Text>
                      <View style={styles.eventDetailRow}>
                        <Feather name="clock" size={12} color="#6b7280" />
                        <Text style={styles.eventDetailText}>{fullDate}</Text>
                      </View>
                      <View style={styles.eventDetailRow}>
                        <Ionicons name="location-outline" size={14} color="#6b7280" style={{marginLeft: -1}} />
                        <Text style={styles.eventDetailText}>{trip.location_text || trip.city || 'TBA'}</Text>
                      </View>
                      <View style={styles.eventFooter}>
                        <Text style={styles.eventGoingText}>{trip.joined_count || 0} Going</Text>
                        <View style={styles.interestedButton}>
                          <Ionicons name="star-outline" size={14} color="#16a34a" />
                          <Text style={styles.interestedButtonText}>View</Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : (
            <Text style={[styles.emptyText, { paddingHorizontal: 16 }]}>No upcoming trips found.</Text>
          )}
        </View>

      </ScrollView>
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
  emptyText: {
    color: '#9ca3af',
    fontSize: 14,
    fontStyle: 'italic',
    paddingHorizontal: 16,
    paddingVertical: 10,
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
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6b7280',
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
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 40,
    marginRight: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  createButtonText: {
    color: '#16a34a',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 4,
  },
  storiesContainer: {
    paddingHorizontal: 12,
    marginBottom: 24,
  },
  storyItem: {
    alignItems: 'center',
    marginHorizontal: 8,
    width: 68,
  },
  storyAvatarRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    position: 'relative',
  },
  addStoryContainer: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyAvatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },
  liveBadge: {
    position: 'absolute',
    bottom: -6,
    backgroundColor: '#ef4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  liveBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  storyTitle: {
    fontSize: 11,
    color: '#374151',
    fontWeight: '500',
    lineHeight: 14,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
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
  communityCard: {
    width: 220,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
  },
  communityCardImage: {
    width: '100%',
    height: 100,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  communityIconBadge: {
    position: 'absolute',
    top: 86,
    left: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    zIndex: 10,
  },
  communityCardContent: {
    padding: 12,
    paddingTop: 16,
  },
  communityCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  communityCardMembers: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  communityCardTags: {
    fontSize: 11,
    color: '#9ca3af',
    marginBottom: 12,
  },
  communityCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberFaces: {
    flexDirection: 'row',
    position: 'relative',
    height: 24,
    width: 80,
  },
  memberFaceItem: {
    width: 24,
    height: 24,
    borderRadius: 12,
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  memberFaceMore: {
    width: 24,
    height: 24,
    borderRadius: 12,
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: '#fff',
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberFaceMoreText: {
    fontSize: 8,
    color: '#4b5563',
    fontWeight: '600',
  },
  joinButton: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  discussionsContainer: {
    paddingHorizontal: 16,
  },
  discussionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  discussionItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  discussionImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  discussionContent: {
    flex: 1,
  },
  discussionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
    lineHeight: 20,
  },
  discussionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  discussionCommunity: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 2,
  },
  discussionMetaDot: {
    fontSize: 12,
    color: '#d1d5db',
    marginHorizontal: 4,
  },
  discussionMetaText: {
    fontSize: 12,
    color: '#6b7280',
  },
  discussionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  discussionFaces: {
    flexDirection: 'row',
    position: 'relative',
    height: 24,
    width: 46,
  },
  discussionFaceItem: {
    width: 24,
    height: 24,
    borderRadius: 12,
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  repliesBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  repliesBadgeText: {
    color: '#16a34a',
    fontSize: 12,
    fontWeight: '600',
  },
  personCard: {
    width: 150,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  personImage: {
    width: '100%',
    height: 140,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  personContent: {
    padding: 10,
  },
  personName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  personLocation: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
    marginBottom: 6,
  },
  personTagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 6,
  },
  personTagText: {
    fontSize: 10,
    color: '#16a34a',
    marginLeft: 4,
  },
  personStats: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 10,
  },
  connectButton: {
    backgroundColor: '#16a34a',
    paddingVertical: 6,
    borderRadius: 16,
    alignItems: 'center',
  },
  connectButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  eventCard: {
    width: 240,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  eventImageContainer: {
    position: 'relative',
  },
  eventImage: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  eventDateBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#fff',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  eventDateMonth: {
    fontSize: 9,
    fontWeight: '600',
    color: '#16a34a',
  },
  eventDateDay: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  eventContent: {
    padding: 12,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  eventCommunity: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
    marginTop: 2,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  eventDetailText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 6,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  eventGoingText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  interestedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dcfce7',
    backgroundColor: '#f0fdf4',
  },
  interestedButtonText: {
    color: '#16a34a',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
});
