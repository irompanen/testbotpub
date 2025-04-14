document.addEventListener('DOMContentLoaded', function() {
  const tg = window.Telegram.WebApp;
  tg.expand();
  tg.BackButton.hide();
  tg.enableClosingConfirmation();

  // Элементы интерфейса
  const elements = {
    taskForm: document.getElementById('taskForm'),
    taskText: document.getElementById('taskText'),
    photoInput: document.getElementById('photos'),
    preview: document.getElementById('preview'),
    taskList: document.getElementById('taskList'),
    tabs: document.querySelectorAll('.tab'),
    tabContents: document.querySelectorAll('.tab-content'),
    charsRemaining: document.getElementById('charsRemaining')
  };

  // Инициализация даты и времени
  initDateTime();

  // Обработчики событий
  setupEventListeners();

  function initDateTime() {
    const now = new Date();
    const dateInput = document.getElementById('deadline-date');
    const timeSelect = document.getElementById('deadline-time');
    
    // Устанавливаем минимальную дату (сегодня)
    dateInput.min = now.toISOString().split('T')[0];
    dateInput.value = now.toISOString().split('T')[0];
    
    // Устанавливаем ближайшее время (следующий час)
    const nextHour = now.getHours() + 1;
    const availableTimes = Array.from(timeSelect.options).map(opt => opt.value);
    const closestTime = availableTimes.find(t => parseInt(t.split(':')[0]) >= nextHour) || '18:00';
    timeSelect.value = closestTime;
  }

  function setupEventListeners() {
    // Ограничение символов
    elements.taskText.addEventListener('input', updateCharCounter);

    // Обработка файлов
    elements.photoInput.addEventListener('change', handleFileUpload);

    // Отправка формы
    elements.taskForm.addEventListener('submit', handleFormSubmit);

    // Переключение вкладок
    elements.tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tg.HapticFeedback.impactOccurred('light');
        switchTab(tab);
      });
    });
  }

  function updateCharCounter() {
    const maxLength = 1000;
    const remaining = maxLength - this.value.length;
    elements.charsRemaining.textContent = remaining;
    
    if (remaining < 50) {
      elements.charsRemaining.style.color = 'var(--secondary-color)';
      tg.HapticFeedback.impactOccurred('light');
    } else {
      elements.charsRemaining.style.color = '#666';
    }
  }

  function handleFileUpload(e) {
    elements.preview.innerHTML = '';
    const files = Array.from(e.target.files).slice(0, 10);
    
    if (files.length > 0) {
      tg.HapticFeedback.impactOccurred('light');
      files.forEach(file => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        
        const icon = document.createElement('img');
        icon.src = file.type.startsWith('image/') ? 
          URL.createObjectURL(file) : 
          'https://cdn-icons-png.flaticon.com/512/136/136521.png';
        
        const name = document.createElement('span');
        name.textContent = file.name.length > 15 ? 
          file.name.substring(0, 12) + '...' : 
          file.name;
        
        const remove = document.createElement('span');
        remove.className = 'file-remove';
        remove.innerHTML = '&times;';
        remove.addEventListener('click', () => {
          fileItem.remove();
          tg.HapticFeedback.impactOccurred('light');
        });
        
        fileItem.appendChild(icon);
        fileItem.appendChild(name);
        fileItem.appendChild(remove);
        elements.preview.appendChild(fileItem);
      });
    }
  }

  function handleFormSubmit(e) {
    e.preventDefault();
    
    if (!elements.taskText.value.trim()) {
      tg.showAlert("Пожалуйста, опишите задачу");
      tg.HapticFeedback.notificationOccurred('error');
      return;
    }

    // Получаем выбранные дату и время
    const date = document.getElementById('deadline-date').value;
    const time = document.getElementById('deadline-time').value;
    const deadline = `${date}T${time}:00`;

    tg.MainButton.showProgress();
    tg.HapticFeedback.impactOccurred('medium');

    const taskData = {
      action: 'create_task',
      text: elements.taskText.value,
      deadline: deadline,
      files: Array.from(elements.photoInput.files).slice(0, 10).map(f => f.name)
    };

    tg.sendData(JSON.stringify(taskData));
    tg.MainButton.hideProgress();
    tg.showAlert("Задача успешно создана!", () => tg.close());
  }

  function switchTab(tab) {
    elements.tabs.forEach(t => t.classList.remove('active'));
    elements.tabContents.forEach(c => c.classList.remove('active'));
    
    tab.classList.add('active');
    const tabId = tab.getAttribute('data-tab');
    document.getElementById(tabId).classList.add('active');
    
    if (tabId === 'tasks') {
      loadUserTasks();
    }
  }

  async function loadUserTasks() {
    try {
      const response = await fetchTasksFromBackend();
      const sortedTasks = response.tasks.sort((a, b) => 
        new Date(b.deadline) - new Date(a.deadline));
      renderTasks(sortedTasks);
    } catch (error) {
      tg.showAlert("Ошибка загрузки задач");
      console.error(error);
      renderTasks(getExampleTasks());
    }
  }

  function fetchTasksFromBackend() {
    return new Promise(resolve => {
      setTimeout(() => resolve({ 
        tasks: getExampleTasks().sort((a, b) => 
          new Date(b.deadline) - new Date(a.deadline))
      }), 500);
    });
  }

  function getExampleTasks() {
    return [
      {
        id: 1,
        text: "Подготовить презентацию для клиента",
        deadline: new Date(Date.now() + 86400000).toISOString(),
        status: "completed",
        solution: "Презентация включает 15 слайдов с анализом рынка.",
        files: []
      },
      {
        id: 2,
        text: "Написать техническое задание",
        deadline: new Date(Date.now() + 172800000).toISOString(),
        status: "created",
        files: []
      },
      {
        id: 3,
        text: "Разработать логотип",
        deadline: new Date(Date.now() + 259200000).toISOString(),
        status: "clarification",
        question: "Какие цвета должны быть в логотипе?",
        answer: "",
        files: [],
        editable: true
      }
    ];
  }

  function renderTasks(tasks) {
    elements.taskList.innerHTML = '';
    
    if (tasks.length === 0) {
      elements.taskList.innerHTML = '<p class="loading">Нет активных задач</p>';
      return;
    }

    tasks.forEach(task => {
      const taskCard = document.createElement('div');
      taskCard.className = 'task-card';
      
      const statusInfo = getStatusInfo(task.status);
      const deadlineDate = formatTelegramDate(task.deadline);
      
      taskCard.innerHTML = generateTaskHTML(task, statusInfo, deadlineDate);
      elements.taskList.appendChild(taskCard);
    });

    setupSolutionDropdowns();
    setupClarificationEdits();
  }

  function generateTaskHTML(task, statusInfo, deadlineDate) {
    return `
      <div class="task-id">Задача #${task.id}</div>
      <div class="task-text">${task.text}</div>
      <div class="task-deadline">⏰ ${deadlineDate}</div>
      <div class="task-status ${statusInfo.class}">
        ${statusInfo.text}
      </div>
      
      ${task.status === 'completed' && task.solution ? `
      <div class="solution-dropdown">
        <button class="solution-toggle">
          Показать решение
          <svg class="dropdown-icon" width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 1.5L6 6.5L11 1.5" stroke="#388e3c" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
        <div class="solution-content">
          <p>${task.solution}</p>
        </div>
      </div>` : ''}
      
      ${task.status === 'clarification' ? `
      <div class="clarification-question">
        <strong>Вопрос оператора:</strong> ${task.question}
      </div>
      <div class="clarification-view">
        <p><strong>Ваш ответ:</strong> ${task.answer || 'Еще не предоставлен'}</p>
        ${task.files && task.files.length > 0 ? `
        <div class="file-preview">
          ${task.files.map(file => `
            <div class="file-item">
              <img src="${file.endsWith('.jpg') || file.endsWith('.png') ? 
                'icon-image.png' : 'icon-file.png'}" alt="File">
              <span>${file}</span>
            </div>
          `).join('')}
        </div>` : ''}
        ${task.editable ? `<button class="edit-btn">Изменить ответ</button>` : ''}
      </div>
      <div class="clarification-edit" style="display: none;">
        <textarea class="clarification-input" placeholder="Введите ваш ответ..." 
          maxlength="500">${task.answer || ''}</textarea>
        <div class="clarification-counter">
          <span class="clarification-remaining">${500 - (task.answer?.length || 0)}</span>/500 символов
        </div>
        <input type="file" class="clarification-files" multiple>
        <div class="file-preview edit-files-preview"></div>
        <div class="edit-buttons">
          <button class="save-btn">Сохранить</button>
          <button class="cancel-btn">Отмена</button>
        </div>
      </div>
      ` : ''}
    `;
  }

  function getStatusInfo(status) {
    switch(status) {
      case 'completed': return { text: 'Завершена', class: 'status-completed' };
      case 'created': return { text: 'Создана', class: 'status-in-progress' };
      case 'clarification': return { text: 'Уточнение', class: 'status-clarification' };
      default: return { text: 'Новая', class: 'status-new' };
    }
  }

  function formatTelegramDate(isoString) {
    const date = new Date(isoString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function setupSolutionDropdowns() {
    document.querySelectorAll('.solution-toggle').forEach(button => {
      button.addEventListener('click', function() {
        tg.HapticFeedback.impactOccurred('light');
        const solutionContent = this.nextElementSibling;
        const icon = this.querySelector('.dropdown-icon');
        
        solutionContent.classList.toggle('show');
        icon.classList.toggle('rotated');
      });
    });
  }

  function setupClarificationEdits() {
    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const card = this.closest('.task-card');
        card.querySelector('.clarification-view').style.display = 'none';
        card.querySelector('.clarification-edit').style.display = 'block';
        tg.HapticFeedback.impactOccurred('light');
      });
    });

    document.querySelectorAll('.cancel-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const card = this.closest('.task-card');
        card.querySelector('.clarification-view').style.display = 'block';
        card.querySelector('.clarification-edit').style.display = 'none';
        tg.HapticFeedback.impactOccurred('light');
      });
    });

    document.querySelectorAll('.save-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const card = this.closest('.task-card');
        const input = card.querySelector('.clarification-input');
        
        if (input.value.trim().length < 10) {
          tg.showAlert("Ответ должен содержать минимум 10 символов");
          tg.HapticFeedback.notificationOccurred('error');
          return;
        }

        tg.HapticFeedback.impactOccurred('heavy');
        tg.showAlert("Изменения сохранены");
        
        const view = card.querySelector('.clarification-view');
        view.querySelector('p').innerHTML = `<strong>Ваш ответ:</strong> ${input.value}`;
        
        view.style.display = 'block';
        card.querySelector('.clarification-edit').style.display = 'none';
      });
    });

    document.querySelectorAll('.clarification-input').forEach(input => {
      const counter = input.parentElement.querySelector('.clarification-remaining');
      
      input.addEventListener('input', function() {
        const remaining = 500 - this.value.length;
        counter.textContent = remaining;
        
        if (remaining < 50) {
          counter.style.color = 'var(--secondary-color)';
          if (remaining % 10 === 0) tg.HapticFeedback.impactOccurred('light');
        } else {
          counter.style.color = '#666';
        }
      });
    });

    document.querySelectorAll('.clarification-files').forEach(input => {
      const preview = input.nextElementSibling;
      
      input.addEventListener('change', function() {
        preview.innerHTML = '';
        const files = Array.from(this.files).slice(0, 10);
        
        if (files.length > 0) {
          files.forEach(file => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            
            const icon = document.createElement('img');
            icon.src = file.type.startsWith('image/') ? 
              URL.createObjectURL(file) : 
              'https://cdn-icons-png.flaticon.com/512/136/136521.png';
            
            const name = document.createElement('span');
            name.textContent = file.name.length > 15 ? 
              file.name.substring(0, 12) + '...' : 
              file.name;
            
            const remove = document.createElement('span');
            remove.className = 'file-remove';
            remove.innerHTML = '&times;';
            remove.addEventListener('click', () => {
              fileItem.remove();
              tg.HapticFeedback.impactOccurred('light');
            });
            
            fileItem.appendChild(icon);
            fileItem.appendChild(name);
            fileItem.appendChild(remove);
            preview.appendChild(fileItem);
          });
        }
      });
    });
  }

  // Инициализация
  if (tg.initDataUnsafe.user) {
    console.log(`User: ${tg.initDataUnsafe.user.first_name} ${tg.initDataUnsafe.user.last_name}`);
  }
});

// Функция для показа тултипа (4 секунды)
function showTooltip(event) {
  event.stopPropagation();
  const tooltip = document.getElementById('infoTooltip');
  
  // Скрываем все тултипы
  document.querySelectorAll('.tooltip').forEach(t => t.style.display = 'none');
  
  // Показываем текущий
  tooltip.style.display = 'block';
  
  // Скрываем через 4 секунды
  setTimeout(() => {
    tooltip.style.display = 'none';
  }, 4000);
}

// Скрываем тултип при клике вне его
document.addEventListener('click', function(e) {
  if (!e.target.classList.contains('info-icon')) {
    document.getElementById('infoTooltip').style.display = 'none';
  }
});
