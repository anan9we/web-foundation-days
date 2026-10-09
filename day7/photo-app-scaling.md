# SnapShare: Photo App Scaling

## 1. Assumptions and Daily Active Users

SnapShare has 10 million registered users, and 10% of them use the application each day.

**Assumptions:**
- The system operates continuously for 86,400 seconds per day.
- Every daily active user uploads one original photo per day.
- Every daily active user views 50 feed pages per day.
- Each original photo is 2 MB, and each thumbnail is 50 KB.
- Peak traffic is five times the average traffic.
- Storage calculations use decimal units and exclude replicas, backups, metadata, and other overhead.

**Daily active users (DAU):**

10,000,000 × 10% = **1,000,000 daily active users**

## 2. Upload and Feed Traffic

### Daily uploads

1,000,000 active users × 1 photo = **1,000,000 uploads per day**

Average uploads per second:

1,000,000 ÷ 86,400 ≈ **11.6 uploads/second**

Peak uploads per second:

11.6 × 5 ≈ **57.9 uploads/second**

### Daily feed views

1,000,000 active users × 50 feed pages = **50,000,000 feed views per day**

Average feed views per second:

50,000,000 ÷ 86,400 ≈ **579 feed views/second**

Peak feed views per second:

579 × 5 ≈ **2,894 feed views/second**

| Metric | Daily total | Average per second | Peak per second |
|---|---:|---:|---:|
| Photo uploads | 1,000,000 | 11.6 | 57.9 |
| Feed views | 50,000,000 | 579 | 2,894 |

These are estimated request rates. A feed page may contain multiple photos, so the number of individual image requests can be higher than the number of feed views.

## 3. Annual Photo Storage

### Original photos

1,000,000 photos/day × 365 days = 365,000,000 photos/year

365,000,000 × 2 MB = 730,000,000 MB

Using decimal units:

730,000,000 MB ÷ 1,000,000 = **730 TB per year**

### Thumbnails

Each original photo also produces one 50 KB thumbnail.

365,000,000 × 50 KB = 18,250,000,000 KB

Using decimal units:

18,250,000,000 KB ÷ 1,000,000,000 = **18.25 TB per year**

### Combined storage

730 TB + 18.25 TB = **748.25 TB per year**

This estimate assumes every uploaded photo is retained for a full year and every photo has one thumbnail. Actual storage requirements will be higher when replicas, backups, metadata, and operational overhead are included.

## 4. Read-Heavy or Write-Heavy?

SnapShare is a **read-heavy system** because each active user views 50 feed pages daily but uploads only one photo.

The system must serve approximately 579 feed views per second on average, compared with 11.6 photo uploads per second. Peak rates are approximately 2,894 feed views and 57.9 uploads per second.

This means the architecture should prioritize fast feed delivery using a CDN, caching, and database read replicas. Uploads should also be reliable, but thumbnail generation and other expensive processing should happen asynchronously so they do not slow down the upload request.

## 5. Why Use Object Storage for Photos?

Photo binaries should be stored in object storage rather than directly in the relational database because object storage is designed for large files, high durability, and cost-effective scaling.

The database should store photo metadata, such as the photo ID, owner ID, caption, upload timestamp, and object-storage key. The application can use that key to locate the original photo and its thumbnail.

Separating metadata from image files keeps database operations smaller and makes it easier to scale image delivery independently.

## 6. Proposed Architecture

```text
                         USERS
                           |
             +-------------+-------------+
             |                           |
             v                           v
       +-----------+                +---------+
       |   CDN     |                |   CDN   |
       | Feed/image|                |  Cache  |
       | delivery  |                |  cache  |
       +-----------+                +---------+
             |                           |
             | Cache miss / API request  |
             v
       +----------------+
       | Load Balancer  |
       +----------------+
                |
                v
       +-------------------+
       | Application       |
       | Servers           |
       +-------------------+
          |       |       |
          |       |       +--------------------+
          |       |                            |
          v       v                            v
     +---------+ +----------------+      +-------------+
     |  Cache  | | Database       |      | Object      |
     |         | | Primary        |      | Storage     |
     +---------+ +----------------+      | Originals   |
          ^             |                | Thumbnails  |
          |             v                +-------------+
          |      +----------------+
          +------| Read Replica   |
                 +----------------+

Photo upload processing:

Application Servers
        |
        v
   Object Storage (original photo)
        |
        v
   +-------------+
   | Durable     |
   | Queue       |
   +-------------+
        |
        v
   +-------------+
   | Thumbnail   |
   | Worker      |
   +-------------+
        |
        v
   Object Storage (thumbnail)
        |
        v
   Database metadata/status update
```

The CDN and cache are separate layers: the CDN primarily serves content near users, while the application cache stores frequently accessed data for fast retrieval. A CDN can also cache public API responses when the caching policy allows it.

### Component responsibilities

- **CDN:** Delivers cached photos and other cacheable content from locations close to users, reducing latency and origin traffic.
- **Load balancer:** Distributes incoming application requests across healthy application servers.
- **Application servers:** Handle authentication, upload requests, feed generation, validation, and business logic.
- **Cache:** Keeps frequently accessed feed data and metadata in memory to reduce database queries.
- **Database primary:** Stores authoritative photo metadata, user information, relationships, and ownership records.
- **Database read replica:** Handles eligible read queries to reduce the load on the primary database.
- **Object storage:** Stores original photos and generated thumbnails durably and independently of the database.
- **Queue:** Holds thumbnail-generation jobs until workers can process them, allowing uploads to continue without waiting for image processing.
- **Thumbnail worker:** Processes queued jobs, generates smaller image versions, stores them in object storage, and updates their processing status.

## 7. Photo Upload Flow

1. A user selects a photo and submits an upload request.
2. The application server authenticates the user and validates the request, including file type and size.
3. The original photo is uploaded to object storage, either through the application server or through a short-lived, authorized upload URL.
4. The application records the photo metadata and original object's storage key in the database.
5. A thumbnail-generation job is placed on a durable queue.
6. The application confirms that the original photo has been accepted or stored successfully without waiting for thumbnail generation to finish.
7. A worker retrieves the job from the queue and generates the thumbnail.
8. The worker uploads the thumbnail to object storage and updates the database with its storage key and processing status.
9. The application can display the original photo or a processing placeholder while the thumbnail is being generated. Once the thumbnail is ready, the feed can use it for faster loading.
10. The CDN can cache the thumbnail and original photo as appropriate when they are requested.

The queue and worker make thumbnail generation asynchronous. If a worker fails, the job can be retried, provided that processing is designed to handle duplicate jobs safely.

## 8. Architectural Trade-Offs

### Trade-off 1: Synchronous versus asynchronous thumbnail generation

**Synchronous processing:** The upload request waits for the thumbnail to be generated. This makes it easier to return a completed photo and thumbnail together, but increases response time and ties up application resources.

**Asynchronous processing:** The application accepts the original photo and queues thumbnail generation. Uploads return faster and processing can scale independently, but thumbnails may not be immediately available. The system must handle retries and processing status.

**Decision:** Use asynchronous processing because SnapShare has substantial upload traffic and should keep upload requests responsive.

### Trade-off 2: Database reads versus caching and read replicas

**Direct database reads:** Every feed request queries the database. This is simpler to implement and keeps reads close to the latest data, but can overload the primary database.

**Caching and read replicas:** Frequently accessed data can be served from cache, and eligible database reads can be distributed to replicas. This improves throughput, but introduces cache invalidation complexity and possible replication lag.

**Decision:** Use caching and read replicas for feed delivery while sending writes to the primary database and handling stale data where necessary.

### Trade-off 3: Cost versus image-delivery performance

**Serving every image directly from object storage:** This keeps the architecture simpler, but increases origin requests and may increase latency for geographically distant users.

**Using a CDN:** Cached images can be delivered closer to users and reduce repeated origin requests, but CDN usage adds cost and requires appropriate cache-control and invalidation policies.

**Decision:** Use a CDN for frequently requested images and apply suitable caching rules to balance performance, cost, and content freshness.

## Conclusion

SnapShare should separate image storage from database metadata, prioritize feed reads, and use a CDN and cache to reduce repeated work. A load-balanced application tier, database read replica, durable queue, and asynchronous thumbnail workers allow the system to scale as traffic and photo storage grow.