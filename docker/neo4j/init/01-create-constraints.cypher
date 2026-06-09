// ============================================================
// FoodScroll - Neo4j Initialization Script
// Creates constraints for the social graph
// ============================================================

CREATE CONSTRAINT unique_user IF NOT EXISTS
FOR (u:User) REQUIRE u.id IS UNIQUE;

CREATE CONSTRAINT unique_user_id IF NOT EXISTS
FOR (u:User) REQUIRE u.user_id IS UNIQUE;

CREATE CONSTRAINT unique_publication IF NOT EXISTS
FOR (p:Publication) REQUIRE p.id IS UNIQUE;

CREATE CONSTRAINT unique_restaurant IF NOT EXISTS
FOR (r:Restaurant) REQUIRE r.id IS UNIQUE;
