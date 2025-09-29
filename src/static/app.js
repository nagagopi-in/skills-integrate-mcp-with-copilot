document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  
  // Calendar and admin elements
  const listViewBtn = document.getElementById("list-view-btn");
  const calendarViewBtn = document.getElementById("calendar-view-btn");
  const adminToggleBtn = document.getElementById("admin-toggle-btn");
  const activitiesSection = document.getElementById("activities-section");
  const calendarSection = document.getElementById("calendar-section");
  const adminSection = document.getElementById("admin-section");
  const eventForm = document.getElementById("event-form");
  const calendarGrid = document.getElementById("calendar-grid");
  const currentMonthSpan = document.getElementById("current-month");
  const prevMonthBtn = document.getElementById("prev-month");
  const nextMonthBtn = document.getElementById("next-month");
  
  let currentMonth = new Date().getMonth();
  let currentYear = new Date().getFullYear();
  let isAdminMode = false;

  // View toggle functionality
  listViewBtn.addEventListener("click", () => {
    showListView();
  });

  calendarViewBtn.addEventListener("click", () => {
    showCalendarView();
  });

  adminToggleBtn.addEventListener("click", () => {
    toggleAdminMode();
  });

  // Calendar navigation
  prevMonthBtn.addEventListener("click", () => {
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    renderCalendar();
  });

  nextMonthBtn.addEventListener("click", () => {
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    renderCalendar();
  });

  function showListView() {
    activitiesSection.classList.remove("hidden");
    calendarSection.classList.add("hidden");
    if (!isAdminMode) adminSection.classList.add("hidden");
    listViewBtn.classList.add("active");
    calendarViewBtn.classList.remove("active");
  }

  function showCalendarView() {
    activitiesSection.classList.add("hidden");
    calendarSection.classList.remove("hidden");
    if (!isAdminMode) adminSection.classList.add("hidden");
    listViewBtn.classList.remove("active");
    calendarViewBtn.classList.add("active");
    renderCalendar();
  }

  function toggleAdminMode() {
    isAdminMode = !isAdminMode;
    if (isAdminMode) {
      adminSection.classList.remove("hidden");
      adminToggleBtn.textContent = "Exit Admin Mode";
      adminToggleBtn.style.backgroundColor = "#f44336";
    } else {
      adminSection.classList.add("hidden");
      adminToggleBtn.textContent = "Admin Mode";
      adminToggleBtn.style.backgroundColor = "#ff9800";
    }
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft =
          details.max_participants - details.participants.length;

        // Create participants HTML with delete icons instead of bullet points
        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${email}</span><button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button></li>`
                  )
                  .join("")}
              </ul>
            </div>`
            : `<p><em>No participants yet</em></p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <div class="activity-meta">
            <span class="category-badge ${details.category.toLowerCase()}">${details.category}</span>
            <span class="date-info">Created: ${details.date}</span>
          </div>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // Add event listeners to delete buttons
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Calendar rendering function
  async function renderCalendar() {
    try {
      const response = await fetch("/calendar");
      const calendarEvents = await response.json();
      
      const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      
      currentMonthSpan.textContent = `${monthNames[currentMonth]} ${currentYear}`;
      
      // Clear calendar grid
      calendarGrid.innerHTML = "";
      
      // Add day headers
      const dayHeaders = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      dayHeaders.forEach(day => {
        const dayHeader = document.createElement("div");
        dayHeader.className = "calendar-day-header";
        dayHeader.textContent = day;
        calendarGrid.appendChild(dayHeader);
      });
      
      // Get first day of month and number of days
      const firstDay = new Date(currentYear, currentMonth, 1).getDay();
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      
      // Add empty cells for days before the first day of the month
      for (let i = 0; i < firstDay; i++) {
        const emptyDay = document.createElement("div");
        emptyDay.className = "calendar-day";
        calendarGrid.appendChild(emptyDay);
      }
      
      // Add days of the month
      for (let day = 1; day <= daysInMonth; day++) {
        const dayDiv = document.createElement("div");
        dayDiv.className = "calendar-day";
        
        const dayNumber = document.createElement("div");
        dayNumber.className = "calendar-day-number";
        dayNumber.textContent = day;
        dayDiv.appendChild(dayNumber);
        
        // Format date to match our data format (YYYY-MM-DD)
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        if (calendarEvents[dateStr]) {
          calendarEvents[dateStr].forEach(event => {
            const eventDiv = document.createElement("div");
            eventDiv.className = `calendar-event ${event.category.toLowerCase()}`;
            eventDiv.textContent = `${event.name} (${event.time})`;
            eventDiv.title = `${event.name} at ${event.location} - ${event.participants_count}/${event.max_participants} participants`;
            dayDiv.appendChild(eventDiv);
          });
        }
        
        calendarGrid.appendChild(dayDiv);
      }
    } catch (error) {
      console.error("Error rendering calendar:", error);
    }
  }

  // Handle event creation form
  eventForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(eventForm);
    const eventData = {
      name: formData.get("name"),
      description: formData.get("description"),
      category: formData.get("category"),
      event_date: formData.get("event_date"),
      event_time: formData.get("event_time"),
      location: formData.get("location"),
      max_participants: parseInt(formData.get("max_participants"))
    };

    try {
      const response = await fetch("/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(eventData)
      });

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        eventForm.reset();

        // Refresh both list and calendar views
        fetchActivities();
        renderCalendar();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to create event. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error creating event:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
