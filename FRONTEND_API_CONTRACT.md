# BeePro Academy Frontend API Contract

The frontend is API-ready and does not include a backend implementation. Set
`VITE_API_BASE_URL` to the REST API root (for example,
`https://api.example.com/api/v1`) when the backend is available.

During local UI development, set `VITE_USE_MOCK_DATA=true`. Mock records live
in [`src/data/mockData.js`](./src/data/mockData.js) and are exposed through
[`src/services/mockApi.js`](./src/services/mockApi.js), so replacing them with
REST responses does not require changing page components.

## Response conventions

The service layer accepts either a direct payload or an envelope:

```json
{ "data": { "...": "..." } }
```

List endpoints may return an array or one of `data`, `items`, `results`, or
`courses`. Paginated course lists may include:

```json
{
  "courses": [],
  "pagination": { "page": 1, "limit": 20, "total": 120 }
}
```

## Authentication

Supabase authentication remains the source of truth for the current session.
The REST API should accept the Supabase bearer token when protected requests
are enabled.

| Method | Endpoint | Expected response |
|---|---|---|
| POST | `/auth/login` | `{ user, access_token, refresh_token, expires_in }` |
| POST | `/auth/register` | `{ user, access_token?, refresh_token?, expires_in? }` |
| POST | `/auth/refresh` | `{ access_token, refresh_token?, expires_in? }` |
| GET | `/auth/me` | User object |
| POST | `/auth/logout` | Success status |

User objects should contain `id`, `email`, `full_name`, `role`, optional
`avatar_url`, `bio`, and `is_suspended`.

## Courses and categories

| Method | Endpoint | Expected response |
|---|---|---|
| GET | `/courses` | Course list envelope |
| GET | `/courses/:id` | Course object |
| POST | `/courses` | Created course |
| PATCH | `/courses/:id` | Updated course |
| DELETE | `/courses/:id` | Success status |
| GET | `/categories` | Category list |
| GET | `/courses/:id/sections` | Section list with optional `lessons` |

Course objects should contain:

```json
{
  "id": "course-id",
  "title": "Arabic title",
  "title_en": "English title",
  "description": "Arabic description",
  "description_en": "English description",
  "category": "data_analysis",
  "thumbnail_url": "https://...",
  "price": 49,
  "level": "beginner",
  "rating": 4.8,
  "students_count": 128,
  "lessons_count": 24,
  "duration": 18,
  "status": "published",
  "admin_approval_status": "approved",
  "instructor": {
    "id": "user-id",
    "full_name": "Instructor name",
    "avatar_url": "https://...",
    "bio": "..."
  }
}
```

## Learning and dashboards

| Method | Endpoint | Expected response |
|---|---|---|
| GET | `/progress/enrollments` | Enrollment list |
| POST | `/progress/enroll/:courseId` | Enrollment |
| GET | `/progress/course/:courseId` | `{ progress, completed_lessons, total_lessons }` |
| PUT | `/progress/lesson/:lessonId` | Updated lesson progress |
| GET | `/reviews?courseId=:id` | Review list |
| GET | `/dashboard/student` | Student dashboard aggregate |
| GET | `/dashboard/teacher` | Teacher dashboard aggregate |
| GET | `/dashboard/admin` | Admin dashboard aggregate |

Enrollment records should contain `id`, `course_id`, `user_id`, `progress`,
`completed_lessons`, `total_lessons`, and an optional nested `course`.

Dashboard aggregates may be returned directly or as an envelope and should
provide the records used by the respective dashboard:

- Student: enrollments, progress rows, completed lessons, certificates.
- Teacher: courses, sections, lessons, enrollments, and reviews.
- Admin: users, pending instructors, courses, and blog posts.

## Blogs

| Method | Endpoint | Expected response |
|---|---|---|
| GET | `/blog/published` | Published post list |
| GET | `/blog/admin` | Admin post list |
| POST | `/blog` | Created post |
| PATCH | `/blog/:id` | Updated post |
| DELETE | `/blog/:id` | Success status |

Posts should contain `id`, `title`, optional `title_en`, `excerpt`,
`excerpt_en`, `content`, `content_en`, `cover_image_url`, `category`,
`published_at`, `status`, and optional `course_id`.

## Error contract

The preferred error shape is:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "A human-readable message",
    "details": [{ "field": "title", "message": "Title is required" }]
  }
}
```

The frontend already normalizes direct errors and this envelope through
`buildApiError`; pages retain explicit loading, error, empty, and success
states.
