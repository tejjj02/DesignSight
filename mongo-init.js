// MongoDB initialization script for DesignSight
db = db.getSiblingDB('designsight');

// Create collections with initial indexes
db.createCollection('projects');
db.createCollection('images');
db.createCollection('feedback');
db.createCollection('comments');

// Create indexes for better performance
db.projects.createIndex({ "createdAt": -1 });
db.projects.createIndex({ "name": "text", "description": "text" });

db.images.createIndex({ "projectId": 1 });
db.images.createIndex({ "createdAt": -1 });
db.images.createIndex({ "analysisStatus": 1 });

db.feedback.createIndex({ "imageId": 1 });
db.feedback.createIndex({ "category": 1 });
db.feedback.createIndex({ "severity": 1 });
db.feedback.createIndex({ "targetRoles": 1 });
db.feedback.createIndex({ "createdAt": -1 });

db.comments.createIndex({ "feedbackId": 1 });
db.comments.createIndex({ "parentCommentId": 1 });
db.comments.createIndex({ "createdAt": -1 });

print('✅ DesignSight database initialized successfully!');
