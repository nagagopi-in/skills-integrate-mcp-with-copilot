"""
High School Management System API

A super simple FastAPI application that allows students to view and sign up
for extracurricular activities at Mergington High School.
"""

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from datetime import datetime, date
from typing import Optional
import os
from pathlib import Path

app = FastAPI(title="Mergington High School API",
              description="API for viewing and signing up for extracurricular activities")

# Pydantic models for event creation
class EventCreate(BaseModel):
    name: str
    description: str
    category: str
    event_date: date
    event_time: str
    location: str
    max_participants: int

# Mount the static files directory
current_dir = Path(__file__).parent
app.mount("/static", StaticFiles(directory=os.path.join(Path(__file__).parent,
          "static")), name="static")

# In-memory activity database
activities = {
    "Chess Club": {
        "description": "Learn strategies and compete in chess tournaments",
        "schedule": "Fridays, 3:30 PM - 5:00 PM",
        "category": "Games",
        "date": "2024-01-15",
        "event_date": "2025-01-26",
        "event_time": "3:30 PM - 5:00 PM",
        "location": "Library Room 101",
        "max_participants": 12,
        "participants": ["michael@mergington.edu", "daniel@mergington.edu"]
    },
    "Programming Class": {
        "description": "Learn programming fundamentals and build software projects",
        "schedule": "Tuesdays and Thursdays, 3:30 PM - 4:30 PM",
        "category": "Academic",
        "date": "2024-01-10",
        "event_date": "2025-01-30",
        "event_time": "3:30 PM - 4:30 PM",
        "location": "Computer Lab A",
        "max_participants": 20,
        "participants": ["emma@mergington.edu", "sophia@mergington.edu"]
    },
    "Gym Class": {
        "description": "Physical education and sports activities",
        "schedule": "Mondays, Wednesdays, Fridays, 2:00 PM - 3:00 PM",
        "category": "Sports",
        "date": "2024-01-08",
        "event_date": "2025-01-29",
        "event_time": "2:00 PM - 3:00 PM",
        "location": "Main Gymnasium",
        "max_participants": 30,
        "participants": ["john@mergington.edu", "olivia@mergington.edu"]
    },
    "Soccer Team": {
        "description": "Join the school soccer team and compete in matches",
        "schedule": "Tuesdays and Thursdays, 4:00 PM - 5:30 PM",
        "category": "Sports",
        "date": "2024-01-12",
        "event_date": "2025-02-01",
        "event_time": "4:00 PM - 5:30 PM",
        "location": "Soccer Field",
        "max_participants": 22,
        "participants": ["liam@mergington.edu", "noah@mergington.edu"]
    },
    "Basketball Team": {
        "description": "Practice and play basketball with the school team",
        "schedule": "Wednesdays and Fridays, 3:30 PM - 5:00 PM",
        "category": "Sports",
        "date": "2024-01-20",
        "event_date": "2025-02-02",
        "event_time": "3:30 PM - 5:00 PM",
        "location": "Basketball Court",
        "max_participants": 15,
        "participants": ["ava@mergington.edu", "mia@mergington.edu"]
    },
    "Art Club": {
        "description": "Explore your creativity through painting and drawing",
        "schedule": "Thursdays, 3:30 PM - 5:00 PM",
        "category": "Arts",
        "date": "2024-01-18",
        "event_date": "2025-01-28",
        "event_time": "3:30 PM - 5:00 PM",
        "location": "Art Room 203",
        "max_participants": 15,
        "participants": ["amelia@mergington.edu", "harper@mergington.edu"]
    },
    "Drama Club": {
        "description": "Act, direct, and produce plays and performances",
        "schedule": "Mondays and Wednesdays, 4:00 PM - 5:30 PM",
        "category": "Arts",
        "date": "2024-01-22",
        "event_date": "2025-01-27",
        "event_time": "4:00 PM - 5:30 PM",
        "location": "Auditorium",
        "max_participants": 20,
        "participants": ["ella@mergington.edu", "scarlett@mergington.edu"]
    },
    "Math Club": {
        "description": "Solve challenging problems and participate in math competitions",
        "schedule": "Tuesdays, 3:30 PM - 4:30 PM",
        "category": "Academic",
        "date": "2024-01-14",
        "event_date": "2025-01-30",
        "event_time": "3:30 PM - 4:30 PM",
        "location": "Math Room 105",
        "max_participants": 10,
        "participants": ["james@mergington.edu", "benjamin@mergington.edu"]
    },
    "Debate Team": {
        "description": "Develop public speaking and argumentation skills",
        "schedule": "Fridays, 4:00 PM - 5:30 PM",
        "category": "Academic",
        "date": "2024-01-25",
        "event_date": "2025-02-03",
        "event_time": "4:00 PM - 5:30 PM",
        "location": "Debate Room 110",
        "max_participants": 12,
        "participants": ["charlotte@mergington.edu", "henry@mergington.edu"]
    }
}


@app.get("/")
def root():
    return RedirectResponse(url="/static/index.html")


@app.get("/activities")
def get_activities():
    return activities


@app.post("/activities/{activity_name}/signup")
def signup_for_activity(activity_name: str, email: str):
    """Sign up a student for an activity"""
    # Validate activity exists
    if activity_name not in activities:
        raise HTTPException(status_code=404, detail="Activity not found")

    # Get the specific activity
    activity = activities[activity_name]

    # Validate student is not already signed up
    if email in activity["participants"]:
        raise HTTPException(
            status_code=400,
            detail="Student is already signed up"
        )

    # Add student
    activity["participants"].append(email)
    return {"message": f"Signed up {email} for {activity_name}"}


@app.delete("/activities/{activity_name}/unregister")
def unregister_from_activity(activity_name: str, email: str):
    """Unregister a student from an activity"""
    # Validate activity exists
    if activity_name not in activities:
        raise HTTPException(status_code=404, detail="Activity not found")

    # Get the specific activity
    activity = activities[activity_name]

    # Validate student is signed up
    if email not in activity["participants"]:
        raise HTTPException(
            status_code=400,
            detail="Student is not signed up for this activity"
        )

    # Remove student
    activity["participants"].remove(email)
    return {"message": f"Unregistered {email} from {activity_name}"}


@app.post("/events")
def create_event(event: EventCreate):
    """Create a new event (admin/faculty only)"""
    # Check if event already exists
    if event.name in activities:
        raise HTTPException(status_code=400, detail="Event already exists")
    
    # Create new event
    activities[event.name] = {
        "description": event.description,
        "schedule": f"{event.event_time}",
        "category": event.category,
        "date": str(date.today()),
        "event_date": str(event.event_date),
        "event_time": event.event_time,
        "location": event.location,
        "max_participants": event.max_participants,
        "participants": []
    }
    
    return {"message": f"Event '{event.name}' created successfully"}


@app.get("/calendar")
def get_calendar_events():
    """Get events formatted for calendar view"""
    calendar_events = {}
    
    for name, details in activities.items():
        event_date = details["event_date"]
        if event_date not in calendar_events:
            calendar_events[event_date] = []
        
        calendar_events[event_date].append({
            "name": name,
            "time": details["event_time"],
            "location": details["location"],
            "category": details["category"],
            "participants_count": len(details["participants"]),
            "max_participants": details["max_participants"]
        })
    
    return calendar_events
