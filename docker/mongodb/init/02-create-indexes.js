// ============================================================
// FoodScroll - MongoDB Index Creation
// ============================================================

const dbPublications = db.getSiblingDB('publications-service');

// Index for feed queries by restaurant and creation date
dbPublications.getCollection('publications').createIndex(
  { restaurant_id: 1, created_at: -1 },
  { name: 'idx_restaurant_created' }
);

// Index for geospatial queries (if location data is present)
dbPublications.getCollection('publications').createIndex(
  { location: '2dsphere' },
  { name: 'idx_publication_location', sparse: true }
);

const dbEngagement = db.getSiblingDB('engagement-service');

// Index for likes lookup
dbEngagement.getCollection('likes').createIndex(
  { publication_id: 1, user_id: 1 },
  { name: 'idx_likes_publication_user', unique: true }
);

// Index for followers lookup
dbEngagement.getCollection('followers').createIndex(
  { followee_id: 1, follower_id: 1 },
  { name: 'idx_followers_followee_follower', unique: true }
);

// Index for comments by publication
dbEngagement.getCollection('comments').createIndex(
  { publication_id: 1, created_at: -1 },
  { name: 'idx_comments_publication_created' }
);
