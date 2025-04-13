document.addEventListener('DOMContentLoaded', function() {
    const tg = window.Telegram.WebApp;
    tg.expand();
    tg.BackButton.hide();

    // Элементы интерфейса
    const taskForm = document.getElementById('taskForm');
    const taskText = document.getElementById('taskText');
    const deadline = document.getElementById('deadline');
    const photoInput = document.getElementById('photos');
    const preview = document.getElementById('preview');
    const taskList = document.getElementById('taskList');
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');

    // Убрано закрытие мини-приложения при фокусе
    taskText.addEventListener('focus', function() {
        tg.HapticFeedback.impactOccurred('light');
    });

    // Обработка фото (до 10 штук)
    photoInput.addEventListener('change', function(e) {
        preview.innerHTML = '';
        const files = Array.from(e.target.files).slice(0, 10);
        
        if (files.length > 0) {
            files.forEach(file => {
                if (!file.type.match('image.*')) return;
                
                const reader = new FileReader();
                reader.onload = function(e) {
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    preview.appendChild(img);
                };
                reader.readAsDataURL(file);
            });
        }
    });

    // Отправка формы
    taskForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (!taskText.value.trim()) {
            tg.showAlert("Пожалуйста, опишите задачу");
            return;
        }

        tg.HapticFeedback.impactOccurred('light');

        const formData = new FormData(taskForm);
        const taskData = {
            action: 'create_task',
            text: formData.get('taskText'),
            deadline: formData.get('deadline'),
            photos: Array.from(formData.getAll('photos'))
        };

        tg.sendData(JSON.stringify(taskData));
        tg.close(); // Закрываем только после отправки данных
    });
    // Переключение вкладок
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            tab.classList.add('active');
            const tabId = tab.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
            
            if (tabId === 'tasks') {
                loadUserTasks();
            }
        });
    });

    // Загрузка задач с выпадающими решениями
    async function loadUserTasks() {
        const exampleTasks = [
            {
                id: 1,
                text: "Подготовить презентацию для клиента",
                deadline: "2023-12-15T18:00",
                status: "completed",
                solution: "Презентация включает 15 слайдов с анализом рынка и нашими предложениями. Все графики актуализированы.",
                photos: []
            },
            {
                id: 2,
                text: "Написать техническое задание",
                deadline: "2023-12-10T12:00",
                status: "completed",
                solution: "ТЗ содержит все требования заказчика, сроки и этапы реализации проекта.",
                photos: []
            }
        ];

        taskList.innerHTML = '';
        exampleTasks.forEach(task => {
            const taskCard = document.createElement('div');
            taskCard.className = 'task-card';
            taskCard.innerHTML = `
                <div class="task-id">Задача #${task.id}</div>
                <div class="task-text">${task.text}</div>
                <div class="task-deadline">⏰ ${new Date(task.deadline).toLocaleString('ru-RU')}</div>
                <div class="task-status ${task.status === 'completed' ? 'status-completed' : 'status-in-progress'}">
                    ${task.status === 'completed' ? 'Завершена' : 'В работе'}
                </div>
                
                ${task.solution ? `
                <div class="solution-dropdown">
                    <button class="solution-toggle">
                        Показать решение
                        <svg class="dropdown-icon" width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1 1.5L6 6.5L11 1.5" stroke="${task.status === 'completed' ? '#388e3c' : '#ff8f00'}" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                    </button>
                    <div class="solution-content">
                        <p>${task.solution}</p>
                    </div>
                </div>` : ''}
            `;
            taskList.appendChild(taskCard);
        });

        setupSolutionDropdowns();
    }

    // Инициализация выпадающих решений
    function setupSolutionDropdowns() {
        document.querySelectorAll('.solution-toggle').forEach(button => {
            button.addEventListener('click', function() {
                const solutionContent = this.nextElementSibling;
                const icon = this.querySelector('.dropdown-icon');
                
                solutionContent.classList.toggle('show');
                icon.classList.toggle('rotated');
                
                if (solutionContent.classList.contains('show')) {
                    solutionContent.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            });
        });
    }

    // Первоначальная загрузка
    if (tg.initDataUnsafe.user) {
        console.log(`Пользователь: ${tg.initDataUnsafe.user.first_name}`);
    }
});
