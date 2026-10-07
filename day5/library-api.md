# Library API

A REST API for managing books in a library.

## 1. List All Books

- **Method:** GET
- **Path:** `/books`
- **Description:** Returns a list of all books in the library.
- **Success Status:** `200 OK`

## 2. Get One Book

- **Method:** GET
- **Path:** `/books/{id}`
- **Description:** Returns the details of one book using its ID.
- **Success Status:** `200 OK`

## 3. Create a Book

- **Method:** POST
- **Path:** `/books`
- **Description:** Creates a new book in the library.
- **Example Request Body:**

```json
{
  "title": "Things Fall Apart",
  "author": "Chinua Achebe",
  "year": 1958
}
```

- **Success Status:** `201 Created`

## 4. Update a Book

- **Method:** PUT
- **Path:** `/books/{id}`
- **Description:** Updates the details of an existing book.
- **Example Request Body:**

```json
{
  "title": "Things Fall Apart",
  "author": "Chinua Achebe",
  "year": 1958
}
```

- **Success Status:** `200 OK`

## 5. Delete a Book

- **Method:** DELETE
- **Path:** `/books/{id}`
- **Description:** Deletes a book from the library.
- **Success Status:** `204 No Content`

## 6. List Books by Author

- **Method:** GET
- **Path:** `/books?author={author}`
- **Description:** Returns all books written by the specified author.
- **Success Status:** `200 OK`

## Error Responses

### 400 Bad Request

The request is invalid or contains missing/incorrect data.

**Example:**

```text
POST /books
```

with a missing required `title` or `author`.

**Response Status:** `400 Bad Request`

### 404 Not Found

The requested book does not exist.

**Example:**

```text
GET /books/999
```

if book `999` does not exist.

**Response Status:** `404 Not Found`