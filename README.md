Team Projects Dashboard

A collaborative task-tracking web app where teams create, prioritise and track tasks with due dates.

Built as a team project during the UTS/Institute of Data Certified Software Engineering Professional course.


Features
Create teams and add tasks to them
Set a priority and a due date for each task
Track the progress of individual tasks
Tech Stack
Layer	Technology
Frontend	HTML, CSS, JavaScript, Bootstrap
Backend	Node.js, Express.js
Database	MongoDB
How It Works

The browser never talks to the database directly. The frontend sends requests to the Express.js backend, which validates them and reads from or writes to MongoDB, then returns the result.

Frontend (browser)  -->  Express.js API  -->  MongoDB
Getting Started
Prerequisites
Node.js installed
A MongoDB database (local or MongoDB Atlas)
