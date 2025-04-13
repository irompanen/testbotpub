document.addEventListener('DOMContentLoaded', function() {
    const tg = window.Telegram.WebApp;
    tg.expand();
    tg.BackButton.hide();

    // Элементы интерфейса
    const taskForm = document.getElementById('taskForm');
    const taskText = document.getElementById('taskText');
    const deadlineInput = document.getElementById('deadline');
    const deadlineOptions = document.querySelectorAll('.deadline-option');
    const charCounter = document.getElementById('charsRemaining');
    const maxChars = 1000;

    // Ограничение символов и счетчик
    taskText.addEventListener('input', function() {
        const remaining = maxChars - this.value.length;
        charCounter.textContent = remaining;
        
        if (remaining < 50) {
            charCounter.style.color = '#ff6b6b';
        } else {
            charCounter.style.color = '#666';
        }
    });

    // Упрощенный выбор срока выполнения
    deadlineOptions.forEach(option => {
        option.addEventListener('click', function() {
            deadlineOptions.forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
            
            const hours = parseInt(this.dataset.hours);
            const deadline = new Date();
            deadline.setHours(deadline.getHours() + hours);
            
            // Форматирование для datetime-local
            const formattedDate = deadline.toISOString().slice(0, 16);
            deadlineInput.value = formattedDate;
        });
    });

    // Установка дефолтного значения (1 час)
    document.querySelector('.deadline-option[data-hours="1"]').click();

    // Загрузка примеров задач
    loadExampleTasks();

    async function loadExampleTasks() {
        const taskList = document.getElementById('taskList');
        taskList.innerHTML = '';
        
        // Пример задачи "Создана"
        const createdTask = createTaskCard({
            id: 1,
            text: "Подготовить презентацию для клиента",
            deadline: new Date(Date.now() + 3600000).toISOString(), // +1 час
            status: "created",
            photos: []
        });
        taskList.appendChild(createdTask);
        
        // Пример задачи "Уточнение"
        const clarificationTask = createTaskCard({
            id: 2,
            text: "Разработать логотип для нового продукта",
            deadline: new Date(Date.now() + 86400000).toISOString(), // +24 часа
            status: "clarification",
            question: "Какой стиль логотипа вы предпочитаете? (минимализм, ретро, градиенты и т.д.)",
            photos: []
        });
        taskList.appendChild(clarificationTask);
    }

    function createTaskCard(task) {
        const taskCard = document.createElement('div');
        taskCard.className = `task-card ${task.status === 'clarification' ? 'task-clarification' : ''}`;
        
        let statusText, statusClass;
        switch(task.status) {
            case 'created':
                statusText = 'Создана';
                statusClass = 'status-created';
                break;
            case 'clarification':
                statusText = 'Уточнение';
                statusClass = 'status-in-progress';
                break;
            default:
                statusText = 'В работе';
                statusClass = 'status-in-progress';
        }
        
        let clarificationSection = '';
        if (task.status === 'clarification' && task.question) {
            clarificationSection = `
                <div class="clarification-section">
                    <div class="clarification-question">${task.question}</div>
                    <textarea class="clarification-input" placeholder="Ваш ответ..." maxlength="500"></textarea>
                    <div class="clarification-counter"><span class="clarification-chars">500</span>/500</div>
                    <button class="submit-clarification">Отправить уточнение</button>
                </div>
            `;
        }
        
        taskCard.innerHTML = `
            <div class="task-id">Задача #${task.id}</div>
            <div class="task-text">${task.text}</div>
            <div class="task-deadline">⏰ ${new Date(task.deadline).toLocaleString('ru-RU')}</div>
            <div class="task-status ${statusClass}">
                ${statusText}
            </div>
            ${clarificationSection}
        `;
        
        // Обработчик для счетчика символов в уточнении
        if (task.status === 'clarification') {
            const clarificationInput = taskCard.querySelector('.clarification-input');
            const clarificationCounter = taskCard.querySelector('.clarification-chars');
            
            clarificationInput.addEventListener('input', function() {
                const remaining = 500 - this.value.length;
                clarificationCounter.textContent = remaining;
                
                if (remaining < 50) {
                    clarificationCounter.style.color = '#ff6b6b';
                } else {
                    clarificationCounter.style.color = '#666';
                }
            });
        }
        
        return taskCard;
    }

    // Остальной код (обработка фото, отправка формы и т.д.) остается без изменений
    // ...
});
