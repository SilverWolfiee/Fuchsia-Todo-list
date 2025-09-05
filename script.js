document.addEventListener('DOMContentLoaded', () => {
  // Close button logic
  const closeBtn = document.getElementById('close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      window.electronAPI.closeApp();
    });
  }

  // Date box logic
  const dateBox = document.getElementById('date-box');
  const now = new Date();
  const weekday = now.toLocaleDateString('en-US', { weekday: 'short' });
  const date = now.getDate();
  const month = now.toLocaleDateString('en-US', { month: 'short' });
  const year = now.getFullYear();
  const formattedDate = `${weekday}, ${date} ${month} ${year}`;
  if (dateBox) {
    dateBox.textContent = formattedDate;
  }

  // Clock logic
  const clockBox = document.getElementById('clock');
  function updateClock() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    if (clockBox) {
      clockBox.textContent = formattedTime;
    }
  }
  updateClock();
  setInterval(updateClock, 1000);

  // Todo list logic
  const list = document.getElementById('list');
  const input = document.getElementById('newtask');
  const placeholderText = 'Add new task...';

  input.contentEditable = true;
  input.style.outline = 'none';
  input.style.padding = '5px';
  input.style.fontSize = '13px';
  input.style.fontFamily = 'Segoe UI';
  input.style.color = '#f294b4a2';
  input.textContent = placeholderText;

  input.addEventListener('focus', () => {
    if (input.textContent === placeholderText) {
      input.textContent = '';
      input.style.color = '#f294b4';
    }
  });

  input.addEventListener('blur', () => {
    if (input.textContent.trim() === '') {
      input.textContent = placeholderText;
      input.style.color = '#f294b4a2';
    }
  });

  function createTaskElement(text, index) {
    const task = document.createElement('div');
    task.className = 'todo-item';
    task.textContent = `${index + 1}. ${text}`;
    task.addEventListener('click', async () => {
      task.style.opacity = '0';
      task.style.transform = 'translateX(10px)';
      task.style.pointerEvents = 'none';
      setTimeout(async () => {
        task.remove();
        await saveTasks();
        updateTaskNumbers();
      }, 300);
    });
    return task;
  }

  function updateTaskNumbers() {
    const items = list.querySelectorAll('.todo-item');
    items.forEach((item, i) => {
      const raw = item.textContent.split('. ')[1];
      item.textContent = `${i + 1}. ${raw}`;
    });
  }

  async function saveTasks() {
    const tasks = Array.from(list.querySelectorAll('.todo-item')).map(item => ({
      text: item.textContent.replace(/^\d+\.\s/, ''),
      completed: false
    }));
    await window.electronAPI.saveTasks(tasks);
  }

  async function loadTasks() {
    const tasks = await window.electronAPI.loadTasks();
    list.innerHTML = '';
    tasks.forEach((task, i) => {
      const taskElement = createTaskElement(task.text, i);
      list.appendChild(taskElement);
    });
  }

  input.addEventListener('keypress', async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const value = input.textContent.trim();
      if (value && value !== placeholderText) {
        const newItem = createTaskElement(value, list.children.length);
        list.appendChild(newItem);
        input.textContent = '';
        
        await saveTasks();
      }
    }
  });

  loadTasks();

  // Calendar logic
  const calendarGrid = document.getElementById('calendargrid');
  const monthDisplay = document.getElementById('month-display');
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');

  let currentDate = new Date();
  let selectedDate = new Date();
  let isDateSelected = true;

  function renderCalendar(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const today = new Date();
    const isTodayMonth = today.getFullYear() === year && today.getMonth() === month;
    const monthName = date.toLocaleString('default', { month: 'short' });
    monthDisplay.textContent = `${monthName}, ${year}`;
    calendarGrid.innerHTML = '';

    const grid = document.createElement('div');
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(7, 1fr)';
    grid.style.gap = '3px';
    grid.style.padding = '10px';

    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    weekdays.forEach(day => {
      const cell = document.createElement('div');
      cell.textContent = day;
      cell.style.fontWeight = 'bold';
      cell.style.textAlign = 'center';
      cell.style.color = '#ff5b92';
      grid.appendChild(cell);
    });

    for (let i = firstDay - 1; i >= 0; i--) {
      const cell = createDayCell(prevMonthDays - i, false, true);
      grid.appendChild(cell);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const isToday = isTodayMonth && i === today.getDate();
      const isSelected = isDateSelected &&
        selectedDate.getFullYear() === year &&
        selectedDate.getMonth() === month &&
        selectedDate.getDate() === i;
      const cell = createDayCell(i, true, false, isToday, isSelected);
      cell.addEventListener('click', () => {
        const clicked = new Date(year, month, i);
        if (selectedDate.getTime() === clicked.getTime()) {
          isDateSelected = !isDateSelected;
        } else {
          isDateSelected = true;
          selectedDate = clicked;
        }
        renderCalendar(currentDate);
      });
      grid.appendChild(cell);
    }

    const totalCells = firstDay + daysInMonth;
    const nextDays = 7 * Math.ceil(totalCells / 7) - totalCells;
    for (let i = 1; i <= nextDays; i++) {
      const cell = createDayCell(i, false, true);
      grid.appendChild(cell);
    }

    calendarGrid.appendChild(grid);
  }

  function createDayCell(dayNum, isCurrentMonth, isShadow, isToday = false, isSelected = false) {
    const cell = document.createElement('div');
    cell.textContent = dayNum;
    cell.style.textAlign = 'center';
    cell.style.borderRadius = '6px';
    cell.style.padding = '4px';
    cell.style.fontWeight = isCurrentMonth ? 'bold' : 'normal';
    cell.style.cursor = isCurrentMonth ? 'pointer' : 'default';
    cell.style.border = isSelected ? '2px solid #ff5b92' : '2px solid transparent';
    if (isShadow) {
      cell.style.backgroundColor = 'white';
      cell.style.color = '#666';
      cell.style.opacity = '0.6';
    } else if (isToday) {
      cell.style.backgroundColor = '#ffc0cb';
      cell.style.color = 'white';
    } else {
      cell.style.backgroundColor = 'white';
      cell.style.color = '#f486aa';
    }
    return cell;
  }

  prevBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar(currentDate);
  });

  nextBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar(currentDate);
  });

  renderCalendar(currentDate);

 // Lofi player controls
  const playBtn = document.getElementById('play-btn');
  const volumeBar = document.getElementById('volume-bar');
  const backBtn = document.getElementById('back');
  const skipBtn = document.getElementById('skip');
  const nowPlaying = document.getElementById('now-playing');

  let lofiTracks = [];
  let currentTrackIndex = 0;
  let lofiAudio = new Audio();
  let isLofiPlaying = false;
  let hasStartedPlaying = false;

  // Fetch mp3 paths from Electron backend
  async function initializeLofiTracks() {
    lofiTracks = await window.electronAPI.getLofiTracks();
    if (lofiTracks.length > 0) {
      currentTrackIndex = Math.floor(Math.random() * lofiTracks.length);
      lofiAudio.src = lofiTracks[currentTrackIndex];
      updateNowPlaying(currentTrackIndex);
    } else {
      console.warn("No MP3 files found in assets/lofi/");
    }
  }
  initializeLofiTracks();

  // Play track by index
  function playTrack(index) {
    if (lofiTracks.length === 0) return;

    if (index < 0) index = lofiTracks.length - 1;
    if (index >= lofiTracks.length) index = 0;

    currentTrackIndex = index;
    lofiAudio.src = lofiTracks[index];
    updateNowPlaying(index);

    hasStartedPlaying = true;
    lofiAudio.play().catch(err => {
      console.warn("Lofi audio failed to play:", err);
    });

    isLofiPlaying = true;
    updatePlayButtonIcon();
  }

  // Scroll animation for song title
  function updateNowPlaying(index) {
    if (!nowPlaying || !lofiTracks[index]) return;

    const fullPath = lofiTracks[index];
    const fileName = '🎵 ' + fullPath.split(/[/\\]/).pop().replace(/\.mp3$/, '');

    nowPlaying.innerHTML = ''; // Clear
    const span = document.createElement('span');
    span.textContent = fileName;
    nowPlaying.appendChild(span);

    requestAnimationFrame(() => {
      const containerWidth = nowPlaying.offsetWidth;
      const textWidth = span.scrollWidth;

      if (textWidth > containerWidth) {
        span.style.transition = 'none';
        span.style.transform = 'translateX(0)';

        setTimeout(() => {
          const distance = textWidth - containerWidth;
          const speed = distance / 30; // adjust for scroll speed
          span.style.transition = `transform ${speed}s linear`;
          span.style.transform = `translateX(-${distance}px)`;

          span.addEventListener('transitionend', () => {
            setTimeout(() => {
              span.style.transition = 'none';
              span.style.transform = 'translateX(0)';
              updateNowPlaying(index);
            }, 1500);
          }, { once: true });

        }, 1500); // wait before scroll starts
      } else {
        span.style.transition = 'none';
        span.style.transform = 'translateX(0)';
      }
    });
  }

  // Volume control
  if (volumeBar) {
    volumeBar.addEventListener('input', () => {
      const vol = volumeBar.value / 100;
      lofiAudio.volume = vol;
    });
    volumeBar.value = 50;
    lofiAudio.volume = 0.5;
  }

  // Play/Pause toggle
  if (playBtn) {
    playBtn.addEventListener('click', () => {
      if (lofiTracks.length === 0) return;

      if (!isLofiPlaying) {
        isLofiPlaying = true;

        if (!hasStartedPlaying) {
          playTrack(currentTrackIndex);
        } else {  
          lofiAudio.play().catch(err => {
            console.warn("Lofi audio failed to play:", err);
          });
          updatePlayButtonIcon();
        }

      } else {
        lofiAudio.pause();
        isLofiPlaying = false;
        updatePlayButtonIcon();
      }

    });

    playBtn.addEventListener('mouseenter', () => updatePlayButtonIcon(true));
    playBtn.addEventListener('mouseleave', () => updatePlayButtonIcon(false));
  }

  // Previous track
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      if (!hasStartedPlaying || lofiTracks.length === 0) return;
      playTrack(currentTrackIndex - 1);
    });
  }

  // Next track
  if (skipBtn) {
    skipBtn.addEventListener('click', () => {
      if (!hasStartedPlaying || lofiTracks.length === 0) return;
      playTrack(currentTrackIndex + 1);
    });
  }

  // Auto-shuffle next track
  lofiAudio.addEventListener('ended', () => {
    if (isLofiPlaying && lofiTracks.length > 0) {
      const nextIndex = Math.floor(Math.random() * lofiTracks.length);
      playTrack(nextIndex);
    }
  });

  // Button image updater
  function updatePlayButtonIcon(hovered = false) {
    if (!playBtn) return;
    playBtn.style.backgroundImage = isLofiPlaying
      ? hovered
        ? "url('assets/icons/pause-hovered.png')"
        : "url('assets/icons/pause-default.png')"
      : hovered
        ? "url('assets/icons/play-hovered.png')"
        : "url('assets/icons/play-default.png')";
  }


  // Greet by time
    let hasPlayedGreeting = false;
    let isGreetingPlaying = false;

    function playGreetingByTime() {
      if (isGreetingPlaying || hasPlayedGreeting) return;

      const now = new Date();
      const hour = now.getHours();
      let greetingAudio;

      if (hour >= 6 && hour <= 15) {
        greetingAudio = new Audio("assets/sounds/morning.mp3");
      } else if (hour >= 16 && hour <= 20) {
        greetingAudio = new Audio("assets/sounds/night.mp3");
      } else {
        greetingAudio = new Audio("assets/sounds/latenight.mp3");
      }

      isGreetingPlaying = true;
      hasPlayedGreeting = true;

      greetingAudio.play().catch(err => {
        console.warn("Greeting audio failed:", err);
        isGreetingPlaying = false;
      });

      greetingAudio.onended = () => {
        isGreetingPlaying = false;
      };
    }

    playGreetingByTime();
});
