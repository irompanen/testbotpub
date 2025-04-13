document.addEventListener('DOMContentLoaded', function() {
    const tg = window.Telegram.WebApp;
    tg.expand();
    tg.BackButton.hide();
    tg.enableClosingConfirmation();

    // Элементы интерфейса
    const taskForm = document.getElementById('taskForm');
    const taskText = document.getElementById('taskText');
    const deadline = document.getElementById('deadline');
    const photoInput = document.getElementById('photos');
    const preview = document.getElementById('preview');
    const taskList = document.getElementById('taskList');
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    const charsRemaining = document.getElementById('charsRemaining');

    // Установка минимальной даты (сегодня) и времени (текущее + 1 час)
    const now = new Date();
    now.setHours(now.getHours() + 1);
    const minDateTime = now.toISOString().slice(0, 16);
    deadline.min = minDateTime;
    deadline.value = minDateTime;

    // Ограничение символов в описании задачи
    taskText.addEventListener('input', function() {
        const maxLength = 1000;
        const remaining = maxLength - this.value.length;
        charsRemaining.textContent = remaining;
        
        if (remaining < 50) {
            charsRemaining.style.color = 'var(--secondary-color)';
            tg.HapticFeedback.impactOccurred('light');
        } else {
            charsRemaining.style.color = '#666';
        }
    });

    // Обработка фото (до 3 штук - ограничение Telegram)
    photoInput.addEventListener('change', function(e) {
        preview.innerHTML = '';
        const files = Array.from(e.target.files).slice(0, 3);
        
        if (files.length > 0) {
            tg.HapticFeedback.impactOccurred('light');
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

    // Отправка формы через Telegram WebApp
    taskForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (!taskText.value.trim()) {
            tg.showAlert("Пожалуйста, опишите задачу");
            tg.HapticFeedback.notificationOccurred('error');
            return;
        }

        tg.MainButton.showProgress();
        tg.HapticFeedback.impactOccurred('medium');

        // Подготовка данных для отправки
        const taskData = {
            action: 'create_task',
            text: taskText.value,
            deadline: deadline.value,
            photos: []
        };

        // Если есть фото - добавляем их как base64
        if (photoInput.files.length > 0) {
            const photoPromises = Array.from(photoInput.files).slice(0, 3).map(file => {
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result.split(',')[1]);
                    reader.readAsDataURL(file);
                });
            });

            Promise.all(photoPromises).then(photos => {
                taskData.photos = photos;
                sendTaskData(taskData);
            });
        } else {
            sendTaskData(taskData);
        }
    });

    function sendTaskData(taskData) {
        tg.sendData(JSON.stringify(taskData));
        tg.MainButton.hideProgress();
        tg.showAlert("Задача успешно создана!", () => tg.close());
    }

    // Переключение вкладок
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tg.HapticFeedback.impactOccurred('light');
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

    // Загрузка задач с учетом Telegram API
    async function loadUserTasks() {
        try {
            // В реальном приложении здесь будет запрос к вашему бэкенду через Telegram
            const response = await fetchTasksFromBackend();
            renderTasks(response.tasks || []);
        } catch (error) {
            tg.showAlert("Ошибка загрузки задач");
            console.error(error);
            renderTasks(getExampleTasks());
        }
    }

    function fetchTasksFromBackend() {
        // Заглушка для демонстрации - в реальном приложении здесь будет fetch к вашему API
        return new Promise(resolve => {
            setTimeout(() => resolve({ tasks: getExampleTasks() }), 500);
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
                photos: []
            },
            {
                id: 2,
                text: "Написать техническое задание",
                deadline: new Date(Date.now() + 172800000).toISOString(),
                status: "created",
                photos: []
            },
            {
                id: 3,
                text: "Разработать логотип",
                deadline: new Date(Date.now() + 259200000).toISOString(),
                status: "clarification",
                question: "Какие цвета должны быть в логотипе?",
                photos: []
            }
        ];
    }

    function renderTasks(tasks) {
        taskList.innerHTML = '';
        
        if (tasks.length === 0) {
            taskList.innerHTML = '<p class="loading">Нет активных задач</p>';
            return;
        }

        tasks.forEach(task => {
            const taskCard = document.createElement('div');
            taskCard.className = 'task-card';
            
            const statusInfo = getStatusInfo(task.status);
            const deadlineDate = formatTelegramDate(task.deadline);
            
            taskCard.innerHTML = `
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
                <textarea class="clarification-input" placeholder="Введите ваш ответ..." maxlength="500"></textarea>
                <div class="clarification-counter"><span class="clarification-remaining">500</span>/500 символов</div>
                <button class="submit-btn clarification-btn">Отправить ответ</button>
                ` : ''}
            `;
            taskList.appendChild(taskCard);
        });

        setupSolutionDropdowns();
        setupClarificationInputs();
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

    function setupClarificationInputs() {
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

        document.querySelectorAll('.clarification-btn').forEach(button => {
            button.addEventListener('click', function() {
                const input = this.previousElementSibling.previousElementSibling;
                if (input.value.trim().length < 10) {
                    tg.showAlert("Ответ должен содержать минимум 10 символов");
                    tg.HapticFeedback.notificationOccurred('error');
                    return;
                }
                
                tg.HapticFeedback.impactOccurred('heavy');
                tg.showAlert("Ответ отправлен на уточнение");
                // Здесь должна быть отправка данных на сервер
            });
        });
    }

    // Инициализация
    if (tg.initDataUnsafe.user) {
        console.log(`User: ${tg.initDataUnsafe.user.first_name} ${tg.initDataUnsafe.user.last_name}`);
    }
});
