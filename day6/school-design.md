# School Database Design

## Tables

**Students:** This table stores information about each student, including their unique ID, name, and email address. The email must be provided and must be unique.

**Courses:** This table stores the courses offered by the school. Each course has a unique ID and a name.

**Enrolments:** This table records which students are enrolled in which courses. It contains the student ID, course ID, and grade. Foreign keys connect each enrolment to an existing student and course. A unique constraint on the student ID and course ID prevents duplicate enrolments.

## Relationships

The relationship between students and enrolments is one-to-many because one student can enrol in several courses, while each enrolment belongs to one student. The relationship between courses and enrolments is also one-to-many because one course can have several enrolments, while each enrolment refers to one course.

Students and courses have a many-to-many relationship because a student can take several courses and each course can have several students. The enrolments table acts as a join table to connect students and courses. It also stores the grade earned by each student in a particular course.

## Index

I would add an index on the `course_id` column in the enrolments table. This would help the database find enrolments for a particular course more efficiently, especially when retrieving all students taking that course.

## SQL or NoSQL?

I would choose SQL for this school system because the data has clear relationships between students, courses, and enrolments. SQL supports primary keys, foreign keys, unique constraints, and joins, which help maintain accurate and consistent data. It also makes it easy to count students per course and retrieve enrolment records. A relational database such as SQLite is suitable for this system because the data is structured and the relationships are well defined.