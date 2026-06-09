// ============================================================
// FoodScroll - MongoDB Initialization Script
// Initializes databases for publications & engagement services
// ============================================================

const dbPublications = db.getSiblingDB('publications-service');
dbPublications.createCollection('__init');
dbPublications.dropCollection('__init');

const dbEngagement = db.getSiblingDB('engagement-service');
dbEngagement.createCollection('__init');
dbEngagement.dropCollection('__init');

dbEngagement.createUser({
  user: appUser,
  pwd: appPass,
  roles: [{ role: 'readWrite', db: 'engagement-service' }]
});
