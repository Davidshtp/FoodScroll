FROM postgis/postgis:16-3.5

RUN apt-get update && apt-get install -y --no-install-recommends \
    postgresql-16-postgis-3 \
    postgresql-16-postgis-3-scripts \
    && rm -rf /var/lib/apt/lists/*

EXPOSE 5432

CMD ["postgres"]
