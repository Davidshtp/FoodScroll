#!/bin/bash
# ============================================================
# FoodScroll - MySQL Initialization
# Creates all 5 databases required by the microservices
# ============================================================

set -e

mysql -u root -p"${MYSQL_ROOT_PASSWORD}" <<-EOSQL
    CREATE DATABASE IF NOT EXISTS \`identity-service\`
        CHARACTER SET utf8mb4
        COLLATE utf8mb4_unicode_ci;

    CREATE DATABASE IF NOT EXISTS \`customer-service\`
        CHARACTER SET utf8mb4
        COLLATE utf8mb4_unicode_ci;

    CREATE DATABASE IF NOT EXISTS \`location-service\`
        CHARACTER SET utf8mb4
        COLLATE utf8mb4_unicode_ci;

    CREATE DATABASE IF NOT EXISTS \`delivery-service\`
        CHARACTER SET utf8mb4
        COLLATE utf8mb4_unicode_ci;

    CREATE DATABASE IF NOT EXISTS \`orders-service\`
        CHARACTER SET utf8mb4
        COLLATE utf8mb4_unicode_ci;

    GRANT ALL PRIVILEGES ON \`identity-service\`.* TO '${MYSQL_USER}'@'%';
    GRANT ALL PRIVILEGES ON \`customer-service\`.* TO '${MYSQL_USER}'@'%';
    GRANT ALL PRIVILEGES ON \`location-service\`.* TO '${MYSQL_USER}'@'%';
    GRANT ALL PRIVILEGES ON \`delivery-service\`.* TO '${MYSQL_USER}'@'%';
    GRANT ALL PRIVILEGES ON \`orders-service\`.* TO '${MYSQL_USER}'@'%';

    FLUSH PRIVILEGES;
EOSQL
