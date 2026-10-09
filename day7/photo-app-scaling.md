# SnapShare - Scaling Plan

## Assumptions
- SnapShare has 10 million registered users, with 10% active daily, giving us 1 million daily active users.
- Every active user uploads one photo and views 50 feed pages daily.
- Original photos are 2 MB, while thumbnails are 50 KB.
- For easier estimation, one day is approximated as 100,000 seconds. Peak traffic is five times the average.

## Estimates

- **Photo uploads:** 1 million uploads daily, or approximately 10 uploads per second. During peak periods, this rises to about 50 uploads per second.
- **Feed views:** 50 million feed views daily, averaging approximately 500 per second and reaching 2,500 per second at peak.
- **Storage requirements:** Each photo and its thumbnail require approximately 2.05 MB combined. This amounts to roughly 2 TB daily and 750 TB annually.

## Is the System Read-Heavy or Write-Heavy?

SnapShare is read-heavy because users view around 50 feed pages for every photo they upload. The system should therefore prioritize fast reads by using a CDN for images, caching frequently accessed feeds, and read replicas for database queries. Uploads must remain dependable, even when some processing takes extra time.

## Where Should Photos Be Stored?

Photo files should be kept outside the database. Storing around 750 TB of images annually in a database would increase its size, make operations more expensive, and complicate backups.

Object storage, such as Amazon S3, is better suited for storing large files reliably and at scale. The database can instead hold smaller records containing each photo's ID, owner, caption, upload time, and file URL.

## Architecture

```text id="r8y1zq"
Mobile app / browser
   │   Photo files and thumbnails
   ├──────────────────────────────> CDN ──> Object storage
   │   API requests (HTTPS, JSON)              (photo files)
   v                                                ^
Load balancer                                       │ uploads
   │                                                │
   ├──> App server 1 ──┐                            │
   ├──> App server 2 ──┼──> Cache (Redis): feeds     │
   └──> App server 3 ──┘                            │
          │       │                                 │
          │       └──> Queue ──> Thumbnail worker ───┘
          v
Primary DB ──replicates──> Read replicas
(photo metadata)           (feed queries)
```

## Components and Their Roles

- **CDN:** Delivers images from locations closer to users, making them load faster and reducing repeated requests to the main servers.
- **Object storage:** Holds the large collection of original photos and thumbnails reliably without consuming database storage.
- **Load balancer:** Distributes incoming API requests among available application servers and avoids sending traffic to failed servers.
- **Application servers:** Process API requests and business logic. Because they are stateless, more servers can be added as demand increases.
- **Cache (Redis):** Keeps commonly requested feed data in memory, allowing users to scroll without repeatedly querying the database.
- **Primary database:** Maintains the authoritative records for users, follow relationships, and photo metadata.
- **Read replicas:** Serve eligible feed queries separately from the primary database, reducing its workload.
- **Queue and thumbnail worker:** Place thumbnail tasks in a queue and process them in the background, allowing uploads to complete without waiting for image processing.

## Photo Upload Process

1. A user uploads a photo, and the request passes through the load balancer to an application server.
2. The server verifies the user's authentication token and checks the file's type and size.
3. The original image is uploaded to object storage.
4. The application saves the photo's metadata in the primary database.
5. A thumbnail-generation task is added to the queue, identifying the photo that needs processing.
6. The application returns a `201 Created` response after the original photo and its metadata have been successfully accepted and stored, without waiting for the thumbnail.
7. A background worker retrieves the task, creates the 50 KB thumbnail, stores it in object storage, and updates the database with the thumbnail's URL.
8. Cached feeds belonging to the user's followers are refreshed or invalidated so the new photo can appear.

## Architectural Trade-offs

1. **Performance versus freshness:** Caching makes feeds faster, but followers might not see a newly uploaded photo immediately. Updating or invalidating cached feeds helps keep content fresh, although it adds complexity. A short delay is an acceptable compromise for reducing database load.

2. **Fast uploads versus immediate thumbnail availability:** Creating thumbnails during the upload request would make users wait longer. Processing them in the background keeps uploads responsive, but the thumbnail might not be ready immediately. The application can display a placeholder until processing finishes.

3. **Operating cost versus scalability:** CDNs and object storage have usage costs. However, they make it more practical to deliver and retain hundreds of terabytes of photos than relying entirely on application servers and database storage.

## Key Design Lessons

The first important lesson is to separate large files from structured information. Object storage and a CDN handle the images, while the database manages their metadata. This approach is useful for applications that store photos, videos, or documents.

The second lesson is to move time-consuming tasks into background jobs. A queue and worker allow thumbnail generation to happen independently of the upload request, helping users receive faster responses.

## Conclusion

SnapShare's large storage requirements and read-heavy traffic call for an architecture that separates image delivery from database operations. Using object storage, a CDN, caching, read replicas, and background workers helps the application remain responsive as its users and photo collection grow.