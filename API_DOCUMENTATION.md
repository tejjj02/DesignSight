# DesignSight API Documentation

## 🎯 Stage 2 Complete - Full API Foundation

### **API Base URL:** `http://localhost:5000/api`

---

## 📋 **Projects API**

### `GET /projects`
Get all active projects
```bash
curl http://localhost:5000/api/projects
```

### `POST /projects`
Create a new project
```bash
curl -X POST http://localhost:5000/api/projects \
  -H "Content-Type: application/json" \
  -d '{"name":"My Design Project","description":"Testing the API"}'
```

### `GET /projects/:id`
Get specific project
```bash
curl http://localhost:5000/api/projects/{PROJECT_ID}
```

---

## 🖼️ **Images API**

### `GET /images`
Get all images (with optional filters)
```bash
# All images
curl http://localhost:5000/api/images

# Filter by project
curl "http://localhost:5000/api/images?projectId={PROJECT_ID}"

# Filter by analysis status
curl "http://localhost:5000/api/images?status=pending"
```

### `POST /images/upload`
Upload image to project
```bash
curl -X POST http://localhost:5000/api/images/upload \
  -F "image=@/path/to/your/image.jpg" \
  -F "projectId={PROJECT_ID}"
```

### `GET /images/:id`
Get image metadata
```bash
curl http://localhost:5000/api/images/{IMAGE_ID}
```

### `GET /images/:id/file`
Serve the actual image file
```bash
curl http://localhost:5000/api/images/{IMAGE_ID}/file
```

---

## 💬 **Feedback API**

### `GET /feedback`
Get feedback with filtering options
```bash
# All feedback
curl http://localhost:5000/api/feedback

# Filter by image
curl "http://localhost:5000/api/feedback?imageId={IMAGE_ID}"

# Filter by category
curl "http://localhost:5000/api/feedback?category=accessibility"

# Filter by role
curl "http://localhost:5000/api/feedback?role=designer"

# Filter by project
curl "http://localhost:5000/api/feedback?projectId={PROJECT_ID}"
```

### `POST /feedback`
Create coordinate-anchored feedback
```bash
curl -X POST http://localhost:5000/api/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "imageId": "{IMAGE_ID}",
    "category": "accessibility",
    "severity": "high",
    "title": "Low contrast text",
    "description": "Text on background has insufficient contrast ratio",
    "coordinates": {"x": 100, "y": 150, "width": 200, "height": 50},
    "targetRoles": ["designer", "developer"],
    "recommendations": ["Increase contrast ratio to at least 4.5:1"]
  }'
```

### `GET /feedback/role/:role`
Get feedback for specific role
```bash
curl http://localhost:5000/api/feedback/role/designer
curl http://localhost:5000/api/feedback/role/developer
```

### `GET /feedback/stats/:imageId`
Get feedback statistics for an image
```bash
curl http://localhost:5000/api/feedback/stats/{IMAGE_ID}
```

---

## 💭 **Comments API**

### `GET /comments/thread/:feedbackId`
Get complete comment tree for feedback
```bash
curl http://localhost:5000/api/comments/thread/{FEEDBACK_ID}
```

### `POST /comments`
Create a comment or reply
```bash
# Top-level comment
curl -X POST http://localhost:5000/api/comments \
  -H "Content-Type: application/json" \
  -d '{
    "feedbackId": "{FEEDBACK_ID}",
    "author": {"name": "John Doe", "role": "designer"},
    "content": "I agree, this needs to be fixed."
  }'

# Reply to comment
curl -X POST http://localhost:5000/api/comments \
  -H "Content-Type: application/json" \
  -d '{
    "feedbackId": "{FEEDBACK_ID}",
    "parentCommentId": "{PARENT_COMMENT_ID}",
    "author": {"name": "Jane Smith", "role": "developer"},
    "content": "I can implement this fix."
  }'
```

### `POST /comments/:id/reaction`
Add reaction to comment
```bash
curl -X POST http://localhost:5000/api/comments/{COMMENT_ID}/reaction \
  -H "Content-Type: application/json" \
  -d '{
    "type": "thumbs_up",
    "author": {"name": "John Doe", "role": "designer"}
  }'
```

---

## 🧪 **Testing Workflow**

### 1. Create Project
```bash
PROJECT_RESPONSE=$(curl -s -X POST http://localhost:5000/api/projects \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Project","description":"API Testing"}')

PROJECT_ID=$(echo $PROJECT_RESPONSE | jq -r '.data._id')
echo "Created project: $PROJECT_ID"
```

### 2. Upload Image
```bash
# Replace with actual image path
curl -X POST http://localhost:5000/api/images/upload \
  -F "image=@test-design.jpg" \
  -F "projectId=$PROJECT_ID"
```

### 3. Create Feedback
```bash
curl -X POST http://localhost:5000/api/feedback \
  -H "Content-Type: application/json" \
  -d "{
    \"imageId\": \"$IMAGE_ID\",
    \"category\": \"accessibility\",
    \"severity\": \"high\",
    \"title\": \"Color contrast issue\",
    \"description\": \"Button text is hard to read\",
    \"coordinates\": {\"x\": 50, \"y\": 100, \"width\": 150, \"height\": 40},
    \"targetRoles\": [\"designer\", \"developer\"],
    \"recommendations\": [\"Use darker text color\"]
  }"
```

### 4. Add Comments
```bash
curl -X POST http://localhost:5000/api/comments \
  -H "Content-Type: application/json" \
  -d "{
    \"feedbackId\": \"$FEEDBACK_ID\",
    \"author\": {\"name\": \"Test User\", \"role\": \"designer\"},
    \"content\": \"This is a critical accessibility issue.\"
  }"
```

---

## 📊 **Data Relationships**

```
Project
├── Images[]
    ├── Feedback[]
        ├── Comments[]
            ├── Replies[] (nested comments)
            └── Reactions[]
```

---

## 🎯 **Ready for Stage 3: Gemini AI Integration**

All API endpoints are now ready to support:
- ✅ Image uploads with metadata
- ✅ Coordinate-anchored feedback
- ✅ Role-based filtering
- ✅ Nested comment threads
- ✅ Project organization

**Next:** Integrate Google Gemini 2.0 Flash for automated design analysis! 🚀
